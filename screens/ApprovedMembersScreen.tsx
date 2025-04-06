import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import { firebase } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { LinearGradient } from "expo-linear-gradient";

export default function ApprovedMembersScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const fetchApprovedMembers = async () => {
    try {
      // Get current president's unit number
      const presidentsRef = collection(firebase, "president");
      const presidentSnapshot = await getDocs(presidentsRef);
      const presidentData = presidentSnapshot.docs[0].data();
      const unitNumber = presidentData.unitNumber;

      // Get all approved members from this unit
      const membersRef = collection(firebase, "K-member");
      const q = query(
        membersRef,
        where("status", "==", "approved"),
        where("unitNumber", "==", unitNumber)
      );

      const querySnapshot = await getDocs(q);
      const membersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMembers(membersList);
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", "Failed to load members");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApprovedMembers();
  }, []);

  const handleRemoveFromUnit = (memberId, memberName) => {
    Alert.alert(
      "Confirm Remove",
      `Are you sure you want to remove ${memberName} from your unit?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Update status instead of deleting
              const memberRef = doc(firebase, "K-member", memberId);
              await updateDoc(memberRef, {
                status: "inactive",
              });

              Alert.alert("Success", "Member removed from unit successfully");
              fetchApprovedMembers();
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", "Failed to remove member from unit");
            }
          },
        },
      ]
    );
  };

  const renderMemberCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.memberName}>
            {item.firstName} {item.lastName}
          </Text>
          <TouchableOpacity
            onPress={() =>
              handleRemoveFromUnit(
                item.id,
                `${item.firstName} ${item.lastName}`
              )
            }
            style={styles.deleteButton}
          >
            <Ionicons name="person-remove-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="call-outline" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{item.phone}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="home-outline" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{item.address}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="card-outline" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.label}>Aadhar:</Text>
            <Text style={styles.value}>{item.aadhar}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#8B5CF6"
              />
            </View>
            <Text style={styles.label}>Ration Card:</Text>
            <Text style={styles.value}>{item.rationCard}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="white"
        translucent={true}
      />

      <LinearGradient
        colors={["rgba(162,39,142,0.01)", "rgba(162,39,142,0.03)"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header with gradient - positioned below status bar */}
        <View style={styles.headerContainer}>
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
              <Text style={styles.headerTitle}>Unit Members</Text>
              <Text style={styles.headerSubtitle}>
                View and manage your unit members
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Main content with scrollable FlatList */}
        <FlatList
          data={members}
          renderItem={renderMemberCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchApprovedMembers();
          }}
          ListHeaderComponent={
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{members.length}</Text>
                <Text style={styles.statLabel}>Active Members</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={48} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No Members Found</Text>
              <Text style={styles.emptyText}>
                There are no approved members in your unit
              </Text>
            </View>
          }
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    width: "100%",
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
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    minWidth: "40%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  memberName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 8,
    borderRadius: 12,
  },
  detailsContainer: {
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    marginBottom: 8,
  },
  detailIconContainer: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    width: 90,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    textAlign: "right",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginTop: 20,
  },
  emptyIconContainer: {
    marginBottom: 12,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    padding: 16,
    borderRadius: 50,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
