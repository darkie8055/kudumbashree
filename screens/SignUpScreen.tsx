import React, { useState, useEffect } from "react"
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
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { LinearGradient } from "expo-linear-gradient"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation"
import { Ionicons } from "@expo/vector-icons"

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, "SignUp">

interface Props {
  navigation: SignUpScreenNavigationProp
}

export default function SignUpScreen({ navigation }: Props) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    address: "",
    aadhar: "",
    rationCard: "",
    economicStatus: "",
    category: "",
    documentUploaded: false,
  })

  const [animation] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [animation]) // Added animation to dependencies

  const handleDocumentUpload = () => {
    setFormData({ ...formData, documentUploaded: true })
  }

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
            <Picker.Item label="Ezhava" value="Ezhava" />
            <Picker.Item label="OBC" value="OBC" />
          </Picker>
        </View>
      )
    }
    return null
  }

  const handleSignUp = () => {
    if (formData.aadhar.length !== 12) {
      alert("Aadhar number must be 12 digits")
      return
    }
    if (formData.rationCard.length !== 10) {
      alert("Ration Card number must be 10 digits")
      return
    }
    // Proceed with sign up
    console.log("Sign Up", formData)
  }

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  })

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
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone Number"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={formData.phone}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/\D/g, "").slice(0, 10)
                      setFormData({ ...formData, phone: cleaned })
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
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
                  onValueChange={(itemValue) => setFormData({ ...formData, economicStatus: itemValue, category: "" })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Economic Status" value="" />
                  <Picker.Item label="APL" value="APL" />
                  <Picker.Item label="BPL" value="BPL" />
                </Picker>
              </View>
              {renderCategoryPicker()}
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
  )
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
    fontSize: 32,
    fontWeight: "bold",
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
    color: "white",
    fontSize: 16,
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
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
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },
})

