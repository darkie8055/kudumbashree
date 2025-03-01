import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { format, addMonths } from "date-fns";
import { getFirestore, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";

type PayLoanDueScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "PayLoanDue">;
  route: RouteProp<RootStackParamList, "PayLoanDue">;
};

const getNextUnpaidMonth = (
  paidMonths: number[],
  totalMonths: number
): number | null => {
  for (let i = 1; i <= totalMonths; i++) {
    if (!paidMonths.includes(i)) {
      return i;
    }
  }
  return null;
};

export default function PayLoanDueScreen({
  route,
  navigation,
}: PayLoanDueScreenProps) {
  const { loanId, totalMonths, paidMonths, monthlyDue, loanType, startDate } =
    route.params;

  const nextUnpaidMonth = getNextUnpaidMonth(paidMonths, totalMonths);
  const [selectedMonth] = useState<number | null>(nextUnpaidMonth);

  const handlePayment = async () => {
    if (!selectedMonth) return;

    try {
      const db = getFirestore();
      await updateDoc(doc(db, "loanApplications", loanId), {
        paidMonths: arrayUnion(selectedMonth),
      });

      Alert.alert("Success", "Payment successful", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error processing payment:", error);
      Alert.alert("Error", "Payment failed");
    }
  };

  const getMonthName = (monthNumber: number) => {
    const date = addMonths(startDate, monthNumber - 1);
    return format(date, "MMMM yyyy");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Loan Due</Text>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.loanType}>{loanType.toUpperCase()} LOAN</Text>
          <Text style={styles.amount}>₹{monthlyDue}</Text>
          <Text style={styles.description}>Monthly Due Amount</Text>

          <Text style={styles.sectionTitle}>Current Due Month</Text>

          {nextUnpaidMonth ? (
            <View style={styles.currentMonthCard}>
              <Text style={styles.monthNumber}>Month {nextUnpaidMonth}</Text>
              <Text style={styles.monthName}>
                {getMonthName(nextUnpaidMonth)}
              </Text>
              <Text style={styles.dueAmount}>₹{monthlyDue}</Text>
            </View>
          ) : (
            <Text style={styles.completedText}>
              All monthly payments completed!
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.payButton,
              !nextUnpaidMonth && styles.payButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={!nextUnpaidMonth}
          >
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  content: {
    padding: 20,
  },
  loanType: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  amount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 4,
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 16,
  },
  currentMonthCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  monthNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 4,
  },
  monthName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  dueAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#8B5CF6",
    marginTop: 12,
  },
  completedText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#10B981",
    textAlign: "center",
    marginVertical: 24,
  },
  payButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  payButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  payButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
