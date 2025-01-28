import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // For safe area handling
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Icon library

const laws = [
  { id: "1", title: "Kudumbashree Act, 1998", description: "A key regulation guiding the formation of Kudumbashree units." },
  { id: "2", title: "Right to Information Act, 2005", description: "Legislation ensuring transparency and accountability." },
];

export default function LawsAndRegulationsScreen({ goBack }) {
  // Render each law item
  const renderLawItem = ({ item }) => (
    <View style={styles.lawCard}>
      <Text style={styles.lawTitle}>{item.title}</Text>
      <Text style={styles.lawDescription}>{item.description}</Text>
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
      <Text style={styles.heading}>Laws & Regulations</Text>

      {/* List of Laws */}
      <FlatList
        data={laws}
        keyExtractor={(item) => item.id}
        renderItem={renderLawItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
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
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#81459b",
    textAlign: "center",
    marginVertical: 15,
  },
  lawCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
  },
  lawTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  lawDescription: {
    fontSize: 16,
    color: "#81459b",
  },
});
