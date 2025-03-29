"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  collection,
  getDocs,
  query,
  orderBy,
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { firebase } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface Props {
  navigation: HomeScreenNavigationProp;
}

type Notice = {
  id: string;
  title: string;
  description?: string;
  date?: Date;
  type?: "meeting" | "notice";
  createdAt?: any;
  venue?: string;
};

type News = {
  id: string;
  headline: string;
  image: string;
  content: string;
};

const sampleNotices: Notice[] = [
  { id: "1", title: " Meeting on Jan 15th, 2025" },
  { id: "2", title: " Audit scheduled for Jan 20th, 2025" },
  { id: "3", title: " New training program starts Feb 1st" },
];

const sampleNews: News[] = [
  {
    id: "1",
    headline: "New Women Empowerment Scheme Launched",
    image: "https://picsum.photos/200/100?random=1",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nec enim nec eros elementum ultricies.",
  },
  {
    id: "2",
    headline: "Kudumbashree Annual Event Announced",
    image: "https://picsum.photos/200/100?random=2",
    content:
      "Nulla facilisi. Duis sed odio sit amet nibh vulputate cursus a sit amet mauris.",
  },
  {
    id: "3",
    headline: "Success Story: Local Business Thrives",
    image: "https://picsum.photos/200/100?random=3",
    content:
      "Donec ullamcorper nulla non metus auctor fringilla. Vestibulum id ligula porta felis euismod semper.",
  },
  {
    id: "4",
    headline: "Community Project Gains Recognition",
    image: "https://picsum.photos/200/100?random=4",
    content:
      "Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.",
  },
  {
    id: "5",
    headline: "Innovative Initiative Wins Award",
    image: "https://picsum.photos/200/100?random=5",
    content:
      "Sed posuere consectetur est at lobortis. Cras mattis consectetur purus sit amet fermentum.",
  },
  {
    id: "6",
    headline: "Local Artisans Showcase Talent",
    image: "https://picsum.photos/200/100?random=6",
    content:
      "Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.",
  },
  {
    id: "7",
    headline: "Youth Empowerment Program Launched",
    image: "https://picsum.photos/200/100?random=7",
    content:
      "Cras mattis consectetur purus sit amet fermentum. Duis mollis, est non commodo luctus, nisi erat porttitor ligula.",
  },
];

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.44;

