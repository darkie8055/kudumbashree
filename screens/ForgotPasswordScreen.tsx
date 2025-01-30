import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Modal,
  Alert,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../types/navigation"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, "ForgotPassword">
type ForgotPasswordScreenRouteProp = RouteProp<RootStackParamList, "ForgotPassword">

interface Props {
  navigation: ForgotPasswordScreenNavigationProp
  route: ForgotPasswordScreenRouteProp
}

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const { userType } = route.params
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [step, setStep] = useState(1)
  const [animation] = useState(new Animated.Value(0))
  const [passwordError, setPasswordError] = useState("")
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [newPasswordVisible, setNewPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [animation])

  const handleSendOTP = () => {
    // Here you would typically make an API call to send the OTP
    console.log("Sending OTP to", phone)
    setStep(2)
  }

  const handleVerifyOTP = () => {
    // Here you would typically verify the OTP with your backend
    console.log("Verifying OTP", otp)
    setStep(3)
  }

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match")
      return
    }
    setPasswordError("")
    // Here you would typically make an API call to reset the password
    console.log("Resetting password")
    setShowSuccessPopup(true)
  }

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  })

  if (!fontsLoaded) {
    return null
  }

  const renderPasswordInput = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string,
    isVisible: boolean,
    setIsVisible: React.Dispatch<React.SetStateAction<boolean>>,
  ) => (
    <View style={styles.inputContainer}>
      <Ionicons name="lock-closed-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.7)"
        value={value}
        onChangeText={(text) => {
          setValue(text)
          setPasswordError("")
        }}
        secureTextEntry={!isVisible}
      />
      <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={styles.eyeIcon}>
        <Ionicons name={isVisible ? "eye-outline" : "eye-off-outline"} size={24} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
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
        <Animated.View style={[styles.formContainer, { opacity: animation, transform: [{ translateY }] }]}>
          <Text style={styles.title}>Reset Password</Text>
          <View style={styles.form}>
            {step === 1 && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <View style={styles.phoneInputContainer}>
                    <Text style={styles.phonePrefix}>+91</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Phone Number"
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      value={phone}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, "").slice(0, 10)
                        setPhone(cleaned)
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
                  <Text style={styles.buttonText}>Send OTP</Text>
                </TouchableOpacity>
              </>
            )}
            {step === 2 && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={24}
                    color="rgba(255,255,255,0.7)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
                  <Text style={styles.buttonText}>Verify OTP</Text>
                </TouchableOpacity>
              </>
            )}
            {step === 3 && (
              <>
                {renderPasswordInput(
                  newPassword,
                  setNewPassword,
                  "New Password",
                  newPasswordVisible,
                  setNewPasswordVisible,
                )}
                {renderPasswordInput(
                  confirmPassword,
                  setConfirmPassword,
                  "Confirm New Password",
                  confirmPasswordVisible,
                  setConfirmPasswordVisible,
                )}
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                  <Text style={styles.buttonText}>Reset Password</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessPopup}
        onRequestClose={() => setShowSuccessPopup(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.modalText}>Password Reset Successful</Text>
            <TouchableOpacity
              style={[styles.button, styles.modalButton]}
              onPress={() => {
                setShowSuccessPopup(false)
                navigation.navigate("Login")
              }}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
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
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
    padding: 15,
  },
  button: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
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
  errorText: {
    fontFamily: "Poppins_400Regular",
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  modalButton: {
    marginTop: 10,
    paddingHorizontal: 30,
  },
  eyeIcon: {
    padding: 10,
  },
})

