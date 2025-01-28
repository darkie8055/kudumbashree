import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";

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
  const [activeScreen, setActiveScreen] = useState("Home");

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

  const navigateTo = (screen) => {
    setActiveScreen(screen);
  };

  if (activeScreen === "Activities")
    return <ActivitiesScreen goBack={() => setActiveScreen("Home")} />;
  if (activeScreen === "LawsAndRegulations")
    return <LawsAndRegulationsScreen goBack={() => setActiveScreen("Home")} />;
  if (activeScreen === "Upcoming")
    return <UpcomingScreen goBack={() => setActiveScreen("Home")} />;
  if (activeScreen === "TodaysStory")
    return <TodaysStoryScreen goBack={() => setActiveScreen("Home")} />;

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
              <Icon name="account-group" size={30} color="#000" style={styles.icon} />
              <Text style={styles.gridText}>Activities</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tableItem}
              onPress={() => navigateTo("LawsAndRegulations")}
            >
              <Icon name="gavel" size={30} color="#000" style={styles.icon} />
              <Text style={styles.gridText}>Laws & Regl</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tableItem}
              onPress={() => navigateTo("Upcoming")}
            >
              <Icon name="calendar" size={30} color="#000" style={styles.icon} />
              <Text style={styles.gridText}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tableItem}
              onPress={() => navigateTo("TodaysStory")}
            >
              <Icon name="book-open-page-variant" size={30} color="#000" style={styles.icon} />
              <Text style={styles.gridText}>Today’s Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notice Board Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Notice Board</Text>
        <LinearGradient
          colors={["rgba(129, 69, 155, 0.7)", "rgba(166, 223, 184, 0.7)"]}
          start={[0.1, 0.1]}
          end={[1, 1]}
          style={styles.boardContainer}
        >
          <FlatList
            data={notices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.boardItem}>
                <Text style={styles.boardText}>{item.title}</Text>
              </View>
            )}
          />
        </LinearGradient>
      </View>

      {/* News Board Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>News Board</Text>
        <LinearGradient
          colors={["rgba(129, 69, 155, 0.7)", "rgba(166, 223, 184, 0.7)"]}
          start={[0.1, 0.1]}
          end={[1, 1]}
          style={styles.boardContainer}
        >
          <FlatList
            data={news}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.boardItem}>
                <Text style={styles.boardText}>{item.headline}</Text>
              </View>
            )}
          />
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop:20,
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: "#fff", // White background for the main screen
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000", // Black color for the heading
    textAlign: "center",
    marginBottom: 25,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#000", // Black for section headings
    textAlign: "center",
    marginTop:30,
  },
  tableOuterBorder: {
    borderWidth: 0.6,
    borderColor: "#000",
    overflow: "hidden",
    width: "90%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  table: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  tableItem: {
    width: "50%",
    height: 55,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#000",
    borderWidth: 0.6,
  },
  icon: {
    marginRight: 10,
  },
  gridText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000", // Black text for the grid items
    textAlign: "center",
  },
  boardContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 10,
    marginLeft: 10,
  },
  boardItem: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  boardText: {
    color: "#000", // Black text for the board items
    textAlign: "center",
  },
});
