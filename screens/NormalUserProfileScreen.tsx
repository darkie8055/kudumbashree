import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"
import { firebase } from "../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { fetchLocationFromPincode } from '../utils/pincodeUtils'

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
}

export default function NormalUserProfileScreen({ route }) {
  const phoneNumber = route?.params?.phoneNumber || '';
  const [isEditing, setIsEditing] = useState(false);
  const [userDetails, setUserDetails] = useState<NormalUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Define fields in specific order matching signup page
  const relevantFields = [
    'phone',
    'address',
    'pincode',
    'district',
    'state',
    'gender'
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
          console.log("Using phone number from params:", phoneNumber);
          const userDoc = await getDoc(doc(firebase, "normal", phoneNumber));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("Fetched data:", data);
            data.role = "Normal User";
            setUserDetails(data as NormalUserDetails);
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
      setIsSaving(true);
      try {
        await updateDoc(doc(firebase, "normal", phoneNumber), {
          address: userDetails.address,
          gender: userDetails.gender,
          pincode: userDetails.pincode,
          district: userDetails.district,
          state: userDetails.state
        });
        
        // Success Alert with custom styling
        Alert.alert(
          "Success",
          "Profile updated successfully",
          [
            {
              text: "OK",
              style: "default",
              onPress: () => setIsEditing(false)
            }
          ],
          {
            cancelable: false,
            titleStyle: { 
              color: '#10B981',
              fontFamily: 'Poppins_600SemiBold'
            },
            messageStyle: {
              fontFamily: 'Poppins_400Regular'
            }
          }
        );
      } catch (error) {
        console.error("Error updating profile:", error);
        // Error Alert with custom styling
        Alert.alert(
          "Error",
          "Failed to update profile",
          [
            {
              text: "Try Again",
              style: "default"
            }
          ],
          {
            cancelable: true,
            titleStyle: { 
              color: '#EF4444',
              fontFamily: 'Poppins_600SemiBold'
            },
            messageStyle: {
              fontFamily: 'Poppins_400Regular'
            }
          }
        );
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = async (field: keyof NormalUserDetails, value: string) => {
    if (userDetails) {
      if (field === 'pincode' && value.length === 6) {
        try {
          const location = await fetchLocationFromPincode(value);
          setUserDetails({
            ...userDetails,
            pincode: value,
            district: location.district,
            state: location.state
          });
        } catch (error) {
          console.error('Error fetching location:', error);
          Alert.alert('Error', 'Invalid pincode');
        }
      } else {
        setUserDetails({ ...userDetails, [field]: value });
      }
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

  return (
    <LinearGradient
      colors={["#8B5CF6", "#EC4899"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>NU</Text>
            </View>
            <Text style={styles.userName}>
              {`${userDetails.firstName} ${userDetails.lastName}`}
            </Text>
            <Text style={styles.userType}>{userDetails.role}</Text>
          </View>

          {/* User Details Section */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionHeader}>Personal Details</Text>
            {Object.entries(userDetails).map(([key, value]) => {
              if (!relevantFields.includes(key) || key === 'firstName' || key === 'lastName' || key === 'role') return null;
              
              return (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                  {isEditing && (key === 'address' || key === 'gender' || key === 'pincode') ? (
                    key === 'gender' ? (
                      <View style={styles.pickerContainer}>
                        <TouchableOpacity
                          style={[styles.genderOption, value === 'Male' && styles.selectedGender]}
                          onPress={() => handleChange('gender', 'Male')}
                        >
                          <Text style={[styles.genderText, value === 'Male' && styles.selectedGenderText]}>Male</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.genderOption, value === 'Female' && styles.selectedGender]}
                          onPress={() => handleChange('gender', 'Female')}
                        >
                          <Text style={[styles.genderText, value === 'Female' && styles.selectedGenderText]}>Female</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TextInput
                        style={styles.detailInput}
                        value={value.toString()}
                        onChangeText={(text) => handleChange(key as keyof NormalUserDetails, text)}
                        keyboardType={key === 'pincode' ? 'numeric' : 'default'}
                        maxLength={key === 'pincode' ? 6 : undefined}
                      />
                    )
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
          </View>

          {/* Edit Button */}
          <TouchableOpacity 
            style={[
              styles.editButton,
              isSaving && styles.editButtonDisabled
            ]} 
            onPress={handleEditButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.editButtonText}>
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={24} color="white" style={styles.infoIcon} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 36,
    color: "#8B5CF6",
  },
  userName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "white",
    marginBottom: 5,
  },
  userType: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  infoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  infoValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "white",
  },
  editButton: {
    backgroundColor: "white",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  editButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#8B5CF6",
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
    color: "white",
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
  },
  detailsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "white",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    width: 100,
  },
  detailText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "white",
  },
  detailInput: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 5,
    padding: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedGender: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  genderText: {
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular',
  },
  selectedGenderText: {
    color: '#FFFFFF',
  },
  editButtonDisabled: {
    opacity: 0.7,
  },
})

