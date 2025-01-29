import React, { useState } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"

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

  const handleEditButton = () => {
    setIsEditing(!isEditing)
  }

  const handleChange = (field: keyof UserDetails, value: string) => {
    setUserDetails({ ...userDetails, [field]: value })
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: "https://picsum.photos/400/400?random=1" }} // Replace with user's actual profile picture
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{userDetails.name}</Text>
      </View>

      {/* Role, Unit Number, and Unit Name Section */}
      <View style={styles.infoRow}>
        {/* First Row with values */}
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{userDetails.role}</Text>
          <Text style={styles.valueText}>{userDetails.unitNumber}</Text>
          <Text style={styles.valueText}>{userDetails.unitName}</Text>
        </View>

        {/* Second Row with underlined indicators */}
        <View style={styles.indicatorRow}>
          <Text style={styles.indicatorText}>Role</Text>
          <Text style={styles.indicatorText}>Unit Number</Text>
          <Text style={styles.indicatorText}>Unit Name</Text>
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
          colors={["rgba(129, 69, 155, 0.7)", "rgba(166, 223, 184, 0.7)"]}
          style={[styles.detailsBox, isEditing && styles.editableBox]}
        >
          {isEditing ? (
            <TextInput
              style={styles.detailText}
              value={userDetails.aadhaarNo}
              onChangeText={(text) => handleChange("aadhaarNo", text)}
            />
          ) : (
            <Text style={styles.detailText}>Aadhaar No: {userDetails.aadhaarNo}</Text>
          )}
          {isEditing ? (
            <TextInput
              style={styles.detailText}
              value={userDetails.rationCard}
              onChangeText={(text) => handleChange("rationCard", text)}
            />
          ) : (
            <Text style={styles.detailText}>Ration Card: {userDetails.rationCard}</Text>
          )}
          {isEditing ? (
            <TextInput
              style={styles.detailText}
              value={userDetails.bankCopy}
              onChangeText={(text) => handleChange("bankCopy", text)}
            />
          ) : (
            <Text style={styles.detailText}>Bank Copy: {userDetails.bankCopy}</Text>
          )}
          {isEditing ? (
            <TextInput
              style={styles.detailText}
              value={userDetails.bplApl}
              onChangeText={(text) => handleChange("bplApl", text)}
            />
          ) : (
            <Text style={styles.detailText}>BPL/APL: {userDetails.bplApl}</Text>
          )}
          {isEditing ? (
            <TextInput
              style={styles.detailText}
              value={userDetails.category}
              onChangeText={(text) => handleChange("category", text)}
            />
          ) : (
            <Text style={styles.detailText}>Category: {userDetails.category}</Text>
          )}
          {isEditing ? (
            <TextInput
              style={styles.detailText}
              value={userDetails.memberSince}
              onChangeText={(text) => handleChange("memberSince", text)}
            />
          ) : (
            <Text style={styles.detailText}>Member Since: {userDetails.memberSince}</Text>
          )}
        </LinearGradient>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  editButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textDecorationLine: "underline",
  },
  detailText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    backgroundColor: "#fff",
    borderWidth: 1,
    padding: 5,
    marginBottom: 10,
  },
  detailsBox: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#000",
    paddingBottom: 5,
  },
  editableBox: {
    backgroundColor: "#f0f0f0",
  },
  infoRow: {
    marginBottom: 20,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  valueText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  indicatorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  indicatorText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    textDecorationLine: "underline",
  },
})

