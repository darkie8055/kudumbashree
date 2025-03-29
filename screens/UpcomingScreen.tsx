import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  getFirestore,
  addDoc,
} from "firebase/firestore";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import Animated, {
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const CustomToast = ({ message, type = "success" }) => {
  return (
    <Animated.View style={[styles.toastContainer]}>
      <LinearGradient
        colors={
          type === "success" ? ["#10B981", "#059669"] : ["#EF4444", "#DC2626"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.toastGradient}
      >
        <Ionicons
          name={type === "success" ? "checkmark-circle" : "alert-circle"}
          size={24}
          color="#fff"
        />
        <Text style={styles.toastText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  time?: string;
  location: string;
  type: "meeting" | "activity" | "training" | "event";
  category?: string;
  organizer: string;
  contactPerson?: string;
  contactNumber?: string;
  requirements?: string[];
  maxParticipants?: number;
}

const sampleEvents: Omit<UpcomingEvent, "id">[] = [
  {
    title: "Monthly Unit Meeting",
    description:
      "Regular monthly meeting to discuss progress, challenges, and upcoming initiatives. All members must attend.",
    date: Timestamp.fromDate(new Date(2024, 3, 10, 10, 0)),
    time: "10:00 AM",
    location: "Community Hall, Ward 5",
    type: "meeting",
    organizer: "9072160767",
    contactPerson: "Sreelatha K",
    contactNumber: "9072160767",
    requirements: ["Attendance Register", "Previous Minutes"],
    maxParticipants: 50,
  },
  {
    title: "Tailoring Workshop",
    description:
      "Professional training on modern tailoring techniques. Materials and machines will be provided.",
    date: Timestamp.fromDate(new Date(2024, 3, 15, 14, 0)),
    time: "2:00 PM",
    location: "Skill Development Center",
    type: "training",
    organizer: "9072160767",
    contactPerson: "Priya M",
    contactNumber: "9876543210",
    requirements: ["Notebook", "Measuring Tape"],
    maxParticipants: 25,
  },
  {
    title: "Food Festival Preparation",
    description:
      "Planning and preparation meeting for the upcoming community food festival. Discussion on stall allocation and menu planning.",
    date: Timestamp.fromDate(new Date(2024, 3, 20, 11, 0)),
    time: "11:00 AM",
    location: "Municipal Office",
    type: "activity",
    organizer: "9072160767",
    contactPerson: "Lakshmi R",
    contactNumber: "9876543211",
    requirements: ["Food Safety Certificates", "Menu Proposals"],
    maxParticipants: 30,
  },
  {
    title: "Community Market Day",
    description:
      "Monthly market day featuring Kudumbashree products. Special discounts on all items.",
    date: Timestamp.fromDate(new Date(2024, 3, 25, 9, 0)),
    time: "9:00 AM - 6:00 PM",
    location: "Town Square",
    type: "event",
    organizer: "9072160767",
    contactPerson: "Maya K",
    contactNumber: "9876543212",
    requirements: ["Product Display", "Price List"],
    maxParticipants: 100,
  },
  {
    title: "Financial Literacy Session",
    description:
      "Expert session on banking, savings, and investment options. Certificates will be provided.",
    date: Timestamp.fromDate(new Date(2024, 4, 1, 10, 0)),
    time: "10:00 AM",
    location: "District Library Hall",
    type: "training",
    organizer: "9072160767",
    contactPerson: "Bindu S",
    contactNumber: "9876543213",
    requirements: ["ID Proof", "Bank Passbook"],
    maxParticipants: 40,
  },
];

export default function UpcomingScreen({ navigation }) {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const eventTypes = [
    { key: "all", icon: "calendar", label: "All" },
    { key: "meeting", icon: "people", label: "Meetings" },
    { key: "activity", icon: "layers", label: "Activities" },
    { key: "training", icon: "school", label: "Training" },
    { key: "event", icon: "flag", label: "Events" },
  ];

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const db = getFirestore();

      // Get all events from upcoming collection
      const eventsQuery = query(
        collection(db, "upcoming"),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(eventsQuery);
      console.log("Found events:", querySnapshot.size); // Debug log

      const eventsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Event data:", data); // Debug log
        return {
          id: doc.id,
          ...data,
          date: data.date, // Ensure date is properly handled
        };
      }) as UpcomingEvent[];

      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Events state updated:", events);
  }, [events]);

  const seedUpcomingEvents = async () => {
    try {
      const db = getFirestore();
      const eventsRef = collection(db, "upcoming");

      for (const event of sampleEvents) {
        await addDoc(eventsRef, {
          ...event,
          createdAt: Timestamp.now(),
          status: "upcoming",
        });
        console.log(`Added event: ${event.title}`);
      }

      console.log("Successfully seeded upcoming events");
      fetchUpcomingEvents();
    } catch (error) {
      console.error("Error seeding events:", error);
    }
  };

  const handleRegistration = (eventId: string, eventTitle: string) => {
    if (!registeredEvents.includes(eventId)) {
      setRegisteredEvents([...registeredEvents, eventId]);
      setToastMessage(`Successfully registered for ${eventTitle}!`);
      setShowToast(true);

      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const filteredEvents =
    selectedType === "all"
      ? events
      : events.filter((event) => event.type === selectedType);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upcoming Events</Text>

          {/* Remove this in production */}
          {/* <TouchableOpacity
            onPress={seedUpcomingEvents}
            style={styles.seedButton}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity> */}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={{ paddingRight: 8 }} // Add extra padding at the end
        >
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.filterButton,
                selectedType === type.key && styles.selectedFilter,
              ]}
              onPress={() => setSelectedType(type.key)}
            >
              <Ionicons
                name={type.icon}
                size={16}
                color={selectedType === type.key ? "#fff" : "#8B5CF6"}
              />
              <Text
                style={[
                  styles.filterText,
                  selectedType === type.key && styles.selectedFilterText,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#8B5CF6" />
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        ) : (
          filteredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() =>
                setExpandedId(expandedId === event.id ? null : event.id)
              }
            >
              <View style={styles.eventHeader}>
                <View
                  style={[
                    styles.typeTag,
                    {
                      backgroundColor: `${
                        event.type === "meeting"
                          ? "#8B5CF6"
                          : event.type === "activity"
                          ? "#EC4899"
                          : event.type === "training"
                          ? "#10B981"
                          : "#F59E0B"
                      }15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      event.type === "meeting"
                        ? "people"
                        : event.type === "activity"
                        ? "layers"
                        : event.type === "training"
                        ? "school"
                        : "flag"
                    }
                    size={14}
                    color={
                      event.type === "meeting"
                        ? "#8B5CF6"
                        : event.type === "activity"
                        ? "#EC4899"
                        : event.type === "training"
                        ? "#10B981"
                        : "#F59E0B"
                    }
                  />
                  <Text
                    style={[
                      styles.typeText,
                      {
                        color:
                          event.type === "meeting"
                            ? "#8B5CF6"
                            : event.type === "activity"
                            ? "#EC4899"
                            : event.type === "training"
                            ? "#10B981"
                            : "#F59E0B",
                      },
                    ]}
                  >
                    {event.type}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {event.date.toDate().toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text
                style={styles.eventDescription}
                numberOfLines={expandedId === event.id ? undefined : 2}
              >
                {event.description}
              </Text>

              <View style={styles.eventFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.footerText}>{event.location}</Text>
                </View>
                {event.time && (
                  <View style={styles.footerItem}>
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text style={styles.footerText}>{event.time}</Text>
                  </View>
                )}
              </View>

              {expandedId === event.id && (
                <View style={styles.expandedContent}>
                  {event.requirements && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Requirements:</Text>
                      {event.requirements.map((req, index) => (
                        <Text key={index} style={styles.detailText}>
                          • {req}
                        </Text>
                      ))}
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>Contact Information:</Text>
                    <Text style={styles.detailText}>
                      {event.contactPerson || "Not specified"}
                    </Text>
                    <Text style={styles.detailText}>
                      {event.contactNumber || "No contact number"}
                    </Text>
                  </View>

                  {event.maxParticipants && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>
                        Maximum Participants:
                      </Text>
                      <Text style={styles.detailText}>
                        {event.maxParticipants} people
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.registerButton,
                      registeredEvents.includes(event.id) &&
                        styles.registeredButton,
                    ]}
                    onPress={() => handleRegistration(event.id, event.title)}
                    disabled={registeredEvents.includes(event.id)}
                  >
                    <LinearGradient
                      colors={
                        registeredEvents.includes(event.id)
                          ? ["#D1D5DB", "#9CA3AF"]
                          : ["#8B5CF6", "#EC4899"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.registerGradient}
                    >
                      <Text style={styles.registerText}>
                        {registeredEvents.includes(event.id)
                          ? "Registered"
                          : "Register for Event"}
                      </Text>
                      {!registeredEvents.includes(event.id) && (
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={styles.learnMoreContainer}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.1)", "rgba(192, 38, 211, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.learnMoreWrapper}
          >
            <TouchableOpacity
              style={styles.learnMoreButton}
              onPress={() =>
                Linking.openURL("https://www.kudumbashree.org/pages/671")
              }
            >
              <LinearGradient
                colors={["#7C3AED", "#C026D3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.learnMoreGradient}
              >
                <View style={styles.learnMoreContent}>
                  <View style={styles.learnMoreTextContainer}>
                    <Text style={styles.learnMoreTitle}>
                      Want to learn more?
                    </Text>
                    <Text style={styles.learnMoreSubtitle}>
                      Visit Kudumbashree Events Page
                    </Text>
                  </View>
                  <View style={styles.learnMoreIconContainer}>
                    <Ionicons name="open-outline" size={24} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>

      {showToast && <CustomToast message={toastMessage} type="success" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  seedButton: {
    padding: 8,
    marginLeft: "auto",
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 5,
    marginTop: 0,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedFilter: {
    backgroundColor: "#8B5CF6",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#8B5CF6",
  },
  selectedFilterText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    textTransform: "capitalize",
  },
  dateText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  eventTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 8,
  },
  eventDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.1)",
  },
  detailSection: {
    marginBottom: 16,
  },
  detailTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },
  detailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
    paddingLeft: 8,
  },
  registerButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  registeredButton: {
    opacity: 0.7,
  },
  registerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  registerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  toastContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
  },
  toastGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  toastText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
    flex: 1,
  },
  learnMoreContainer: {
    marginTop: 8,
    marginBottom:40,
    marginHorizontal: 16,
  },
  learnMoreWrapper: {
    borderRadius: 16,
    padding: 1,
  },
  learnMoreButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  learnMoreGradient: {
    borderRadius: 16,
  },
  learnMoreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  learnMoreTextContainer: {
    flex: 1,
  },
  learnMoreTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
  },
  learnMoreSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  learnMoreIconContainer: {
    marginLeft: 12,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
