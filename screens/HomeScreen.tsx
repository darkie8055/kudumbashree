"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Pressable,
} from "react-native"
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
  content: string
}

const sampleNotices: Notice[] = [
  { id: "1", title: " Meeting on Jan 15th, 2025" },
  { id: "2", title: " Audit scheduled for Jan 20th, 2025" },
  { id: "3", title: " New training program starts Feb 1st" },
]

const sampleNews: News[] = [
  {
    id: "1",
    headline: "New Women Empowerment Scheme Launched",
    image: "https://picsum.photos/200/100?random=1",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nec enim nec eros elementum ultricies.",
  },
  {
    id: "2",
    headline: "Kudumbashree Annual Event Announced",
    image: "https://picsum.photos/200/100?random=2",
    content: "Nulla facilisi. Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.",
  },
  {
    id: "3",
    headline: "Success Story: Local Business Thrives",
    image: "https://picsum.photos/200/100?random=3",
    content: "Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper.",
  },
  {
    id: "4",
    headline: "Community Project Gains Recognition",
    image: "https://picsum.photos/200/100?random=4",
    content: "Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.",
  },
  {
    id: "5",
    headline: "Innovative Initiative Wins Award",
    image: "https://picsum.photos/200/100?random=5",
    content: "Sed posuere consectetur est at lobortis. Cras mattis consectetur purus sit amet fermentum.",
  },
  {
    id: "6",
    headline: "Local Artisans Showcase Talent",
    image: "https://picsum.photos/200/100?random=6",
    content: "Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.",
  },
  {
    id: "7",
    headline: "Youth Empowerment Program Launched",
    image: "https://picsum.photos/200/100?random=7",
    content:
      "Cras mattis consectetur purus sit amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor ligula.",
  },
]

const { width } = Dimensions.get("window")
const ITEM_WIDTH = width * 0.44

export default function HomeScreen({ navigation }: Props) {
  const [notices] = useState<Notice[]>(sampleNotices)
  const [news] = useState<News[]>(sampleNews)
  const [animation] = useState(new Animated.Value(0))
  const newsListRef = useRef<FlatList>(null)
  const scaleAnimations = useRef<{ [key: string]: Animated.Value }>({}).current
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)

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

  useEffect(() => {
    let index = 0

    const scrollInterval = setInterval(() => {
      if (newsListRef.current && news.length > 0) {
        newsListRef.current.scrollToOffset({
          offset: index * (ITEM_WIDTH + 15),
          animated: true,
        })

        index = (index + 1) % news.length
      }
    }, 3000)

    return () => clearInterval(scrollInterval)
  }, [news])

  const scrollLeft = () => {
    if (newsListRef.current) {
      newsListRef.current.scrollToOffset({
        offset: Math.max(0, newsListRef.current.props.contentOffset?.x - ITEM_WIDTH - 15),
        animated: true,
      })
    }
  }

  const scrollRight = () => {
    if (newsListRef.current) {
      news
      newsListRef.current.scrollToOffset({
        offset: (newsListRef.current.props.contentOffset?.x || 0) + ITEM_WIDTH + 15,
        animated: true,
      })
    }
  }

  const handleHover = useCallback(
    (id: string, isHovered: boolean) => {
      if (!scaleAnimations[id]) {
        scaleAnimations[id] = new Animated.Value(1)
      }
      Animated.spring(scaleAnimations[id], {
        toValue: isHovered ? 1.1 : 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start()
    },
    [scaleAnimations],
  )

  const renderNewsItem = useCallback(
    ({ item }: { item: News }) => {
      const scale = scaleAnimations[item.id] || new Animated.Value(1)
      return (
        <TouchableOpacity
          onPressIn={() => handleHover(item.id, true)}
          onPressOut={() => handleHover(item.id, false)}
          style={styles.newsItem}
          onPress={() => {
            setSelectedNews(item)
            setModalVisible(true)
          }}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Image source={{ uri: item.image }} style={styles.newsImage} />
          </Animated.View>
          <Text style={styles.newsHeadline}>{item.headline}</Text>
        </TouchableOpacity>
      )
    },
    [handleHover, scaleAnimations],
  )

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
        <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.header}>
          <Text style={styles.pageHeading}>Welcome, User!</Text>
        </LinearGradient>

        <Animated.View style={fadeIn}>
          {/* Quick Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="list-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>ACTIVITIES</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="book-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Rules & RGL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>UPCOMING</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>TODAY'S STORY</Text>
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
            <View style={styles.newsContainer}>
              <TouchableOpacity style={styles.scrollButton} onPress={scrollLeft}>
                <Ionicons name="chevron-back" size={24} color="#8B5CF6" />
              </TouchableOpacity>
              <FlatList
                ref={newsListRef}
                data={news}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderNewsItem}
              />
              <TouchableOpacity style={styles.scrollButton} onPress={scrollRight}>
                <Ionicons name="chevron-forward" size={24} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible)
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              {selectedNews && (
                <>
                  <Pressable style={[styles.closeButton]} onPress={() => setModalVisible(!modalVisible)}>
                    <Text style={styles.textStyle}>Close</Text>
                  </Pressable>
                  <Image source={{ uri: selectedNews.image }} style={styles.modalImage} />
                  <Text style={styles.modalHeadline}>{selectedNews.headline}</Text>
                  <Text style={styles.modalContent}>{selectedNews.content}</Text>
                </>
              )}
            </View>
          </View>
        </Modal>
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
    flexGrow: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pageHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 20,
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
    width: ITEM_WIDTH,
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  newsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scrollButton: {
    padding: 0.5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalImage: {
    width: 200,
    height: 100,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalHeadline: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  modalContent: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  closeButton: {
    top: 0,
    backgroundColor: "#8B5CF6",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginBottom: 15,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
})
