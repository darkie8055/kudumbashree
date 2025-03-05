import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
  Alert, // Add this import
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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import * as FileSystem from "expo-file-system";
import { StorageAccessFramework } from "expo-file-system";
import { getAuth } from "firebase/auth";

interface LoanApplication {
  id: string;
  amount: number;
  purpose: string;
  repaymentPeriod: number;
  loanType: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

interface FilterOptions {
  sortBy: "date" | "amount" | "status";
  order: "asc" | "desc";
}

interface UserData {
  phone: string;
  firstName: string;
  lastName: string;
}

export default function LoanScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: "date",
    order: "desc",
  });
  const [sortedLoans, setSortedLoans] = useState<LoanApplication[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const checkAuthAndFetchLoans = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          Alert.alert("Error", "Please login to view loans");
          navigation.navigate("Login");
          return;
        }

        const phoneNumber = currentUser.phoneNumber?.replace("+91", "");

        if (!phoneNumber) {
          Alert.alert("Error", "Invalid user data");
          navigation.goBack();
          return;
        }

        // Fetch user data
        const db = getFirestore();
        const userDocRef = doc(db, "K-member", phoneNumber);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData({
            phone: phoneNumber,
            firstName: data.firstName,
            lastName: data.lastName,
          });

          // Fetch loans with the correct phone number
          const q = query(
            collection(db, "loanApplications"),
            where("memberId", "==", phoneNumber)
          );

          const querySnapshot = await getDocs(q);
          const loanData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })) as LoanApplication[];

          setLoans(
            loanData.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            )
          );
        } else {
          Alert.alert("Error", "Member data not found");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load loan data");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchLoans();
  }, []);

  useEffect(() => {
    const sorted = sortLoans(loans);
    setSortedLoans(sorted);
  }, [loans, filterOptions]);

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

  const sortLoans = (loansToSort: LoanApplication[]) => {
    return [...loansToSort].sort((a, b) => {
      switch (filterOptions.sortBy) {
        case "date":
          return filterOptions.order === "desc"
            ? b.createdAt.getTime() - a.createdAt.getTime()
            : a.createdAt.getTime() - b.createdAt.getTime();
        case "amount":
          return filterOptions.order === "desc"
            ? b.amount - a.amount
            : a.amount - b.amount;
        case "status":
          const statusOrder = { approved: 3, pending: 2, rejected: 1 };
          const statusA = statusOrder[a.status] || 0;
          const statusB = statusOrder[b.status] || 0;
          return filterOptions.order === "desc"
            ? statusB - statusA
            : statusA - statusB;
        default:
          return 0;
      }
    });
  };

  const generatePDF = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #8B5CF6; color: white; }
            .status-approved { color: #10B981; }
            .status-rejected { color: #EF4444; }
            .status-pending { color: #F59E0B; }
            h1 { color: #8B5CF6; }
          </style>
        </head>
        <body>
          <h1>Loan Applications History</h1>
          <p style="color: #6B7280; margin-bottom: 20px;">
            Member: ${userData?.firstName} ${userData?.lastName}
          </p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sortLoans(loans)
                .map(
                  (loan) => `
                <tr>
                  <td>${format(loan.createdAt, "dd/MM/yyyy")}</td>
                  <td>${loan.loanType}</td>
                  <td>₹${loan.amount}</td>
                  <td>${loan.purpose}</td>
                  <td>${loan.repaymentPeriod} months</td>
                  <td class="status-${loan.status}">${loan.status}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (Platform.OS === "ios") {
        // Show preview on iOS
        await Print.printAsync({ uri });
      } else {
        // On Android, save to downloads
        const permissions =
          await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            "loan-history.pdf",
            "application/pdf"
          ).then(async (fileUri) => {
            await FileSystem.writeAsStringAsync(fileUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert("Success", "PDF saved to your downloads folder", [
              { text: "OK" },
            ]);
          });
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF");
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.headerTitle}>Loan Applications</Text>
        </LinearGradient>

        {/* Add this new section below the header */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={24} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Sort</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={generatePDF}>
            <Ionicons name="download-outline" size={24} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

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
                navigation.navigate("ApplyLoan", {
                  phoneNumber: userData?.phone,
                })
              }
            >
              <Text style={styles.applyButtonText}>Apply for a Loan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loansContainer}>
            {sortedLoans.map((loan) => (
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
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sort Loans</Text>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterOptions.sortBy === "date" &&
                    styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setFilterOptions({
                    sortBy: "date",
                    order: filterOptions.order,
                  });
                  setSortedLoans(sortLoans(loans));
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterOptions.sortBy === "date" && { color: "#fff" },
                  ]}
                >
                  Date
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterOptions.sortBy === "amount" &&
                    styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setFilterOptions({
                    sortBy: "amount",
                    order: filterOptions.order,
                  });
                  setSortedLoans(sortLoans(loans));
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterOptions.sortBy === "amount" && { color: "#fff" },
                  ]}
                >
                  Amount
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filterOptions.sortBy === "status" &&
                    styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setFilterOptions({
                    sortBy: "status",
                    order: filterOptions.order,
                  });
                  setSortedLoans(sortLoans(loans));
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterOptions.sortBy === "status" && { color: "#fff" },
                  ]}
                >
                  Status
                </Text>
              </TouchableOpacity>

              <View style={styles.orderContainer}>
                <TouchableOpacity
                  style={[
                    styles.orderOption,
                    filterOptions.order === "asc" && styles.orderOptionSelected,
                  ]}
                  onPress={() =>
                    setFilterOptions({ ...filterOptions, order: "asc" })
                  }
                >
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color={filterOptions.order === "asc" ? "#fff" : "#1F2937"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orderOption,
                    filterOptions.order === "desc" &&
                      styles.orderOptionSelected,
                  ]}
                  onPress={() =>
                    setFilterOptions({ ...filterOptions, order: "desc" })
                  }
                >
                  <Ionicons
                    name="arrow-down"
                    size={20}
                    color={filterOptions.order === "desc" ? "#fff" : "#1F2937"}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 80,
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
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
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
  headerButtons: {
    flexDirection: "row",
    position: "absolute",
    right: 16,
    top: 50,
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 16,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F3F4F6",
  },
  filterOptionSelected: {
    backgroundColor: "#8B5CF6",
  },
  filterOptionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#1F2937",
  },
  orderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  orderOption: {
    padding: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  orderOptionSelected: {
    backgroundColor: "#8B5CF6",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: "#F3F4F6",
  },
  actionButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#8B5CF6",
    marginLeft: 4,
  },
});
