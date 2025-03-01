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

interface LoanSummary {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  completedMonths: number;
  remainingMonths: number;
  progress: number;
}

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

  const [loanDetails, setLoanDetails] = useState<LoanSummary>({
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    completedMonths: 0,
    remainingMonths: 0,
    progress: 0,
  });

  useEffect(() => {
    calculateLoanSummary();
  }, [paidMonths]);

  const calculateLoanSummary = () => {
    const completedMonths = paidMonths.length;
    const remainingMonths = totalMonths - completedMonths;
    const totalAmount = monthlyDue * totalMonths;
    const paidAmount = monthlyDue * completedMonths;
    const remainingAmount = monthlyDue * remainingMonths;
    const progress = (completedMonths / totalMonths) * 100;

    setLoanDetails({
      totalAmount,
      paidAmount,
      remainingAmount,
      completedMonths,
      remainingMonths,
      progress,
    });
  };

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

          {/* Loan Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>
                  ₹{loanDetails.totalAmount}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Monthly Due</Text>
                <Text style={styles.summaryValue}>₹{monthlyDue}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${loanDetails.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {loanDetails.progress.toFixed(0)}% Complete
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Paid Amount</Text>
                <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                  ₹{loanDetails.paidAmount}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
                  ₹{loanDetails.remainingAmount}
                </Text>
              </View>
            </View>

            <View style={styles.monthsContainer}>
              <Text style={styles.monthsText}>
                {loanDetails.completedMonths} of {totalMonths} months paid
              </Text>
              <Text style={styles.monthsRemaining}>
                {loanDetails.remainingMonths} months remaining
              </Text>
            </View>
          </View>

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

          {/* Payment History */}
          <Text style={styles.sectionTitle}>Payment History</Text>
          <View style={styles.historyContainer}>
            {Array.from({ length: totalMonths }, (_, i) => i + 1).map(
              (month) => (
                <View
                  key={month}
                  style={[
                    styles.monthIndicator,
                    paidMonths.includes(month) && styles.monthPaid,
                  ]}
                >
                  <Text style={styles.monthNumber}>{month}</Text>
                  <Text style={styles.monthLabel}>
                    {format(addMonths(startDate, month - 1), "MMM")}
                  </Text>
                </View>
              )
            )}
          </View>
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
  summaryCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#1F2937",
  },
  progressBarContainer: {
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 4,
  },
  progressText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  monthsContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  monthsText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 4,
  },
  monthsRemaining: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  historyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 12,
  },
  monthIndicator: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  monthPaid: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  monthLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
});
