import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"
import { firebase } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const auth = getAuth();

interface KMemberDetails {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  unitNumber: string;
  unitName: string;
  aadhar: string;
  rationCard: string;
  economicStatus: string;
  category: string;
  memberSince: string;
  role: string;
  profilePhotoUrl: string;
}


export default function KMemberProfileScreen({ route }) {
  const [isEditing, setIsEditing] = useState(false);
  const [userDetails, setUserDetails] = useState<KMemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const phoneNumber = route.params?.phoneNumber;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (phoneNumber) {
          console.log("Using phone number from params:", phoneNumber);
          const userDoc = await getDoc(doc(firebase, "K-member", phoneNumber));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("Fetched data:", data);
            data.role = "K-member";
            setUserDetails(data as KMemberDetails);
          } else {
            console.log("No document found for phone:", phoneNumber);
          }
        } else {
          console.log("No phone number in params");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [phoneNumber]);

  const handleEditButton = async () => {
    if (isEditing && userDetails) {
      try {
        const user = auth.currentUser;
        if (user?.phoneNumber) {
          const formattedPhone = user.phoneNumber.replace('+91', '');
          // Only update the address field
          await updateDoc(doc(firebase, "K-member", formattedPhone), {
            address: userDetails.address
          });
          Alert.alert("Success", "Address updated successfully");
        }
      } catch (error) {
        console.error("Error updating address:", error);
        Alert.alert("Error", "Failed to update address");
      }
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (field: keyof KMemberDetails, value: string) => {
    if (userDetails) {
      setUserDetails({ ...userDetails, [field]: value });
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No profile data found</Text>
      </View>
    );
  }

  // Define fields in specific order matching signup page
  const relevantFields = [
    'phone',
    'address',
    'aadhar',
    'rationCard',
    'economicStatus',
    'category',
    'unitNumber',
    'unitName',
    'memberSince'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.header}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: userDetails.profilePhotoUrl }} // Replace with user's actual profile picture
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>{`${userDetails.firstName} ${userDetails.lastName}`}</Text>
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
              // Skip if not in our ordered list
              if (!relevantFields.includes(key)) return null;
              
              return (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                  {isEditing && key === 'address' ? (
                    <TextInput
                      style={styles.detailInput}
                      value={value.toString()}
                      onChangeText={(text) => handleChange(key as keyof KMemberDetails, text)}
                    />
                  ) : (
                    <Text style={styles.detailText}>{value}</Text>
                  )}
                </View>
              );
            }).sort((a, b) => {
              if (!a || !b) return 0;
              const indexA = relevantFields.indexOf(a.key);
              const indexB = relevantFields.indexOf(b.key);
              return indexA - indexB;
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FF0000",
    fontFamily: "Poppins_600SemiBold",
  },
})

