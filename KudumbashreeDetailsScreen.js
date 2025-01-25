import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // For safe area handling

export default function KudumbashreeDetailsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Page Heading */}
      <Text style={styles.pageHeading}>Kudumbashree Details</Text>

      {/* ScrollView to enable vertical scrolling */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Mission */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Mission</Text>
          <Text style={styles.sectionText}>
            The mission of Kudumbashree is to eradicate absolute poverty in
            Kerala by empowering women through community-based organizations.
            It aims to uplift marginalized women and promote gender equality.
          </Text>
        </View>

        {/* Objectives */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Objectives</Text>
          <Text style={styles.sectionText}>
            1. Empower women through leadership, skill-building, and community
            development.
            {"\n"}2. Promote sustainable livelihoods and economic independence.
            {"\n"}3. Improve access to education, health, and welfare services for
            women and children.
          </Text>
        </View>

        {/* Key Features */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Key Features</Text>
          <Text style={styles.sectionText}>
            Kudumbashree is based on a three-tier structure:
            {"\n"}- **Neighbourhood Groups (NHGs)**: Grassroots level groups of
            women engaged in various activities.
            {"\n"}- **Area Development Societies (ADS)**: Facilitates the
            convergence of various programs.
            {"\n"}- **Community Development Societies (CDS)**: Responsible for
            the overall management and coordination of activities.
          </Text>
        </View>

        {/* Images Section (optional) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Gallery</Text>
          <Image
            source={{ uri: "https://placeimg.com/400/200/any" }} // Replace with your image URL
            style={styles.image}
          />
          <Text style={styles.sectionText}>
            Image caption or description of the activities being conducted by
            Kudumbashree.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Light background for the screen
    paddingHorizontal: 10,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#81459b", // Purple color for heading
    textAlign: "center",
    marginVertical: 15,
  },
  scrollContainer: {
    paddingBottom: 20, // Padding to avoid content being cut off
  },
  sectionContainer: {
    backgroundColor: "#ffffff", // White background for each section
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    elevation: 5, // Shadow effect for card-like design
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#81459b", // Purple header color
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    color: "#333333", // Dark color for text
    lineHeight: 24,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
});
