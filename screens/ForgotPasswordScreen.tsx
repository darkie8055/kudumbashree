import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  LogBox,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../types/navigation"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"
import { getAuth, PhoneAuthProvider, signInWithCredential } from "firebase/auth"
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha"
import { firebaseConfig } from "../firebase"

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, "ForgotPassword">
type ForgotPasswordScreenRouteProp = RouteProp<RootStackParamList, "ForgotPassword">

interface Props {
  navigation: ForgotPasswordScreenNavigationProp
  route: ForgotPasswordScreenRouteProp
}

LogBox.ignoreLogs([
  "Warning: FirebaseRecaptcha: Support for defaultProps will be removed from function components in a future major release.",
  "Firebase: Error (auth/cancelled-popup-request).",
  "Firebase: Error (auth/popup-closed-by-user).",
  "Error: Cancelled by user.",
  "Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification."
])

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params
  const [phone, setPhone] = useState(phoneNumber || "")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [step, setStep] = useState(1)
  const [animation] = useState(new Animated.Value(0))
  const [passwordError, setPasswordError] = useState("")
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [newPasswordVisible, setNewPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [verificationId, setVerificationId] = useState("")
  const [loading, setLoading] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const recaptchaVerifier = useRef(null)

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

  const handleSendOTP = async () => {
    try {
      setLoading(true)
      const auth = getAuth()
      const phoneProvider = new PhoneAuthProvider(auth)
      const formattedPhoneNumber = "+91" + phone

      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedPhoneNumber,
        recaptchaVerifier.current
      )
      setVerificationId(verificationId)
      Alert.alert("Success", "Verification code has been sent to your phone.")
      setStep(2)
    } catch (err: any) {
      if (
        err?.message === "Cancelled by user" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.code === "auth/popup-closed-by-user"
      ) {
        Alert.alert("Cancelled", "Verification was cancelled. Please try again.")
      } else {
        console.error(err)
        Alert.alert("Error", "Failed to send verification code. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    try {
      setLoading(true)
      const auth = getAuth()
      const credential = PhoneAuthProvider.credential(verificationId, otp)
      await signInWithCredential(auth, credential)
      setStep(3)
    } catch (err) {
      console.error(err)
      Alert.alert("Error", "Invalid verification code. Please try again.")
    } finally {
      setLoading(false)
    }
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

  return (
    <LinearGradient
      colors={[
        isPressed ? "rgba(162,39,142,0.03)" : "rgba(162,39,142,0.01)", 
        isPressed ? "rgba(162,39,142,0.08)" : "rgba(162,39,142,0.03)"
      ]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <Animated.View style={[styles.formContainer, { opacity: animation, transform: [{ translateY }] }]}>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.8)", "rgba(236, 72, 153, 0.8)"]}
              style={styles.gradientBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.whiteBackground}>
                <Text style={styles.title}>Reset Password</Text>
                <View style={styles.form}>
                  {step === 1 && (
                    <>
                      <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={24} color="rgb(162,39,142)" style={styles.inputIcon} />
                        <Text style={[styles.phonePrefix, { color: "rgb(162,39,142)" }]}>+91</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Phone Number"
                          placeholderTextColor="rgba(162,39,142,0.7)"
                          value={phone}
                          onChangeText={(text) => {
                            const cleaned = text.replace(/\D/g, "").slice(0, 10)
                            setPhone(cleaned)
                          }}
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                      </View>
                      <View style={styles.buttonContainer}>
                        <LinearGradient
                          colors={["rgba(139, 92, 246, 0.8)", "rgba(236, 72, 153, 0.8)"]}
                          style={styles.buttonGradientBorder}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <TouchableOpacity 
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSendOTP}
                            disabled={loading || phone.length !== 10}
                          >
                            <Text style={styles.buttonText}>{loading ? "Sending..." : "Send OTP"}</Text>
                          </TouchableOpacity>
                        </LinearGradient>
                      </View>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <View style={styles.inputContainer}>
                        <Ionicons name="key-outline" size={24} color="rgb(162,39,142)" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter OTP"
                          placeholderTextColor="rgba(162,39,142,0.7)"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="numeric"
                          maxLength={6}
                        />
                      </View>
                      <View style={styles.buttonContainer}>
                        <LinearGradient
                          colors={["rgba(139, 92, 246, 0.8)", "rgba(236, 72, 153, 0.8)"]}
                          style={styles.buttonGradientBorder}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <TouchableOpacity 
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleVerifyOTP}
                            disabled={loading || otp.length !== 6}
                          >
                            <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify OTP"}</Text>
                          </TouchableOpacity>
                        </LinearGradient>
                      </View>
                      <TouchableOpacity onPress={() => {
                        setOtp("")
                        setStep(1)
                      }}>
                        <Text style={styles.forgotPasswordText}>Resend Code</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={24} color="rgb(162,39,142)" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="New Password"
                          placeholderTextColor="rgba(162,39,142,0.7)"
                          value={newPassword}
                          onChangeText={(text) => {
                            setNewPassword(text)
                            setPasswordError("")
                          }}
                          secureTextEntry={!newPasswordVisible}
                        />
                        <TouchableOpacity onPress={() => setNewPasswordVisible(!newPasswordVisible)} style={styles.eyeIcon}>
                          <Ionicons
                            name={newPasswordVisible ? "eye-outline" : "eye-off-outline"}
                            size={24}
                            color="rgb(162,39,142)"
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={24} color="rgb(162,39,142)" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Confirm New Password"
                          placeholderTextColor="rgba(162,39,142,0.7)"
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text)
                            setPasswordError("")
                          }}
                          secureTextEntry={!confirmPasswordVisible}
                        />
                        <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.eyeIcon}>
                          <Ionicons
                            name={confirmPasswordVisible ? "eye-outline" : "eye-off-outline"}
                            size={24}
                            color="rgb(162,39,142)"
                          />
                        </TouchableOpacity>
                      </View>
                      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                      <View style={styles.buttonContainer}>
                        <LinearGradient
                          colors={["rgba(139, 92, 246, 0.8)", "rgba(236, 72, 153, 0.8)"]}
                          style={styles.buttonGradientBorder}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <TouchableOpacity 
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={loading}
                          >
                            <Text style={styles.buttonText}>Reset Password</Text>
                          </TouchableOpacity>
                        </LinearGradient>
                      </View>
                    </>
                  )}
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.linkText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={false}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessPopup}
        onRequestClose={() => setShowSuccessPopup(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name="checkmark-circle" size={60} color="rgb(162,39,142)" />
            <Text style={styles.modalText}>Password Reset Successful</Text>
            <View style={styles.buttonContainer}>
              <LinearGradient
                colors={["rgba(139, 92, 246, 0.8)", "rgba(236, 72, 153, 0.8)"]}
                style={styles.buttonGradientBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity
                  style={[styles.button, styles.modalButton]}
                  onPress={() => {
                    setShowSuccessPopup(false)
                    navigation.navigate("Login")
                  }}
                >
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
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
    marginHorizontal: 20,
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
    backgroundColor: 'white',
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  phonePrefix: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
    fontSize: 16,
    padding: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  buttonContainer: {
    padding: 1.5,
    borderRadius: 25,
  },
  buttonGradientBorder: {
    borderRadius: 25,
    padding: 2,
  },
  button: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 22,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: "Poppins_700Bold",
    color: "rgb(162,39,142)",
    fontSize: 16,
  },
  linkText: {
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
    textAlign: "center",
    marginTop: 20,
    textDecorationLine: "underline",
  },
  forgotPasswordText: {
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
  eyeIcon: {
    padding: 10,
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
    margin: 20,
  },
  modalText: {
    fontFamily: "Poppins_600SemiBold",
    color: "rgb(162,39,142)",
    fontSize: 18,
    marginVertical: 16,
    textAlign: "center",
  },
  modalButton: {
    width: "100%",
    marginTop: 16,
  },
})