export default function HomeScreen({ navigation }: Props) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [animation] = useState(new Animated.Value(0));
  const newsListRef = useRef<FlatList>(null);
  const scaleAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [pauseScroll, setPauseScroll] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [firstName, setFirstName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const fetchNotices = async () => {
    try {
      const noticesRef = collection(firebase, "notices");
      const q = query(noticesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const noticesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || "",
        description: doc.data().description,
        date: doc.data().date?.toDate(),
        type: doc.data().type,
        createdAt: doc.data().createdAt,
        venue: doc.data().venue,
      })) as Notice[];

      setNotices(noticesList);
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  const fetchNews = async () => {
    try {
      const newsRef = collection(firebase, "news");
      const q = query(newsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const newsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        headline: doc.data().headline || "",
        content: doc.data().content || "",
        image: doc.data().image || "",
      })) as News[];

      setNews(newsList);
    } catch (error) {
      console.error("Error fetching news:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchNotices(), fetchNews()]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [animation]);

  useEffect(() => {
    let index = 0;

    const scrollInterval = setInterval(() => {
      if (newsListRef.current && news.length > 0) {
        newsListRef.current.scrollToOffset({
          offset: index * (ITEM_WIDTH + 15),
          animated: true,
        });

        index = (index + 1) % news.length;
      }
    }, 3000);

    return () => clearInterval(scrollInterval);
  }, [news]);

  useEffect(() => {
    if (expandedNotice || pauseScroll) return;

    const interval = setInterval(() => {
      if (notices.length > 1) {
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: -1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentNoticeIndex((prev) => (prev + 1) % notices.length);

          Animated.sequence([
            Animated.timing(slideAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [notices.length, expandedNotice, pauseScroll]);

  const scrollLeft = () => {
    if (newsListRef.current) {
      newsListRef.current.scrollToOffset({
        offset: Math.max(
          0,
          newsListRef.current.props.contentOffset?.x - ITEM_WIDTH - 15
        ),
        animated: true,
      });
    }
  };

  const scrollRight = () => {
    if (newsListRef.current) {
      news;
      newsListRef.current.scrollToOffset({
        offset:
          (newsListRef.current.props.contentOffset?.x || 0) + ITEM_WIDTH + 15,
        animated: true,
      });
    }
  };

  const handleHover = useCallback(
    (id: string, isHovered: boolean) => {
      if (!scaleAnimations[id]) {
        scaleAnimations[id] = new Animated.Value(1);
      }
      Animated.spring(scaleAnimations[id], {
        toValue: isHovered ? 1.1 : 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    },
    [scaleAnimations]
  );

  const renderNewsItem = useCallback(
    ({ item }: { item: News }) => {
      const scale = scaleAnimations[item.id] || new Animated.Value(1);
      return (
        <TouchableOpacity
          onPressIn={() => handleHover(item.id, true)}
          onPressOut={() => handleHover(item.id, false)}
          style={styles.newsItem}
          onPress={() => {
            setSelectedNews(item);
            setModalVisible(true);
          }}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Image source={{ uri: item.image }} style={styles.newsImage} />
          </Animated.View>
          <Text style={styles.newsHeadline}>{item.headline}</Text>
        </TouchableOpacity>
      );
    },
    [handleHover, scaleAnimations]
  );

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    // Listen for auth state changes
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setIsLoading(true);
          const phoneNumber = user.phoneNumber?.replace("+91", "") || "";
          const collections = ["K-member", "normal", "president"];

          // Set up real-time listeners for each possible collection
          const unsubscribers = collections.map((collectionName) => {
            const userDocRef = doc(db, collectionName, phoneNumber);
            return onSnapshot(userDocRef, (docSnapshot) => {
              if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                const name = userData.firstName || userData.FirstName || "User";
                setFirstName(name);
                setIsLoading(false);
              }
            });
          });

          // Initial check for user data
          for (const collection of collections) {
            const docRef = doc(db, collection, phoneNumber);
            const userDoc = await getDoc(docRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const name = userData.firstName || userData.FirstName || "User";
              setFirstName(name);
              break;
            }
          }

          return () => {
            // Cleanup all collection listeners
            unsubscribers.forEach((unsubscribe) => unsubscribe());
          };
        } catch (error) {
          console.error("Error fetching user data:", error);
          setFirstName("User");
        } finally {
          setIsLoading(false);
        }
      } else {
        setFirstName("User");
        setIsLoading(false);
      }
    });

    // Cleanup auth listener
    return () => {
      authUnsubscribe();
    };
  }, []); // Empty dependency array means this runs once when component mounts

  // Add this effect hook after your other useEffect hooks
  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const phoneNumber = user.phoneNumber?.replace("+91", "") || "";
          const collections = ["K-member", "normal", "president"];

          // Check each collection for user data
          for (const collection of collections) {
            const userDocRef = doc(db, collection, phoneNumber);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Check both firstName and FirstName fields
              const name = userData.firstName || userData.FirstName || "User";
              setFirstName(name);
              break; // Exit loop once user is found
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setFirstName("User");
        }
      } else {
        setFirstName("User");
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once when component mounts

  if (!fontsLoaded) {
    return null;
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
  };

  const renderNotice = (notice: Notice) => {
    if (!notice) return null;

    return (
      <View key={notice.id} style={styles.boardItem}>
        <TouchableOpacity
          style={styles.noticeHeader}
          onPress={() =>
            setExpandedNotice(expandedNotice === notice.id ? null : notice.id)
          }
        >
          <View style={styles.noticeHeaderContent}>
            <View style={styles.noticeIconContainer}>
              <Ionicons
                name={
                  notice?.type === "meeting"
                    ? "calendar-outline"
                    : "notifications-outline"
                }
                size={20}
                color="#8B5CF6"
              />
            </View>
            <View style={styles.noticeTextContent}>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              {notice.date && (
                <Text style={styles.noticeDate}>
                  {notice.date.toLocaleDateString()}
                </Text>
              )}
              {notice.venue && (
                <Text style={styles.venueText}>Venue: {notice.venue}</Text>
              )}
            </View>
            <Ionicons
              name={
                expandedNotice === notice.id ? "chevron-up" : "chevron-down"
              }
              size={20}
              color="#8B5CF6"
              style={styles.expandIcon}
            />
          </View>
        </TouchableOpacity>

        {expandedNotice === notice.id && notice.description && (
          <View style={styles.expandedContent}>
            <Text style={styles.noticeDescription}>{notice.description}</Text>
          </View>
        )}
      </View>
    );
  };

  const goToPreviousNotice = () => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPauseScroll(true);
      setCurrentNoticeIndex((prev) =>
        prev === 0 ? notices.length - 1 : prev - 1
      );
      setTimeout(() => setPauseScroll(false), 3000);
    });
  };

  const goToNextNotice = () => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -1,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPauseScroll(true);
      setCurrentNoticeIndex((prev) => (prev + 1) % notices.length);
      setTimeout(() => setPauseScroll(false), 3000);
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8B5CF6"]}
            tintColor="#8B5CF6"
          />
        }
      >
        <LinearGradient
          colors={["#7C3AED", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="home" size={24} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>
              Welcome, {firstName || "User"}
            </Text>
            <View style={styles.headerBadge}>
              <Ionicons
                name="location"
                size={14}
                color="#fff"
                style={styles.badgeIcon}
              />
              <Text style={styles.headerSubtitle}>Home</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.cardsGrid}>
            {[
              {
                title: "Activities",
                icon: "layers",
                description: "View all activities",
                color: "#8B5CF6",
                onPress: () => navigation.navigate("Activities"),
              },
              {
                title: "Rules & RGL",
                icon: "book",
                description: "Check guidelines",
                color: "#EC4899",
                onPress: () => navigation.navigate("RulesAndRegulations"),
              },
              {
                title: "Upcoming",
                icon: "calendar",
                description: "View schedule",
                color: "#10B981",
                onPress: () => navigation.navigate("Upcoming"),
              },
              {
                title: "Today's Story",
                icon: "document-text",
                description: "Daily updates",
                color: "#F59E0B",
                onPress: () => navigation.navigate("TodayStory"),
              },
            ].map((item, index) => (
              <View key={index} style={styles.cardWrapper}>
                <TouchableOpacity
                  style={[styles.card, { borderLeftColor: item.color }]}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: `${item.color}15` },
                        ]}
                      >
                        <Ionicons
                          name={`${item.icon}-outline`}
                          size={22}
                          color={item.color}
                        />
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={item.color}
                      />
                    </View>
                    <Text
                      style={[styles.cardTitle, { color: item.color }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <Animated.View style={fadeIn}>
          {/* Notice Board Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Notice Board</Text>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
              style={styles.boardContainer}
            >
              {notices.length > 0 ? (
                <View>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [-1, 0, 1],
                            outputRange: [-300, 0, 300],
                          }),
                        },
                      ],
                      opacity: slideAnim.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [0, 1, 0],
                      }),
                    }}
                  >
                    {renderNotice(notices[currentNoticeIndex])}
                  </Animated.View>
                  <View style={styles.noticeNavigation}>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={goToPreviousNotice}
                    >
                      <Ionicons name="chevron-back" size={24} color="#8B5CF6" />
                    </TouchableOpacity>
                    <View style={styles.dotContainer}>
                      {notices.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.dot,
                            index === currentNoticeIndex && styles.activeDot,
                          ]}
                        />
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={goToNextNotice}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color="#8B5CF6"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyNotice}>No notices available</Text>
              )}
            </LinearGradient>
          </View>

          {/* News Board Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Latest News</Text>
            <View style={styles.newsContainer}>
              <TouchableOpacity
                style={styles.scrollButton}
                onPress={scrollLeft}
              >
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
              <TouchableOpacity
                style={styles.scrollButton}
                onPress={scrollRight}
              >
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
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              {selectedNews && (
                <>
                  <TouchableOpacity
                    style={styles.closeIconButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: selectedNews.image }}
                    style={styles.modalImage}
                  />
                  <Text style={styles.modalHeadline}>
                    {selectedNews.headline}
                  </Text>
                  <Text style={styles.modalContent}>
                    {selectedNews.content}
                  </Text>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 90,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    height: 48,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#fff",
    flex: 1,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#fff",
  },
  badgeIcon: {
    marginRight: 2,
  },
  sectionContainer: {
    marginTop: 10,
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
  },
  boardItem: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
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
    padding: 20,
    paddingTop: 60, // Add more padding at top to accommodate close button
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
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
  closeIconButton: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "#8B5CF6",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  noticeHeader: {
    padding: 12,
  },
  noticeHeaderContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noticeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  noticeTextContent: {
    flex: 1,
    marginRight: 8,
  },
  noticeTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 4,
  },
  noticeDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  venueText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  expandIcon: {
    marginTop: 6,
  },
  expandedContent: {
    padding: 12,
    paddingTop: 10,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
    marginTop: 4,
  },
  noticeDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },
  emptyNotice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    padding: 10,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#8B5CF6",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  noticeNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  navButton: {
    padding: 5,
  },
  buttonGradientBorder: {
    borderRadius: 15,
    padding: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    height: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTopContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 16,
  },
});
