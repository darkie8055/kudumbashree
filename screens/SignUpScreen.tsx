import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { firebase } from "../firebase";
import { getFirestore, collection, doc, setDoc, getDoc } from "firebase/firestore";
import { useRoute } from '@react-navigation/native';

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, "SignUp">

interface Props {
  navigation: SignUpScreenNavigationProp
}

export default function SignUpScreen({ navigation }: Props) {
  const route = useRoute();
  const { phoneNumber } = route.params;
  
  const [formData, setFormData] = useState({
    userType: "normal",
    firstName: "",
    lastName: "",
    phone: phoneNumber,
    password: "",
    confirmPassword: "",
    address: "",
    gender: "",
    pincode: "",
    district: "",
    state: "",
    aadhar: "",
    rationCard: "",
    economicStatus: "",
    category: "",
    unitNumber: "",
    documentUploaded: false,
    status: "pending",
  });



  const [animation] = useState(new Animated.Value(0));

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [animation]);

  const handleDocumentUpload = () => {
    setFormData({ ...formData, documentUploaded: true });
  };

  const renderCategoryPicker = () => {
    if (formData.economicStatus === "APL" || formData.economicStatus === "BPL") {
      return (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Category</Text>
          <Picker
            selectedValue={formData.category}
            onValueChange={(itemValue) => setFormData({ ...formData, category: itemValue })}
            style={styles.picker}
          >
            <Picker.Item label="Select Category" value="" />
            <Picker.Item label="General" value="General" />
            <Picker.Item label="OBC" value="OBC" />
            <Picker.Item label="SC" value="SC" />
            <Picker.Item label="ST" value="ST" />
          </Picker>
        </View>
      );
    }
    return null;
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Password Mismatch", "Password and Confirm Password do not match")
      return
    }

    if (formData.userType === "K-member") {
      if (formData.aadhar.length !== 12) {
        Alert.alert("Invalid Aadhar", "Aadhar number must be 12 digits")
        return
      }
      if (formData.rationCard.length !== 10) {
        Alert.alert("Invalid Ration Card", "Ration Card number must be 10 digits")
        return
      }
    }

    try {
      const userTypeCollection = collection(firebase, formData.userType)
      const userDocRef = doc(userTypeCollection, formData.phone)

      const userDocSnapshot = await getDoc(userDocRef)

      if (userDocSnapshot.exists()) {
        Alert.alert("Phone Number Exists", "A user with this phone number already exists.")
        return
      }

      await setDoc(userDocRef, {
        ...formData,
        password: formData.password, // Hash password in a real app!
      })

      console.log("Document successfully written!")

      if (formData.userType === "K-member") {
        Alert.alert("Registration Complete", "Your K-Member registration is complete. Please wait for approval.", [
          { text: "OK", onPress: () => navigation.navigate("WaitingApproval") },
        ])
      } else {
        Alert.alert("Registration Complete", "Your registration is complete.", [
          { text: "OK", onPress: () => navigation.navigate("Login") },
        ])
      }
    } catch (e) {
      console.error("Error adding document: ", e)
      Alert.alert("Error", "An error occurred during registration. Please try again later.")
    }
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  if (!fontsLoaded) {
    return null;
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
          <Animated.View style={[styles.formContainer, { opacity: animation, transform: [{ translateY }] }]}>
            <Text style={styles.title}>Create Account</Text>
            <View style={styles.form}>
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>User Type</Text>
                <Picker
                  selectedValue={formData.userType}
                  onValueChange={(itemValue) => setFormData({ ...formData, userType: itemValue })}
                  style={styles.picker}
                >
                  <Picker.Item label="User" value="normal" />
                  <Picker.Item label="K-Member" value="K-member" />
                </Picker>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                />
              </View>
              <View style={[styles.inputContainer, { height: 50 }]}>
                <Ionicons name="call-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <View style={[styles.phoneInputContainer, { height: 50 }]}>
                    <Text style={styles.phonePrefix}>+91 {phoneNumber}</Text>
                  </View>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="home-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Address"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
              {formData.userType === "normal" && (
                <>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Gender</Text>
                    <Picker
                      selectedValue={formData.gender}
                      onValueChange={(itemValue) => setFormData({ ...formData, gender: itemValue })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Gender" value="" />
                      <Picker.Item label="Male" value="male" />
                      <Picker.Item label="Female" value="female" />
                      <Picker.Item label="Other" value="other" />
                    </Picker>
                  </View>
                  <View style={styles.inputContainer}>
                    <Ionicons name="map-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Pincode"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={formData.pincode}
                      onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="business-outline"
                      size={24}
                      color="rgba(255,255,255,0.7)"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="District"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={formData.district}
                      onChangeText={(text) => setFormData({ ...formData, district: text })}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Ionicons name="flag-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="State"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={formData.state}
                      onChangeText={(text) => setFormData({ ...formData, state: text })}
                    />
                  </View>
                </>
              )}
              {formData.userType === "K-member" && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Aadhar Number (12 digits)"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={formData.aadhar}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, "").slice(0, 12)
                        setFormData({ ...formData, aadhar: cleaned })
                      }}
                      keyboardType="numeric"
                      maxLength={12}
                    />
                  </View>
                  <TouchableOpacity style={styles.uploadButton} onPress={handleDocumentUpload}>
                    <Ionicons name="cloud-upload-outline" size={24} color="white" style={styles.uploadIcon} />
                    <Text style={styles.uploadButtonText}>
                      {formData.documentUploaded ? "Document Uploaded" : "Upload Document"}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ration Card Number (10 digits)"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={formData.rationCard}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, "").slice(0, 10)
                        setFormData({ ...formData, rationCard: cleaned })
                      }}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Economic Status</Text>
                    <Picker
                      selectedValue={formData.economicStatus}
                      onValueChange={(itemValue) =>
                        setFormData({ ...formData, economicStatus: itemValue, category: "" })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Economic Status" value="" />
                      <Picker.Item label="APL" value="APL" />
                      <Picker.Item label="BPL" value="BPL" />
                    </Picker>
                  </View>
                  {renderCategoryPicker()}
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="business-outline"
                      size={24}
                      color="rgba(255,255,255,0.7)"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Unit Number"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={formData.unitNumber}
                      onChangeText={(text) => setFormData({ ...formData, unitNumber: text })}
                    />
                  </View>
                </>
              )}
              <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: "white",
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
    padding: 15,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  phonePrefix: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
    padding: 15,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    overflow: "hidden",
  },
  label: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  picker: {
    color: "white",
  },
  uploadButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  uploadIcon: {
    marginRight: 10,
  },
  uploadButtonText: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
  },
  button: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#8B5CF6",
    fontSize: 16,
  },
  linkText: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },
})
