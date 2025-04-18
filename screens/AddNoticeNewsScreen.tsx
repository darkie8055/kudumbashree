import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  FlatList,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { firebase } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  deleteDoc,
  where,
} from "firebase/firestore";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import { showLocalNotification } from "../utils/notifications";
import { LinearGradient } from "expo-linear-gradient";

type Notice = {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  date?: Date;
  type?: "notice" | "news";
  createdAt?: any;
};

type News = {
  id: string;
  headline: string;
  content: string;
  image: string;
  createdAt?: any;
};

export default function AddNoticeNewsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState<"notice" | "news">("notice");
  const [loading, setLoading] = useState(false);

  // Notice fields
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDescription, setNoticeDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // News fields
  const [newsHeadline, setNewsHeadline] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // New state variables for viewing and deleting
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const handleAddNotice = async () => {
    if (!noticeTitle.trim()) {
      Alert.alert("Error", "Please enter a notice title");
      return;
    }

    try {
      setLoading(true);
      const noticesRef = collection(firebase, "notices");

      await addDoc(noticesRef, {
        title: noticeTitle,
        description: noticeDescription,
        venue,
        date,
        createdAt: serverTimestamp(),
        type: "notice",
      });

      // Send notification
      await showLocalNotification(
        "New Notice Posted",
        `${noticeTitle}\n${
          venue ? `Venue: ${venue}` : ""
        }\n${date.toLocaleDateString()}`
      );

      Alert.alert("Success", "Notice added successfully", [
        {
          text: "OK",
          onPress: () => {
            setNoticeTitle("");
            setNoticeDescription("");
            setVenue("");
            setDate(new Date());
            fetchNotices();
          },
        },
      ]);
    } catch (error) {
      console.error("Error adding notice:", error);
      Alert.alert("Error", "Failed to add notice");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNews = async () => {
    if (!newsHeadline.trim() || !image) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const newsRef = collection(firebase, "news");

      await addDoc(newsRef, {
        headline: newsHeadline,
        content: newsContent,
        image: imageUrl,
        createdAt: serverTimestamp(),
        type: "news",
      });

      // Send notification
      await showLocalNotification(
        "New News Update",
        `${newsHeadline}\n${newsContent.substring(0, 100)}${
          newsContent.length > 100 ? "..." : ""
        }`
      );

      Alert.alert("Success", "News added successfully", [
        {
          text: "OK",
          onPress: () => {
            setNewsHeadline("");
            setNewsContent("");
            setImageUrl("");
            setImage(null);
            fetchNews();
          },
        },
      ]);
    } catch (error) {
      console.error("Error adding news:", error);
      Alert.alert("Error", "Failed to add news");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const storage = getStorage();
        const imageRef = ref(storage, `news/${Date.now()}`);

        // Convert image to blob
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        // Upload to Firebase Storage
        await uploadBytes(imageRef, blob);
        const url = await getDownloadURL(imageRef);
        setImage(url);
        setImageUrl(url);
      } catch (error) {
        console.error("Error uploading image:", error);
        Alert.alert("Error", "Failed to upload image");
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchNotices = async () => {
    try {
      const noticesRef = collection(firebase, "notices");
      // Remove the where clause and filter client-side
      const q = query(noticesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const noticesList = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          title: doc.data().title || "",
          description: doc.data().description,
          venue: doc.data().venue,
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt,
          type: doc.data().type,
        }))
        .filter((doc) => doc.type === "notice"); // Filter only notices

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

      const newsItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        headline: doc.data().headline,
        content: doc.data().content,
        image: doc.data().image,
        createdAt: doc.data().createdAt,
      }));

      setNewsList(newsItems);
    } catch (error) {
      console.error("Error fetching news:", error);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      const noticeRef = doc(firebase, "notices", noticeId);
      await deleteDoc(noticeRef);
      Alert.alert("Success", "Notice deleted successfully");
      fetchNotices();
    } catch (error) {
      console.error("Error deleting notice:", error);
      Alert.alert("Error", "Failed to delete notice");
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      const newsRef = doc(firebase, "news", newsId);
      await deleteDoc(newsRef);
      Alert.alert("Success", "News deleted successfully");
      fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      Alert.alert("Error", "Failed to delete news");
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchNews();
  }, []);

  const renderNotice = ({ item: notice }: { item: Notice }) => (
    <View key={notice.id} style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={() =>
          setExpandedNotice(expandedNotice === notice.id ? null : notice.id)
        }
      >
        <Ionicons
          name="notifications-outline"
          size={20}
          color="#8B5CF6"
          style={styles.icon}
        />
        <View style={styles.headerContent}>
          <Text style={styles.itemTitle}>{notice.title}</Text>
          {notice.date && (
            <Text style={styles.dateText}>
              {notice.date.toLocaleDateString()}
            </Text>
          )}
        </View>
        <Ionicons
          name={expandedNotice === notice.id ? "chevron-up" : "chevron-down"}
          size={20}
          color="#8B5CF6"
        />
      </TouchableOpacity>

      {expandedNotice === notice.id && (
        <View style={styles.expandedContent}>
          {notice.description && (
            <Text style={styles.descriptionText}>{notice.description}</Text>
          )}
          {notice.venue && (
            <Text style={styles.venueText}>Venue: {notice.venue}</Text>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                "Delete Notice",
                "Are you sure you want to delete this notice?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeleteNotice(notice.id),
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
            <Text style={styles.deleteButtonText}>Delete Notice</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderNews = ({ item: news }: { item: News }) => (
    <View key={news.id} style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemHeader}
        onPress={() =>
          setExpandedNews(expandedNews === news.id ? null : news.id)
        }
      >
        <Ionicons
          name="newspaper-outline"
          size={20}
          color="#8B5CF6"
          style={styles.icon}
        />
        <View style={styles.headerContent}>
          <Text style={styles.itemTitle}>{news.headline}</Text>
        </View>
        <Ionicons
          name={expandedNews === news.id ? "chevron-up" : "chevron-down"}
          size={20}
          color="#8B5CF6"
        />
      </TouchableOpacity>

      {expandedNews === news.id && (
        <View style={styles.expandedContent}>
          {news.image && (
            <Image source={{ uri: news.image }} style={styles.newsImage} />
          )}
          <Text style={styles.descriptionText}>{news.content}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                "Delete News",
                "Are you sure you want to delete this news?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeleteNews(news.id),
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
            <Text style={styles.deleteButtonText}>Delete News</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="white"
        translucent={true}
      />

      <LinearGradient
        colors={["rgba(162,39,142,0.01)", "rgba(162,39,142,0.03)"]}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#7C3AED", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {activeTab === "notice" ? "Notices" : "News"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === "notice"
                ? "Create and manage unit notices"
                : "Share updates with your community"}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Enhanced Tabs Component */}
          <View style={styles.tabOuterContainer}>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.15)", "rgba(194, 65, 204, 0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabGradientBorder}
            >
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "notice" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("notice")}
                >
                  <LinearGradient
                    colors={
                      activeTab === "notice"
                        ? ["#7C3AED", "#C026D3"]
                        : ["transparent", "transparent"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.tabGradient,
                      activeTab === "notice" && styles.activeTabGradient,
                    ]}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color={activeTab === "notice" ? "white" : "#6B7280"}
                      style={styles.tabIcon}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === "notice" && styles.activeTabText,
                      ]}
                    >
                      Notice
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "news" && styles.activeTab]}
                  onPress={() => setActiveTab("news")}
                >
                  <LinearGradient
                    colors={
                      activeTab === "news"
                        ? ["#7C3AED", "#C026D3"]
                        : ["transparent", "transparent"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.tabGradient,
                      activeTab === "news" && styles.activeTabGradient,
                    ]}
                  >
                    <Ionicons
                      name="newspaper-outline"
                      size={20}
                      color={activeTab === "news" ? "white" : "#6B7280"}
                      style={styles.tabIcon}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === "news" && styles.activeTabText,
                      ]}
                    >
                      News
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {activeTab === "notice" ? (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Create Notice</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Notice Title</Text>
                <TextInput
                  style={styles.input}
                  value={noticeTitle}
                  onChangeText={setNoticeTitle}
                  placeholder="Enter notice title"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={noticeDescription}
                  onChangeText={setNoticeDescription}
                  placeholder="Enter description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Venue</Text>
                <TextInput
                  style={styles.input}
                  value={venue}
                  onChangeText={setVenue}
                  placeholder="Enter venue"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#8B5CF6"
                    style={styles.dateIcon}
                  />
                  <Text style={styles.dateButtonText}>
                    {date.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddNotice}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#7C3AED", "#C026D3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="white"
                        style={styles.submitIcon}
                      />
                      <Text style={styles.submitButtonText}>Add Notice</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.listContainer}>
                <Text style={styles.listTitle}>Posted Notices</Text>
                {notices.length > 0 ? (
                  notices.map((notice) => renderNotice({ item: notice }))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons
                      name="notifications-off-outline"
                      size={48}
                      color="#8B5CF6"
                      style={styles.emptyStateIcon}
                    />
                    <Text style={styles.emptyStateText}>No notices posted</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Create your first notice using the form above
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Create News</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>News Headline</Text>
                <TextInput
                  style={styles.input}
                  value={newsHeadline}
                  onChangeText={setNewsHeadline}
                  placeholder="Enter news headline"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newsContent}
                  onChangeText={setNewsContent}
                  placeholder="Enter news content"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Image</Text>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImage}
                  disabled={loading}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={styles.selectedImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons
                        name="image-outline"
                        size={36}
                        color="#8B5CF6"
                      />
                      <Text style={styles.imagePlaceholderText}>
                        {loading ? "Uploading..." : "Select Image"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddNews}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#7C3AED", "#C026D3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="white"
                        style={styles.submitIcon}
                      />
                      <Text style={styles.submitButtonText}>Add News</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.listContainer}>
                <Text style={styles.listTitle}>Posted News</Text>
                {newsList.length > 0 ? (
                  newsList.map((news) => renderNews({ item: news }))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons
                      name="newspaper-outline"
                      size={48}
                      color="#8B5CF6"
                      style={styles.emptyStateIcon}
                    />
                    <Text style={styles.emptyStateText}>No news posted</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Create your first news update using the form above
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradientContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: 20,
    paddingTop: 15,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 15,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    marginBottom: 0,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  tabOuterContainer: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabGradientBorder: {
    borderRadius: 16,
    padding: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 6,
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    margin: 2,
  },
  tabGradient: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  activeTabGradient: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTab: {
    // No background color here - moved to gradient
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
  },
  activeTabText: {
    color: "white",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  dateButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: 8,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#1F2937",
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  imageButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 200,
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
  listContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginBottom: 16,
  },
  itemContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  headerContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  icon: {
    marginRight: 12,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 8,
  },
  newsImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginTop: 2,
  },
  venueText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#4B5563",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginBottom: 8,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateIcon: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 50,
  },
  emptyStateText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
