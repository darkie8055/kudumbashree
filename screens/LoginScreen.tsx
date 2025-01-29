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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Login">

interface Props {
  navigation: LoginScreenNavigationProp
}

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [animation] = useState(new Animated.Value(0))

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

  const handleLogin = () => {
    // Here you would typically verify the phone and password with your backend
    console.log("Logging in with", { phone, password })
    navigation.navigate("MainTabs")
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
      colors={["#8B5CF6", "#EC4899"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <Animated.View style={[styles.formContainer, { opacity: animation, transform: [{ translateY }] }]}>
            <Text style={styles.title}>Welcome Back</Text>
            <View style={styles.form}>
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
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
                  <Ionicons
                    name={passwordVisible ? "eye-outline" : "eye-off-outline"}
                    size={24}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  forgotPasswordText: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
  eyeIcon: {
    padding: 10,
  },
})

