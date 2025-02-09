import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"
import { firebase } from "../firebase"
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"
import { auth } from "../firebase"

interface KMember {
  id: string
  firstName: string
  lastName: string
  phone: string
  status: "pending" | "approved" | "rejected"
  aadhar: string
  rationCard: string
  economicStatus: string
  category: string
  unitNumber: string
  aadharDocumentUrl: string
}

export default function KMemberApprovalScreen({ navigation }) {
  const [kMembers, setKMembers] = useState<KMember[]>([])
  const [loading, setLoading] = useState(true)

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  useEffect(() => {
    fetchKMembers()
  }, [])

  const fetchKMembers = async () => {
    try {
      const kMemberCollection = collection(firebase, "K-member")
      const q = query(kMemberCollection, where("status", "==", "pending"))
      const querySnapshot = await getDocs(q)
      const members: KMember[] = []
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() } as KMember)
      })
      setKMembers(members)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching K-members:", error)
      Alert.alert("Error", "Failed to fetch K-members. Please try again.")
      setLoading(false)
    }
  }

  const handleApprove = async (phone: string) => {
    try {
      // First get the K-member's unit number
      const kmemberDoc = await getDoc(doc(firebase, "K-member", phone));
      if (!kmemberDoc.exists()) {
        Alert.alert("Error", "Member data not found");
        return;
      }
      const kmemberData = kmemberDoc.data();
      const unitNumber = kmemberData.unitNumber;

      // Find president with matching unit number
      const presidentsRef = collection(firebase, "president");
      const q = query(presidentsRef, where("unitNumber", "==", unitNumber));
      const presidentSnapshot = await getDocs(q);

      if (presidentSnapshot.empty) {
        Alert.alert("Error", "No president found for this unit");
        return;
      }

      const presidentData = presidentSnapshot.docs[0].data();

      // Update K-member status
      await updateDoc(doc(firebase, "K-member", phone), {
        status: "approved",
        unitName: presidentData.unitName
      });
      
      fetchKMembers();
      Alert.alert("Success", "Member approved successfully");
    } catch (error) {
      console.error("Error approving member:", error);
      Alert.alert("Error", "Failed to approve member");
    }
  };

  if (!fontsLoaded) {
    return null
  }

  const renderItem = ({ item }: { item: KMember }) => (
    <LinearGradient
      colors={['rgba(139, 92, 246, 0.05)', 'rgba(236, 72, 153, 0.05)']}
      style={styles.memberItem}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.memberDetails}>
        <Text style={styles.memberName}>{`${item.firstName} ${item.lastName}`}</Text>
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
          <Text style={styles.infoLabel}>Unit Number:</Text>
          <Text style={styles.infoValue}>{item.unitNumber}</Text>
        </View>
        
        {item.aadharDocumentUrl && (
          <TouchableOpacity 
            style={styles.viewDocButton}
            onPress={() => Linking.openURL(item.aadharDocumentUrl)}
          >
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text style={styles.viewDocText}>View Document</Text>
          </TouchableOpacity>
        )}
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
          onPress={() => handleApprove(item.phone)}
        >
          <Ionicons name="close-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
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
    backgroundColor: 'white',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
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
    justifyContent: 'flex-end',
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
  viewDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
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
})

