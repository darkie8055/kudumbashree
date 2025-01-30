import React, { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, ScrollView, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

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
  image: string
}

const sampleNotices: Notice[] = [
  { id: "1", title: "Meeting on Jan 15th, 2025" },
  { id: "2", title: "Audit scheduled for Jan 20th, 2025" },
  { id: "3", title: "New training program starts Feb 1st" },
]

const sampleNews: News[] = [
  { id: "1", headline: "New Women Empowerment Scheme Launched", image: "https://picsum.photos/200/100?random=1" },
  { id: "2", headline: "Kudumbashree Annual Event Announced", image: "https://picsum.photos/200/100?random=2" },
  { id: "3", headline: "Success Story: Local Business Thrives", image: "https://picsum.photos/200/100?random=3" },
]

export default function HomeScreen({ navigation }: Props) {
  const [notices, setNotices] = useState<Notice[]>(sampleNotices)
  const [news, setNews] = useState<News[]>(sampleNews)
  const [animation] = useState(new Animated.Value(0))

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [animation])

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={fadeIn}>
          <Text style={styles.pageHeading}>Welcome, User!</Text>

          {/* Quick Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="people-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Members</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="cash-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Finances</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notice Board Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Notice Board</Text>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
              style={styles.boardContainer}
            >
              {notices.map((notice) => (
                <View key={notice.id} style={styles.boardItem}>
                  <Ionicons name="notifications-outline" size={20} color="#8B5CF6" style={styles.boardIcon} />
                  <Text style={styles.boardText}>{notice.title}</Text>
                </View>
              ))}
            </LinearGradient>
          </View>

          {/* News Board Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Latest News</Text>
            <FlatList
              data={news}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.newsItem}>
                  <Image source={{ uri: item.image }} style={styles.newsImage} />
                  <Text style={styles.newsHeadline}>{item.headline}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
  },
  pageHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#333",
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  quickActionItem: {
    width: "48%",
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  quickActionText: {
    fontFamily: "Poppins_400Regular",
    marginTop: 5,
    color: "#4B5563",
  },
  boardContainer: {
    padding: 15,
    borderRadius: 10,
  },
  boardItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  boardIcon: {
    marginRight: 10,
  },
  boardText: {
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    flex: 1,
  },
  newsItem: {
    width: 200,
    marginRight: 15,
  },
  newsImage: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    marginBottom: 5,
  },
  newsHeadline: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4B5563",
  },
})

