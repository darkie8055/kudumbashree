import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { createStackNavigator } from "@react-navigation/stack"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../types/navigation"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

// Importing screens (unchanged)
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

const { width } = Dimensions.get("window")
const ITEM_WIDTH = width * 0.44

function MainDetailsScreen({ navigation }: MainDetailsScreenProps) {
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
      useNativeDriver: true,
    }).start()
  }, [animation])

  if (!fontsLoaded) {
    return null
  }

  const fadeIn = {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.header}>
          <Text style={styles.pageHeading}>UNIT NAME</Text>
        </LinearGradient>

        <Animated.View style={fadeIn}>
          {/* Quick Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate("Savings")}>
                <Ionicons name="wallet-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Savings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate("Loan")}>
                <Ionicons name="cash-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Loan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate("Balance")}>
                <Ionicons name="bar-chart-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Balance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate("Pending")}>
                <Ionicons name="hourglass-outline" size={24} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Pending</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Unit Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Unit Details</Text>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
              style={styles.detailsContainer}
            >
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={20} color="#8B5CF6" style={styles.detailIcon} />
                <Text style={styles.detailText}>President</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={20} color="#8B5CF6" style={styles.detailIcon} />
                <Text style={styles.detailText}>Secretary</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="book-outline" size={20} color="#8B5CF6" style={styles.detailIcon} />
                <Text style={styles.detailText}>Samatheeka</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={20} color="#8B5CF6" style={styles.detailIcon} />
                <Text style={styles.detailText}>Adisthana</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="school-outline" size={20} color="#8B5CF6" style={styles.detailIcon} />
                <Text style={styles.detailText}>Vidyabhyasa</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="leaf-outline" size={20} color="#8B5CF6" style={styles.detailIcon} />
                <Text style={styles.detailText}>Upjeevana</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Linkage Loan Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Linkage Loan</Text>
            <TouchableOpacity style={styles.linkageLoanButton} onPress={() => navigation.navigate("LinkageLoan")}>
              <Ionicons name="link-outline" size={24} color="#8B5CF6" />
              <Text style={styles.linkageLoanText}>View Linkage Loan Details</Text>
            </TouchableOpacity>
          </View>

          {/* Loan Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Loan Actions</Text>
            <View style={styles.loanActionsContainer}>
              <TouchableOpacity style={styles.loanActionItem} onPress={() => navigation.navigate("ApplyLoan")}>
                <Ionicons name="add-circle-outline" size={24} color="#8B5CF6" />
                <Text style={styles.loanActionText}>Apply for New Loan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.loanActionItem} onPress={() => navigation.navigate("PayPendingLoan")}>
                <Ionicons name="card-outline" size={24} color="#8B5CF6" />
                <Text style={styles.loanActionText}>Pay Pending Loans</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.loanActionItem} onPress={() => navigation.navigate("PayWeeklyDue")}>
                <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
                <Text style={styles.loanActionText}>Pay Weekly Due</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Main Navigator for all screens (unchanged)
export default function KudumbashreeDetailsScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainDetails" component={MainDetailsScreen} options={{ headerShown: false }} />
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
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pageHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  quickActionItem: {
    width: ITEM_WIDTH,
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontFamily: "Poppins_400Regular",
    marginTop: 5,
    color: "#4B5563",
  },
  detailsContainer: {
    padding: 15,
    borderRadius: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    flex: 1,
  },
  linkageLoanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkageLoanText: {
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginLeft: 10,
  },
  loanActionsContainer: {
    flexDirection: "column",
  },
  loanActionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loanActionText: {
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginLeft: 10,
  },
})

