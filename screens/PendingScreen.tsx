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
  useFonts,
  Poppins_400Regular,
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
  progress: number; // Add this line
  memberName: string;
  unitId: string;
  baseAmount: number; // Original loan amount
  interestAmount: number; // Interest amount
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

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // First, add state for member details
  const [memberDetails, setMemberDetails] = useState<{
    name: string;
    unitId: string;
  } | null>(null);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchPendingData("9747424242"); // Directly pass the memberId
    }
  }, [isFocused]);

  // Update fetchPendingData to also fetch member details
  const fetchPendingData = async (memberId: string) => {
    try {
      const db = getFirestore();

      // Fetch member details
      const memberDoc = await getDoc(doc(db, "K-member", memberId));
      if (memberDoc.exists()) {
        const data = memberDoc.data();
        setMemberDetails({
          name: data.name,
          unitId: `${data.unitName}-${data.unitNumber}`,
        });
      }

      // Fetch loans directly using memberId
      const loansQuery = query(
        collection(db, "loanApplications"),
        where("memberId", "==", memberId),
        where("status", "==", "approved")
      );

      const loansSnapshot = await getDocs(loansQuery);
      const loans = loansSnapshot.docs.map((doc) => {
        const data = doc.data();
        const baseAmount = data.amount;
        const interestRate = 0.03; // 3% interest
        const totalAmount = baseAmount + baseAmount * interestRate;
        const paidMonths = data.paidMonths || [];
        const totalMonths = data.repaymentPeriod || 12;

        return {
          id: doc.id,
          amount: totalAmount, // This is now base amount + 3%
          purpose: data.purpose,
          loanType: data.loanType,
          startDate: data.createdAt?.toDate() || new Date(),
          repaymentPeriod: data.repaymentPeriod || 12,
          monthlyDue: Math.ceil(totalAmount / (data.repaymentPeriod || 12)),
          paidMonths: data.paidMonths || [],
          totalMonths: data.repaymentPeriod || 12,
          memberName: data.memberName,
          unitId: data.unitId,
          pendingAmount:
            totalAmount -
            Math.ceil(totalAmount / (data.repaymentPeriod || 12)) *
              (data.paidMonths?.length || 0),
          progress:
            ((data.paidMonths?.length || 0) / (data.repaymentPeriod || 12)) *
            100,
          baseAmount: baseAmount, // Original loan amount
          interestAmount: baseAmount * interestRate, // Interest amount
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

  if (!fontsLoaded) {
    return null;
  }

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
          <Text style={styles.headerTitle}>Pending Payments</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#8B5CF6"
            style={styles.loader}
          />
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Loans</Text>
            {pendingLoans.length === 0 ? (
              <Text style={styles.emptyText}>No pending loans</Text>
            ) : (
              pendingLoans.map((loan) => (
                <View key={loan.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.loanType}>
                      {loan.loanType.toUpperCase()} LOAN
                    </Text>
                    {loan.status === "completed" && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>FULLY PAID</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.amountContainer}>
                      <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Base Amount</Text>
                        <Text style={styles.totalAmount}>
                          ₹{loan.baseAmount}
                        </Text>
                        <Text style={styles.interestText}>
                          (+3% Interest: ₹{loan.interestAmount})
                        </Text>
                      </View>
                      <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Pending Amount</Text>
                        <Text
                          style={[styles.totalAmount, styles.pendingAmount]}
                        >
                          ₹{loan.pendingAmount}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Monthly Due:</Text>
                      <Text style={styles.value}>₹{loan.monthlyDue}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Progress:</Text>
                      <Text style={styles.value}>
                        {loan.paidMonths.length}/{loan.totalMonths} months
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              (loan.paidMonths.length / loan.totalMonths) * 100
                            }%`,
                          },
                        ]}
                      />
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom:80,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 20,
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
  loader: {
    marginTop: 50,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 15,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  loanType: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#6B7280",
  },
  amount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#1F2937",
  },
  cardBody: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  value: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#1F2937",
  },
  dueDate: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#EF4444",
  },
  payButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  payButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginVertical: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 2,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  amountBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  amountLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  totalAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#1F2937",
  },
  pendingAmount: {
    color: "#EF4444",
  },
  dueTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    flex: 1,
  },
  interestText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  completedBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completedText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
});
