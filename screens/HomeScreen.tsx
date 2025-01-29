import React, { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

// Importing screens as components
import ActivitiesScreen from "./ActivitiesScreen"
import LawsAndRegulationsScreen from "./LawsAndRegulationsScreen"
import UpcomingScreen from "./UpcomingScreen"
import TodaysStoryScreen from "./TodaysStoryScreen"

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">

interface Props {
  navigation: HomeScreenNavigationProp
}

type Notice = {
  id: string
  title: string
}

type News = {
  id: string
  headline: string
}

const sampleNotices: Notice[] = [
  { id: "1", title: "Meeting on Jan 15th, 2025" },
  { id: "2", title: "Audit scheduled for Jan 20th, 2025" },
]

const sampleNews: News[] = [
  { id: "1", headline: "New Women Empowerment Scheme Launched" },
  { id: "2", headline: "Kudumbashree Annual Event Announced" },
]

export default function HomeScreen({ navigation }: Props) {
  const [notices, setNotices] = useState<Notice[]>(sampleNotices)
  const [news, setNews] = useState<News[]>(sampleNews)
  const [activeScreen, setActiveScreen] = useState<string>("Home")
  const [animation] = useState(new Animated.Value(0))

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  const startAnimation = useCallback(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [animation])

  useEffect(() => {
    startAnimation()
  }, [startAnimation])

  const fetchNotices = async () => {
    setNotices(sampleNotices)
  }

  const fetchNews = async () => {
    setNews(sampleNews)
  }

  useEffect(() => {
    fetchNotices()
    fetchNews()
  }, [])

  const navigateTo = (screen: string) => {
    setActiveScreen(screen)
  }

  if (activeScreen === "Activities") return <ActivitiesScreen goBack={() => setActiveScreen("Home")} />
  if (activeScreen === "LawsAndRegulations") return <LawsAndRegulationsScreen goBack={() => setActiveScreen("Home")} />
  if (activeScreen === "Upcoming") return <UpcomingScreen goBack={() => setActiveScreen("Home")} />
  if (activeScreen === "TodaysStory") return <TodaysStoryScreen goBack={() => setActiveScreen("Home")} />

  if (!fontsLoaded) {
    return null
  }

  const fadeIn = {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={fadeIn}>
        <Text style={styles.pageHeading}>Home</Text>

        {/* Table Navigation Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.tableOuterBorder}>
            <View style={styles.table}>
              <TouchableOpacity style={styles.tableItem} onPress={() => navigateTo("Activities")}>
                <Ionicons name="people" size={30} color="#000" style={styles.icon} />
                <Text style={styles.gridText}>Activities</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableItem} onPress={() => navigateTo("LawsAndRegulations")}>
                <Ionicons name="hammer" size={30} color="#000" style={styles.icon} />
                <Text style={styles.gridText}>Laws & Regl</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableItem} onPress={() => navigateTo("Upcoming")}>
                <Ionicons name="calendar" size={30} color="#000" style={styles.icon} />
                <Text style={styles.gridText}>Upcoming</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableItem} onPress={() => navigateTo("TodaysStory")}>
                <Ionicons name="book" size={30} color="#000" style={styles.icon} />
                <Text style={styles.gridText}>Today's Story</Text>
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
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  pageHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#000",
    textAlign: "center",
    marginBottom: 25,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    marginVertical: 10,
    color: "#000",
    textAlign: "center",
    marginTop: 30,
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
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#000",
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
    fontFamily: "Poppins_400Regular",
    color: "#000",
    textAlign: "center",
  },
})

