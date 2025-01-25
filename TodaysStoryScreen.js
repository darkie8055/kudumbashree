import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // For safe area handling
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Icon library

export default function TodaysStoryScreen({ goBack }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Icon name="arrow-left" size={24} color="#81459b" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Heading */}
      <Text style={styles.heading}>Today's Story</Text>

      {/* Story Content */}
      <ScrollView style={styles.storyContainer}>
        <Text style={styles.storyTitle}>Empowering Women: The Kudumbashree Journey</Text>
        <Text style={styles.storyContent}>
          Kudumbashree has always been a beacon of hope for thousands of women in Kerala. This organization, initially started as a way to combat poverty, has now transformed into a force for empowerment, providing financial independence, vocational training, and community support for women across the state. Through Kudumbashree, women have found not just a livelihood but also a voice in the community.
        </Text>
        <Text style={styles.storyContent}>
          Today, Kudumbashree continues to grow with new programs focused on sustainable agriculture, entrepreneurship, and leadership training, all of which contribute to improving the quality of life for members. This story is one of many that showcase the powerful impact of collective action and the spirit of self-help.
        </Text>
      </ScrollView>
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
  storyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 15,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  storyContent: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
});
