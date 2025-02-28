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

interface LoanApplication {
  id: string;
  amount: number;
  purpose: string;
  repaymentPeriod: number;
  loanType: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export default function LoanScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const db = getFirestore();
      const q = query(
        collection(db, "loanApplications"),
        where("memberId", "==", "9747424242")
      );

      const querySnapshot = await getDocs(q);
      const loanData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as LoanApplication[];

      setLoans(
        loanData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      );
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      default:
        return "#F59E0B";
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
          <Text style={styles.headerTitle}>Your Loan Applications</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#8B5CF6"
            style={styles.loader}
          />
        ) : loans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#8B5CF6" />
            <Text style={styles.emptyText}>No loan applications yet</Text>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() =>
                navigation.navigate("ApplyLoan", { phoneNumber: "9747424242" })
              }
            >
              <Text style={styles.applyButtonText}>Apply for a Loan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loansContainer}>
            {loans.map((loan) => (
              <View key={loan.id} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <Text style={styles.loanType}>
                    {loan.loanType.toUpperCase()} LOAN
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(loan.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{loan.status}</Text>
                  </View>
                </View>

                <View style={styles.loanDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>₹{loan.amount}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Purpose:</Text>
                    <Text style={styles.detailValue}>{loan.purpose}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Repayment Period:</Text>
                    <Text style={styles.detailValue}>
                      {loan.repaymentPeriod} months
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Applied on:</Text>
                    <Text style={styles.detailValue}>
                      {loan.createdAt.toLocaleDateString()}
                    </Text>
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
    paddingTop: 50, // Adjust this value based on your device's status bar height
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginRight: 24, // To offset the back button width and keep text centered
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  loader: {
    marginTop: 50,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 10,
  },
  applyButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  applyButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
  loansContainer: {
    padding: 16,
  },
  loanCard: {
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
  loanHeader: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
    textTransform: "capitalize",
  },
  loanDetails: {
    marginTop: 8,
  },
  detailRow: {
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
    flex: 1,
    textAlign: "right",
  },
});
