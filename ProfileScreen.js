import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; 

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: "https://placeimg.com/100/100/people" }} // Replace with user's actual profile picture
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Jane Doe</Text>
        <Text style={styles.profileEmail}>janedoe@example.com</Text>
      </View>

      {/* User Details Section */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionHeader}>User Details</Text>
        <Text style={styles.detailText}>Age: 28</Text>
        <Text style={styles.detailText}>Location: Kerala</Text>
        <Text style={styles.detailText}>Member Since: 2021</Text>
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
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
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#81459b",
  },
  profileEmail: {
    fontSize: 16,
    color: "#81459b",
  },
  detailsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#81459b",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 5,
  },
  editButton: {
    backgroundColor: "#81459b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
