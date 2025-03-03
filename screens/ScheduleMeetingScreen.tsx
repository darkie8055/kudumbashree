import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { firebase } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  where,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import {
  requestPermissions,
  showLocalNotification,
  showNotificationInDevMode,
  sendNotificationToAll,
} from "../utils/notifications";
import { useUser } from "../contexts/UserContext";

type Meeting = {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  date?: Date;
  createdAt?: any;
  attendanceMarked: boolean;
  attendanceOpen: boolean; // Add this field
};

// Update the Notice type definition
type Notice = {
  id: string;
  title: string;
  description?: string;
  date?: Date;
  type?: "meeting" | "notice"; // Make type optional
  createdAt?: any;
  venue?: string;
};

export default function ScheduleMeetingScreen() {
  const { userDetails } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    const setupNotifications = async () => {
      await requestPermissions();
    };
    setupNotifications();
  }, []);

  useEffect(() => {
    console.log("Current user details:", userDetails);
  }, [userDetails]);

  // Update the handleSchedule function
  const handleSchedule = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a meeting title");
      return;
    }
    if (!venue.trim()) {
      Alert.alert("Error", "Please enter a meeting venue");
      return;
    }
    if (!userDetails?.phone) {
      Alert.alert("Error", "Please login again");
      return;
    }

    try {
      setLoading(true);

      // Get all president documents to find the matching unit number
      const presidentsRef = collection(firebase, "president");
      const querySnapshot = await getDocs(presidentsRef);
      const presidentDoc = querySnapshot.docs[0]; // Get the first president document

      if (!presidentDoc) {
        Alert.alert("Error", "President details not found");
        return;
      }

      const presidentData = presidentDoc.data();
      const unitNumber = presidentData.unitNumber;
      const unitName = presidentData.unitName;

      const noticesRef = collection(firebase, "notices");
      await addDoc(noticesRef, {
        title: title,
        description: description,
        venue: venue,
        date: date,
        createdAt: serverTimestamp(),
        type: "meeting",
        attendanceMarked: false,
        attendanceOpen: true,
        unitNumber: unitNumber,
        createdBy: userDetails.phone,
        unitName: unitName,
      });

      // Rest of your notification code...
      await sendNotificationToAll(
        "New Meeting Scheduled",
        `${title} at ${venue}\nDate: ${date.toLocaleDateString()}\nTime: ${date.toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )}`
      );

      Alert.alert("Success", "Meeting scheduled successfully", [
        {
          text: "OK",
          onPress: () => {
            setTitle("");
            setDescription("");
            setVenue("");
            setDate(new Date());
          },
        },
      ]);
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      console.log("User phone:", userDetails.phone); // Debug log
      Alert.alert("Error", "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      const noticeRef = doc(firebase, "notices", meetingId);
      await deleteDoc(noticeRef);
      Alert.alert("Success", "Meeting deleted successfully");
      fetchMeetings(); // Refresh the meetings list
    } catch (error) {
      console.error("Error deleting meeting:", error);
      Alert.alert("Error", "Failed to delete meeting");
    }
  };

  const toggleAttendance = async (
    meetingId: string,
    currentStatus: boolean
  ) => {
    try {
      const meetingRef = doc(firebase, "notices", meetingId);
      await updateDoc(meetingRef, {
        attendanceOpen: !currentStatus,
      });
      fetchMeetings(); // Refresh the meetings list
    } catch (error) {
      console.error("Error toggling attendance:", error);
      Alert.alert("Error", "Failed to update attendance status");
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    setShowTimePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentTime = date;
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const fetchMeetings = async () => {
    try {
      const noticesRef = collection(firebase, "notices");
      const q = query(noticesRef, where("type", "==", "meeting"));
      const querySnapshot = await getDocs(q);

      const meetingsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        venue: doc.data().venue,
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt,
        attendanceMarked: doc.data().attendanceMarked,
        attendanceOpen: doc.data().attendanceOpen,
      })) as Meeting[];

      meetingsList.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );

      setMeetings(meetingsList);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const renderMeeting = (meeting: Meeting) => (
    <View key={meeting.id} style={styles.meetingItem}>
      <TouchableOpacity
        style={styles.meetingHeader}
        onPress={() =>
          setExpandedMeeting(expandedMeeting === meeting.id ? null : meeting.id)
        }
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color="#8B5CF6"
          style={styles.meetingIcon}
        />
        <View style={styles.meetingHeaderContent}>
          <Text style={styles.meetingTitle}>{meeting.title}</Text>
          <Text style={styles.meetingDateTime}>
            {meeting.date?.toLocaleDateString()}{" "}
            {meeting.date?.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <Ionicons
          name={expandedMeeting === meeting.id ? "chevron-up" : "chevron-down"}
          size={20}
          color="#8B5CF6"
        />
      </TouchableOpacity>

      {expandedMeeting === meeting.id && (
        <View style={styles.expandedContent}>
          <Text style={styles.venueText}>Venue: {meeting.venue}</Text>
          {meeting.description && (
            <Text style={styles.descriptionText}>{meeting.description}</Text>
          )}

          {/* Add attendance toggle button */}
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              {
                backgroundColor: meeting.attendanceOpen ? "#22C55E" : "#EF4444",
              },
            ]}
            onPress={() => toggleAttendance(meeting.id, meeting.attendanceOpen)}
          >
            <Ionicons
              name={
                meeting.attendanceOpen
                  ? "checkbox-outline"
                  : "close-circle-outline"
              }
              size={18}
              color="white"
            />
            <Text style={styles.attendanceButtonText}>
              {meeting.attendanceOpen ? "Attendance Open" : "Attendance Closed"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                "Delete Meeting",
                "Are you sure you want to delete this meeting?",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeleteMeeting(meeting.id),
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
            <Text style={styles.deleteButtonText}>Delete Meeting</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Schedule Meeting</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Meeting Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter meeting title"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Venue</Text>
          <TextInput
            style={styles.input}
            value={venue}
            onChangeText={setVenue}
            placeholder="Enter meeting venue"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter meeting description"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />

          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={showDatepicker}
            >
              <Text style={styles.dateTimeButtonText}>
                Select Date: {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={showTimepicker}
            >
              <Text style={styles.dateTimeButtonText}>
                Select Time:{" "}
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  const currentTime = date;
                  selectedDate.setHours(currentTime.getHours());
                  selectedDate.setMinutes(currentTime.getMinutes());
                  setDate(selectedDate);
                }
              }}
            />
          )}

          {showTimePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={date}
              mode="time"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) {
                  const newDate = new Date(date);
                  newDate.setHours(selectedDate.getHours());
                  newDate.setMinutes(selectedDate.getMinutes());
                  setDate(newDate);
                }
              }}
            />
          )}

          <TouchableOpacity
            style={[styles.scheduleButton, loading && styles.disabledButton]}
            onPress={handleSchedule}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.scheduleButtonText}>Schedule Meeting</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.meetingsContainer}>
          <Text style={styles.meetingsTitle}>Scheduled Meetings</Text>
          {meetings.length > 0 ? (
            meetings.map(renderMeeting)
          ) : (
            <Text style={styles.emptyText}>No meetings scheduled</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateTimeButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flex: 0.48,
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#1F2937",
    textAlign: "center",
  },
  scheduleButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  scheduleButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  meetingsContainer: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  meetingsTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginBottom: 16,
  },
  meetingItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  meetingHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  meetingIcon: {
    marginRight: 12,
  },
  meetingHeaderContent: {
    flex: 1,
    marginRight: 8,
  },
  meetingTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  meetingDateTime: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginTop: 2,
  },
  expandedContent: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  venueText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    textAlign: "center",
    padding: 16,
  },
  attendanceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  attendanceButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 4,
  },
});
