import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { firebase } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useUser } from "../contexts/UserContext";
import { LinearGradient } from "expo-linear-gradient";

interface Member {
  id: string;
  name: string;
  role: string;
  unitNumber: string;
  phone: string;
}

interface Meeting {
  id: string;
  title: string;
  date: Date;
  venue: string;
  type: string;
  attendanceOpen: boolean;
  createdAt: any;
  summary?: string;
}

interface AttendanceRecord {
  [memberId: string]: {
    present: boolean;
    markedBy: string;
    markedAt: Date;
  };
}

// Update the component definition with navigation prop
export default function AttendanceScreen({ navigation }: { navigation: any }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [loading, setLoading] = useState(false);
  const { userDetails } = useUser();
  const [summary, setSummary] = useState("");

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const noticesRef = collection(firebase, "notices");
      const q = query(
        noticesRef,
        where("type", "==", "meeting"),
        where("attendanceOpen", "==", true)
      );
      const querySnapshot = await getDocs(q);

      const meetingsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as Meeting[];

      setMeetings(
        meetingsList.sort((a, b) => b.date.getTime() - a.date.getTime())
      );
    } catch (error) {
      console.error("Error fetching meetings:", error);
      Alert.alert("Error", "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      // First get the president's unit number
      const presidentsRef = collection(firebase, "president");
      const presidentSnapshot = await getDocs(presidentsRef);
      const presidentDoc = presidentSnapshot.docs[0];

      if (!presidentDoc) {
        Alert.alert("Error", "President details not found");
        return [];
      }

      const unitNumber = presidentDoc.data().unitNumber;
      console.log("President unit number:", unitNumber); // Debug log

      // Now fetch members with this unit number
      const usersRef = collection(firebase, "K-member");
      const q = query(
        usersRef,
        where("unitNumber", "==", unitNumber),
        where("status", "==", "approved")
      );

      const querySnapshot = await getDocs(q);
      console.log("Found members:", querySnapshot.size); // Debug log

      const membersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: `${doc.data().firstName} ${doc.data().lastName}`,
        role: doc.data().userType,
        unitNumber: doc.data().unitNumber,
        phone: doc.data().phone,
      }));

      console.log("Processed members:", membersList); // Debug log
      setMembers(membersList);
      return membersList;
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", "Failed to load members");
      return [];
    }
  };

  // Update the fetchAttendance function to use unitNumber instead of unitId
  const fetchAttendance = async (meetingId: string, membersList: Member[]) => {
    try {
      if (!membersList || membersList.length === 0) {
        console.error("No members list provided");
        return;
      }

      const attendanceRef = doc(firebase, "attendance", meetingId);
      const attendanceDoc = await getDoc(attendanceRef);

      let attendanceData: AttendanceRecord = {};

      if (attendanceDoc.exists()) {
        const existingData = attendanceDoc.data();
        attendanceData = existingData.members || {};

        membersList.forEach((member) => {
          if (!attendanceData[member.id]) {
            attendanceData[member.id] = {
              present: false,
              markedBy: "",
              markedAt: new Date(),
            };
          }
        });
      } else {
        membersList.forEach((member) => {
          attendanceData[member.id] = {
            present: false,
            markedBy: "",
            markedAt: new Date(),
          };
        });

        // Create initial attendance document with unitNumber instead of unitId
        await setDoc(attendanceRef, {
          meetingId,
          members: attendanceData,
          createdAt: new Date(),
          updatedAt: new Date(),
          unitNumber: membersList[0].unitNumber, // Use the unit number from members
        });
      }

      setAttendance(attendanceData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      Alert.alert("Error", "Failed to load attendance records");
    }
  };

  const handleMeetingSelect = async (meeting: Meeting) => {
    try {
      setLoading(true);
      setSelectedMeeting(meeting);

      // First fetch members
      const membersList = await fetchMembers();

      if (membersList.length === 0) {
        Alert.alert("Error", "No members found in this unit");
        setSelectedMeeting(null);
        return;
      }

      // Then fetch/initialize attendance with the members list
      await fetchAttendance(meeting.id, membersList);
    } catch (error) {
      console.error("Error selecting meeting:", error);
      Alert.alert("Error", "Failed to load meeting details");
      setSelectedMeeting(null);
    } finally {
      setLoading(false);
    }
  };

  // Add function to save summary
  const saveSummary = async () => {
    if (!selectedMeeting) return;

    try {
      const meetingRef = doc(firebase, "notices", selectedMeeting.id);
      await updateDoc(meetingRef, {
        summary: summary.trim(),
        updatedAt: new Date(),
      });
      Alert.alert("Success", "Meeting summary saved successfully");
    } catch (error) {
      console.error("Error saving summary:", error);
      Alert.alert("Error", "Failed to save meeting summary");
    }
  };

  // Add useEffect to load existing summary when meeting is selected
  useEffect(() => {
    if (selectedMeeting?.summary) {
      setSummary(selectedMeeting.summary);
    } else {
      setSummary("");
    }
  }, [selectedMeeting]);

  // Update the toggleAttendance function
  const toggleAttendance = async (memberId: string) => {
    if (!selectedMeeting || !userDetails?.phone) return;

    try {
      const newMemberAttendance = {
        present: !attendance[memberId]?.present,
        markedBy: userDetails.phone,
        markedAt: new Date(),
      };

      const attendanceRef = doc(firebase, "attendance", selectedMeeting.id);

      // Update both the members field and the specific member's attendance
      await updateDoc(attendanceRef, {
        [`members.${memberId}`]: newMemberAttendance,
        updatedAt: new Date(),
      });

      // Update local state with the new attendance
      setAttendance((prev) => ({
        ...prev,
        [memberId]: newMemberAttendance,
      }));
    } catch (error) {
      console.error("Error updating attendance:", error);
      Alert.alert("Error", "Failed to update attendance");
    }
  };

  // Update the renderMeetingItem function
  const renderMeetingItem = (meeting: Meeting) => (
    <TouchableOpacity
      key={meeting.id}
      style={styles.meetingCard}
      onPress={() => handleMeetingSelect(meeting)}
      activeOpacity={0.7}
    >
      <View style={styles.meetingContent}>
        <View style={styles.meetingLeftContent}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateDay}>
              {meeting.date.getDate().toString().padStart(2, "0")}
            </Text>
            <Text style={styles.dateMonth}>
              {meeting.date.toLocaleString("default", { month: "short" })}
            </Text>
          </View>
          <View style={styles.meetingInfo}>
            <Text style={styles.meetingTitle} numberOfLines={1}>
              {meeting.title}
            </Text>
            <View style={styles.meetingDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  {meeting.date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {meeting.venue}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Update the renderMemberAttendance function
  const renderMemberAttendance = (member: Member) => {
    const memberAttendance = attendance[member.id];
    const isPresent = memberAttendance?.present;

    return (
      <TouchableOpacity
        key={member.id}
        style={[
          styles.memberRow,
          isPresent ? styles.memberRowPresent : styles.memberRowAbsent,
        ]}
        onPress={() => toggleAttendance(member.id)}
        activeOpacity={0.7}
      >
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{member.phone}</Text>
        </View>
        <View
          style={[
            styles.attendanceStatus,
            { backgroundColor: isPresent ? "#22C55E" : "#EF4444" },
          ]}
        >
          <Ionicons
            name={isPresent ? "checkmark-circle" : "close-circle"}
            size={20}
            color="white"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meeting Attendance</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {selectedMeeting ? (
            <View style={styles.selectedMeetingContainer}>
              <View style={styles.selectedMeetingHeader}>
                <View>
                  <Text style={styles.selectedMeetingTitle}>
                    {selectedMeeting.title}
                  </Text>
                  <Text style={styles.selectedMeetingDate}>
                    {selectedMeeting.date.toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMeeting(null);
                    setMembers([]);
                    setAttendance({});
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.attendanceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{members.length}</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Object.values(attendance).filter((a) => a.present).length}
                  </Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {members.length -
                      Object.values(attendance).filter((a) => a.present).length}
                  </Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
              </View>

              {members.length > 0 ? (
                <>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="people-outline" size={24} color="#6B7280" />
                    <Text style={styles.sectionTitle}>Mark Attendance</Text>
                  </View>
                  {members.map(renderMemberAttendance)}

                  <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>Journal</Text>
                    <TextInput
                      style={styles.summaryInput}
                      multiline
                      numberOfLines={4}
                      placeholder="Enter meeting summary or notes..."
                      value={summary}
                      onChangeText={setSummary}
                    />
                    <TouchableOpacity
                      style={styles.saveSummaryButton}
                      onPress={saveSummary}
                    >
                      <Text style={styles.saveSummaryButtonText}>
                        Save Summary
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  No members found in this unit.
                </Text>
              )}
            </View>
          ) : meetings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="calendar-outline" size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyStateText}>No meetings available</Text>
            </View>
          ) : (
            <>
              <View style={styles.meetingsListHeader}>
                <View style={styles.meetingsHeaderContent}>
                  <View style={styles.headerIconContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={24}
                      color="#8B5CF6"
                    />
                  </View>
                  <View>
                    <Text style={styles.meetingsListTitle}>
                      Active Meetings
                    </Text>
                    <Text style={styles.meetingsListSubtitle}>
                      Select a meeting to mark attendance
                    </Text>
                  </View>
                </View>
                {/* <View style={styles.meetingCountBadge}>
                  <Text style={styles.meetingCountText}>{meetings.length}</Text>
                </View> */}
              </View>
              {meetings.map(renderMeetingItem)}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Update the styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectedMeetingContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  meetingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    padding: 20,
    paddingBottom: 10,
  },
  meetingHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 8,
  },
  meetingDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  meetingVenue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  attendanceContainer: {
    padding: 20,
  },
  selectedMeetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  selectedMeetingTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#1F2937",
    marginBottom: 4,
  },
  selectedMeetingDate: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#6B7280",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: "#6B7280",
  },
  attendanceStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#1F2937",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 32,
    marginBottom: 32,
  },
  expandIcon: {
    marginLeft: "auto",
    padding: 4,
  },
  memberRowPresent: {
    borderLeftWidth: 4,
    borderLeftColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  memberRowAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  summaryContainer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  summaryInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  saveSummaryButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveSummaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  iconContainer: {
    backgroundColor: "#EDE9FE",
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  meetingDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    gap: 6,
  },
  arrowContainer: {
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateIcon: {
    backgroundColor: "#EDE9FE",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  emptyStateText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  attendanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
    gap: 8,
  },
  meetingContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  meetingLeftContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  dateContainer: {
    width: 48,
    height: 56,
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dateDay: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#7C3AED",
  },
  dateMonth: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#7C3AED",
    textTransform: "uppercase",
  },
  detailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6B7280",
  },
  meetingsListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  headerIconContainer: {
    backgroundColor: "#F5F3FF",
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  meetingsListTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: "#1F2937",
    marginBottom: 0,
  },
  meetingsListSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  meetingCountBadge: {
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  meetingCountText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#8B5CF6",
  },
  meetingsHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
