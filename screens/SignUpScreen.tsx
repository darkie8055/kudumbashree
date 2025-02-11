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
  ActivityIndicator,
  Image,
  Pressable,
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
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../firebase";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import { RouteProp } from "@react-navigation/native";

type SignUpScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SignUp"
>;

interface Props {
  navigation: SignUpScreenNavigationProp;
}

type RouteParams = {
  phoneNumber: string;
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function SignUpScreen({ navigation }: Props) {
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
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
    profilePhotoUrl: "",
  });

  const [animation] = useState(new Animated.Value(0));
  const [loginButtonScale] = useState(new Animated.Value(1));

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [aadharDocumentUrl, setAadharDocumentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [animation]);

  const animateScale = (value: Animated.Value, toValue: number) => {
    Animated.timing(value, {
      toValue,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const fetchAddressFromPincode = async (pincode: string) => {
    try {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      if (response.data[0].Status === "Success") {
        const postOffice = response.data[0].PostOffice[0];
        setFormData({
          ...formData,
          pincode,
          state: postOffice.State,
          district: postOffice.District,
        });
      } else {
        Alert.alert("Error", "Please enter a valid pincode");
        setFormData({
          ...formData,
          pincode,
          state: "",
          district: "",
        });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      Alert.alert("Error", "Please enter a valid pincode");
      setFormData({
        ...formData,
        pincode,
        state: "",
        district: "",
      });
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        setIsLoading(true);
        const storage = getStorage(app);
        const fileRef = storageRef(
          storage,
          `aadhar-documents/${formData.phone}-${Date.now()}.pdf`
        );

        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        const metadata = {
          contentType: result.assets[0].mimeType || "application/pdf",
        };

        await uploadBytes(fileRef, blob, metadata);
        const downloadUrl = await getDownloadURL(fileRef);

        setAadharDocumentUrl(downloadUrl);
        setFormData({ ...formData, documentUploaded: true });
        setIsLoading(false);
        Alert.alert("Success", "Document uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to upload document");
    }
  };

  const handleProfilePhotoUpload = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setIsPhotoUploading(true);
        const storage = getStorage(app);
        const photoRef = storageRef(
          storage,
          `profile-photos/${formData.phone}-${Date.now()}.jpg`
        );

        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        await uploadBytes(photoRef, blob);
        const downloadUrl = await getDownloadURL(photoRef);

        setFormData({ ...formData, profilePhotoUrl: downloadUrl });
        Alert.alert("Success", "Profile photo uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", "Failed to upload profile photo");
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const renderCategoryPicker = () => {
    if (
      formData.economicStatus === "APL" ||
      formData.economicStatus === "BPL"
    ) {
      return (
        <LinearGradient
          colors={["rgba(139, 92, 246, 0.8)", "rgba(236, 72, 153, 0.8)"]}
          style={styles.pickerGradientBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Category</Text>
            <Picker
              selectedValue={formData.category}
              onValueChange={(itemValue) =>
                setFormData({ ...formData, category: itemValue })
              }
              style={[styles.picker, { color: "rgb(162,39,142)" }]}
            >
              <Picker.Item label="Select Category" value="" />
              <Picker.Item label="General" value="General" />
              <Picker.Item label="OBC" value="OBC" />
              <Picker.Item label="SC" value="SC" />
              <Picker.Item label="ST" value="ST" />
            </Picker>
          </View>
        </LinearGradient>
      );
    }
    return null;
  };

  const handleSignUp = async () => {
    try {
      setIsSubmitting(true);

      // Basic validation
      const requiredFields = {
        firstName: "First Name",
        lastName: "Last Name",
        password: "Password",
        confirmPassword: "Confirm Password",
        address: "Address",
      };

      // Add conditional required fields based on userType
      if (formData.userType === "normal") {
        Object.assign(requiredFields, {
          gender: "Gender",
          pincode: "Pincode",
        });
      }

      if (formData.userType === "K-member") {
        Object.assign(requiredFields, {
          aadhar: "Aadhar Number",
          rationCard: "Ration Card Number",
          economicStatus: "Economic Status",
          category: "Category",
          unitNumber: "Unit Number",
        });
      }

      // Check for empty fields
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!formData[field]) {
          Alert.alert("Required Field", `Please enter ${label}`);
          return;
        }
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert(
          "Password Mismatch",
          "Password and Confirm Password do not match"
        );
        return;
      }

      if (formData.userType === "K-member") {
        if (formData.aadhar.length !== 12) {
          Alert.alert("Invalid Aadhar", "Aadhar number must be 12 digits");
          return;
        }
        if (formData.rationCard.length !== 10) {
          Alert.alert(
            "Invalid Ration Card",
            "Ration Card number must be 10 digits"
          );
          return;
        }
      }

      if (formData.userType === "K-member" && !aadharDocumentUrl) {
        Alert.alert("Document Required", "Please upload your Aadhar document");
        return;
      }

      const userTypeCollection = collection(db, formData.userType);
      const userDocRef = doc(userTypeCollection, formData.phone);

      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        Alert.alert(
          "Phone Number Exists",
          "A user with this phone number already exists."
        );
        return;
      }

      if (formData.userType === "K-member") {
        try {
          const presidentsRef = collection(db, "president");
          const q = query(
            presidentsRef,
            where("unitNumber", "==", formData.unitNumber)
          );
          const presidentSnapshot = await getDocs(q);

          if (presidentSnapshot.empty) {
            Alert.alert(
              "Error",
              "No president found for this unit. Please check your unit number."
            );
            return;
          }

          // Get the president's data and check for unitName
          const presidentData = presidentSnapshot.docs[0].data();
          if (!presidentData.unitName) {
            console.error("President data:", presidentData); // Debug log
            Alert.alert(
              "Error",
              "Unit name not found. Please contact administrator."
            );
            return;
          }

          // Store user data with pending status and verified unitName
          const userData = {
            ...formData,
            password: formData.password,
            aadharDocumentUrl,
            profilePhotoUrl: formData.profilePhotoUrl,
            status: "pending",
            presidentId: presidentSnapshot.docs[0].id,
            unitName: presidentData.unitName,
          };

          console.log("User data being stored:", userData); // Debug log

          await setDoc(userDocRef, userData);

          Alert.alert(
            "Registration Complete",
            "Your K-Member registration is complete. Please wait for approval from your unit president.",
            [
              {
                text: "OK",
                onPress: () =>
                  navigation.navigate("WaitingApproval", {
                    phone: formData.phone,
                  }),
              },
            ]
          );
        } catch (error) {
          console.error("Error in K-member registration:", error);
          Alert.alert(
            "Error",
            "Failed to complete registration. Please try again."
          );
        }
      } else {
        // For normal users, just store the data
        await setDoc(userDocRef, {
          ...formData,
          password: formData.password,
          profilePhotoUrl: formData.profilePhotoUrl,
        });

        Alert.alert("Registration Complete", "Your registration is complete.", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      }
    } catch (e) {
      console.error("Error adding document: ", e);
      Alert.alert(
        "Error",
        "An error occurred during registration. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
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
      colors={[
        isPressed ? "rgba(162,39,142,0.03)" : "rgba(162,39,142,0.01)",
        isPressed ? "rgba(162,39,142,0.08)" : "rgba(162,39,142,0.03)",
      ]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.formContainer,
              { opacity: animation, transform: [{ translateY }] },
            ]}
          >
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.8)", "rgba(236, 72, 153, 0.8)"]}
              style={styles.gradientBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.whiteBackground}>
                <Text style={styles.title}>Create Account</Text>
                <View style={styles.form}>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.8)",
                      "rgba(236, 72, 153, 0.8)",
                    ]}
                    style={styles.pickerGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.pickerContainer}>
                      <Text style={styles.label}>User Type</Text>
                      <Picker
                        selectedValue={formData.userType}
                        onValueChange={(itemValue) =>
                          setFormData({ ...formData, userType: itemValue })
                        }
                        style={[styles.picker, { color: "rgb(162,39,142)" }]}
                      >
                        <Picker.Item label="Normal User" value="normal" />
                        <Picker.Item label="K-Member" value="K-member" />
                      </Picker>
                    </View>
                  </LinearGradient>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.8)",
                      "rgba(236, 72, 153, 0.8)",
                    ]}
                    style={styles.inputGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color="rgb(162,39,142)"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="rgba(162,39,142,0.7)"
                        value={formData.firstName}
                        onChangeText={(text) =>
                          setFormData({ ...formData, firstName: text })
                        }
                      />
                    </View>
                  </LinearGradient>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.8)",
                      "rgba(236, 72, 153, 0.8)",
                    ]}
                    style={styles.inputGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color="rgb(162,39,142)"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="rgba(162,39,142,0.7)"
                        value={formData.lastName}
                        onChangeText={(text) =>
                          setFormData({ ...formData, lastName: text })
                        }
                      />
                    </View>
                  </LinearGradient>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.8)",
                      "rgba(236, 72, 153, 0.8)",
                    ]}
                    style={styles.inputGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.inputContainer, { height: 50 }]}>
                      <Ionicons
                        name="call-outline"
                        size={24}
                        color="rgb(162,39,142)"
                        style={styles.inputIcon}
                      />
                      <View
                        style={[styles.phoneInputContainer, { height: 50 }]}
                      >
                        <Text style={styles.phonePrefix}>
                          +91 {phoneNumber}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.8)",
                      "rgba(236, 72, 153, 0.8)",
                    ]}
                    style={styles.inputGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={24}
                        color="rgb(162,39,142)"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="rgba(162,39,142,0.7)"
                        value={formData.password}
                        onChangeText={(text) =>
                          setFormData({ ...formData, password: text })
                        }
                        secureTextEntry
                      />
                    </View>
                  </LinearGradient>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.8)",
                      "rgba(236, 72, 153, 0.8)",
                    ]}
                    style={styles.inputGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={24}
                        color="rgb(162,39,142)"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="rgba(162,39,142,0.7)"
                        value={formData.confirmPassword}
                        onChangeText={(text) =>
                          setFormData({ ...formData, confirmPassword: text })
                        }
                        secureTextEntry
                      />
                    </View>
                  </LinearGradient>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.8)",
                      "rgba(236, 72, 153, 0.8)",
                    ]}
                    style={styles.inputGradientBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="home-outline"
                        size={24}
                        color="rgb(162,39,142)"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, styles.multilineInput]}
                        placeholder="Address"
                        placeholderTextColor="rgba(162,39,142,0.7)"
                        value={formData.address}
                        onChangeText={(text) =>
                          setFormData({ ...formData, address: text })
                        }
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  </LinearGradient>
                  {formData.userType === "normal" && (
                    <>
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.8)",
                          "rgba(236, 72, 153, 0.8)",
                        ]}
                        style={styles.pickerGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.pickerContainer}>
                          <Text style={styles.label}>Gender</Text>
                          <Picker
                            selectedValue={formData.gender}
                            onValueChange={(itemValue) =>
                              setFormData({ ...formData, gender: itemValue })
                            }
                            style={[
                              styles.picker,
                              { color: "rgb(162,39,142)" },
                            ]}
                          >
                            <Picker.Item label="Select Gender" value="" />
                            <Picker.Item label="Male" value="male" />
                            <Picker.Item label="Female" value="female" />
                            <Picker.Item label="Other" value="other" />
                          </Picker>
                        </View>
                      </LinearGradient>
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.8)",
                          "rgba(236, 72, 153, 0.8)",
                        ]}
                        style={styles.inputGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.inputContainer}>
                          <Ionicons
                            name="map-outline"
                            size={24}
                            color="rgb(162,39,142)"
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Pincode"
                            placeholderTextColor="rgba(162,39,142,0.7)"
                            value={formData.pincode}
                            onChangeText={(text) => {
                              const cleaned = text
                                .replace(/\D/g, "")
                                .slice(0, 6);
                              setFormData({ ...formData, pincode: cleaned });
                              if (cleaned.length === 6) {
                                fetchAddressFromPincode(cleaned);
                              }
                            }}
                            keyboardType="numeric"
                            maxLength={6}
                          />
                        </View>
                      </LinearGradient>
                      {formData.district && formData.state && (
                        <>
                          <LinearGradient
                            colors={[
                              "rgba(139, 92, 246, 0.8)",
                              "rgba(236, 72, 153, 0.8)",
                            ]}
                            style={styles.inputGradientBorder}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <View style={styles.inputContainer}>
                              <Ionicons
                                name="business-outline"
                                size={24}
                                color="rgb(162,39,142)"
                                style={styles.inputIcon}
                              />
                              <TextInput
                                style={styles.input}
                                placeholder="District"
                                placeholderTextColor="rgba(162,39,142,0.7)"
                                value={formData.district}
                                editable={false}
                              />
                            </View>
                          </LinearGradient>
                          <LinearGradient
                            colors={[
                              "rgba(139, 92, 246, 0.8)",
                              "rgba(236, 72, 153, 0.8)",
                            ]}
                            style={styles.inputGradientBorder}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <View style={styles.inputContainer}>
                              <Ionicons
                                name="flag-outline"
                                size={24}
                                color="rgb(162,39,142)"
                                style={styles.inputIcon}
                              />
                              <TextInput
                                style={styles.input}
                                placeholder="State"
                                placeholderTextColor="rgba(162,39,142,0.7)"
                                value={formData.state}
                                editable={false}
                              />
                            </View>
                          </LinearGradient>
                        </>
                      )}
                    </>
                  )}
                  {formData.userType === "K-member" && (
                    <>
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.8)",
                          "rgba(236, 72, 153, 0.8)",
                        ]}
                        style={styles.inputGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.inputContainer}>
                          <Ionicons
                            name="card-outline"
                            size={24}
                            color="rgb(162,39,142)"
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Aadhar Number (12 digits)"
                            placeholderTextColor="rgba(162,39,142,0.7)"
                            value={formData.aadhar}
                            onChangeText={(text) => {
                              const cleaned = text
                                .replace(/\D/g, "")
                                .slice(0, 12);
                              setFormData({ ...formData, aadhar: cleaned });
                            }}
                            keyboardType="numeric"
                            maxLength={12}
                          />
                        </View>
                      </LinearGradient>
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.8)",
                          "rgba(236, 72, 153, 0.8)",
                        ]}
                        style={styles.uploadGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={handleDocumentUpload}
                          disabled={isLoading}
                        >
                          <Ionicons
                            name={
                              isLoading
                                ? "reload-outline"
                                : "cloud-upload-outline"
                            }
                            size={24}
                            color="rgb(162,39,142)"
                            style={[
                              styles.uploadIcon,
                              isLoading && styles.rotating,
                            ]}
                          />
                          <Text style={styles.uploadButtonText}>
                            {isLoading
                              ? "Uploading..."
                              : formData.documentUploaded
                              ? "Document Uploaded"
                              : "Upload Document"}
                          </Text>
                        </TouchableOpacity>
                      </LinearGradient>
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.8)",
                          "rgba(236, 72, 153, 0.8)",
                        ]}
                        style={styles.inputGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.inputContainer}>
                          <Ionicons
                            name="card-outline"
                            size={24}
                            color="rgb(162,39,142)"
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Ration Card Number (10 digits)"
                            placeholderTextColor="rgba(162,39,142,0.7)"
                            value={formData.rationCard}
                            onChangeText={(text) => {
                              const cleaned = text
                                .replace(/\D/g, "")
                                .slice(0, 10);
                              setFormData({ ...formData, rationCard: cleaned });
                            }}
                            keyboardType="numeric"
                            maxLength={10}
                          />
                        </View>
                      </LinearGradient>
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.8)",
                          "rgba(236, 72, 153, 0.8)",
                        ]}
                        style={styles.pickerGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.pickerContainer}>
                          <Text style={styles.label}>Economic Status</Text>
                          <Picker
                            selectedValue={formData.economicStatus}
                            onValueChange={(itemValue) =>
                              setFormData({
                                ...formData,
                                economicStatus: itemValue,
                                category: "",
                              })
                            }
                            style={[
                              styles.picker,
                              { color: "rgb(162,39,142)" },
                            ]}
                          >
                            <Picker.Item
                              label="Select Economic Status"
                              value=""
                            />
                            <Picker.Item label="APL" value="APL" />
                            <Picker.Item label="BPL" value="BPL" />
                          </Picker>
                        </View>
                      </LinearGradient>
                      {renderCategoryPicker()}
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.8)",
                          "rgba(236, 72, 153, 0.8)",
                        ]}
                        style={styles.inputGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.inputContainer}>
                          <Ionicons
                            name="business-outline"
                            size={24}
                            color="rgb(162,39,142)"
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Unit Number"
                            placeholderTextColor="rgba(162,39,142,0.7)"
                            value={formData.unitNumber}
                            onChangeText={(text) =>
                              setFormData({ ...formData, unitNumber: text })
                            }
                          />
                        </View>
                      </LinearGradient>
                    </>
                  )}
                  <View style={styles.photoUploadContainer}>
                    <LinearGradient
                      colors={[
                        "rgba(139, 92, 246, 0.8)",
                        "rgba(236, 72, 153, 0.8)",
                      ]}
                      style={styles.photoGradientBorder}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <TouchableOpacity
                        style={styles.photoUploadButton}
                        onPress={handleProfilePhotoUpload}
                        disabled={isPhotoUploading}
                      >
                        {formData.profilePhotoUrl ? (
                          <Image
                            source={{ uri: formData.profilePhotoUrl }}
                            style={styles.profilePhoto}
                          />
                        ) : (
                          <>
                            <Ionicons
                              name={
                                isPhotoUploading
                                  ? "reload-outline"
                                  : "camera-outline"
                              }
                              size={24}
                              color="rgb(162,39,142)"
                              style={[
                                styles.uploadIcon,
                                isPhotoUploading && styles.rotating,
                              ]}
                            />
                            <Text style={styles.photoUploadText}>
                              {isPhotoUploading
                                ? "Uploading..."
                                : "Add Profile Photo"}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                  <Pressable
                    style={[styles.button]}
                    onPress={handleSignUp}
                    disabled={isSubmitting}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(139, 92, 246, 1)",
                        "rgba(236, 72, 153, 1)",
                      ]}
                      style={[
                        styles.buttonGradient,
                        isSubmitting && styles.buttonDisabled,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>
                        {isSubmitting ? "Signing up..." : "Sign Up"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.linkText}>
                    Already have an account? Login
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    borderRadius: 20,
    padding: 1.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientBorder: {
    borderRadius: 18,
    padding: 2,
  },
  whiteBackground: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: "rgb(162,39,142)",
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  inputGradientBorder: {
    borderRadius: 25,
    padding: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
    color: "rgb(162,39,142)",
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
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
    color: "rgb(162,39,142)",
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
    backgroundColor: "white",
    borderRadius: 25,
    overflow: "hidden",
  },
  label: {
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
    fontSize: 16,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  picker: {
    color: "rgb(162,39,142)",
  },
  pickerGradientBorder: {
    borderRadius: 25,
    padding: 2,
    marginBottom: 15,
  },
  uploadGradientBorder: {
    borderRadius: 25,
    padding: 2,
  },
  uploadButton: {
    backgroundColor: "white",
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
    color: "rgb(162,39,142)",
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
    fontFamily: "Poppins_700Bold",
    color: "white",
    fontSize: 16,
  },
  linkText: {
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
    textAlign: "center",
    marginTop: 20,
    textDecorationLine: "underline",
  },
  rotating: {
    opacity: 0.7,
  },
  photoUploadContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoGradientBorder: {
    borderRadius: 80,
    padding: 2,
  },
  photoUploadButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
  },
  photoUploadText: {
    color: "rgb(162,39,142)",
    marginTop: 8,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
