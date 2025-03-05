import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

const INITIAL_BALANCE = 20000;

interface ActiveLoan {
  id: string;
  memberName: string;
  loanType: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidMonths: number;
  totalMonths: number;
  createdAt: Date;
  unitId: string;
}

interface BalanceState {
  totalBalance: number;
  totalLoansGiven: number;
  activeLoans: number;
  availableBalance: number;
  activeLoansList: ActiveLoan[];
}

export default function BalanceScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<BalanceState>({
    totalBalance: INITIAL_BALANCE,
    totalLoansGiven: 0,
    activeLoans: 0,
    availableBalance: INITIAL_BALANCE,
    activeLoansList: [],
  });

  useEffect(() => {
    fetchBalanceData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchBalanceData();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      const db = getFirestore();

      // Fetch all approved loans without auth check
      const loansQuery = query(
        collection(db, "loanApplications"),
        where("status", "==", "approved")
      );

      const loansSnap = await getDocs(loansQuery);

      let totalLoansAmount = 0;
      let activeLoansCount = 0;
      const activeLoansList: ActiveLoan[] = [];

      loansSnap.docs.forEach((doc) => {
        const loan = doc.data();

        const baseAmount = loan.amount || 0;
        const interestAmount = baseAmount * 0.03;
        const totalAmount = baseAmount + interestAmount;
        const monthlyAmount = totalAmount / (loan.repaymentPeriod || 12);
        const paidMonths = loan.paidMonths || [];
        const paidAmount = paidMonths.length * monthlyAmount;
        const remainingAmount = totalAmount - paidAmount;

        if (remainingAmount > 0) {
          activeLoansCount++;
          activeLoansList.push({
            id: doc.id,
            memberName: loan.memberName,
            loanType: loan.loanType,
            totalAmount,
            paidAmount,
            remainingAmount,
            paidMonths: paidMonths.length,
            totalMonths: loan.repaymentPeriod || 12,
            createdAt: loan.createdAt?.toDate() || new Date(),
            unitId: loan.unitId,
          });
        }

        totalLoansAmount += baseAmount;
      });

      const availableBalance =
        INITIAL_BALANCE -
        totalLoansAmount +
        activeLoansList.reduce((sum, loan) => {
          const paidBaseAmount = loan.paidAmount / 1.03;
          return sum + paidBaseAmount;
        }, 0);

      setBalanceData({
        totalBalance: INITIAL_BALANCE,
        totalLoansGiven: totalLoansAmount,
        activeLoans: activeLoansCount,
        availableBalance,
        activeLoansList: activeLoansList.sort(
          (a, b) =>
            (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        ),
      });
    } catch (error) {
      console.error("Error fetching balance data:", error);
      Alert.alert("Error", "Failed to fetch balance data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN");
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Balance Details</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ₹{formatCurrency(balanceData.availableBalance)}
            </Text>
            <View style={styles.balanceDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Initial Balance</Text>
                <Text style={styles.detailValue}>
                  ₹{formatCurrency(balanceData.totalBalance)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Total Loans Given</Text>
                <Text style={[styles.detailValue, { color: "#EF4444" }]}>
                  ₹{formatCurrency(balanceData.totalLoansGiven)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{balanceData.activeLoans}</Text>
              <Text style={styles.statLabel}>Active Loans</Text>
            </View>
          </View>

          <View style={styles.activeLoansContainer}>
            <Text style={styles.sectionTitle}>Active Loans</Text>
            {balanceData.activeLoansList.map((loan) => (
              <View key={loan.id} style={styles.activeLoanItem}>
                <View style={styles.activeLoanHeader}>
                  <View>
                    <Text style={styles.activeLoanMember}>
                      {loan.memberName}
                    </Text>
                    <Text style={styles.unitId}>Unit: {loan.unitId}</Text>
                  </View>
                  <Text style={styles.activeLoanType}>{loan.loanType}</Text>
                </View>
                <View style={styles.activeLoanDetails}>
                  <View style={styles.activeLoanRow}>
                    <Text style={styles.loanLabel}>Total Amount:</Text>
                    <Text style={styles.loanValue}>
                      ₹{formatCurrency(loan.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.activeLoanRow}>
                    <Text style={styles.loanLabel}>Paid Amount:</Text>
                    <Text style={[styles.loanValue, { color: "#10B981" }]}>
                      ₹{formatCurrency(loan.paidAmount)}
                    </Text>
                  </View>
                  <View style={styles.activeLoanRow}>
                    <Text style={styles.loanLabel}>Remaining:</Text>
                    <Text style={[styles.loanValue, { color: "#EF4444" }]}>
                      ₹{formatCurrency(loan.remainingAmount)}
                    </Text>
                  </View>
                  <View style={styles.activeLoanProgress}>
                    <Text style={styles.loanLabel}>
                      Progress: {loan.paidMonths}/{loan.totalMonths} months
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              (loan.paidMonths / loan.totalMonths) * 100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
            {balanceData.activeLoansList.length === 0 && (
              <Text style={styles.noLoansText}>No active loans</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingBottom: 80,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
  content: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 40,
    color: "#1F2937",
    textAlign: "center",
    marginVertical: 8,
  },
  balanceDetails: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 20,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  detailLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: "#4B5563",
  },
  detailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#1F2937",
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#1F2937",
    marginVertical: 8,
  },
  statLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6B7280",
  },
  activeLoansContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  activeLoanItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeLoanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activeLoanMember: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
  },
  activeLoanType: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#8B5CF6",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeLoanDetails: {
    gap: 12,
  },
  activeLoanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  loanLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: "#6B7280",
  },
  loanValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#1F2937",
  },
  activeLoanProgress: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 3,
  },
  noLoansText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    padding: 24,
  },
  unitId: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});
