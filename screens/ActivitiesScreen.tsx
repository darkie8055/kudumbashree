import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  addDoc,
  getFirestore,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  SharedValue,
} from "react-native-reanimated";

interface Activity {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  imageUrl: string;
  location: string;
  type: "meeting" | "event" | "training";
  attendees: string[];
  organizer: string;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: Timestamp;
  detailedAgenda?: string[];
  trainer?: string;
  materials?: string;
  duration?: string;
  speakers?: string[];
  topics?: string[];
  certificates?: boolean;
  stallCategories?: string[];
  timings?: string;
  specialFeatures?: string[];
  includes?: string[];
  lunch?: string;
  contactPerson?: string;
  contactPhone?: string;
  images: string[]; // Array of image URLs
  eventDate: string;
  venue: string;
  participants: number;
  highlights: string[];
  outcome?: string;
}

// Update the sampleActivities array with generated images
const sampleActivities = [
  {
    title: "Monthly General Meeting",
    description:
      "Discussion on upcoming projects, financial updates, and loan disbursements. All members are required to attend to participate in important decisions.",
    date: Timestamp.fromDate(new Date(2024, 3, 15, 10, 0)),
    imageUrl: "https://picsum.photos/800/600?random=1", // Meeting room image
    location: "Community Hall, Ward 5",
    type: "meeting" as const,
    attendees: [],
    organizer: "9072160767",
    status: "upcoming" as const,
    createdAt: Timestamp.now(),
    detailedAgenda: [
      "Monthly progress review",
      "Financial statement presentation",
      "New member applications",
      "Upcoming training programs",
    ],
    contactPerson: "Sreelatha K",
    contactPhone: "9072160767",
    images: [],
    eventDate: "",
    venue: "",
    participants: 0,
    highlights: [],
  },
  {
    title: "Annual Women's Day Celebration",
    description:
      "Celebrating International Women's Day with cultural programs and awards ceremony for outstanding members.",
    date: Timestamp.fromDate(new Date(2024, 2, 8)),
    images: [
      "https://picsum.photos/800/600?random=1",
      "https://picsum.photos/800/600?random=2",
      "https://picsum.photos/800/600?random=3",
    ],
    location: "District Community Hall",
    type: "event" as const,
    eventDate: "March 8, 2024",
    venue: "District Community Hall, Kollam",
    participants: 200,
    highlights: [
      "Cultural performances by members",
      "Recognition of successful entrepreneurs",
      "Launch of new initiatives",
      "Interactive sessions with leaders",
    ],
    outcome:
      "Successfully celebrated women's achievements and motivated members",
    attendees: [],
    organizer: "9072160767",
    status: "upcoming" as const,
    createdAt: Timestamp.now(),
  },
  {
    title: "Traditional Handicrafts Exhibition",
    description:
      "Showcasing handmade products by Kudumbashree members including traditional crafts, textiles, and artworks.",
    date: Timestamp.fromDate(new Date(2024, 2, 20)),
    images: [
      "https://picsum.photos/800/600?random=4",
      "https://picsum.photos/800/600?random=5",
      "https://picsum.photos/800/600?random=6",
    ],
    location: "Town Hall Exhibition Center",
    type: "event",
    eventDate: "March 20, 2024",
    venue: "Town Hall, Trivandrum",
    participants: 150,
    highlights: [
      "Display of traditional Kerala handicrafts",
      "Live demonstration of craft making",
      "Direct sales opportunity",
      "Workshops for visitors",
    ],
    outcome:
      "Successfully showcased local artisans and generated sales worth ₹2.5 lakhs",
    attendees: [],
    organizer: "9072160767",
    status: "completed",
    createdAt: Timestamp.now(),
  },
  {
    title: "Organic Farming Workshop",
    description:
      "Hands-on training session on organic farming techniques, composting, and sustainable agriculture practices.",
    date: Timestamp.fromDate(new Date(2024, 2, 25)),
    images: [
      "https://picsum.photos/800/600?random=7",
      "https://picsum.photos/800/600?random=8",
      "https://picsum.photos/800/600?random=9",
    ],
    location: "Agricultural Training Center",
    type: "training",
    eventDate: "March 25, 2024",
    venue: "Agri Center, Kottayam",
    participants: 75,
    highlights: [
      "Organic farming methods demonstration",
      "Natural pest control techniques",
      "Seed preservation workshop",
      "Marketing organic produce",
    ],
    outcome: "Participants started 15 new organic farming units",
    attendees: [],
    organizer: "9072160767",
    status: "completed",
    createdAt: Timestamp.now(),
  },
  {
    title: "Financial Literacy Program",
    description:
      "Comprehensive training on financial management, banking, and investment opportunities for women entrepreneurs.",
    date: Timestamp.fromDate(new Date(2024, 3, 5)),
    images: [
      "https://picsum.photos/800/600?random=10",
      "https://picsum.photos/800/600?random=11",
      "https://picsum.photos/800/600?random=12",
    ],
    location: "District Cooperative Bank",
    type: "training",
    eventDate: "April 5, 2024",
    venue: "DCB Training Hall, Palakkad",
    participants: 100,
    highlights: [
      "Basic banking operations",
      "Digital payment systems",
      "Investment opportunities",
      "Loan management",
    ],
    outcome: "Enhanced financial literacy among members",
    attendees: [],
    organizer: "9072160767",
    status: "completed",
    createdAt: Timestamp.now(),
  },
  {
    title: "Community Food Festival",
    description:
      "Annual food festival showcasing traditional Kerala cuisine prepared by Kudumbashree cooking units.",
    date: Timestamp.fromDate(new Date(2024, 3, 12)),
    images: [
      "https://picsum.photos/800/600?random=13",
      "https://picsum.photos/800/600?random=14",
      "https://picsum.photos/800/600?random=15",
    ],
    location: "Marine Drive",
    type: "event",
    eventDate: "April 12, 2024",
    venue: "Marine Drive, Kochi",
    participants: 300,
    highlights: [
      "Traditional Kerala cuisine",
      "Live cooking demonstrations",
      "Cultural performances",
      "Food photography contest",
    ],
    outcome:
      "Successfully promoted local cuisine and generated revenue for food units",
    attendees: [],
    organizer: "9072160767",
    status: "completed",
    createdAt: Timestamp.now(),
  },
  {
    title: "Digital Skills Workshop",
    description:
      "Training session on essential digital skills including social media marketing and e-commerce platforms.",
    date: Timestamp.fromDate(new Date(2024, 3, 18)),
    images: [
      "https://picsum.photos/800/600?random=16",
      "https://picsum.photos/800/600?random=17",
      "https://picsum.photos/800/600?random=18",
    ],
    location: "IT Training Center",
    type: "training",
    eventDate: "April 18, 2024",
    venue: "Tech Hub, Kozhikode",
    participants: 80,
    highlights: [
      "Social media marketing basics",
      "E-commerce platform usage",
      "Digital payment systems",
      "Online customer service",
    ],
    outcome: "Members started 25 new online businesses",
    attendees: [],
    organizer: "9072160767",
    status: "completed",
    createdAt: Timestamp.now(),
  },
];

