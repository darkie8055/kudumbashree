import { useState } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

interface UserDetails {
  name: string
  role: string
  unitNumber: string
  unitName: string
  aadhaarNo: string
  rationCard: string
  bankCopy: string
  bplApl: string
  category: string
  memberSince: string
}

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: "Jane Doe",
    role: "Member",
    unitNumber: "101",
    unitName: "Green Group",
    aadhaarNo: "1234 5678 9101",
    rationCard: "Yes",
    bankCopy: "Attached",
    bplApl: "BPL",
    category: "SC",
    memberSince: "2021",
  })

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  const handleEditButton = () => {
    setIsEditing(!isEditing)
  }

  const handleChange = (field: keyof UserDetails, value: string) => {
    setUserDetails({ ...userDetails, [field]: value })
  }

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.header}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: "https://picsum.photos/200" }} // Replace with user's actual profile picture
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>{userDetails.name}</Text>
          </View>
        </LinearGradient>

        {/* Role, Unit Number, and Unit Name Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={24} color="#8B5CF6" />
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>{userDetails.role}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="home-outline" size={24} color="#8B5CF6" />
              <Text style={styles.infoLabel}>Unit Number</Text>
              <Text style={styles.infoValue}>{userDetails.unitNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={24} color="#8B5CF6" />
              <Text style={styles.infoLabel}>Unit Name</Text>
              <Text style={styles.infoValue}>{userDetails.unitName}</Text>
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditButton}>
          <Text style={styles.editButtonText}>{isEditing ? "Save Changes" : "Edit Profile"}</Text>
        </TouchableOpacity>

        {/* User Details Section */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionHeader}>Personal Details</Text>
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
            style={[styles.detailsBox, isEditing && styles.editableBox]}
          >
            {Object.entries(userDetails).map(([key, value]) => {
              if (key === "name" || key === "role" || key === "unitNumber" || key === "unitName") return null
              return (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.detailInput}
                      value={value}
                      onChangeText={(text) => handleChange(key as keyof UserDetails, text)}
                    />
                  ) : (
                    <Text style={styles.detailText}>{value}</Text>
                  )}
                </View>
              )
            })}
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
  },
  profileContainer: {
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  profileName: {
    marginTop: 10,
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginTop: -30,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  editButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginVertical: 20,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
    marginBottom: 10,
  },
  detailsBox: {
    padding: 15,
    borderRadius: 10,
  },
  editableBox: {
    backgroundColor: "rgba(243, 244, 246, 0.8)",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(209, 213, 219, 0.5)",
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#4B5563",
  },
  detailText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#1F2937",
  },
  detailInput: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 120,
  },
})

