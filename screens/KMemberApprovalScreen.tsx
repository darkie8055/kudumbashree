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
    <View style={styles.memberItem}>
      <View style={styles.memberDetails}>
        <Text style={styles.memberName}>{`${item.firstName} ${item.lastName}`}</Text>
        <Text style={styles.memberInfo}>Phone: {item.phone}</Text>
        <Text style={styles.memberInfo}>Aadhar: {item.aadhar}</Text>
        <Text style={styles.memberInfo}>Ration Card: {item.rationCard}</Text>
        <Text style={styles.memberInfo}>Economic Status: {item.economicStatus}</Text>
        <Text style={styles.memberInfo}>Category: {item.category}</Text>
        <Text style={styles.memberInfo}>Unit Number: {item.unitNumber}</Text>
        
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
    </View>
  )

  return (
    <LinearGradient
      colors={["#8B5CF6", "#EC4899"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>K-Member Approvals</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="white" />
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
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "white",
  },
  listContainer: {
    padding: 16,
  },
  memberItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "white",
  },
  memberInfo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: "#10B981",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  noMembersText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 18,
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },
  viewDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    width: 'auto',
    alignSelf: 'flex-start',
  },
  viewDocText: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    marginLeft: 5,
    fontSize: 14,
  },
})

