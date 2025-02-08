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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { getAuth, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  "Warning: FirebaseRecaptcha: Support for defaultProps will be removed from function components in a future major release.",
  "Firebase: Error (auth/cancelled-popup-request).",
  "Firebase: Error (auth/popup-closed-by-user).",
  "Error: Cancelled by user.",
  "Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification."
]);

// Import your Firebase configuration
import { firebaseConfig } from "../firebase"; // Ensure you export this in firebase.js

type VerificationScreenNavigationProp = StackNavigationProp<RootStackParamList, "Verification">;

interface Props {
  navigation: VerificationScreenNavigationProp;
}

// Update recaptchaStyles
const recaptchaStyles = {
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  webview: {
    width: 300,
    height: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
};

export default function VerificationScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [animation] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [recaptchaVisible, setRecaptchaVisible] = useState(false);

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
      const auth = getAuth();
      const phoneProvider = new PhoneAuthProvider(auth);
      const formattedPhoneNumber = "+91" + phoneNumber;

      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedPhoneNumber,
        recaptchaVerifier.current
      );
      setVerificationId(verificationId);
      Alert.alert("Success", "Verification code has been sent to your phone.");
    } catch (err: any) {
      // Don't log the error but show the alert
      if (err?.message === 'Cancelled by user' || 
          err?.code === 'auth/cancelled-popup-request' || 
          err?.code === 'auth/popup-closed-by-user') {
        Alert.alert("Cancelled", "Verification was cancelled. Please try again.");
      } else {
        console.error(err);
        Alert.alert("Error", "Failed to send verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Confirm OTP entered by user
  const confirmCode = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential); // Correct usage of signInWithCredential
      Alert.alert("Success", "Phone number verified successfully!", [
        {
          text: "Continue",
          onPress: () => navigation.navigate("SignUp", { phoneNumber }), // Pass phoneNumber to SignUp screen
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
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
    <>
      <LinearGradient
        colors={["#8B5CF6", "#EC4899"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <Animated.View style={[styles.formContainer, { opacity: animation, transform: [{ translateY }] }]}>
              <Text style={styles.title}>Verify Phone</Text>
              <View style={styles.form}>
                {!verificationId ? (
                  <>
                    <View style={styles.phoneInputContainer}>
                      <Text style={styles.phonePrefix}>+91</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Enter Phone Number"
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={phoneNumber}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/\D/g, "").slice(0, 10);
                          setPhoneNumber(cleaned);
                        }}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={sendVerificationCode}
                      disabled={loading || phoneNumber.length !== 10}
                    >
                      <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Verification Code"}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.otpContainer}>
                      <TextInput
                        style={styles.otpInput}
                        placeholder="Enter OTP"
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={confirmCode}
                      disabled={loading || code.length !== 6}
                    >
                      <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify Code"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setVerificationId("");
                      setCode("");
                    }}>
                      <Text style={styles.resendText}>Resend Code</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.linkText}>Already have an account? Login</Text>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={false}
      />
    </>
  );
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
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  phonePrefix: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
    padding: 15,
  },
  phoneInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
    padding: 15,
  },
  otpContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  otpInput: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    fontSize: 16,
    padding: 15,
    textAlign: "center",
    letterSpacing: 5,
  },
  button: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
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
  resendText: {
    fontFamily: "Poppins_400Regular",
    color: "white",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  recaptchaTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "white",
    textAlign: "center",
    marginBottom: 15,
  },
});
