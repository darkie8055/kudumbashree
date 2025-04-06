import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PendingLoan {
  id: string;
  amount: number;
  purpose: string;
  loanType: string;
  startDate: Date;
  repaymentPeriod: number; // in months
  monthlyDue: number;
  pendingAmount: number;
  paidMonths: number[];
  totalMonths: number;
  progress: number;
  memberName: string;
  unitId: string;
  baseAmount: number;
  interestAmount: number;
  status: "pending" | "completed";
}

interface MemberData {
  id: string;
  phoneNumber: string;
}

type PendingScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Pending">;
};

export default function PendingScreen({ navigation }: PendingScreenProps) {
  const [loading, setLoading] = useState(true);
  const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([]);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [memberDetails, setMemberDetails] = useState<{
    name: string;
    unitId: string;
  } | null>(null);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchLoggedInUserLoans();
    }
  }, [isFocused]);

  const fetchLoggedInUserLoans = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        await fetchPendingData(userId);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  const fetchPendingData = async (memberId: string) => {
    try {
      const db = getFirestore();

      const memberDoc = await getDoc(doc(db, "K-member", memberId));
      if (memberDoc.exists()) {
        const data = memberDoc.data();
        setMemberDetails({
          name: data.name,
          unitId: `${data.unitName}-${data.unitNumber}`,
        });
      }

      const loansQuery = query(
        collection(db, "loanApplications"),
        where("memberId", "==", memberId),
        where("status", "==", "approved")
      );

      const loansSnapshot = await getDocs(loansQuery);
      const loans = loansSnapshot.docs.map((doc) => {
        const data = doc.data();
        const baseAmount = data.amount || 0;
        const interestRate = 0.03;
        const totalAmount = baseAmount + baseAmount * interestRate;
        const paidMonths = data.paidMonths || [];
        const totalMonths = data.repaymentPeriod || 12;

        return {
          id: doc.id,
          amount: totalAmount,
          purpose: data.purpose || "",
          loanType: data.loanType || "personal",
          startDate: data.approvedAt?.toDate() || new Date(),
          repaymentPeriod: data.repaymentPeriod || 12,
          monthlyDue: Math.ceil(totalAmount / (data.repaymentPeriod || 12)),
          paidMonths: paidMonths,
          totalMonths: totalMonths,
          memberName: data.memberName || "",
          unitId: data.unitId || "",
          pendingAmount:
            totalAmount -
            Math.ceil(totalAmount / totalMonths) * paidMonths.length,
          progress: (paidMonths.length / totalMonths) * 100,
          baseAmount: baseAmount,
          interestAmount: baseAmount * interestRate,
          status: paidMonths.length >= totalMonths ? "completed" : "pending",
        };
      }) as PendingLoan[];

      setPendingLoans(loans);
    } catch (error) {
      console.error("Error fetching pending data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoggedInUserLoans();
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
        <Text style={styles.headerTitle}>Pending Payments</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading your loans...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="wallet-outline" size={28} color="#8B5CF6" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Your Loans</Text>
                <Text style={styles.summaryCount}>
                  {pendingLoans.length} Active{" "}
                  {pendingLoans.length === 1 ? "Loan" : "Loans"}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {pendingLoans.length > 0
                  ? "Payment Schedule"
                  : "No Active Loans"}
              </Text>

              {pendingLoans.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={48}
                      color="#8B5CF6"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>All Caught Up!</Text>
                  <Text style={styles.emptyText}>
                    You don't have any pending loan payments at the moment.
                  </Text>
                </View>
              ) : (
                pendingLoans.map((loan, index) => (
                  <View
                    key={loan.id}
                    style={[
                      styles.card,
                      loan.status === "completed" && styles.completedCard,
                      {
                        borderLeftColor:
                          loan.status === "completed" ? "#22C55E" : "#8B5CF6",
                        borderLeftWidth: 4,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.loanTypeContainer}>
                        <View
                          style={[
                            styles.loanIconContainer,
                            {
                              backgroundColor:
                                loan.status === "completed"
                                  ? "rgba(34, 197, 94, 0.1)"
                                  : "rgba(139, 92, 246, 0.1)",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              loan.loanType.toLowerCase().includes("personal")
                                ? "person-outline"
                                : "business-outline"
                            }
                            size={20}
                            color={
                              loan.status === "completed"
                                ? "#22C55E"
                                : "#8B5CF6"
                            }
                          />
                        </View>
                        <Text style={styles.loanType}>
                          {loan.loanType.toUpperCase()} LOAN
                        </Text>
                      </View>

                      {loan.status === "completed" ? (
                        <View style={styles.completedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#fff"
                            style={styles.badgeIcon}
                          />
                          <Text style={styles.completedText}>PAID</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#fff"
                            style={styles.badgeIcon}
                          />
                          <Text style={styles.pendingText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.amountContainer}>
                        <View style={styles.amountBox}>
                          <Text style={styles.amountLabel}>Total Amount</Text>
                          <Text style={styles.totalAmount}>
                            ₹{loan.baseAmount + loan.interestAmount}
                          </Text>
                          <View style={styles.amountBreakdown}>
                            <Text style={styles.breakdownText}>
                              Base: ₹{loan.baseAmount}
                            </Text>
                            <Text style={styles.breakdownText}>
                              Interest: ₹{Math.round(loan.interestAmount)}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.divider,
                            { height: loan.status === "completed" ? 70 : 90 },
                          ]}
                        />

                        <View style={styles.amountBox}>
                          <Text style={styles.amountLabel}>
                            {loan.status === "completed"
                              ? "Paid Amount"
                              : "Pending Amount"}
                          </Text>
                          <Text
                            style={[
                              styles.totalAmount,
                              loan.status === "completed"
                                ? styles.paidAmount
                                : styles.pendingAmount,
                            ]}
                          >
                            ₹
                            {loan.status === "completed"
                              ? loan.baseAmount + loan.interestAmount
                              : loan.pendingAmount}
                          </Text>
                          {loan.status !== "completed" && (
                            <Text style={styles.remainingText}>
                              {loan.totalMonths - loan.paidMonths.length}{" "}
                              payments left
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressTitle}>
                            Payment Progress
                          </Text>
                          <Text style={styles.progressText}>
                            {loan.paidMonths.length}/{loan.totalMonths} months
                          </Text>
                        </View>

                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${
                                    (loan.paidMonths.length /
                                      loan.totalMonths) *
                                    100
                                  }%`,
                                  backgroundColor:
                                    loan.status === "completed"
                                      ? "#22C55E"
                                      : "#8B5CF6",
                                },
                              ]}
                            />
                          </View>
                          <View style={styles.progressMarkers}>
                            <Text style={styles.progressStartText}>0%</Text>
                            <Text style={styles.progressEndText}>100%</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailsContainer}>
                        <View style={styles.detailColumn}>
                          <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                              <Ionicons
                                name="calendar-outline"
                                size={16}
                                color="#6B7280"
                              />
                            </View>
                            <View>
                              <Text style={styles.detailLabel}>Duration</Text>
                              <Text style={styles.detailValue}>
                                {loan.totalMonths} months
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.detailColumn}>
                          <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                              <Ionicons
                                name="cash-outline"
                                size={16}
                                color="#6B7280"
                              />
                            </View>
                            <View>
                              <Text style={styles.detailLabel}>
                                Monthly Payment
                              </Text>
                              <Text style={styles.detailValue}>
                                ₹{loan.monthlyDue}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {loan.status !== "completed" && (
                        <TouchableOpacity
                          style={styles.payButton}
                          onPress={() =>
                            navigation.navigate("PayLoanDue", {
                              loanId: loan.id,
                              totalMonths: loan.totalMonths,
                              paidMonths: loan.paidMonths,
                              monthlyDue: loan.monthlyDue,
                              loanType: loan.loanType,
                              startDate: loan.startDate,
                            })
                          }
                        >
                          <Ionicons
                            name="cash-outline"
                            size={20}
                            color="#fff"
                            style={styles.buttonIcon}
                          />
                          <Text style={styles.payButtonText}>
                            Pay Monthly Due
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
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
  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
  },
  summaryCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
  section: {
    padding: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 16,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  completedCard: {
    borderColor: "#22C55E",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  loanTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loanIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  loanType: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#4B5563",
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  pendingBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeIcon: {
    marginRight: 4,
  },
  completedText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  pendingText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  cardBody: {
    padding: 16,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  amountBox: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },
  amountLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  totalAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 4,
  },
  amountBreakdown: {
    alignItems: "center",
  },
  breakdownText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#6B7280",
  },
  pendingAmount: {
    color: "#EF4444",
  },
  paidAmount: {
    color: "#22C55E",
  },
  remainingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  progressSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#4B5563",
  },
  progressText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#8B5CF6",
  },
  progressBarContainer: {
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressMarkers: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  progressStartText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#9CA3AF",
  },
  progressEndText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#9CA3AF",
  },
  detailsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailColumn: {
    flex: 1,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  detailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  detailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#1F2937",
  },
  payButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  payButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
