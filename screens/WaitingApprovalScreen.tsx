import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { useFonts, Poppins_400Regular, Poppins_700Bold } from "@expo-google-fonts/poppins"
import { firebase } from "../firebase"
import { doc, onSnapshot } from "firebase/firestore"

export default function WaitingApprovalScreen({ route, navigation }) {
  const { phone } = route.params
  const [status, setStatus] = useState("pending")

  useEffect(() => {
    // Listen to real-time updates of the user's status
    const userRef = doc(firebase, "K-member", phone)
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data()
        if (userData.status === "approved") {
          Alert.alert(
            "Approved!",
            "Your registration has been approved. Please login to continue.",
            [
              {
                text: "OK",
                onPress: () => navigation.replace("Login")
              }
            ]
          )
        } else if (userData.status === "rejected") {
          Alert.alert(
            "Registration Rejected",
            "Your registration has been rejected. Please contact support for more information.",
            [
              {
                text: "OK",
                onPress: () => navigation.replace("Login")
              }
            ]
          )
        }
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
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
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#ffffff" style={styles.animation} />
          <Text style={styles.title}>Waiting for Approval</Text>
          <Text style={styles.description}>
            Your registration is being reviewed by the Kudumbashree president. We'll notify you once it's approved.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
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
})

