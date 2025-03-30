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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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

  if (!fontsLoaded) {
    return null;
  }

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
    <LinearGradient
      colors={["rgba(139, 92, 246, 0.05)", "rgba(236, 72, 153, 0.05)"]}
      style={styles.memberItem}
    >
      <View style={styles.memberDetails}>
        <Text
          style={styles.memberName}
        >{`${item.firstName} ${item.lastName}`}</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{item.phone}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Aadhar:</Text>
          <Text style={styles.infoValue}>{item.aadhar}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Ration Card:</Text>
          <Text style={styles.infoValue}>{item.rationCard}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Economic Status:</Text>
          <Text style={styles.infoValue}>{item.economicStatus}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>{item.category}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Unit Name:</Text>
          <Text style={styles.infoValue}>{item.unitName}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Unit Number:</Text>
          <Text style={styles.infoValue}>{item.unitNumber}</Text>
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
                  size={20}
                  color="white"
                />
                <Text style={styles.viewDocText}>View Aadhar</Text>
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
                  size={20}
                  color="white"
                />
                <Text style={styles.viewDocText}>View Ration Card</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.phone)}
        >
          <Ionicons name="checkmark-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.phone)} // Changed from handleApprove
        >
          <Ionicons name="close-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.title}>K-Member Approvals</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" />
      ) : kMembers.length > 0 ? (
        <FlatList
          data={kMembers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.noMembersText}>No pending approvals</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.1)",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#8B5CF6",
  },
  listContainer: {
    padding: 16,
  },
  memberItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  memberDetails: {
    flex: 1,
    gap: 8,
  },
  memberName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#8B5CF6",
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.1)",
  },
  infoLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#8B5CF6",
  },
  infoValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4B5563",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  approveButton: {
    backgroundColor: "#8B5CF6",
  },
  rejectButton: {
    backgroundColor: "#EC4899",
  },
  noMembersText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 18,
    color: "#8B5CF6",
    textAlign: "center",
    marginTop: 20,
  },
  documentSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.1)",
    paddingTop: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#8B5CF6",
    marginBottom: 8,
  },
  documentButtons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  viewDocButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: 150,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  viewDocText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    marginLeft: 8,
    fontSize: 14,
  },
  noDocText: {
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
    fontSize: 14,
    flex: 1,
    textAlign: "center",
  },
});
