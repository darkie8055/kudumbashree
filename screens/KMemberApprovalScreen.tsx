import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"
import { firebase } from "../firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"

interface KMember {
  id: string
  firstName: string
  lastName: string
  phone: string
  status: "pending" | "approved" | "rejected"
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

  const handleApproval = async (memberId: string, approved: boolean) => {
    try {
      const memberRef = doc(firebase, "K-member", memberId)
      await updateDoc(memberRef, {
        status: approved ? "approved" : "rejected",
      })
      // Update local state
      setKMembers((prevMembers) => prevMembers.filter((member) => member.id !== memberId))
      Alert.alert("Success", `K-member ${approved ? "approved" : "rejected"} successfully.`)
    } catch (error) {
      console.error("Error updating K-member status:", error)
      Alert.alert("Error", "Failed to update K-member status. Please try again.")
    }
  }

  if (!fontsLoaded) {
    return null
  }

  const renderItem = ({ item }: { item: KMember }) => (
    <View style={styles.memberItem}>
      <View>
        <Text style={styles.memberName}>{`${item.firstName} ${item.lastName}`}</Text>
        <Text style={styles.memberPhone}>{item.phone}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApproval(item.id, true)}
        >
          <Ionicons name="checkmark-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleApproval(item.id, false)}
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
  memberName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "white",
  },
  memberPhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
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
})

