import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { firebase } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { fetchLocationFromPincode } from "../utils/pincodeUtils";

const auth = getAuth();

interface NormalUserDetails {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  pincode: string;
  district: string;
  state: string;
  gender: string;
  role: string;
  createdAt?: string;
}

export default function NormalUserProfileScreen({ route, navigation }) {
  const phoneNumber = route?.params?.phoneNumber || "";
  const [isEditing, setIsEditing] = useState(false);
  const [userDetails, setUserDetails] = useState<NormalUserDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [membershipDays, setMembershipDays] = useState(0);

  const relevantFields = [
    "phone",
    "address",
    "pincode",
    "district",
    "state",
    "gender",
  ];

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (phoneNumber) {
          const userDoc = await getDoc(doc(firebase, "normal", phoneNumber));
          if (userDoc.exists()) {
            const data = userDoc.data();
            data.role = "Normal User";
            setUserDetails(data as NormalUserDetails);
          }
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [phoneNumber]);

  useEffect(() => {
    if (userDetails?.createdAt) {
      const today = new Date();
      const registrationDate = new Date(userDetails.createdAt);
      const diffTime = Math.abs(today.getTime() - registrationDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setMembershipDays(Math.max(1, diffDays));
    }
  }, [userDetails]);

  const handleEditButton = async () => {
    if (isEditing && userDetails) {
      setIsSaving(true);
      try {
        await updateDoc(doc(firebase, "normal", phoneNumber), {
          address: userDetails.address,
          gender: userDetails.gender,
          pincode: userDetails.pincode,
          district: userDetails.district,
          state: userDetails.state,
        });
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => setIsEditing(false) },
        ]);
      } catch (error) {
        Alert.alert("Error", "Failed to update profile");
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = async (
    field: keyof NormalUserDetails,
    value: string
  ) => {
    if (userDetails) {
      if (field === "pincode" && value.length === 6) {
        try {
          const location = await fetchLocationFromPincode(value);
          setUserDetails({
            ...userDetails,
            pincode: value,
            district: location.district,
            state: location.state,
          });
        } catch (error) {
          Alert.alert("Error", "Invalid pincode");
        }
      } else {
        setUserDetails({ ...userDetails, [field]: value });
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await auth.signOut();
            navigation.replace("Login");
          } catch (error) {
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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false} // Add this line
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
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userDetails?.firstName?.[0]}
                {userDetails?.lastName?.[0]}
              </Text>
            </View>
            <Text style={styles.userName}>
              {`${userDetails?.firstName} ${userDetails?.lastName}`}
            </Text>
            <View style={styles.membershipBadge}>
              <MaterialCommunityIcons
                name="account-circle"
                size={16}
                color="#FFD700"
              />
              <Text style={styles.membershipText}>
                {`${membershipDays} Days as Member`}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          {[
            {
              icon: "map-marker",
              label: "District",
              value: userDetails?.district || "N/A",
              color: "#8B5CF6",
            },
            {
              icon: "account",
              label: "Gender",
              value: userDetails?.gender || "N/A",
              color: "#EC4899",
            },
            {
              icon: "home",
              label: "State",
              value: userDetails?.state || "N/A",
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

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionHeader}>Personal Information</Text>
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
            style={[styles.detailsBox, isEditing && styles.editableBox]}
          >
            {Object.entries(userDetails).map(([key, value]) => {
              if (
                !relevantFields.includes(key) ||
                key === "firstName" ||
                key === "lastName" ||
                key === "role"
              )
                return null;

              return (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </Text>
                  {isEditing &&
                  (key === "address" ||
                    key === "gender" ||
                    key === "pincode") ? (
                    key === "gender" ? (
                      <View style={styles.pickerContainer}>
                        <TouchableOpacity
                          style={[
                            styles.genderOption,
                            value === "Male" && styles.selectedGender,
                          ]}
                          onPress={() => handleChange("gender", "Male")}
                        >
                          <Text
                            style={[
                              styles.genderText,
                              value === "Male" && styles.selectedGenderText,
                            ]}
                          >
                            Male
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.genderOption,
                            value === "Female" && styles.selectedGender,
                          ]}
                          onPress={() => handleChange("gender", "Female")}
                        >
                          <Text
                            style={[
                              styles.genderText,
                              value === "Female" && styles.selectedGenderText,
                            ]}
                          >
                            Female
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TextInput
                        style={styles.detailInput}
                        value={value.toString()}
                        onChangeText={(text) =>
                          handleChange(key as keyof NormalUserDetails, text)
                        }
                        keyboardType={key === "pincode" ? "numeric" : "default"}
                        maxLength={key === "pincode" ? 6 : undefined}
                      />
                    )
                  ) : (
                    <Text style={styles.detailText}>{value}</Text>
                  )}
                </View>
              );
            })}
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={styles.editButtonContainer}
          onPress={handleEditButton}
          disabled={isSaving}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90, // Add extra padding for bottom nav bar
  },
  header: {
    paddingTop: 10,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  avatarText: {
    fontSize: 36,
    fontFamily: "Poppins_600SemiBold",
    color: "#8B5CF6",
  },
  userName: {
    marginTop: 8,
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
  },
  membershipText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#FFD700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  statLabel: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  statValue: {
    marginTop: 5,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#555",
  },
  detailsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 10,
  },
  detailsBox: {
    padding: 15,
    borderRadius: 10,
  },
  editableBox: {
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#333",
    width: 100,
  },
  detailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#555",
  },
  detailInput: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#555",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
  pickerContainer: {
    flexDirection: "row",
    gap: 10,
  },
  genderOption: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  selectedGender: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  genderText: {
    color: "#4B5563",
    fontFamily: "Poppins_400Regular",
  },
  selectedGenderText: {
    color: "#FFFFFF",
  },
  editButtonContainer: {
    marginBottom: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 25,
  },
  editButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  logoutButtonContainer: {
    marginBottom: 30, // Increase bottom margin
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 25,
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
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
    color: "#333",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
  },
});
