import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { firebase } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";

type Props = {
  route: any;
  navigation: StackNavigationProp<RootStackParamList, "KMemberProfile">;
};

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
  createdAt?: string; // Optional field for registration date
}

export default function KMemberProfileScreen({ route, navigation }: Props) {
  const phoneNumber = route?.params?.phoneNumber || "";
  const [isEditing, setIsEditing] = useState(false);
  const [userDetails, setUserDetails] = useState<KMemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollY] = useState(new Animated.Value(0));
  const [membershipDays, setMembershipDays] = useState(0);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (phoneNumber) {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "K-member", phoneNumber));

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (!data.createdAt) {
              // Use current date if createdAt doesn't exist
              data.createdAt = new Date().toISOString();
              // Update the document with the creation date
              await updateDoc(doc(db, "K-member", phoneNumber), {
                createdAt: data.createdAt,
              });
            }
            data.role = "K-member";
            setUserDetails(data as KMemberDetails);
          }
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

  useEffect(() => {
    const calculateMembershipDays = async () => {
      try {
        if (userDetails) {
          const db = getFirestore();
          const unitDoc = await getDoc(
            doc(db, "unitDetails", userDetails.unitNumber)
          );

          if (unitDoc.exists()) {
            const unitData = unitDoc.data();
            const memberInfo = unitData.members?.find(
              (member: any) => member.phone === phoneNumber
            );

            const today = new Date();
            let startDate;

            if (memberInfo?.joinedAt) {
              // Use member's joinedAt date if available
              startDate = new Date(memberInfo.joinedAt);
            } else {
              // Use March 1st, 2025 as fallback
              startDate = new Date("2025-03-01T00:00:00.000Z");
            }

            const diffTime = Math.abs(today.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setMembershipDays(Math.max(1, diffDays));
          }
        }
      } catch (error) {
        console.error("Error calculating membership days:", error);
        // Use March 1st, 2025 as fallback if there's an error
        const today = new Date();
        const startDate = new Date("2025-03-01T00:00:00.000Z");
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setMembershipDays(Math.max(1, diffDays));
      }
    };

    calculateMembershipDays();
  }, [userDetails, phoneNumber]);

  const handleEditButton = async () => {
    if (isEditing && userDetails) {
      try {
        const user = auth.currentUser;
        if (user?.phoneNumber) {
          const formattedPhone = user.phoneNumber.replace("+91", "");
          // Only update the address field
          await updateDoc(doc(firebase, "K-member", formattedPhone), {
            address: userDetails.address,
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

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await auth.signOut();
            navigation.replace("Login");
          } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Error", "Failed to log out");
          }
        },
      },
    ]);
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
    "phone",
    "address",
    "aadhar",
    "rationCard",
    "economicStatus",
    "category",
    "unitNumber",
    "unitName",
    "memberSince",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <LinearGradient
          colors={["#7C3AED", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Animated.View
            style={[
              styles.profileContainer,
              {
                transform: [
                  {
                    scale: scrollY.interpolate({
                      inputRange: [-100, 0, 100],
                      outputRange: [1.2, 1, 0.8],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: userDetails.profilePhotoUrl }}
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>
              {`${userDetails.firstName} ${userDetails.lastName}`}
            </Text>
            <View style={styles.membershipBadge}>
              <MaterialCommunityIcons
                name="shield-star"
                size={16}
                color="#FFD700"
              />
              <Text style={styles.membershipText}>
                {`${membershipDays} Days as Member`}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {[
            {
              icon: "bank",
              label: "Unit",
              value: userDetails.unitName,
              color: "#8B5CF6",
            },
            {
              icon: "card-account-details",
              label: "Category",
              value: userDetails.category,
              color: "#EC4899",
            },
            {
              icon: "wallet",
              label: "Status",
              value: userDetails.economicStatus,
              color: "#10B981",
            },
          ].map((stat, index) => (
            <LinearGradient
              key={index}
              colors={[`${stat.color}15`, `${stat.color}05`]}
              style={styles.statCard}
            >
              <MaterialCommunityIcons
                name={stat.icon}
                size={24}
                color={stat.color}
              />
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Edit Profile Button with Animation */}
        <TouchableOpacity
          style={styles.editButtonContainer}
          onPress={handleEditButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#8B5CF6", "#C026D3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.editButton}
          >
            <MaterialCommunityIcons
              name={isEditing ? "content-save" : "account-edit"}
              size={20}
              color="#fff"
            />
            <Text style={styles.editButtonText}>
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButtonContainer}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#EF4444", "#DC2626"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutButton}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Personal Details Section */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionHeader}>Personal Information</Text>
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
            style={[styles.detailsBox, isEditing && styles.editableBox]}
          >
            {Object.entries(userDetails)
              .map(([key, value]) => {
                // Skip if not in our ordered list
                if (!relevantFields.includes(key)) return null;

                return (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Text>
                    {isEditing && key === "address" ? (
                      <TextInput
                        style={styles.detailInput}
                        value={value.toString()}
                        onChangeText={(text) =>
                          handleChange(key as keyof KMemberDetails, text)
                        }
                      />
                    ) : (
                      <Text style={styles.detailText}>{value}</Text>
                    )}
                  </View>
                );
              })
              .sort((a, b) => {
                if (!a || !b) return 0;
                const indexA = relevantFields.indexOf(a.key);
                const indexB = relevantFields.indexOf(b.key);
                return indexA - indexB;
              })}
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 90,
  },
  header: {
    paddingTop: 10, // Reduced from 20
    paddingBottom: 25, // Reduced from 40
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 10, // Reduced from 20
  },
  profileImage: {
    width: 120, // Reduced from 120
    height: 120, // Reduced from 120
    borderRadius: 60, // Adjusted for new size
    borderWidth: 3, // Reduced from 4
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  profileName: {
    marginTop: 8, // Reduced from 16
    fontSize: 24, // Reduced from 24
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12, // Reduced from 12
    paddingVertical: 6, // Reduced from 6
    borderRadius: 20, // Reduced from 20
    marginTop: 6, // Reduced from 8
  },
  membershipText: {
    color: "#fff",
    marginLeft: 4, // Reduced from 6
    fontFamily: "Poppins_400Regular",
    fontSize: 11, // Reduced from 12
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: -30,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoItem: {
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: -20, // Adjusted to move cards up
  },
  statCard: {
    flex: 1,
    margin: 4,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
    marginTop: 2,
  },
  editButtonContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 25,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  logoutButtonContainer: {
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 25,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 12,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  detailsBox: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
  },
  editableBox: {
    backgroundColor: "rgba(243, 244, 246, 0.8)",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
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
    borderColor: "#8B5CF6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    fontFamily: "Poppins_600SemiBold",
  },
});
