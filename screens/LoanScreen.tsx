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
  Alert,
  Image,
  Dimensions,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";

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

interface UnitDetails {
  presidentName: string;
  unitName: string;
  presidentDetails?: {
    name: string;
  };
  // ... other fields
}

type LoanScreenProps = {
  navigation: NavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, "Loan">;
};

export default function LoanScreen({ navigation, route }: LoanScreenProps) {
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
  const [unitDetails, setUnitDetails] = useState<UnitDetails | null>(null);

  const phoneNumber = route.params?.phoneNumber;
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenWidth < 375;

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);

        const userPhone =
          phoneNumber || (await AsyncStorage.getItem("userPhoneNumber"));

        if (!userPhone) {
          console.log("No phone number available");
          Alert.alert("Error", "Please login to view loans");
          navigation.navigate("Login");
          return;
        }

        const cleanPhoneNumber = userPhone.replace("+91", "").trim();
        console.log("Using phone number:", cleanPhoneNumber);

        const db = getFirestore();
        const userDocRef = doc(db, "K-member", cleanPhoneNumber);
        console.log("Fetching K-member document:", cleanPhoneNumber);

        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData({
            phone: cleanPhoneNumber,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
          });

          const q = query(
            collection(db, "loanApplications"),
            where("memberId", "==", cleanPhoneNumber)
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
          Alert.alert(
            "Error",
            "Member data not found. Please ensure you're registered."
          );
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert(
          "Error",
          "Failed to load loan data: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [phoneNumber]);

  useEffect(() => {
    const sorted = sortLoans(loans);
    setSortedLoans(sorted);
  }, [loans, filterOptions]);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      try {
        const db = getFirestore();
        const unitDoc = await getDoc(doc(db, "unitDetails", "123")); // Using "123" as your unit ID
        if (unitDoc.exists()) {
          const data = unitDoc.data() as UnitDetails;
          setUnitDetails({
            presidentName:
              data.presidentDetails?.name ||
              data.presidentName ||
              "Unit President",
            unitName: data.unitName || "Kudumbashree Unit",
          });
        }
      } catch (error) {
        console.error("Error fetching unit details:", error);
      }
    };

    fetchUnitDetails();
  }, []);

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
    try {
      const kudumbashreeLogo = require("../assets/kudumbashreelogo.jpg");
      const logoSource = Image.resolveAssetSource(kudumbashreeLogo);
      const logoUrl = logoSource.uri;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: Arial, sans-serif;
                padding: 40px;
                color: #1F2937;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
              }
              .logo {
                width: 120px;
                margin-bottom: 20px;
              }
              h1 { 
                color: #8B5CF6;
                margin: 0;
                font-size: 28px;
              }
              .date {
                color: #6B7280;
                margin-top: 8px;
              }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #8B5CF6; color: white; }
              .status-approved { color: #10B981; }
              .status-rejected { color: #EF4444; }
              .status-pending { color: #F59E0B; }
              .signature-section {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
              }
              .signature-box {
                margin-top: 20px;
                display: flex;
                justify-content: flex-end;
              }
              .signature-line {
                width: 200px;
                border-bottom: 1px solid #1F2937;
                margin-bottom: 8px;
              }
              .signature-label {
                font-size: 12px;
                color: #6B7280;
                text-align: center;
              }
              .position-label {
                font-size: 10px;
                color: #6B7280;
                text-align: center;
                margin-top: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
                color: #6B7280;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${logoUrl}" class="logo" alt="Kudumbashree Logo"/>
              <h1>Loan Applications History</h1>
              <div class="date">
                Generated on ${format(new Date(), "MMMM dd, yyyy")}
              </div>
              <p style="color: #6B7280; margin-bottom: 20px;">
                Member: ${userData?.firstName} ${userData?.lastName}
              </p>
            </div>
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
            
            <div class="signature-section">
              <div class="signature-box">
                <div>
                  <div class="signature-line"></div>
                  <div class="signature-label">
                    ${unitDetails?.presidentName || "Unit President"}
                  </div>
                  <div class="position-label">President, ${
                    unitDetails?.unitName || "Kudumbashree Unit"
                  }</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <img src="${logoUrl}" width="60" alt="Kudumbashree Logo"/>
              <p>© ${new Date().getFullYear()} Kudumbashree Unit Report</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (Platform.OS === "ios") {
        await Print.printAsync({ uri });
      } else {
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

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>
            Loading your loan applications...
          </Text>
        </View>
      ) : loans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={48} color="#8B5CF6" />
          </View>
          <Text style={styles.emptyText}>No loan applications yet</Text>
          <Text style={styles.emptySubtext}>
            Apply for a loan to get started with your financial needs
          </Text>
          <TouchableOpacity
            style={styles.applyButtonLarge}
            onPress={() =>
              navigation.navigate("ApplyLoan", {
                phoneNumber: userData?.phone,
              })
            }
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.applyButtonText}>Apply for a Loan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="wallet-outline" size={28} color="#8B5CF6" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Your Loans</Text>
              <Text style={styles.summaryCount}>
                {loans.length} Applications
              </Text>
            </View>
            <TouchableOpacity
              style={styles.newLoanButton}
              onPress={() =>
                navigation.navigate("ApplyLoan", {
                  phoneNumber: userData?.phone,
                })
              }
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons name="filter" size={20} color="#8B5CF6" />
              <Text style={styles.actionButtonText}>Sort</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={generatePDF}>
              <Ionicons name="download-outline" size={20} color="#8B5CF6" />
              <Text style={styles.actionButtonText}>Export PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loansContainer}>
            {sortedLoans.map((loan, index) => (
              <View
                key={loan.id}
                style={[
                  styles.loanCard,
                  {
                    borderLeftWidth: 4,
                    borderLeftColor: getStatusColor(loan.status),
                    paddingHorizontal: isSmallScreen ? 12 : 20, // Responsive padding
                  },
                ]}
              >
                <View style={styles.loanHeader}>
                  <View style={styles.loanTypeContainer}>
                    <View
                      style={[
                        styles.loanIconContainer,
                        { backgroundColor: `${getStatusColor(loan.status)}15` }, // 15% opacity
                      ]}
                    >
                      <Ionicons
                        name={
                          loan.loanType.toLowerCase().includes("personal")
                            ? "person-outline"
                            : "business-outline"
                        }
                        size={20}
                        color={getStatusColor(loan.status)}
                      />
                    </View>
                    <Text style={styles.loanType}>
                      {loan.loanType.toUpperCase()} LOAN
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(loan.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{loan.status}</Text>
                  </View>
                </View>

                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.amountValue}>
                    {loan.amount.toLocaleString()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.loanDetails,
                    { borderLeftColor: `${getStatusColor(loan.status)}30` }, // 30% opacity
                  ]}
                >
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="book-outline" size={16} color="#6B7280" />
                    </View>
                    <Text
                      style={[
                        styles.detailLabel,
                        { fontSize: isSmallScreen ? 13 : 14 },
                      ]}
                    >
                      Purpose:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { fontSize: isSmallScreen ? 13 : 14 },
                      ]}
                    >
                      {loan.purpose}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                    </View>
                    <Text
                      style={[
                        styles.detailLabel,
                        { fontSize: isSmallScreen ? 13 : 14 },
                      ]}
                    >
                      Repay:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { fontSize: isSmallScreen ? 13 : 14 },
                      ]}
                    >
                      {loan.repaymentPeriod} months
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#6B7280"
                      />
                    </View>
                    <Text
                      style={[
                        styles.detailLabel,
                        { fontSize: isSmallScreen ? 13 : 14 },
                      ]}
                    >
                      Applied:
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { fontSize: isSmallScreen ? 13 : 14 },
                      ]}
                    >
                      {format(loan.createdAt, "MMM dd, yyyy")}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
                filterOptions.sortBy === "date" && styles.filterOptionSelected,
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
                  filterOptions.order === "desc" && styles.orderOptionSelected,
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
  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12, // Reduced from 16 for more space
    marginVertical: 16,
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
  newLoanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginTop: 20,
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
  emptyText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginTop: 10,
  },
  emptySubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  applyButtonLarge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  applyButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12, // Reduced from 16 for consistency
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#8B5CF6",
    marginLeft: 4,
  },
  loansContainer: {
    paddingHorizontal: 12, // Reduced from 16 for more space on small screens
    paddingVertical: 4, // Reduced vertical padding
  },
  loanCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 20, // Only vertical padding, horizontal is handled dynamically
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderLeftWidth: 0, // This will be overridden in component
    overflow: "hidden", // To ensure border radius works with colored border
  },
  loanIconContainer: {
    width: 36, // Made slightly larger
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(139, 92, 246, 0.1)", // This will be dynamically set
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  loanDetails: {
    marginTop: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16, // Slightly more padding
    paddingHorizontal: 12, // Reduced horizontal padding for more space
    borderWidth: 1,
    borderColor: "#E5E7EB", // This will be dynamically enhanced
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  loanTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loanType: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
    textTransform: "capitalize",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  currencySymbol: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#1F2937",
    marginRight: 4,
  },
  amountValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: "#1F2937",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start", // Changed from "center" to "flex-start" for better text alignment
    marginBottom: 10,
    minHeight: 24, // Ensure minimum height for proper spacing
  },
  detailIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 2, // Slight adjustment for icon alignment with text
  },
  detailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    minWidth: 55, // Changed from fixed width to minWidth
    flexShrink: 0, // Prevent label from shrinking
  },
  detailValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
    marginLeft: 8, // Increased margin for better spacing
    flexWrap: "wrap", // Allow text to wrap properly
    textAlign: "left", // Ensure text alignment
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
  applyButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
});
