import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
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
  updateDoc,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import { Platform } from "react-native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";

// Replace the StorageAccessFramework import with this
const StorageAccessFramework = FileSystem.StorageAccessFramework;

interface MemberReport {
  memberId: string;
  memberName: string;
  phoneNumber: string;
  weeklyDues: {
    total: number;
    paid: number;
    pending: number;
    weeklyAmount: number;
    totalDueAmount: number;
    paidAmount: number;
    pendingAmount: number;
    lastPaidDate: Timestamp | null;
  };
  loans: {
    active: number;
    totalAmount: number;
    pendingAmount: number;
  };
}

interface LoanReport {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  purpose: string;
  loanType: string;
  repaymentPeriod: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  paidMonths: number[];
  pendingAmount: number;
  totalPaid: number;
}

// First, create a const array of valid sort options
const SORT_OPTIONS = ["date", "amount", "status", "member"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

// Add these constants at the top with other interfaces
const ORDER_OPTIONS = ["asc", "desc"] as const;
type OrderOption = (typeof ORDER_OPTIONS)[number];

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected"] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

// Add this type definition at the top with other interfaces
type StatusOrderType = {
  [key: string]: number;
  approved: number;
  pending: number;
  rejected: number;
};

// Update the FilterOptions interface
interface FilterOptions {
  sortBy: SortOption;
  order: OrderOption;
  status: StatusOption;
}

type ViewReportsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "ViewReports">;
};

// Add this utility function near the top of the file
const formatCurrency = (amount: number): string => {
  return Math.floor(amount).toLocaleString("en-IN");
};

