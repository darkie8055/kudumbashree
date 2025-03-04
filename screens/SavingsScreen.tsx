import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
  doc,
  getDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SavingsData {
  totalAmount: number;
  weeksPaid: number;
  lastPaidDate: Date | null;
  weeklyAmount: number;
  collectiveTotal: number;
  memberCount: number;
  averageSavings: number;
  monthlyBreakdown: {
    month: string;
    amount: number;
    weeksCount: number;
  }[];
}

export default function SavingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [savingsData, setSavingsData] = useState<SavingsData>({
    totalAmount: 0,
    weeksPaid: 0,
    lastPaidDate: null,
    weeklyAmount: 0,
    collectiveTotal: 0,
    memberCount: 0,
    averageSavings: 0,
    monthlyBreakdown: [],
  });

  useEffect(() => {
    fetchSavingsData();
  }, []);

  const fetchSavingsData = async () => {
    try {
      setLoading(true);
      const db = getFirestore();

      // Get member's phone number and unit
      const phoneNumber = await AsyncStorage.getItem("userPhoneNumber");
      const memberQuery = query(
        collection(db, "K-member"),
        where("phone", "==", phoneNumber?.replace("+91", ""))
      );
      const memberSnap = await getDocs(memberQuery);
      const unitId = memberSnap.docs[0]?.data().unitNumber;

      // Get weekly due amount
      const settingsDoc = await getDoc(doc(db, "weeklyDueSettings", "config"));
      const weeklyAmount = settingsDoc.data()?.amount || 0;

      // Get member's payments
      const userDuesDoc = await getDoc(
        doc(db, "weeklyDuePayments", phoneNumber?.replace("+91", "") || "")
      );
      const paidWeeks = userDuesDoc.exists()
        ? userDuesDoc.data().paidWeeks || []
        : [];
      const paidDates = userDuesDoc.exists()
        ? userDuesDoc.data().paidDates || {}
        : {};

      // Calculate monthly breakdown
      const monthlyData = new Map<
        string,
        { amount: number; weeksCount: number }
      >();
      Object.entries(paidDates).forEach(([week, date]: [string, any]) => {
        // Add null check and type guard for Timestamp
        if (date && typeof date.toDate === "function") {
          const monthKey = new Date(date.toDate()).toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
          const existing = monthlyData.get(monthKey) || {
            amount: 0,
            weeksCount: 0,
          };
          monthlyData.set(monthKey, {
            amount: existing.amount + weeklyAmount,
            weeksCount: existing.weeksCount + 1,
          });
        }
      });

      // Get collective unit data
      const unitMembersQuery = query(
        collection(db, "K-member"),
        where("unitNumber", "==", unitId)
      );
      const unitMembersSnap = await getDocs(unitMembersQuery);
      const memberCount = unitMembersSnap.docs.length;

      let collectiveTotal = 0;
      for (const memberDoc of unitMembersSnap.docs) {
        const memberDuesDoc = await getDoc(
          doc(db, "weeklyDuePayments", memberDoc.id)
        );
        if (memberDuesDoc.exists()) {
          const memberPaidWeeks = memberDuesDoc.data().paidWeeks || [];
          collectiveTotal += memberPaidWeeks.length * weeklyAmount;
        }
      }

      // Update the lastPaidDate calculation
      const lastPaidDate =
        paidWeeks.length > 0 && paidDates[paidWeeks[paidWeeks.length - 1]]
          ? new Date(paidDates[paidWeeks[paidWeeks.length - 1]].toDate())
          : null;

      setSavingsData({
        totalAmount: paidWeeks.length * weeklyAmount,
        weeksPaid: paidWeeks.length,
        lastPaidDate,
        weeklyAmount,
        collectiveTotal,
        memberCount,
        averageSavings: collectiveTotal / memberCount,
        monthlyBreakdown: Array.from(monthlyData.entries())
          .map(([month, data]) => ({
            month,
            amount: data.amount,
            weeksCount: data.weeksCount,
          }))
          .sort((a, b) => b.month.localeCompare(a.month)),
      });
    } catch (error) {
      console.error("Error fetching savings data:", error);
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
        <Text style={styles.headerTitle}>My Savings</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.savingsCard}>
            <Text style={styles.savingsLabel}>Total Savings</Text>
            <Text style={styles.savingsAmount}>
              ₹{formatCurrency(savingsData.totalAmount)}
            </Text>
            <View style={styles.savingsDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weeks Paid</Text>
                <Text style={styles.detailValue}>{savingsData.weeksPaid}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weekly Amount</Text>
                <Text style={styles.detailValue}>
                  ₹{formatCurrency(savingsData.weeklyAmount)}
                </Text>
              </View>
              {savingsData.lastPaidDate && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Last Paid</Text>
                  <Text style={styles.detailValue}>
                    {savingsData.lastPaidDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.collectiveCard}>
            <Text style={styles.cardTitle}>Unit Collective Savings</Text>
            <View style={styles.collectiveStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ₹{formatCurrency(savingsData.collectiveTotal)}
                </Text>
                <Text style={styles.statLabel}>Total Collection</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ₹{formatCurrency(savingsData.averageSavings)}
                </Text>
                <Text style={styles.statLabel}>Avg. per Member</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{savingsData.memberCount}</Text>
                <Text style={styles.statLabel}>Total Members</Text>
              </View>
            </View>
          </View>

          <View style={styles.breakdownCard}>
            <Text style={styles.cardTitle}>Savings Analysis</Text>

            <View style={styles.statGrid}>
              <View style={styles.statBlock}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="calendar" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.statBlockLabel}>Payment Streak</Text>
                <Text style={styles.statBlockValue}>
                  {savingsData.weeksPaid} weeks
                </Text>
                <Text style={styles.statBlockSubtext}>
                  Consecutive payments
                </Text>
              </View>

              <View style={styles.statBlock}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="trending-up" size={24} color="#10B981" />
                </View>
                <Text style={styles.statBlockLabel}>Monthly Average</Text>
                <Text style={styles.statBlockValue}>
                  ₹
                  {formatCurrency(
                    savingsData.totalAmount /
                      (savingsData.monthlyBreakdown.length || 1)
                  )}
                </Text>
                <Text style={styles.statBlockSubtext}>Per month savings</Text>
              </View>

              <View style={styles.statBlock}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="analytics" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statBlockLabel}>Contribution</Text>
                <Text style={styles.statBlockValue}>
                  {(
                    (savingsData.totalAmount /
                      (savingsData.collectiveTotal || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </Text>
                <Text style={styles.statBlockSubtext}>Of unit total</Text>
              </View>

              <View style={styles.statBlock}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="bar-chart" size={24} color="#EC4899" />
                </View>
                <Text style={styles.statBlockLabel}>Payment Rate</Text>
                <Text style={styles.statBlockValue}>
                  {(
                    (savingsData.weeksPaid / (savingsData.weeksPaid + 4)) *
                    100
                  ).toFixed(1)}
                  %
                </Text>
                <Text style={styles.statBlockSubtext}>Completion rate</Text>
              </View>
            </View>
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
    paddingBottom:50,
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
  },
  savingsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  savingsLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  savingsAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    color: "#1F2937",
    textAlign: "center",
    marginVertical: 8,
  },
  savingsDetails: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#1F2937",
  },
  collectiveCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 16,
  },
  collectiveStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  breakdownCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBlock: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  statIconWrapper: {
    backgroundColor: "#EDE9FE",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  statBlockLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  statBlockValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 2,
  },
  statBlockSubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#9CA3AF",
  },
});
