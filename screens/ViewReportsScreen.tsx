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
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  where,
} from "firebase/firestore";

interface MemberReport {
  memberId: string;
  memberName: string;
  weeklyDues: {
    total: number;
    paid: number;
    pending: number;
  };
  loans: {
    active: number;
    totalAmount: number;
    pendingAmount: number;
  };
}

export default function ViewReportsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberReport[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchReports();
  }, [currentMonth]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const membersSnapshot = await getDocs(
        query(collection(db, "K-member"), where("status", "==", "approved"))
      );

      const reportsPromises = membersSnapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        
        // Get weekly dues for the month
        const duesQuery = query(
          collection(db, "weeklyDuePayments"),
          where("memberId", "==", memberDoc.id),
          where("paidAt", ">=", new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)),
          where("paidAt", "<=", new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0))
        );
        const duesSnapshot = await getDocs(duesQuery);
        
        // Get active loans
        const loansQuery = query(
          collection(db, "loanApplications"),
          where("memberId", "==", memberDoc.id),
          where("status", "==", "approved")
        );
        const loansSnapshot = await getDocs(loansQuery);

        return {
          memberId: memberDoc.id,
          memberName: memberData.name,
          weeklyDues: {
            total: 4, // Assuming 4 weeks per month
            paid: duesSnapshot.size,
            pending: 4 - duesSnapshot.size,
          },
          loans: {
            active: loansSnapshot.size,
            totalAmount: loansSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0),
            pendingAmount: loansSnapshot.docs.reduce((sum, doc) => sum + doc.data().pendingAmount, 0),
          },
        };
      });

      const reportsData = await Promise.all(reportsPromises);
      setMembers(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

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
          <Text style={styles.headerTitle}>Monthly Reports</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
        ) : (
          <View style={styles.content}>
            <View style={styles.monthSelector}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(currentMonth.getMonth() - 1);
                  setCurrentMonth(newDate);
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#8B5CF6" />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {currentMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(currentMonth.getMonth() + 1);
                  setCurrentMonth(newDate);
                }}
              >
                <Ionicons name="chevron-forward" size={24} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            {members.map((member) => (
              <View key={member.memberId} style={styles.memberCard}>
                <Text style={styles.memberName}>{member.memberName}</Text>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Weekly Dues</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Total</Text>
                      <Text style={styles.statValue}>{member.weeklyDues.total}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Paid</Text>
                      <Text style={[styles.statValue, { color: "#10B981" }]}>
                        {member.weeklyDues.paid}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Pending</Text>
                      <Text style={[styles.statValue, { color: "#EF4444" }]}>
                        {member.weeklyDues.pending}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Active Loans</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Count</Text>
                      <Text style={styles.statValue}>{member.loans.active}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Total Amount</Text>
                      <Text style={styles.statValue}>₹{member.loans.totalAmount}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Pending</Text>
                      <Text style={[styles.statValue, { color: "#EF4444" }]}>
                        ₹{member.loans.pendingAmount}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
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
    padding: 16,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 20,
  },
  monthText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
  },
  memberCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
  },
  loader: {
    marginTop: 50,
  },
});