// Update the AnimatedDot component to have smoother animations
const AnimatedDot = ({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = Math.round(scrollX.value / width) === index;
    return {
      width: withSpring(isActive ? 24 : 8),
      height: 8,
      backgroundColor: withTiming(
        isActive ? "#fff" : "rgba(255, 255, 255, 0.5)",
        { duration: 300 }
      ),
      borderRadius: 4,
      marginHorizontal: 4,
      transform: [{ scale: withSpring(isActive ? 1 : 0.8) }],
    };
  });

  return <Animated.View style={[styles.indicator, animatedStyle]} />;
};

// Update the ImageCarousel component
const ImageCarousel = ({ images, cardId }) => {
  const scrollX = useSharedValue(0);
  const [paused, setPaused] = useState(false);
  const scrollViewRef = useRef(null);
  const screenWidth = Dimensions.get("window").width - 32;

  const scrollToNextImage = () => {
    const currentIndex = Math.round(scrollX.value / screenWidth);
    const nextIndex = (currentIndex + 1) % images.length;

    scrollViewRef.current?.scrollTo({
      x: nextIndex * screenWidth,
      animated: true,
      duration: 1000, // 1 second transition
    });
  };

  useEffect(() => {
    let scrollInterval;

    if (!paused && images.length > 1) {
      scrollInterval = setInterval(scrollToNextImage, 5000); // Change image every 5 seconds
    }

    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [paused, images.length, screenWidth]);

  return (
    <View style={styles.imageContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        decelerationRate={0.1} // Slower deceleration
        snapToInterval={screenWidth} // Snap to each image
        snapToAlignment="center"
        style={styles.imageScroll}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onMomentumScrollEnd={() => setPaused(false)}
        contentContainerStyle={{ alignItems: "center" }}
      >
        {images.map((image, index) => (
          <View
            key={`${cardId}-${index}`}
            style={[styles.imageWrapper, { width: screenWidth }]}
          >
            <Image
              source={{ uri: image }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)"]}
              style={styles.imageGradient}
            />
          </View>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.imageIndicators}>
          {images.map((_, index) => (
            <AnimatedDot
              key={`dot-${cardId}-${index}`}
              index={index}
              scrollX={scrollX}
              width={screenWidth}
            />
          ))}
        </View>
      )}

      {images.length > 1 && (
        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={() => setPaused(!paused)}
        >
          <Ionicons
            name={paused ? "play-circle" : "pause-circle"}
            size={24}
            color="rgba(255, 255, 255, 0.8)"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Update the ActivityCard component
const ActivityCard = ({ activity, expandedId, setExpandedId }) => {
  return (
    <Animated.View
      style={[
        styles.galleryCard,
        expandedId === activity.id && styles.expandedCard,
      ]}
    >
      {activity.images.length > 0 ? (
        <ImageCarousel images={activity.images} cardId={activity.id} />
      ) : (
        <View style={styles.noImageContainer}>
          <Ionicons name="image-outline" size={32} color="#9CA3AF" />
        </View>
      )}

      <TouchableOpacity
        onPress={() =>
          setExpandedId(expandedId === activity.id ? null : activity.id)
        }
        style={styles.contentContainer}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.galleryTitle}>{activity.title}</Text>
            <Text style={styles.eventDate}>{activity.eventDate}</Text>
          </View>
          <View
            style={[
              styles.typeTag,
              { backgroundColor: getTypeColor(activity.type) },
            ]}
          >
            <Ionicons
              name={getTypeIcon(activity.type)}
              size={14}
              color="#fff"
            />
            <Text style={styles.typeText}>{activity.type}</Text>
          </View>
        </View>

        <Text
          style={styles.description}
          numberOfLines={expandedId === activity.id ? undefined : 2}
        >
          {activity.description}
        </Text>

        {expandedId === activity.id && (
          <View style={styles.expandedDetails}>
            <View style={styles.detailsRow}>
              <Ionicons name="location" size={18} color="#8B5CF6" />
              <Text style={styles.detailText}>{activity.venue}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Ionicons name="people" size={18} color="#8B5CF6" />
              <Text style={styles.detailText}>
                {activity.participants} participants
              </Text>
            </View>

            <View style={styles.highlightsSection}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              {activity.highlights.map((highlight, index) => (
                <View key={index} style={styles.highlightRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>

            {activity.outcome && (
              <View style={styles.outcomeSection}>
                <Text style={styles.sectionTitle}>Outcome</Text>
                <Text style={styles.outcomeText}>{activity.outcome}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Add these helper functions
const getTypeColor = (type: string) => {
  switch (type) {
    case "event":
      return "rgba(139, 92, 246, 0.9)";
    case "training":
      return "rgba(236, 72, 153, 0.9)";
    case "meeting":
      return "rgba(59, 130, 246, 0.9)";
    default:
      return "rgba(107, 114, 128, 0.9)";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "event":
      return "calendar";
    case "training":
      return "school";
    case "meeting":
      return "people";
    default:
      return "information-circle";
  }
};

const ActivitiesScreen = ({ navigation }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollX = useSharedValue(0);
  const [selectedType, setSelectedType] = useState<string>("all");

  const activityTypes = [
    { key: "all", icon: "albums-outline", label: "All" },
    { key: "event", icon: "calendar", label: "Events" },
    { key: "training", icon: "school", label: "Training" },
    { key: "meeting", icon: "people", label: "Meetings" },
  ];

  const seedActivities = async () => {
    setSeeding(true);
    try {
      const db = getFirestore();
      const activitiesRef = collection(db, "activities");

      for (const activity of sampleActivities) {
        await addDoc(activitiesRef, activity);
      }

      Alert.alert("Success", "Activities have been seeded successfully");
      fetchActivities(); // Refresh the list after seeding
    } catch (error) {
      console.error("Error seeding activities:", error);
      Alert.alert("Error", "Failed to seed activities");
    } finally {
      setSeeding(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const db = getFirestore();
      const q = query(collection(db, "activities"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);

      const activitiesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];

      setActivities(activitiesList);
    } catch (error) {
      console.error("Error fetching activities:", error);
      Alert.alert("Error", "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Activities</Text>

          {/* Seed button - you might want to hide this in production */}
          {/* <TouchableOpacity
            onPress={seedActivities}
            disabled={seeding}
            style={styles.seedButton}
          >
            {seeding ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
            )}
          </TouchableOpacity> */}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {activityTypes.map((type) => (
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
        {activities
          .filter((activity) =>
            selectedType === "all" ? true : activity.type === selectedType
          )
          .map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
            />
          ))}

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
                Linking.openURL("https://www.kudumbashree.org/activities")
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
                      Visit the official Kudumbashree website
                    </Text>
                  </View>
                  <View style={styles.learnMoreIconContainer}>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={32}
                      color="#fff"
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    backgroundColor: "#F9FAFB",
  },
  galleryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    transform: [{ scale: 1 }],
  },
  expandedCard: {
    transform: [{ scale: 1.02 }],
    elevation: 8,
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  imageContainer: {
    height: 200,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  imageWrapper: {
    position: "relative",
    overflow: "hidden",
  },
  imageScroll: {
    height: 200,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  imageIndicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 20,
  },
  playPauseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  contentContainer: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  galleryTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: "#8B5CF6",
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
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
    textTransform: "capitalize",
  },
  description: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    lineHeight: 20,
  },
  expandedDetails: {
    marginTop: 12,
    backgroundColor: "#F9FAFB",
    margin: -16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.1)",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
  },
  highlightsSection: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginBottom: 12,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
    marginRight: 12,
  },
  highlightText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    flex: 1,
  },
  outcomeSection: {
    marginTop: 16,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
    borderRadius: 12,
    padding: 16,
  },
  outcomeText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    lineHeight: 20,
  },
  learnMoreContainer: {
    marginTop: 8,
    marginBottom: 40,
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
  noImageContainer: {
    height: 180,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    overflow: "hidden",
  },
});

export default ActivitiesScreen;
