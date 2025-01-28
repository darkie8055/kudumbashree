import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // For safe area handling
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const activities = [
  {
    id: "1",
    uri: "https://placeimg.com/400/200/any", // Landscape image
    date: "Jan 20, 2025",
    info: "Community Clean-Up Drive",
  },
  {
    id: "2",
    uri: "https://placeimg.com/200/200/any", // Square image
    date: "Jan 15, 2025",
    info: "Handicraft Workshop",
  },
  {
    id: "3",
    uri: "https://placeimg.com/400/200/any", // Landscape image
    date: "Jan 10, 2025",
    info: "Agriculture Training Program",
  },
  {
    id: "4",
    uri: "https://placeimg.com/200/200/any", // Square image
    date: "Jan 5, 2025",
    info: "Food Distribution Drive",
  },
];

export default function ActivitiesScreen({ goBack }) {
  // Render each activity item
  const renderActivityItem = ({ item }) => (
    <View style={styles.activityContainer}>
      <Image
        source={{ uri: item.uri }}
        style={[
          styles.image,
          item.uri.includes("400/200") ? styles.landscapeImage : styles.squareImage,
        ]}
      />
      <Text style={styles.activityText}>{item.date}</Text>
      <Text style={styles.activityInfo}>{item.info}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Icon name="arrow-left" size={24} color="#81459b" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Page Heading */}
      <Text style={styles.pageHeading}>Kudumbashree Activities</Text>

      {/* Activity List */}
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityItem}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Light background
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#81459b",
    marginLeft: 5,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#81459b", // Purple color for heading
    textAlign: "center",
    marginVertical: 15,
  },
  listContainer: {
    paddingBottom: 20, // Space at the bottom of the list
  },
  activityContainer: {
    marginBottom: 15,
    alignItems: "center", // Center images and text
  },
  image: {
    borderRadius: 10, // Rounded corners for images
    marginBottom: 5,
  },
  landscapeImage: {
    width: "100%", // Full width for landscape images
    height: 200, // Fixed height for landscape images
  },
  squareImage: {
    width: "48%", // Two images fit side-by-side
    height: 150, // Fixed height for square images
    marginHorizontal: "1%", // Small space between square images
  },
  activityText: {
    fontSize: 14,
    color: "#333", // Dark text for date
    fontWeight: "600",
  },
  activityInfo: {
    fontSize: 12,
    color: "#666", // Lighter text for info
    textAlign: "center",
    marginTop: 3,
  },
});
