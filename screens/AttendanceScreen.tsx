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

export default function AttendanceScreen() {
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

  // Update the renderMeetingItem function to include an arrow icon
  const renderMeetingItem = (meeting: Meeting) => (
    <TouchableOpacity
      key={meeting.id}
      style={styles.meetingCard}
      onPress={() => handleMeetingSelect(meeting)}
    >
      <View style={styles.meetingHeader}>
        <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
        <View style={styles.meetingInfo}>
          <Text style={styles.meetingTitle}>{meeting.title}</Text>
          <Text style={styles.meetingDate}>
            {meeting.date.toLocaleDateString()}
          </Text>
          <Text style={styles.meetingVenue}>{meeting.venue}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color="#6B7280"
          style={styles.expandIcon}
        />
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meeting Attendance</Text>
      </View>

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

              {members.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Mark Attendance</Text>
                  {members.map(renderMemberAttendance)}

                  <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>Meeting Summary</Text>
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
          ) : (
            meetings.map(renderMeetingItem)
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
    backgroundColor: "#8B5CF6",
    padding: 20,
    paddingTop: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
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
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  meetingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
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
    flex: 1,
  },
  meetingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  meetingDate: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  meetingVenue: {
    fontSize: 14,
    color: "#6B7280",
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  selectedMeetingDate: {
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
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
    marginTop: 8,
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
});
