import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation"
import Toast from 'react-native-toast-message'

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Login">

interface Props {
  navigation: LoginScreenNavigationProp
}

export default function LoginScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [animation] = useState(new Animated.Value(0))
  const [isPressed, setIsPressed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginButtonScale] = useState(new Animated.Value(1))

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

  const handleLogin = async () => {
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      showAlert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number."
      )
      return
    }

    try {
      setLoading(true)
      const db = getFirestore()
      const collections = ["K-member", "normal", "president"]
      let userData = null
      let userRole = ""

      for (const collectionName of collections) {
        const usersRef = collection(db, collectionName)
        const q = query(usersRef, where("phone", "==", phoneNumber))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          userData = querySnapshot.docs[0].data()
          userRole = collectionName
          break
        }
      }

      if (!userData) {
        showAlert(
          "User Not Found",
          "No account associated with this phone number."
        )
        return
      }

      if (userData.password !== password) {
        showAlert(
          "Incorrect Password",
          "Please enter the correct password."
        )
        return
      }

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome back!',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
      })

      // Navigate after a short delay to allow the toast to be visible
      setTimeout(() => {
        if (userRole === "president") {
          navigation.navigate("PresidentDashboard")
        } else if (userRole === "K-member") {
          if (userData.status === "approved") {
            navigation.navigate("KMemberTabs", { phoneNumber })
          } else if (userData.status === "pending") {
            navigation.navigate("WaitingApproval")
          } else {
            showAlert(
              "Access Denied",
              "Your application has been rejected."
            )
          }
        } else {
          navigation.navigate("NormalUserTabs", { phoneNumber })
        }
      }, 1000)
    } catch (error) {
      showAlert(
        "Login Failed",
        error.message
      )
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword", { phoneNumber })
  }

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  })

  const animateScale = (value: Animated.Value, toValue: number) => {
    Animated.timing(value, {
      toValue,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }

  const showAlert = (title: string, message: string) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: "OK",
          style: "default",
          onPress: () => setIsPressed(false)
        }
      ],
      {
        cancelable: true,
        onDismiss: () => setIsPressed(false)
      }
    )
  }

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
                <Text style={styles.title}>Welcome Back</Text>
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={24} color="rgb(162,39,142)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      placeholderTextColor="rgba(162,39,142,0.7)"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={24} color="rgb(162,39,142)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="rgba(162,39,142,0.7)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!passwordVisible}
                    />
                    <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
                      <Ionicons
                        name={passwordVisible ? "eye-outline" : "eye-off-outline"}
                        size={24}
                        color="rgb(162,39,142)"
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.buttonContainer}>
                    <Animated.View style={{ transform: [{ scale: loginButtonScale }] }}>
                      <Pressable
                        style={[styles.button]}
                        onPress={handleLogin}
                        onPressIn={() => animateScale(loginButtonScale, 0.95)}
                        onPressOut={() => animateScale(loginButtonScale, 1)}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={["rgba(139, 92, 246, 1)", "rgba(236, 72, 153, 1)"]}
                          style={[styles.buttonGradient, loading && styles.buttonDisabled]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  </View>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("Verification")}>
                  <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
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
  buttonContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    marginVertical: 5,
  },
  button: {
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 25,
  },
  buttonDisabled: {
    opacity: 0.3,
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
    color: "rgb(162,39,142)",
  },
})
