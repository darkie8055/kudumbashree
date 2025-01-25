import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Importing screens as components
import ActivitiesScreen from "./ActivitiesScreen";
import LawsAndRegulationsScreen from "./LawsAndRegulationsScreen";
import UpcomingScreen from "./UpcomingScreen";
import TodaysStoryScreen from "./TodaysStoryScreen";

const sampleNotices = [
  { id: "1", title: "Meeting on Jan 15th, 2025" },
  { id: "2", title: "Audit scheduled for Jan 20th, 2025" },
];

const sampleNews = [
  { id: "1", headline: "New Women Empowerment Scheme Launched" },
  { id: "2", headline: "Kudumbashree Annual Event Announced" },
];

export default function HomeScreen() {
  const [notices, setNotices] = useState(sampleNotices);
  const [news, setNews] = useState(sampleNews);
  const [activeScreen, setActiveScreen] = useState("Home"); // Tracks the current screen

  const fetchNotices = async () => {
    setNotices(sampleNotices);
  };

  const fetchNews = async () => {
    setNews(sampleNews);
  };

  useEffect(() => {
    fetchNotices();
    fetchNews();
  }, []);

  // Navigation logic
  const navigateTo = (screen) => {
    setActiveScreen(screen);
  };

  if (activeScreen === "Activities") return <ActivitiesScreen goBack={() => setActiveScreen("Home")} />;
  if (activeScreen === "LawsAndRegulations") return <LawsAndRegulationsScreen goBack={() => setActiveScreen("Home")} />;
  if (activeScreen === "Upcoming") return <UpcomingScreen goBack={() => setActiveScreen("Home")} />;
  if (activeScreen === "TodaysStory") return <TodaysStoryScreen goBack={() => setActiveScreen("Home")} />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageHeading}>Home</Text>

      {/* Table Navigation Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.tableOuterBorder}>
          <View style={styles.table}>
            <TouchableOpacity
              style={styles.tableItem}
              onPress={() => navigateTo("Activities")}
            >
              <Icon name="account-group" size={30} color="#ffffff" />
              <Text style={styles.gridText}>Activities</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tableItem}
              onPress={() => navigateTo("LawsAndRegulations")}
            >
              <Icon name="gavel" size={30} color="#ffffff" />
              <Text style={styles.gridText}>Laws & Regl</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tableItem}
              onPress={() => navigateTo("Upcoming")}
            >
              <Icon name="calendar" size={30} color="#ffffff" />
              <Text style={styles.gridText}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tableItem}
              onPress={() => navigateTo("TodaysStory")}
            >
              <Icon name="book-open-page-variant" size={30} color="#ffffff" />
              <Text style={styles.gridText}>Today’s Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notice Board Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Notice Board</Text>
        <View style={styles.boardContainer}>
          <FlatList
            data={notices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.boardItem}>
                <Text style={styles.boardText}>{item.title}</Text>
              </View>
            )}
          />
        </View>
      </View>

      {/* News Board Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>News Board</Text>
        <View style={styles.boardContainer}>
          <FlatList
            data={news}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.boardItem}>
                <Text style={styles.boardText}>{item.headline}</Text>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#81459b",
    textAlign: "center",
    marginBottom:15,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#81459b",
    textAlign: "center",
  },
  tableOuterBorder: {
    borderWidth: 2.5,
    borderColor: "#a6dfb8",
    borderRadius: 4,
    overflow: "hidden",
    width:"90%",
    marginLeft:15,
  },
  table: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  tableItem: {
    width: "50%",
    height: 70,
    backgroundColor: "#81459b",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#a6dfb8",
    borderWidth: 1,
  },
  gridText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 5,
    textAlign: "center",
  },
  boardContainer: {
    backgroundColor: "#a6dfb8",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#81459b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  boardItem: {
    backgroundColor: "#ffffff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#81459b",
  },
  boardText: {
    color: "#81459b",
    textAlign: "center",
  },
});
