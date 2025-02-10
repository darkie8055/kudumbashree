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
} from "@expo-google-fonts/poppins";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";

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

export default function AddNoticeNewsScreen() {
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

      Alert.alert("Success", "Notice added successfully", [
        {
          text: "OK",
          onPress: () => {
            setNoticeTitle("");
            setNoticeDescription("");
            setVenue("");
            setDate(new Date());
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

      Alert.alert("Success", "News added successfully", [
        {
          text: "OK",
          onPress: () => {
            setNewsHeadline("");
            setNewsContent("");
            setImageUrl("");
            setImage(null);
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
      quality: 1,
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "notice" && styles.activeTab]}
            onPress={() => setActiveTab("notice")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "notice" && styles.activeTabText,
              ]}
            >
              Notice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "news" && styles.activeTab]}
            onPress={() => setActiveTab("news")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "news" && styles.activeTabText,
              ]}
            >
              News
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "notice" ? (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Notice Title</Text>
            <TextInput
              style={styles.input}
              value={noticeTitle}
              onChangeText={setNoticeTitle}
              placeholder="Enter notice title"
              placeholderTextColor="#9CA3AF"
            />

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

            <Text style={styles.label}>Venue</Text>
            <TextInput
              style={styles.input}
              value={venue}
              onChangeText={setVenue}
              placeholder="Enter venue"
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.dateTimeButton, { flex: 1 }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  Select Date: {date.toLocaleDateString()}
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
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleAddNotice}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Add Notice</Text>
              )}
            </TouchableOpacity>

            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Posted Notices</Text>
              {notices.length > 0 ? (
                notices.map((notice) => renderNotice({ item: notice }))
              ) : (
                <Text style={styles.emptyText}>No notices posted</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.label}>News Headline</Text>
            <TextInput
              style={styles.input}
              value={newsHeadline}
              onChangeText={setNewsHeadline}
              placeholder="Enter news headline"
              placeholderTextColor="#9CA3AF"
            />

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

            <View>
              <Text style={styles.label}>Image</Text>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color="#6B7280" />
                    <Text style={styles.imagePlaceholderText}>
                      Select Image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleAddNews}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Add News</Text>
              )}
            </TouchableOpacity>

            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Posted News</Text>
              {newsList.length > 0 ? (
                newsList.map((news) => renderNews({ item: news }))
              ) : (
                <Text style={styles.emptyText}>No news posted</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    padding: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#8B5CF6",
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
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateTimeButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flex: 0.48,
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#1F2937",
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  imageButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 200,
    overflow: "hidden",
    marginBottom: 16,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
  listContainer: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginBottom: 16,
  },
  itemContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
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
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginLeft: 4,
  },
  newsImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginTop: 2,
  },
  venueText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    textAlign: "center",
    padding: 16,
  },
});
