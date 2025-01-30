import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

export default function KMDashboardScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Kudumbashree Member Dashboard</Text>
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.card}>
              <Ionicons name="wallet-outline" size={40} color="#8B5CF6" />
              <Text style={styles.cardTitle}>View Balance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card}>
              <Ionicons name="cash-outline" size={40} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Pay Dues</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card}>
              <Ionicons name="document-text-outline" size={40} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Apply for Loan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card}>
              <Ionicons name="calendar-outline" size={40} color="#8B5CF6" />
              <Text style={styles.cardTitle}>View Meetings</Text>
            </TouchableOpacity>
          </View>
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
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "white",
    textAlign: "center",
    marginBottom: 30,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
})