export default function ViewReportsScreen({
  navigation,
}: ViewReportsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberReport[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loans, setLoans] = useState<LoanReport[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: "date",
    order: "desc",
    status: "all",
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchReports();
    fetchLoans();
  }, [currentMonth]);

  // Update the fetchReports function to correctly calculate weekly dues
  const fetchReports = async () => {
    setLoading(true);
    try {
      const db = getFirestore();

      // Get weekly due settings for amount
      const settingsDoc = await getDoc(doc(db, "weeklyDueSettings", "config"));
      const weeklyAmount = settingsDoc.exists() ? settingsDoc.data().amount : 0;

      // Start date for weekly dues (February 1st, 2025)
      const startDate = new Date("2025-02-01");
      const now = new Date();

      // Calculate total weeks from start date till now
      const totalWeeks = Math.ceil(
        (now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      const membersSnapshot = await getDocs(
        query(collection(db, "K-member"), where("status", "==", "approved"))
      );

      const reportsPromises = membersSnapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        const fullName = `${memberData.firstName || ""} ${
          memberData.lastName || ""
        }`.trim();

        // Get weekly dues payments
        const duesDoc = await getDoc(
          doc(db, "weeklyDuePayments", memberDoc.id)
        );
        const paidWeeksData = duesDoc.exists() ? duesDoc.data() : null;
        const paidWeeks = paidWeeksData?.paidWeeks || [];
        const paidDates = paidWeeksData?.paidDates || {};

        // Calculate pending amount
        const totalDueAmount = weeklyAmount * totalWeeks;
        const paidAmount = weeklyAmount * paidWeeks.length;
        const pendingAmount = totalDueAmount - paidAmount;

        // Get loan information
        const loansQuery = query(
          collection(db, "loanApplications"),
          where("memberId", "==", memberDoc.id),
          where("status", "==", "approved")
        );
        const loansSnapshot = await getDocs(loansQuery);

        let loansTotalAmount = 0; // Changed variable name to avoid conflict
        let pendingAmountLoans = 0;

        loansSnapshot.docs.forEach((loanDoc) => {
          const loanData = loanDoc.data();
          const baseAmount = loanData.amount || 0;
          const interestRate = 0.03; // 3% interest
          const totalAmount = baseAmount + baseAmount * interestRate;
          const paidMonths = loanData.paidMonths || [];
          const monthlyAmount = totalAmount / (loanData.repaymentPeriod || 12);

          loansTotalAmount += totalAmount; // Use total amount with interest
          pendingAmountLoans += totalAmount - monthlyAmount * paidMonths.length;
        });

        return {
          memberId: memberDoc.id,
          memberName: fullName,
          phoneNumber: memberData.phone || "",
          weeklyDues: {
            total: totalWeeks,
            paid: paidWeeks.length,
            pending: totalWeeks - paidWeeks.length,
            weeklyAmount: weeklyAmount,
            totalDueAmount: totalDueAmount,
            paidAmount: paidAmount,
            pendingAmount: pendingAmount,
            lastPaidDate:
              paidWeeks.length > 0
                ? paidDates[paidWeeks[paidWeeks.length - 1]]
                : null,
          },
          loans: {
            active: loansSnapshot.size,
            totalAmount: loansTotalAmount, // Use the accumulated total
            pendingAmount: pendingAmountLoans,
          },
        };
      });

      const reportsData = await Promise.all(reportsPromises);
      setMembers(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      Alert.alert("Error", "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // Update the getLoanPendingAmount function
  const getLoanPendingAmount = (loanAmount: number, paidMonths: number[]) => {
    const totalAmount = loanAmount + loanAmount * 0.03; // Add 3% interest
    const monthlyAmount = totalAmount / 12; // Assuming 12 months repayment period
    const paidAmount = monthlyAmount * (paidMonths?.length || 0);
    return Math.floor(Math.max(0, totalAmount - paidAmount));
  };

  // Update the fetchLoans function to include payment information
  const fetchLoans = async () => {
    try {
      const db = getFirestore();
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const membersSnapshot = await getDocs(
        query(collection(db, "K-member"), where("status", "==", "approved"))
      );

      const loansPromises = membersSnapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();

        const loansQuery = query(
          collection(db, "loanApplications"),
          where("memberId", "==", memberDoc.id),
          where("createdAt", ">=", startOfMonth),
          where("createdAt", "<=", endOfMonth)
        );

        try {
          const loansSnapshot = await getDocs(loansQuery);
          const loanPromises = loansSnapshot.docs.map(async (doc) => {
            const loanData = doc.data();
            const amount = loanData.amount || 0;
            const paidMonths = loanData.paidMonths || [];
            const pendingAmount = getLoanPendingAmount(amount, paidMonths);

            return {
              id: doc.id,
              memberId: memberDoc.id,
              memberName: `${memberData.firstName || ""} ${
                memberData.lastName || ""
              }`.trim(),
              amount: amount,
              purpose: loanData.purpose || "",
              loanType: loanData.loanType || "",
              repaymentPeriod: loanData.repaymentPeriod || 12,
              status: loanData.status || "pending",
              createdAt: loanData.createdAt?.toDate() || new Date(),
              paidMonths: paidMonths,
              pendingAmount: pendingAmount,
              totalPaid: amount - pendingAmount,
            } as LoanReport;
          });

          return await Promise.all(loanPromises);
        } catch (error) {
          console.error(
            `Error fetching loans for member ${memberDoc.id}:`,
            error
          );
          return [];
        }
      });

      const allLoans = (await Promise.all(loansPromises)).flat();
      setLoans(allLoans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      Alert.alert("Error", "Failed to load loan data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (loanId: string, newStatus: string) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, "loanApplications", loanId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Loan status updated successfully");
      fetchLoans(); // Refresh the loans list
    } catch (error) {
      console.error("Error updating loan status:", error);
      Alert.alert("Error", "Failed to update loan status");
    }
  };

  const getSortedLoans = () => {
    let filteredLoans = [...loans];

    if (selectedStatus !== "all") {
      filteredLoans = filteredLoans.filter(
        (loan) => loan.status === selectedStatus
      );
    }

    const statusOrder: StatusOrderType = {
      approved: 3,
      pending: 2,
      rejected: 1,
    };

    return filteredLoans.sort((a, b) => {
      switch (filterOptions.sortBy) {
        case "date":
          return filterOptions.order === "desc"
            ? b.createdAt.getTime() - a.createdAt.getTime()
            : a.createdAt.getTime() - b.createdAt.getTime();
        case "amount":
          return filterOptions.order === "desc"
            ? b.amount - a.amount
            : a.amount - b.amount;
        case "member":
          return filterOptions.order === "desc"
            ? b.memberName.localeCompare(a.memberName)
            : a.memberName.localeCompare(b.memberName);
        case "status":
          const statusOrder = { approved: 3, pending: 2, rejected: 1 };
          return filterOptions.order === "desc"
            ? (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0)
            : (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        default:
          return 0;
      }
    });
  };

  const savePDFToDownloads = async (uri: string, fileName: string) => {
    try {
      if (Platform.OS === "android") {
        try {
          const permissions =
            await StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (permissions.granted) {
            try {
              // Create file in the selected directory with proper path handling
              const destinationUri =
                await StorageAccessFramework.createFileAsync(
                  permissions.directoryUri,
                  fileName,
                  "application/pdf"
                );

              // Read the source file
              const fileContent = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
              });

              // Write to the destination
              await FileSystem.writeAsStringAsync(destinationUri, fileContent, {
                encoding: FileSystem.EncodingType.Base64,
              });

              Alert.alert("Success", `Report saved as ${fileName}`, [
                { text: "OK" },
              ]);
            } catch (writeError) {
              console.error("Write error:", writeError);
              Alert.alert("Error", "Could not write file to selected location");
            }
          } else {
            Alert.alert(
              "Permission Required",
              "Please grant permission to save files",
              [{ text: "OK" }]
            );
          }
        } catch (error) {
          console.error("Permission error:", error);
          Alert.alert(
            "Error",
            "Could not access storage. Please check app permissions."
          );
        }
      } else {
        Alert.alert(
          "Not Supported",
          "This feature is only available on Android devices."
        );
      }
    } catch (error) {
      console.error("Error saving PDF:", error);
      Alert.alert("Error", "Failed to save PDF");
    }
  };

  const generatePDF = async () => {
    try {
      const sortedLoans = getSortedLoans();
      const baseAmount = sortedLoans.reduce(
        (sum, loan) => sum + loan.amount,
        0
      );
      const totalAmount = baseAmount * 1.03; // Including 3% interest

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #8B5CF6; text-align: center; }
              .summary { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #8B5CF6; color: white; }
              .status-approved { color: #10B981; }
              .status-rejected { color: #EF4444; }
              .status-pending { color: #F59E0B; }
              .amount-detail { color: #6B7280; font-size: 0.9em; }
            </style>
          </head>
          <body>
            <h1>Kudumbashree Unit Report</h1>
            
            <div class="summary">
              <h2>Summary</h2>
              <p>Total Members: ${members.length}</p>
              <p>Weekly Dues Status:</p>
              <ul>
                <li>Total Members with Pending Dues: ${
                  members.filter((m) => m.weeklyDues.pending > 0).length
                }</li>
                <li>Total Pending Due Amount: ₹${formatCurrency(
                  members.reduce(
                    (sum, m) => sum + m.weeklyDues.pendingAmount,
                    0
                  )
                )}</li>
              </ul>
              <p>Loans Status:</p>
              <ul>
                <li>Total Active Loans: ${
                  sortedLoans.filter((l) => l.status === "approved").length
                }</li>
                <li>Base Amount: ₹${formatCurrency(baseAmount)}</li>
                <li>Total Amount (with 3% interest): ₹${formatCurrency(
                  totalAmount
                )}</li>
              </ul>
            </div>

            <h2>Loan Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Loan Type</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                </tr>
              </thead>
              <tbody>
                ${sortedLoans
                  .map(
                    (loan) => `
                  <tr>
                    <td>${loan.memberName}</td>
                    <td>${loan.loanType}</td>
                    <td>
                      ₹${formatCurrency(loan.amount)}
                      <br/>
                      <span class="amount-detail">
                        With Interest: ₹${formatCurrency(loan.amount * 1.03)}
                      </span>
                    </td>
                    <td>${loan.purpose}</td>
                    <td class="status-${loan.status}">${loan.status}</td>
                    <td>${format(loan.createdAt, "dd/MM/yyyy")}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const fileName = `kudumbashree-report-${format(
        new Date(),
        "yyyy-MM-dd-HHmmss"
      )}.pdf`;
      await savePDFToDownloads(uri, fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF report");
    }
  };

  const generateMemberReport = async (member: MemberReport) => {
    const memberLoans = loans.filter(
      (loan) => loan.memberId === member.memberId
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #8B5CF6; text-align: center; }
            .member-info { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .amount-detail { color: #6B7280; font-size: 0.9em; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #8B5CF6; color: white; }
            .status-approved { color: #10B981; }
            .status-rejected { color: #EF4444; }
            .status-pending { color: #F59E0B; }
          </style>
        </head>
        <body>
          <h1>Member Report - ${member.memberName}</h1>
          
          <div class="member-info">
            <h2>Weekly Dues Summary</h2>
            <p>Total Weeks: ${member.weeklyDues.total}</p>
            <p>Paid Weeks: ${member.weeklyDues.paid}</p>
            <p>Pending Weeks: ${member.weeklyDues.pending}</p>
            <p>Weekly Amount: ₹${formatCurrency(
              member.weeklyDues.weeklyAmount
            )}</p>
            <p>Total Due: ₹${formatCurrency(
              member.weeklyDues.totalDueAmount
            )}</p>
            <p>Total Paid: ₹${formatCurrency(member.weeklyDues.paidAmount)}</p>
            <p>Pending Amount: ₹${formatCurrency(
              member.weeklyDues.pendingAmount
            )}</p>
            ${
              member.weeklyDues.lastPaidDate
                ? `<p>Last Paid: ${format(
                    member.weeklyDues.lastPaidDate.toDate(),
                    "dd MMM yyyy"
                  )}</p>`
                : ""
            }
          </div>

          <div class="member-info">
            <h2>Loans Summary</h2>
            <p>Active Loans: ${member.loans.active}</p>
            <p>Total Amount: ₹${formatCurrency(member.loans.totalAmount)}</p>
            <p>Pending Amount: ₹${formatCurrency(
              member.loans.pendingAmount
            )}</p>
          </div>

          <h2>Loan Details</h2>
          <table>
            <thead>
              <tr>
                <th>Loan Type</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              ${memberLoans
                .map(
                  (loan) => `
                <tr>
                  <td>${loan.loanType}</td>
                  <td>
                    Base: ₹${formatCurrency(loan.amount)}
                    <br/>
                    <span class="amount-detail">
                      With Interest: ₹${formatCurrency(loan.amount * 1.03)}
                    </span>
                  </td>
                  <td>${loan.purpose}</td>
                  <td class="status-${loan.status}">${loan.status}</td>
                  <td>${format(loan.createdAt, "dd/MM/yyyy")}</td>
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
      const fileName = `member-report-${member.memberName}-${format(
        new Date(),
        "yyyy-MM-dd-HHmm"
      )}.pdf`;
      await savePDFToDownloads(uri, fileName);
      Alert.alert("Success", "Member report generated successfully!");
    } catch (error) {
      console.error("Error generating member report:", error);
      Alert.alert("Error", "Failed to generate member report");
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
          <ActivityIndicator
            size="large"
            color="#8B5CF6"
            style={styles.loader}
          />
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

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons name="filter" size={20} color="#6B7280" />
                <Text style={styles.filterButtonText}>Filter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportButton}
                onPress={generatePDF}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Export Report</Text>
              </TouchableOpacity>
            </View>

            {members.map((member) => (
              <View key={member.memberId} style={styles.memberCard}>
                <TouchableOpacity
                  onPress={() =>
                    setExpandedMemberId(
                      expandedMemberId === member.memberId
                        ? null
                        : member.memberId
                    )
                  }
                  style={styles.memberHeader}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{member.memberName}</Text>
                    <View style={styles.memberSummary}>
                      <Text style={styles.memberPhone}>
                        {member.phoneNumber}
                      </Text>
                    </View>
                    {member.loans.pendingAmount > 0 && (
                      <Text style={styles.pendingAmount}>
                        ₹{formatCurrency(member.loans.pendingAmount)} loan
                        pending
                      </Text>
                    )}
                    {member.weeklyDues.pending > 0 && (
                      <Text style={styles.pendingText}>
                        {member.weeklyDues.pending} weekly dues pending
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={
                      expandedMemberId === member.memberId
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={24}
                    style={styles.expandIcon}
                  />
                </TouchableOpacity>

                {expandedMemberId === member.memberId && (
                  <View style={styles.expandedContent}>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Weekly Dues</Text>
                      <View style={styles.statsRow}>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Total Weeks</Text>
                          <Text style={styles.statValue}>
                            {member.weeklyDues.total}
                          </Text>
                          <Text style={styles.statSubtext}>
                            ₹{formatCurrency(member.weeklyDues.totalDueAmount)}
                          </Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Paid Weeks</Text>
                          <Text
                            style={[styles.statValue, { color: "#10B981" }]}
                          >
                            {member.weeklyDues.paid}
                          </Text>
                          <Text
                            style={[styles.statSubtext, { color: "#10B981" }]}
                          >
                            ₹{formatCurrency(member.weeklyDues.paidAmount)}
                          </Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Pending</Text>
                          <Text
                            style={[styles.statValue, { color: "#EF4444" }]}
                          >
                            {member.weeklyDues.pending}
                          </Text>
                          <Text
                            style={[styles.statSubtext, { color: "#EF4444" }]}
                          >
                            ₹{formatCurrency(member.weeklyDues.pendingAmount)}
                          </Text>
                        </View>
                      </View>
                      {member.weeklyDues.lastPaidDate && (
                        <Text style={styles.lastPaidText}>
                          Last paid on:{" "}
                          {format(
                            member.weeklyDues.lastPaidDate.toDate(),
                            "dd MMM yyyy"
                          )}
                        </Text>
                      )}
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Active Loans</Text>
                      <View style={styles.statsRow}>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Count</Text>
                          <Text style={styles.statValue}>
                            {member.loans.active}
                          </Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Total Amount</Text>
                          <Text style={styles.statValue}>
                            ₹{formatCurrency(member.loans.totalAmount)}
                          </Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Pending</Text>
                          <Text
                            style={[styles.statValue, { color: "#EF4444" }]}
                          >
                            ₹{formatCurrency(member.loans.pendingAmount)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        Loan Applications -{" "}
                        {currentMonth.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                      {loans
                        .filter((loan) => loan.memberId === member.memberId)
                        .map((loan) => (
                          <View key={loan.id} style={styles.loanItem}>
                            <View style={styles.loanHeader}>
                              <Text style={styles.loanType}>
                                {loan.loanType}
                              </Text>
                              <Text
                                style={[
                                  styles.loanStatus,
                                  styles[`status${loan.status}`],
                                ]}
                              >
                                {loan.status}
                              </Text>
                            </View>
                            <View style={styles.loanDetails}>
                              <View style={styles.loanRow}>
                                <Text style={styles.loanLabel}>
                                  Base Amount:
                                </Text>
                                <Text style={styles.loanValue}>
                                  ₹{formatCurrency(loan.amount)}
                                </Text>
                              </View>
                              <View style={styles.loanRow}>
                                <Text style={styles.loanLabel}>
                                  With 3% Interest:
                                </Text>
                                <Text style={styles.loanValue}>
                                  ₹
                                  {formatCurrency(
                                    loan.amount + loan.amount * 0.03
                                  )}
                                </Text>
                              </View>
                              <View style={styles.loanRow}>
                                <Text style={styles.loanLabel}>Purpose:</Text>
                                <Text style={styles.loanValue}>
                                  {loan.purpose}
                                </Text>
                              </View>
                              <View style={styles.loanRow}>
                                <Text style={styles.loanLabel}>
                                  Applied On:
                                </Text>
                                <Text style={styles.loanValue}>
                                  {format(loan.createdAt, "dd/MM/yyyy")}
                                </Text>
                              </View>
                              <View style={styles.loanRow}>
                                <Text style={styles.loanLabel}>
                                  Paid Months:
                                </Text>
                                <Text
                                  style={[
                                    styles.loanValue,
                                    { color: "#10B981" },
                                  ]}
                                >
                                  {loan.paidMonths?.length || 0} /{" "}
                                  {loan.repaymentPeriod}
                                </Text>
                              </View>
                              <View style={styles.loanRow}>
                                <Text style={styles.loanLabel}>
                                  Pending Amount:
                                </Text>
                                <Text
                                  style={[
                                    styles.loanValue,
                                    { color: "#EF4444" },
                                  ]}
                                >
                                  ₹{formatCurrency(loan.pendingAmount)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      {loans.filter((loan) => loan.memberId === member.memberId)
                        .length === 0 && (
                        <Text
                          style={[
                            styles.loanLabel,
                            { textAlign: "center", marginTop: 8 },
                          ]}
                        >
                          No loan applications for this month
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.reportButton}
                      onPress={() => generateMemberReport(member)}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.reportButtonText}>
                        Generate Report
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(options) => setFilterOptions(options)}
        currentOptions={filterOptions}
      />
    </SafeAreaView>
  );
}

// Move FilterModal component here, before styles
const FilterModal = ({
  visible,
  onClose,
  onApply,
  currentOptions,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (options: FilterOptions) => void;
  currentOptions: FilterOptions;
}) => {
  const [options, setOptions] = useState(currentOptions);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter Options</Text>

          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.optionsContainer}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterOption,
                  options.sortBy === option && styles.filterOptionSelected,
                ]}
                onPress={() => setOptions({ ...options, sortBy: option })}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    options.sortBy === option &&
                      styles.filterOptionTextSelected,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.optionsContainer}>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  options.status === status && styles.filterOptionSelected,
                ]}
                onPress={() => setOptions({ ...options, status })}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    options.status === status &&
                      styles.filterOptionTextSelected,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Order</Text>
          <View style={styles.optionsContainer}>
            {ORDER_OPTIONS.map((order) => (
              <TouchableOpacity
                key={order}
                style={[
                  styles.filterOption,
                  options.order === order && styles.filterOptionSelected,
                ]}
                onPress={() => setOptions({ ...options, order })}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    options.order === order && styles.filterOptionTextSelected,
                  ]}
                >
                  {order === "asc" ? "Ascending" : "Descending"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => {
                onApply(options);
                onClose();
              }}
            >
              <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#fff", // Add this to ensure background is white
  },
  memberName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    flex: 1,
    marginRight: 8, // Add spacing between text and icon
  },
  memberPhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  expandIcon: {
    color: "#4B5563", // Matching gray color for the icon
    marginLeft: 8, // Add some spacing between text and icon
  },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
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
    color: "#1F2937", // Dark text color for better visibility
  },
  loader: {
    marginTop: 50,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#4B5563", // Slightly darker gray
    marginLeft: 8,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
    marginLeft: 8,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    justifyContent: "center",
  },
  reportButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  filterLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  filterOptionSelected: {
    backgroundColor: "#8B5CF6",
  },
  filterOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#1F2937",
  },
  filterOptionTextSelected: {
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  modalButtonPrimary: {
    backgroundColor: "#8B5CF6",
  },
  modalButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#1F2937", // Dark text color
  },
  loanItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  loanType: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
  },
  loanStatus: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusapproved: {
    backgroundColor: "#D1FAE5",
    color: "#059669",
  },
  statuspending: {
    backgroundColor: "#FEF3C7",
    color: "#D97706",
  },
  statusrejected: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },
  loanDetails: {
    gap: 4,
  },
  loanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loanLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  loanValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#1F2937",
  },
  memberSummary: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  pendingAmount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#EF4444",
    marginTop: 4,
  },
  pendingText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#F59E0B",
    marginTop: 4,
  },
  statSubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  lastPaidText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
});
