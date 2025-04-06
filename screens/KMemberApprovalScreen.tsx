import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { firebase } from "../firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  writeBatch,
  getFirestore,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";

interface KMember {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  aadhar: string;
  rationCard: string;
  economicStatus: string;
  category: string;
  unitNumber: string;
  aadharDocumentUrl: string;
  rationCardDocumentUrl: string;
  unitName: string;
  presidentId: string;
}

export default function KMemberApprovalScreen({ navigation }) {
  const [kMembers, setKMembers] = useState<KMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const fetchKMembers = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const kMembersRef = collection(db, "K-member");

      // Query for pending members matching president's phone number
      const q = query(
        kMembersRef,
        where("presidentId", "==", "9072160767"),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      const members: KMember[] = [];

      console.log("Found pending members:", querySnapshot.size);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Member data:", data);
        members.push({
          id: doc.id,
          ...data,
        } as KMember);
      });

      setKMembers(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      Alert.alert("Error", "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKMembers();
  }, []);

  const handleApprove = async (phone: string) => {
    try {
      const db = getFirestore();
      const batch = writeBatch(db);

      // First, get the member document
      const kmemberDoc = await getDoc(doc(db, "K-member", phone));
      if (!kmemberDoc.exists()) {
        Alert.alert("Error", "Member data not found");
        return;
      }

      const memberData = kmemberDoc.data();
      const unitNumber = memberData.unitNumber;

      // Update K-member status
      const kmemberRef = doc(db, "K-member", phone);
      batch.update(kmemberRef, {
        status: "approved",
      });

      // Update unit details with new member
      const unitRef = doc(db, "unitDetails", unitNumber);
      const memberInfo = {
        phone: phone,
        name: `${memberData.firstName} ${memberData.lastName}`,
        joinedAt: new Date().toISOString(),
        role: "Member",
        committee: memberData.committee || "general", // Add committee if specified
      };

      // First check if unitDetails document exists
      const unitDoc = await getDoc(unitRef);
      if (unitDoc.exists()) {
        // Get the existing data
        const unitData = unitDoc.data();

        // If committee is specified, add member to committee members array
        if (
          memberData.committee &&
          unitData.committees?.[memberData.committee]
        ) {
          batch.update(unitRef, {
            [`committees.${memberData.committee}.members`]: arrayUnion(
              memberData.firstName + " " + memberData.lastName
            ),
            updatedAt: new Date().toISOString(),
          });
        }

        // Add member to general members list
        batch.update(unitRef, {
          members: arrayUnion(memberInfo),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // If unit doesn't exist, create new with basic structure
        batch.set(unitRef, {
          unitNumber: unitNumber,
          unitName: memberData.unitName,
          members: [memberInfo],
          committees: {
            samatheeka: {
              coordinator: "",
              members: [],
            },
            adisthana: {
              coordinator: "",
              members: [],
            },
            vidyabhyasa: {
              coordinator: "",
              members: [],
            },
            upjeevana: {
              coordinator: "",
              members: [],
            },
          },
          meetings: {
            frequency: "Weekly",
            day: "Sunday",
            time: "4:00 PM",
          },
          presidentDetails: {
            name: "Pending",
            phone: memberData.presidentId,
            role: "President",
          },
          secretaryDetails: {
            name: "Pending",
            role: "Secretary",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Commit the batch
      await batch.commit();

      // Refresh the members list
      fetchKMembers();
      Alert.alert("Success", "Member approved and added to unit successfully");
    } catch (error) {
      console.error("Error approving member:", error);
      Alert.alert("Error", "Failed to approve member");
    }
  };

  const handleReject = async (phone: string) => {
    try {
      const kmemberDoc = await getDoc(doc(firebase, "K-member", phone));
      if (!kmemberDoc.exists()) {
        Alert.alert("Error", "Member data not found");
        return;
      }

      await updateDoc(doc(firebase, "K-member", phone), {
        status: "rejected",
      });

      fetchKMembers();
      Alert.alert("Success", "Member rejected successfully");
    } catch (error) {
      console.error("Error rejecting member:", error);
      Alert.alert("Error", "Failed to reject member");
    }
  };

  const handleDocumentView = async (
    documentUrl: string,
    documentType: string
  ) => {
    try {
      if (!documentUrl) {
        Alert.alert("Error", `No ${documentType} document available`);
        return;
      }

      // Directly open the URL since we have unrestricted access
      await Linking.openURL(documentUrl);
    } catch (error) {
      console.error(`Error viewing ${documentType}:`, error);
      Alert.alert("Error", `Unable to open ${documentType} document`);
    }
  };

  const renderItem = ({ item }: { item: KMember }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.memberName}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item.phone)}
            >
              <Ionicons name="checkmark-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item.phone)}
            >
              <Ionicons name="close-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
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

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="wallet-outline" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.label}>Economic:</Text>
            <Text style={styles.value}>{item.economicStatus}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="people-outline" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.value}>{item.category}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="home-outline" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.label}>Unit:</Text>
            <Text style={styles.value}>
              {item.unitName} ({item.unitNumber})
            </Text>
          </View>
        </View>

        <View style={styles.documentSection}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.documentButtons}>
            {item.aadharDocumentUrl && (
              <TouchableOpacity
                style={styles.viewDocButton}
                onPress={() =>
                  handleDocumentView(item.aadharDocumentUrl, "Aadhar")
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color="white"
                />
                <Text style={styles.viewDocText}>Aadhar Card</Text>
              </TouchableOpacity>
            )}

            {item.rationCardDocumentUrl && (
              <TouchableOpacity
                style={styles.viewDocButton}
                onPress={() =>
                  handleDocumentView(item.rationCardDocumentUrl, "RationCard")
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color="white"
                />
                <Text style={styles.viewDocText}>Ration Card</Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.headerTitle}>Member Approvals</Text>
              <Text style={styles.headerSubtitle}>
                Review and manage unit member applications
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Main content with scrollable FlatList */}
        <FlatList
          data={kMembers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{kMembers.length}</Text>
                <Text style={styles.statLabel}>Pending Approvals</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={48} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No Pending Approvals</Text>
              <Text style={styles.emptyText}>
                There are no pending members to approve
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
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#10B981", // Green color for approve
  },
  rejectButton: {
    backgroundColor: "#EF4444", // Red color for reject
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    marginBottom: 6,
  },
  detailIconContainer: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    width: 80,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    textAlign: "right",
  },
  documentSection: {
    marginTop: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
  },
  documentButtons: {
    flexDirection: "row",
    gap: 12,
  },
  viewDocButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  viewDocText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    marginLeft: 8,
    fontSize: 14,
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
