import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { format, addMonths } from "date-fns";
import { getFirestore, doc, updateDoc, arrayUnion } from "firebase/firestore";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
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
  const [refreshing, setRefreshing] = useState(false);

  const [loanDetails, setLoanDetails] = useState<LoanSummary>({
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    completedMonths: 0,
    remainingMonths: 0,
    progress: 0,
  });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
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

  const onRefresh = () => {
    setRefreshing(true);
    calculateLoanSummary();
    setRefreshing(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loanInfoCard}>
          <View style={styles.loanTypeContainer}>
            <View style={styles.loanIconContainer}>
              <Ionicons
                name={
                  loanType.toLowerCase().includes("personal")
                    ? "person-outline"
                    : "business-outline"
                }
                size={22}
                color="#8B5CF6"
              />
            </View>
            <Text style={styles.loanType}>{loanType.toUpperCase()} LOAN</Text>
          </View>

          <View style={styles.loanInfoDivider} />

          <View style={styles.loanIdContainer}>
            <Text style={styles.loanIdLabel}>Loan ID</Text>
            <Text style={styles.loanIdValue}>{loanId.substring(0, 8)}...</Text>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.progressCard}>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircleOuter}>
              <View style={styles.progressCircleInner}>
                <Text style={styles.progressPercentage}>
                  {loanDetails.progress.toFixed(0)}%
                </Text>
                <Text style={styles.progressLabel}>Complete</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressDetails}>
            <View style={styles.progressDetailRow}>
              <View style={styles.progressDetailItem}>
                <Text style={styles.progressDetailLabel}>Total Months</Text>
                <Text style={styles.progressDetailValue}>{totalMonths}</Text>
              </View>
              <View style={styles.progressDetailItem}>
                <Text style={styles.progressDetailLabel}>Paid Months</Text>
                <Text style={styles.progressDetailValue}>
                  {paidMonths.length}
                </Text>
              </View>
            </View>
            <View style={styles.progressDetailRow}>
              <View style={styles.progressDetailItem}>
                <Text style={styles.progressDetailLabel}>Remaining</Text>
                <Text style={styles.progressDetailValue}>
                  {totalMonths - paidMonths.length}
                </Text>
              </View>
              <View style={styles.progressDetailItem}>
                <Text style={styles.progressDetailLabel}>Monthly Due</Text>
                <Text style={styles.progressDetailValue}>₹{monthlyDue}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialSummaryCard}>
          <Text style={styles.cardTitle}>Payment Summary</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="cash-outline" size={18} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>
                  ₹{loanDetails.totalAmount}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View
                style={[
                  styles.summaryIconContainer,
                  { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#10B981"
                />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Paid Amount</Text>
                <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                  ₹{loanDetails.paidAmount}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View
                style={[
                  styles.summaryIconContainer,
                  { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#EF4444"
                />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
                  ₹{loanDetails.remainingAmount}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View
                style={[
                  styles.summaryIconContainer,
                  { backgroundColor: "rgba(59, 130, 246, 0.1)" },
                ]}
              >
                <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Loan End Date</Text>
                <Text style={styles.summaryValue}>
                  {format(addMonths(startDate, totalMonths), "MMM yyyy")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current Due Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Due Month</Text>

          {nextUnpaidMonth ? (
            <View style={styles.currentMonthCard}>
              <View style={styles.currentMonthHeader}>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthBadgeText}>
                    Month {nextUnpaidMonth}
                  </Text>
                </View>
                <View style={styles.dueDateContainer}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.dueDateText}>
                    {getMonthName(nextUnpaidMonth)}
                  </Text>
                </View>
              </View>

              <View style={styles.currentMonthContent}>
                <Text style={styles.currentMonthLabel}>Amount Due</Text>
                <Text style={styles.dueAmount}>₹{monthlyDue}</Text>

                <TouchableOpacity
                  style={styles.payButton}
                  onPress={handlePayment}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.completedContainer}>
              <View style={styles.completedIconContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.completedText}>
                All monthly payments completed!
              </Text>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.viewDetailsText}>Back to Loans</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <View style={styles.historyContainer}>
            {Array.from({ length: totalMonths }, (_, i) => i + 1).map(
              (month) => (
                <View
                  key={month}
                  style={[
                    styles.monthIndicator,
                    paidMonths.includes(month) && styles.monthPaid,
                    month === nextUnpaidMonth && styles.monthCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.monthNumber,
                      paidMonths.includes(month) && styles.monthPaidText,
                      month === nextUnpaidMonth && styles.monthCurrentText,
                    ]}
                  >
                    {month}
                  </Text>
                  <Text
                    style={[
                      styles.monthLabel,
                      paidMonths.includes(month) && styles.monthPaidText,
                      month === nextUnpaidMonth && styles.monthCurrentText,
                    ]}
                  >
                    {format(addMonths(startDate, month - 1), "MMM")}
                  </Text>
                  {paidMonths.includes(month) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#10B981"
                      style={styles.paidIcon}
                    />
                  )}
                  {month === nextUnpaidMonth && !paidMonths.includes(month) && (
                    <Ionicons
                      name="time"
                      size={14}
                      color="#8B5CF6"
                      style={styles.paidIcon}
                    />
                  )}
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
    backgroundColor: "#f5f7fa",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
  },
  loanInfoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loanTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  loanIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  loanType: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#4B5563",
    letterSpacing: 0.5,
  },
  loanInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  loanIdContainer: {
    alignItems: "center",
  },
  loanIdLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  loanIdValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#8B5CF6",
  },
  progressCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressCircleContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  progressCircleOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 8,
    borderColor: "#8B5CF6",
  },
  progressCircleInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#8B5CF6",
  },
  progressLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#6B7280",
  },
  progressDetails: {
    flex: 1,
    justifyContent: "center",
  },
  progressDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressDetailItem: {
    flex: 1,
  },
  progressDetailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  progressDetailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
  },
  financialSummaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 16,
  },
  currentMonthCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  currentMonthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  monthBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  monthBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDateText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
  },
  currentMonthContent: {
    padding: 16,
    alignItems: "center",
  },
  currentMonthLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  dueAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#1F2937",
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 2,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: "100%",
  },
  buttonIcon: {
    marginRight: 8,
  },
  payButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  completedContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  completedText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#10B981",
    textAlign: "center",
    marginBottom: 20,
  },
  viewDetailsButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  viewDetailsText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#10B981",
  },
  historyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  monthIndicator: {
    width: 52,
    height: 62,
    margin: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  monthPaid: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  monthCurrent: {
    backgroundColor: "#EDE9FE",
    borderColor: "#8B5CF6",
    borderWidth: 2,
  },
  monthNumber: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 2,
  },
  monthPaidText: {
    color: "#10B981",
  },
  monthCurrentText: {
    color: "#8B5CF6",
  },
  monthLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#6B7280",
  },
  paidIcon: {
    position: "absolute",
    top: 6,
    right: 6,
  },
});
