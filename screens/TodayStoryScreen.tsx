import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Animated,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  orderBy,
  getDocs,
  Timestamp,
  getFirestore,
  addDoc,
} from "firebase/firestore";

interface Story {
  id?: string;
  title: string;
  content: string;
  date: Timestamp;
  images: string[];
  category: string;
  location: string;
  author?: string;
}

const sampleStories = [
  {
    title: "Successful Micro-Enterprise Launch",
    content:
      "A group of 10 Kudumbashree members from Kollam district launched their catering business venture today. The unit specializes in traditional Kerala cuisine and has already received orders for upcoming events.",
    date: Timestamp.fromDate(new Date()),
    images: [
      "https://picsum.photos/800/600?random=1",
      "https://picsum.photos/800/600?random=2",
    ],
    category: "Success Story",
    location: "Kollam",
    author: "Sreelatha K",
  },
  {
    title: "Digital Literacy Program Achievement",
    content:
      "50 Kudumbashree members successfully completed their digital literacy training program. They learned basic computer skills, internet banking, and digital marketing fundamentals.",
    date: Timestamp.fromDate(new Date(Date.now() - 86400000)), // Yesterday
    images: ["https://picsum.photos/800/600?random=3"],
    category: "Achievement",
    location: "Thiruvananthapuram",
    author: "Rajesh M",
  },
  {
    title: "Organic Farming Initiative",
    content:
      "Kudumbashree farming groups in Kottayam have started organic vegetable cultivation on 5 acres of land. The produce will be sold through weekly markets.",
    date: Timestamp.fromDate(new Date(Date.now() - 172800000)), // 2 days ago
    images: [
      "https://picsum.photos/800/600?random=4",
      "https://picsum.photos/800/600?random=5",
    ],
    category: "Update",
    location: "Kottayam",
    author: "Priya S",
  },
];

export default function TodayStoryScreen({ navigation }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  const fetchStories = async () => {
    try {
      const db = getFirestore();
      const q = query(collection(db, "stories"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const storiesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Story[];
      setStories(storiesList);
      updateCategories(storiesList);
    } catch (error) {
      console.error("Error fetching stories:", error);
      setStories(sampleStories); // Fallback to sample stories
      updateCategories(sampleStories);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const seedStories = async () => {
    setSeeding(true);
    try {
      const db = getFirestore();
      const storiesRef = collection(db, "stories");

      for (const story of sampleStories) {
        await addDoc(storiesRef, story);
      }

      Alert.alert("Success", "Stories have been seeded successfully");
      fetchStories(); // Refresh the list after seeding
    } catch (error) {
      console.error("Error seeding stories:", error);
      Alert.alert("Error", "Failed to seed stories");
    } finally {
      setSeeding(false);
    }
  };

  const updateCategories = (storiesList: Story[]) => {
    const uniqueCategories = [
      "All",
      ...new Set(storiesList.map((story) => story.category)),
    ];
    setCategories(uniqueCategories);
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStories();
  };

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
          <Text style={styles.headerTitle}>Today's Story</Text>
          {/* <TouchableOpacity
            onPress={seedStories}
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
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.selectedFilter,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Ionicons
                name={getCategoryIcon(category)}
                size={16}
                color={selectedCategory === category ? "#fff" : "#8B5CF6"}
              />
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === category && styles.selectedFilterText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {stories
          .filter((story) =>
            selectedCategory === "All"
              ? true
              : story.category === selectedCategory
          )
          .map((story) => (
            <View key={story.id || story.title} style={styles.storyCard}>
              {story.images && story.images.length > 0 && (
                <Image
                  source={{ uri: story.images[0] }}
                  style={styles.storyImage}
                />
              )}
              <View style={styles.storyContent}>
                <View style={styles.categoryTag}>
                  <Ionicons
                    name={getCategoryIcon(story.category)}
                    size={14}
                    color="#8B5CF6"
                  />
                  <Text style={styles.categoryText}>{story.category}</Text>
                </View>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyText}>{story.content}</Text>
                <View style={styles.storyFooter}>
                  <View style={styles.footerItem}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.footerText}>{story.location}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.footerText}>
                      {story.date.toDate().toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

        <View style={styles.websiteLinkContainer}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.1)", "rgba(192, 38, 211, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.linkWrapper}
          >
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                Linking.openURL("https://www.kudumbashree.org/news")
              }
            >
              <LinearGradient
                colors={["#7C3AED", "#C026D3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linkContent}
              >
                <View style={styles.linkTextContainer}>
                  <Text style={styles.linkTitle}>Visit Kudumbashree News</Text>
                  <Text style={styles.linkSubtitle}>
                    Stay updated with all official news and announcements
                  </Text>
                </View>
                <View style={styles.linkIconContainer}>
                  <Ionicons
                    name="arrow-forward-circle"
                    size={32}
                    color="#fff"
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "all":
      return "albums-outline";
    case "success story":
      return "star-outline";
    case "achievement":
      return "trophy-outline";
    case "event":
      return "calendar-outline";
    case "update":
      return "newspaper-outline";
    default:
      return "document-text-outline";
  }
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
    paddingBottom: 20,
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
  storyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  storyImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  storyContent: {
    padding: 16,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#8B5CF6",
  },
  storyTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginBottom: 8,
  },
  storyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  storyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.1)",
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
  websiteLinkContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
  linkWrapper: {
    borderRadius: 16,
    padding: 1,
  },
  linkButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 2,
  },
  linkSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  linkIconContainer: {
    marginLeft: 12,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
