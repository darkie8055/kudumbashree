import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { createStackNavigator } from "@react-navigation/stack"
import { LinearGradient } from "expo-linear-gradient"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation"

// Importing screens
import SavingsScreen from "./SavingsScreen"
import LoanScreen from "./LoanScreen"
import BalanceScreen from "./BalanceScreen"
import PendingScreen from "./PendingScreen"
import LinkageLoanScreen from "./LinkageLoanScreen"
import ApplyLoanScreen from "./ApplyLoanScreen"
import PayPendingLoanScreen from "./PayPendingLoanScreen"
import PayWeeklyDueScreen from "./PayWeeklyDueScreen"

const Stack = createStackNavigator<RootStackParamList>()

type MainDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, "MainDetails">

interface MainDetailsScreenProps {
  navigation: MainDetailsScreenNavigationProp
}

// Main Screen Component
function MainDetailsScreen({ navigation }: MainDetailsScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Heading */}
      <Text style={styles.pageHeading}>UNIT NAME</Text>

      {/* Grid Section above View */}
      <View style={styles.topGridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.topGridItem}>
            <Text style={styles.gridText}>President</Text>
          </View>
          <View style={styles.topGridItem}>
            <Text style={styles.gridText}>Secretary</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.topGridItem}>
            <Text style={styles.gridText}>Samatheeka</Text>
          </View>
          <View style={styles.topGridItem}>
            <Text style={styles.gridText}>Adisthana</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.topGridItem}>
            <Text style={styles.gridText}>Vidyabhyasa</Text>
          </View>
          <View style={styles.topGridItem}>
            <Text style={styles.gridText}>Upjeevana</Text>
          </View>
        </View>
      </View>

      {/* View Section */}
      <Text style={styles.subHeading}>View</Text>

      {/* Gradient Button Container */}
      <LinearGradient
        colors={["rgba(129, 69, 155, 0.7)", "rgba(166, 223, 184, 0.7)"]}
        start={[0.1, 0.1]}
        end={[1, 1]}
        style={styles.buttonContainer}
      >
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Savings")}>
          <Text style={styles.buttonText}>
            Savings {"\u2197"} {/* Top-right arrow */}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Loan")}>
          <Text style={styles.buttonText}>Loan {"\u2197"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Balance")}>
          <Text style={styles.buttonText}>Balance {"\u2197"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Pending")}>
          <Text style={styles.buttonText}>Pending {"\u2197"}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Linkage Loan Section */}
      <TouchableOpacity onPress={() => navigation.navigate("LinkageLoan")}>
        <Text style={[styles.subHeading, styles.clickableSubHeading]}>Linkage Loan {"\u2197"}</Text>
      </TouchableOpacity>
      <View style={styles.bottomGridContainer}>
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.bottomGridItem} onPress={() => navigation.navigate("ApplyLoan")}>
            <Text style={styles.gridText}>Apply for New Loan {"\u2197"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomGridItem} onPress={() => navigation.navigate("PayPendingLoan")}>
            <Text style={styles.gridText}>Pay Pending Loans {"\u2197"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.bottomGridItem} onPress={() => navigation.navigate("PayWeeklyDue")}>
            <Text style={styles.gridText}>Pay Weekly Due {"\u2197"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

// Main Navigator for all screens
export default function KudumbashreeDetailsScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainDetails"
        component={MainDetailsScreen}
        options={{ headerShown: false }} // Hide header for main details screen
      />
      <Stack.Screen name="Savings" component={SavingsScreen} />
      <Stack.Screen name="Loan" component={LoanScreen} />
      <Stack.Screen name="Balance" component={BalanceScreen} />
      <Stack.Screen name="Pending" component={PendingScreen} />
      <Stack.Screen name="LinkageLoan" component={LinkageLoanScreen} />
      <Stack.Screen name="ApplyLoan" component={ApplyLoanScreen} />
      <Stack.Screen name="PayPendingLoan" component={PayPendingLoanScreen} />
      <Stack.Screen name="PayWeeklyDue" component={PayWeeklyDueScreen} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
  pageHeading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginVertical: 20,
  },
  // Styles for the top grid (above View heading)
  topGridContainer: {
    marginBottom: 20,
    borderWidth: 1,
    marginRight: 15,
    marginLeft: 15,
  },
  gridRow: {
    flexDirection: "row",
  },
  topGridItem: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 14,
    borderWidth: 1,
    borderColor: "#000", // Light border color to make items distinct
  },

  // Styles for the bottom grid (below Linkage Loan heading)
  bottomGridContainer: {
    marginBottom: 20,
  },
  bottomGridItem: {
    flex: 1,
    backgroundColor: "#fff", // Different background color for bottom grid
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
    borderWidth: 1,
  },

  // Common styles for grid items and text
  gridText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },

  // Styles for headings and buttons
  subHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginVertical: 10,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  clickableSubHeading: {
    textDecorationLine: "underline",
  },
  buttonContainer: {
    marginBottom: 20,
    padding: 8,
    borderWidth: 1,
    paddingTop: 16,
    marginRight: 10,
    marginLeft: 10,
  },
  button: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
})

