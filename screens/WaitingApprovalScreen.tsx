import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../firebase"; // Update this import based on your config file
import { doc, onSnapshot } from "firebase/firestore";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";

type WaitingApprovalScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "WaitingApproval"
>;

type WaitingApprovalScreenRouteProp = RouteProp<
  RootStackParamList,
  "WaitingApproval"
>;

interface Props {
  navigation: WaitingApprovalScreenNavigationProp;
  route: WaitingApprovalScreenRouteProp;
}

export default function WaitingApprovalScreen({ route, navigation }: Props) {
  const { phone } = route.params || {};
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!phone) {
      Alert.alert("Error", "Phone number not found", [
        {
          text: "OK",
          onPress: () => navigation.replace("Login"),
        },
      ]);
      return;
    }

    // Initialize Firebase and get Firestore instance
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
      // Listen to real-time updates of the user's status
      const userRef = doc(db, "K-member", phone);
      const unsubscribe = onSnapshot(
        userRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            if (userData?.status === "approved") {
              Alert.alert(
                "Approved!",
                "Your registration has been approved. Please login to continue.",
                [
                  {
                    text: "OK",
                    onPress: () => navigation.replace("Login"),
                  },
                ]
              );
            } else if (userData?.status === "rejected") {
              Alert.alert(
                "Registration Rejected",
                "Your registration has been rejected. Please contact support for more information.",
                [
                  {
                    text: "OK",
                    onPress: () => navigation.replace("Login"),
                  },
                ]
              );
            }
          }
        },
        (error) => {
          console.error("Error listening to document:", error);
          Alert.alert(
            "Error",
            "Failed to check approval status. Please try again later.",
            [
              {
                text: "OK",
                onPress: () => navigation.replace("Login"),
              },
            ]
          );
        }
      );

      // Cleanup subscription
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up listener:", error);
      Alert.alert(
        "Error",
        "Failed to initialize approval check. Please try again later.",
        [
          {
            text: "OK",
            onPress: () => navigation.replace("Login"),
          },
        ]
      );
    }
  }, [phone, navigation]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#8B5CF6" />;
  }

  return (
    <LinearGradient
      colors={["#8B5CF6", "#EC4899"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator
            size="large"
            color="#ffffff"
            style={styles.animation}
          />
          <Text style={styles.title}>Waiting for Approval</Text>
          <Text style={styles.description}>
            Your registration is being reviewed by the Kudumbashree president.
            We'll notify you once it's approved.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  animation: {
    marginBottom: 20,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
});
