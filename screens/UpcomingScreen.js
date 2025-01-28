import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function UpcomingScreen({ goBack }) {
  // Function to open the Kudumbashree events page
  const openEventsPage = () => {
    const url = "https://kudumbashree.org/events";
    Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Icon name="arrow-left" size={24} color="#81459b" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Heading */}
      <Text style={styles.heading}>Upcoming Events</Text>

      {/* Button to Open Events Page */}
      <TouchableOpacity style={styles.linkButton} onPress={openEventsPage}>
        <Text style={styles.linkButtonText}>Visit Kudumbashree Events Page</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
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
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#81459b",
    textAlign: "center",
    marginVertical: 20,
  },
  linkButton: {
    backgroundColor: "#81459b",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
});
