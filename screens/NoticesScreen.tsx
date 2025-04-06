import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
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
import { firebase } from "../firebase";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { format } from "date-fns";

type NoticesScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Notices">;
};

type Notice = {
  id: string;
  title: string;
  description?: string;
  date?: Date;
  type?: "meeting" | "notice";
  createdAt?: any;
  venue?: string;
};

export default function NoticesScreen({ navigation }: NoticesScreenProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotices();
    setRefreshing(false);
  };

  const getFilteredNotices = () => {
    if (activeFilter === "all") return notices;
    return notices.filter((notice) => notice.type === activeFilter);
  };

  const renderNotice = ({ item }: { item: Notice }) => {
    const isExpanded = expandedNotice === item.id;
    
    return (
      <View style={styles.noticeCard}>
        <TouchableOpacity
          style={styles.noticeHeader}
          onPress={() => setExpandedNotice(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.noticeHeaderContent}>
            <View style={[
              styles.noticeIconContainer,
              {
                backgroundColor: item.type === "meeting" 
                  ? "rgba(16, 185, 129, 0.1)" 
                  : "rgba(139, 92, 246, 0.1)"
              }
            ]}>
              <Ionicons
                name={
                  item.type === "meeting"
                    ? "calendar-outline"
                    : "notifications-outline"
                }
                size={20}
                color={item.type === "meeting" ? "#10B981" : "#8B5CF6"}
              />
            </View>
            <View style={styles.noticeTextContent}>
              <View style={styles.noticeMeta}>
                <View style={[
                  styles.typeTag,
                  {
                    backgroundColor: item.type === "meeting" 
                      ? "rgba(16, 185, 129, 0.1)" 
                      : "rgba(139, 92, 246, 0.1)"
                  }
                ]}>
                  <Text style={[
                    styles.typeTagText,
                    {
                      color: item.type === "meeting" ? "#10B981" : "#8B5CF6"
                    }
                  ]}>
                    {item.type === "meeting" ? "MEETING" : "NOTICE"}
                  </Text>
                </View>
                {item.date && (
                  <Text style={styles.noticeDate}>
                    {format(item.date, "MMM dd, yyyy")}
                  </Text>
                )}
              </View>
              <Text style={styles.noticeTitle}>{item.title}</Text>
              {item.venue && (
                <View style={styles.venueContainer}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.venueText}>{item.venue}</Text>
                </View>
              )}
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#8B5CF6"
              style={styles.expandIcon}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && item.description && (
          <View style={styles.expandedContent}>
            <Text style={styles.noticeDescription}>{item.description}</Text>
          </View>
        )}
      </View>
    );
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
        <Text style={styles.headerTitle}>All Notices</Text>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "all" && styles.activeFilterButton,
            ]}
            onPress={() => setActiveFilter("all")}
          >
            <Text style={[
              styles.filterText,
              activeFilter === "all" && styles.activeFilterText,
            ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "meeting" && styles.activeFilterButton,
            ]}
            onPress={() => setActiveFilter("meeting")}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={activeFilter === "meeting" ? "#fff" : "#6B7280"}
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText,
              activeFilter === "meeting" && styles.activeFilterText,
            ]}>
              Meetings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "notice" && styles.activeFilterButton,
            ]}
            onPress={() => setActiveFilter("notice")}
          >
            <Ionicons
              name="notifications-outline"
              size={16}
              color={activeFilter === "notice" ? "#fff" : "#6B7280"}
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText,
              activeFilter === "notice" && styles.activeFilterText,
            ]}>
              Notices
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading notices...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredNotices()}
          keyExtractor={(item) => item.id}
          renderItem={renderNotice}
          contentContainerStyle={styles.noticesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications-off-outline" size={40} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No notices found</Text>
              <Text style={styles.emptyText}>
                {activeFilter === "all"
                  ? "There are no notices available at the moment."
                  : `No ${activeFilter}s available. Try checking all notices.`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
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
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#8B5CF6",
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6B7280",
  },
  activeFilterText: {
    color: "#fff",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
  noticesList: {
    padding: 16,
    paddingBottom: 100,
  },
  noticeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noticeHeader: {
    padding: 16,
  },
  noticeHeaderContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noticeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  noticeTextContent: {
    flex: 1,
    marginRight: 12,
  },
  noticeMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeTagText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
  },
  noticeTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 6,
  },
  noticeDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  venueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  venueText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  expandIcon: {
    marginTop: 8,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#F9FAFB",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  noticeDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: "80%",
  },
});