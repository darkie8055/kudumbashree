import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  getAuth,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "Warning: FirebaseRecaptcha: Support for defaultProps will be removed from function components in a future major release.",
  "Firebase: Error (auth/cancelled-popup-request).",
  "Firebase: Error (auth/popup-closed-by-user).",
  "Error: Cancelled by user.",
  "Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.",
]);

// Import your Firebase configuration
import { firebaseConfig } from "../firebase"; // Ensure you export this in firebase.js

const TEST_VERIFICATION_ID = "test-verification-id";

type VerificationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Verification"
>;

interface Props {
  navigation: VerificationScreenNavigationProp;
}

// Update recaptchaStyles
const recaptchaStyles = {
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  webview: {
    width: 300,
    height: 400,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden" as const,
  },
};

export default function VerificationScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [animation] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [recaptchaVisible, setRecaptchaVisible] = useState(false);
  const [sendButtonScale] = useState(new Animated.Value(1));
  const [verifyButtonScale] = useState(new Animated.Value(1));

  const recaptchaVerifier = useRef(null); // reCAPTCHA verifier reference

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

  // Send verification code
  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      const formattedPhoneNumber = "+91" + phoneNumber;

      // Simulate verification process
      setTimeout(() => {
        setVerificationId(TEST_VERIFICATION_ID);
        Alert.alert(
          "Success",
          "Verification code has been sent to your phone."
        );
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Error",
        "Failed to send verification code. Please try again."
      );
      setLoading(false);
    }
  };

  // Confirm OTP entered by user
  const confirmCode = async () => {
    try {
      setLoading(true);

      // Simulate verification - accept any 6-digit code
      if (code.length === 6) {
        setTimeout(() => {
          Alert.alert("Success", "Phone number verified successfully!", [
            {
              text: "Continue",
              onPress: () =>
                navigation.navigate("SignUp", { phoneNumber: phoneNumber }),
            },
          ]);
          setLoading(false);
        }, 1000);
      } else {
        Alert.alert("Error", "Please enter a 6-digit code.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Invalid verification code. Please try again.");
      setLoading(false);
    }
  };

  const animateScale = (scale: Animated.Value, value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 50,
      bounciness: 5,
    }).start();
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
      colors={["rgba(162,39,142,0.01)", "rgba(162,39,142,0.03)"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
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
                <Text style={styles.title}>Verify Phone</Text>
                <View style={styles.form}>
                  {!verificationId ? (
                    <>
                      <View style={styles.inputContainer}>
                        <View style={styles.prefixContainer}>
                          <Text style={styles.phonePrefix}>+91</Text>
                        </View>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter Phone Number"
                          placeholderTextColor="rgba(162,39,142,0.7)"
                          value={phoneNumber}
                          onChangeText={(text) => {
                            const cleaned = text
                              .replace(/\D/g, "")
                              .slice(0, 10);
                            setPhoneNumber(cleaned);
                          }}
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                      </View>
                      <View style={styles.buttonContainer}>
                        <Animated.View
                          style={{ transform: [{ scale: sendButtonScale }] }}
                        >
                          <Pressable
                            style={[
                              styles.button,
                              loading && styles.buttonDisabled,
                            ]}
                            onPress={sendVerificationCode}
                            onPressIn={() =>
                              animateScale(sendButtonScale, 0.95)
                            }
                            onPressOut={() => animateScale(sendButtonScale, 1)}
                            disabled={loading || phoneNumber.length !== 10}
                          >
                            <LinearGradient
                              colors={[
                                "rgba(139, 92, 246, 1)",
                                "rgba(236, 72, 153, 1)",
                              ]}
                              style={styles.buttonGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Text style={styles.buttonText}>
                                {loading
                                  ? "Sending..."
                                  : "Send Verification Code"}
                              </Text>
                            </LinearGradient>
                          </Pressable>
                        </Animated.View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[styles.input, styles.otpInput]}
                          placeholder="Enter OTP"
                          placeholderTextColor="rgba(162,39,142,0.7)"
                          value={code}
                          onChangeText={setCode}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                      <View style={styles.buttonContainer}>
                        <Animated.View
                          style={{ transform: [{ scale: verifyButtonScale }] }}
                        >
                          <Pressable
                            style={[
                              styles.button,
                              code.length !== 6 && styles.buttonDisabled,
                            ]}
                            onPress={confirmCode}
                            onPressIn={() =>
                              code.length === 6 &&
                              animateScale(verifyButtonScale, 0.95)
                            }
                            onPressOut={() =>
                              code.length === 6 &&
                              animateScale(verifyButtonScale, 1)
                            }
                            disabled={loading || code.length !== 6}
                          >
                            <LinearGradient
                              colors={[
                                "rgba(139, 92, 246, 1)",
                                "rgba(236, 72, 153, 1)",
                              ]}
                              style={styles.buttonGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Text style={styles.buttonText}>
                                {loading
                                  ? "Verifying..."
                                  : code.length === 6
                                  ? "Verify Code"
                                  : `Enter ${6 - code.length} more digit${
                                      6 - code.length === 1 ? "" : "s"
                                    }`}
                              </Text>
                            </LinearGradient>
                          </Pressable>
                        </Animated.View>
                      </View>
                      <TouchableOpacity
                        style={styles.resendButton}
                        onPress={() => {
                          setVerificationId("");
                          setCode("");
                        }}
                      >
                        <Text style={styles.resendText}>Resend Code</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.linkText}>
                    Already have an account? Login
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  prefixContainer: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "rgba(162,39,142,0.2)",
  },
  phonePrefix: {
    fontFamily: "Poppins_600SemiBold",
    color: "rgb(162,39,142)",
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
    fontSize: 16,
    padding: 15,
  },
  otpInput: {
    textAlign: "center",
    letterSpacing: 8,
  },
  buttonContainer: {
    borderRadius: 25,
    overflow: "hidden",
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
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 25,
  },
  buttonText: {
    fontFamily: "Poppins_700Bold",
    color: "white",
    fontSize: 16,
  },
  resendButton: {
    alignItems: "center",
    padding: 8,
  },
  resendText: {
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  linkText: {
    fontFamily: "Poppins_400Regular",
    color: "rgb(162,39,142)",
    textAlign: "center",
    marginTop: 20,
    textDecorationLine: "underline",
  },
});
