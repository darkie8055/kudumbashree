import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  collection,
  getDocs,
  query,
  orderBy,
  getFirestore,
} from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";

type AllNewsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "AllNews">;
};

type News = {
  id: string;
  headline: string;
  image: string;
  content: string;
  createdAt?: any;
  category?: string;
};

const { width } = Dimensions.get("window");

export default function AllNewsScreen({ navigation }: AllNewsScreenProps) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [scaleAnimations] = useState<{ [key: string]: Animated.Value }>({});

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const newsRef = collection(db, "news");
      const q = query(newsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const newsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        headline: doc.data().headline || "",
        content: doc.data().content || "",
        image: doc.data().image || "",
        createdAt: doc.data().createdAt,
        category: doc.data().category || "News",
      })) as News[];

      setNews(newsList);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  const handleHover = (id: string, isHovered: boolean) => {
    if (!scaleAnimations[id]) {
      scaleAnimations[id] = new Animated.Value(1);
    }

    Animated.spring(scaleAnimations[id], {
      toValue: isHovered ? 1.03 : 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All News</Text>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8B5CF6"]}
              tintColor="#8B5CF6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No news available</Text>
            </View>
          }
          renderItem={({ item }) => {
            const scale = scaleAnimations[item.id] || new Animated.Value(1);
            return (
              <TouchableOpacity
                onPressIn={() => handleHover(item.id, true)}
                onPressOut={() => handleHover(item.id, false)}
                style={styles.newsItemContainer}
                onPress={() => {
                  setSelectedNews(item);
                  setModalVisible(true);
                }}
                activeOpacity={0.9}
              >
                <Animated.View
                  style={[styles.newsItem, { transform: [{ scale }] }]}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.newsImage}
                  />
                  <View style={styles.newsContent}>
                    <View style={styles.categoryContainer}>
                      <Text style={styles.categoryText}>
                        {item.category || "News"}
                      </Text>
                    </View>
                    <Text style={styles.headline} numberOfLines={2}>
                      {item.headline}
                    </Text>
                    <Text style={styles.preview} numberOfLines={2}>
                      {item.content}
                    </Text>
                    <TouchableOpacity style={styles.readMoreButton}>
                      <Text style={styles.readMoreText}>Read more</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#8B5CF6"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            {selectedNews && (
              <>
                <Image
                  source={{ uri: selectedNews.image }}
                  style={styles.modalImage}
                />
                <View style={styles.modalContent}>
                  <View style={styles.modalCategoryContainer}>
                    <Text style={styles.modalCategoryText}>
                      {selectedNews.category || "News"}
                    </Text>
                  </View>
                  <Text style={styles.modalHeadline}>
                    {selectedNews.headline}
                  </Text>
                  <Text style={styles.modalBody}>{selectedNews.content}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  headerGradient: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  newsItemContainer: {
    marginBottom: 16,
  },
  newsItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  newsContent: {
    padding: 16,
  },
  categoryContainer: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  categoryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#8B5CF6",
  },
  headline: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 8,
  },
  preview: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  readMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  readMoreText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#8B5CF6",
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  modalContent: {
    padding: 20,
  },
  modalCategoryContainer: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  modalCategoryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#8B5CF6",
  },
  modalHeadline: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    color: "#1F2937",
    marginBottom: 16,
  },
  modalBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
  },
});
