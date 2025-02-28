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
  where,
  getDocs,
} from "firebase/firestore";

interface PendingLoan {
  id: string;
  amount: number;
  purpose: string;
  loanType: string;
  dueDate: Date;
  pendingAmount: number;
  weeklyDue: number;
}

interface WeeklyDue {
  id: string;
  dueDate: Date;
  amount: number;
  status: "pending" | "paid";
}

export default function PendingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([]);
  const [weeklyDues, setWeeklyDues] = useState<WeeklyDue[]>([]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchPendingData();
  }, []);

  const fetchPendingData = async () => {
    try {
      const db = getFirestore();

      // Fetch pending loans
      const loansQuery = query(
        collection(db, "loanApplications"),
        where("memberId", "==", "9747424242"),
        where("status", "==", "approved")
      );

      const loansSnapshot = await getDocs(loansQuery);
      const loans = loansSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
      })) as PendingLoan[];

      // Fetch weekly dues
      const duesQuery = query(
        collection(db, "weeklyDues"),
        where("memberId", "==", "9747424242"),
        where("status", "==", "pending")
      );

      const duesSnapshot = await getDocs(duesQuery);
      const dues = duesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
      })) as WeeklyDue[];

      setPendingLoans(loans);
      setWeeklyDues(dues);
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
          <>
            {/* Pending Loans Section */}
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
                      <Text style={styles.amount}>₹{loan.pendingAmount}</Text>
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Weekly Due:</Text>
                        <Text style={styles.value}>₹{loan.weeklyDue}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Next Due Date:</Text>
                        <Text style={styles.value}>
                          {loan.dueDate.toLocaleDateString()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() =>
                          navigation.navigate("PayPendingLoan", {
                            loanId: loan.id,
                          })
                        }
                      >
                        <Text style={styles.payButtonText}>Pay Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Weekly Dues Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Dues</Text>
              {weeklyDues.length === 0 ? (
                <Text style={styles.emptyText}>No pending weekly dues</Text>
              ) : (
                weeklyDues.map((due) => (
                  <View key={due.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.dueDate}>
                        Due: {due.dueDate.toLocaleDateString()}
                      </Text>
                      <Text style={styles.amount}>₹{due.amount}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() =>
                        navigation.navigate("PayWeeklyDue", { dueId: due.id })
                      }
                    >
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    </TouchableOpacity>
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
});
