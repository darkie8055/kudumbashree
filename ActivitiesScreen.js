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

const images = [
  { id: "1", uri: "https://placeimg.com/200/200/any" },
  { id: "2", uri: "https://placeimg.com/200/200/any" },
  { id: "3", uri: "https://placeimg.com/200/200/any" },
  { id: "4", uri: "https://placeimg.com/200/200/any" },
  { id: "5", uri: "https://placeimg.com/200/200/any" },
  { id: "6", uri: "https://placeimg.com/200/200/any" },
];

export default function ActivitiesScreen({ goBack }) {
  // Render each item in the gallery
  const renderImageItem = ({ item }) => (
    <TouchableOpacity style={styles.imageContainer}>
      <Image source={{ uri: item.uri }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Icon name="arrow-left" size={24} color="#81459b" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Page Heading */}
      <Text style={styles.pageHeading}>Activities Photo Gallery</Text>

      {/* Grid of Images */}
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={renderImageItem}
        numColumns={2} // 2 items per row for the grid
        columnWrapperStyle={styles.row}
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
  row: {
    justifyContent: "space-between", // Space out images horizontally
  },
  imageContainer: {
    marginBottom: 10, // Spacing between images
    borderRadius: 10, // Rounded corners
    overflow: "hidden", // To make sure the image fits the container properly
    elevation: 5, // Adding a shadow effect for 3D look
  },
  image: {
    width: 150, // Set the width for images
    height: 150, // Set the height for images
    borderRadius: 8, // Rounded corners for images
  },
});
