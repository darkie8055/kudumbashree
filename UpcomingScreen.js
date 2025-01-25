import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // For safe area handling
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Icon library

const upcomingEvents = [
  { id: "1", title: "Annual Meet – Jan 30th, 2025", date: "Jan 30th, 2025" },
  { id: "2", title: "Workshop on Sustainable Living – Feb 5th, 2025", date: "Feb 5th, 2025" },
];

export default function UpcomingScreen({ goBack }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Icon name="arrow-left" size={24} color="#81459b" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Heading */}
      <Text style={styles.heading}>Upcoming Events</Text>

      {/* List of Events */}
      <FlatList
        data={upcomingEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDate}>{item.date}</Text>
          </View>
        )}
      />
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
  eventCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  eventDate: {
    fontSize: 16,
    color: "#81459b",
  },
});
