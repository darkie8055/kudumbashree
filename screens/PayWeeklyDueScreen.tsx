import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  orderBy,
  limit,
} from "firebase/firestore";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface WeekDue {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  amount: number;
  isPaid: boolean;
  isPayable: boolean;
}

interface UserDetails {
  id: string;
  name: string;
  unitName: string;
  unitNumber: string;
}

export default function PayWeeklyDueScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [weeklyDueAmount, setWeeklyDueAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [weekDues, setWeekDues] = useState<WeekDue[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update getStartDate function to start from February 1st, 2025
  const getStartDate = async (db: any, memberId: string) => {
    // Always start from February 1st, 2025
    const fixedStartDate = new Date(2025, 1, 1); // February 1st, 2025
    return fixedStartDate;
  };

  // Update the getWeekNumber function to be more accurate
  const getWeekNumber = (date: Date): number => {
    // Get first day of the year
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    // Get the Thursday in week 1 and calculate the week number from there
    firstDayOfYear.setDate(
      firstDayOfYear.getDate() + (1 - (firstDayOfYear.getDay() || 7))
    );
    const pastDays = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDays + 1) / 7);
  };

  // Update fetchInitialData to use these changes
  const fetchInitialData = async () => {
    try {
      const db = getFirestore();
      const PHONE_NUMBER = "9747424242";

      // Get user details from K-member collection
      const userDoc = await getDoc(doc(db, "K-member", PHONE_NUMBER));
      if (!userDoc.exists()) {
        Alert.alert("Error", "Member not found");
        return;
      }

      const userData = userDoc.data();
      setUserDetails({
        id: PHONE_NUMBER,
        name: userData.name || "Unknown Member",
        unitName: userData.unitName || "",
        unitNumber: userData.unitNumber || "",
      });

      // Get weekly due settings
      const settingsDoc = await getDoc(doc(db, "weeklyDueSettings", "current"));
      if (!settingsDoc.exists()) {
        Alert.alert("Error", "Weekly due settings not found");
        return;
      }

      const settings = settingsDoc.data();
      setWeeklyDueAmount(settings.amount || 0);
      setDescription(settings.description || "");

      // Get fixed start date (February 1st, 2025)
      const startDate = await getStartDate(db, PHONE_NUMBER);

      // Generate all weeks from February 1st
      const generatedWeeks = generateWeeksFromDate(
        startDate,
        settings.amount || 0
      );

      // Get all payments since February 1st, 2025
      const paymentsSnapshot = await getDocs(
        query(
          collection(db, "weeklyDuePayments"),
          where("memberId", "==", PHONE_NUMBER),
          where("paidAt", ">=", new Date(2025, 1, 1)), // February 1st, 2025
          orderBy("paidAt", "desc")
        )
      );

      // Create a map of paid weeks using week number as key
      const paidWeeksMap = new Map();
      paymentsSnapshot.docs.forEach((doc) => {
        const payment = doc.data();
        if (payment.paidAt) {
          const paymentDate = payment.paidAt.toDate();
          const weekStart = startOfWeek(paymentDate, { weekStartsOn: 1 });
          const weekNumber =
            Math.floor(
              (weekStart.getTime() - startDate.getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            ) + 1;
          paidWeeksMap.set(weekNumber, true);
        }
      });

      // Mark paid weeks
      const updatedWeeks = generatedWeeks.map((week) => ({
        ...week,
        isPaid: paidWeeksMap.has(week.weekNumber),
      }));

      setWeekDues(updatedWeeks);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function to check if a week is payable
  const isWeekPayable = (weekEnd: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weekEnd <= today;
  };

  // Update generateWeeksFromDate function
  const generateWeeksFromDate = (
    startDate: Date,
    amount: number
  ): WeekDue[] => {
    const weeks: WeekDue[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Always start from February 1st, 2025
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });

    // Generate weeks until today plus one week
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);

    let weekNumber = 1; // Start from week 1

    while (currentWeekStart <= endDate) {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

      weeks.push({
        weekNumber,
        startDate: new Date(currentWeekStart),
        endDate: new Date(weekEnd),
        amount,
        isPaid: false,
        isPayable: weekEnd <= today, // Only payable if week has ended
      });

      // Move to next week
      currentWeekStart = new Date(weekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      weekNumber++; // Increment week number sequentially
    }

    return weeks;
  };

  const handlePayment = async () => {
    if (selectedWeeks.length === 0 || !userDetails) return;

    setLoading(true);
    try {
      const db = getFirestore();
      const batch = writeBatch(db);

      for (const weekNumber of selectedWeeks) {
        const week = weekDues.find((w) => w.weekNumber === weekNumber);
        if (!week) continue;

        const paymentRef = doc(collection(db, "weeklyDuePayments"));
        const paymentData = {
          memberId: userDetails.id,
          memberName: userDetails.name,
          unitId: `${userDetails.unitName}-${userDetails.unitNumber}`,
          weekNumber: getWeekNumber(week.startDate), // Use consistent week numbering
          month: week.startDate.getMonth() + 1,
          year: week.startDate.getFullYear(),
          amount: weeklyDueAmount,
          description: description,
          paidAt: new Date(),
          startDate: week.startDate,
          endDate: week.endDate,
          status: "paid",
        };

        // Verify all required fields are present
        if (Object.values(paymentData).some((value) => value === undefined)) {
          throw new Error("Missing required payment data");
        }

        batch.set(paymentRef, paymentData);
      }

      await batch.commit();
      await fetchInitialData(); // Refresh the data after payment
      setSelectedWeeks([]); // Clear selection
      Alert.alert("Success", "Payment completed successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Error",
        "Payment failed. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Weekly Due</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Weekly Due Amount</Text>
          <Text style={styles.amount}>₹{weeklyDueAmount}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Weeks to Pay</Text>

        {weekDues.map((week) => (
          <TouchableOpacity
            key={week.weekNumber}
            style={[
              styles.weekItem,
              week.isPaid && styles.weekPaid,
              selectedWeeks.includes(week.weekNumber) && styles.weekSelected,
              !week.isPayable && styles.weekDisabled,
            ]}
            onPress={() => {
              if (!week.isPaid && week.isPayable) {
                setSelectedWeeks((prev) =>
                  prev.includes(week.weekNumber)
                    ? prev.filter((w) => w !== week.weekNumber)
                    : [...prev, week.weekNumber]
                );
              }
            }}
            disabled={week.isPaid || !week.isPayable}
          >
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
              {week.isPaid ? (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>Paid</Text>
                </View>
              ) : !week.isPayable ? (
                <View style={styles.unavailableBadge}>
                  <Text style={styles.unavailableText}>Not Yet Due</Text>
                </View>
              ) : (
                <Text style={styles.weekAmount}>₹{week.amount}</Text>
              )}
            </View>
            <Text style={styles.weekDates}>
              {format(week.startDate, "MMM d")} -{" "}
              {format(week.endDate, "MMM d, yyyy")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedWeeks.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>
              ₹{weeklyDueAmount * selectedWeeks.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay ₹{weeklyDueAmount * selectedWeeks.length}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
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
    flex: 1,
    padding: 20,
  },
  amountCard: {
    backgroundColor: "#F3F4F6",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  amountLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
  },
  amount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    color: "#1F2937",
    marginVertical: 8,
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 16,
  },
  weekItem: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  weekPaid: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  weekSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#8B5CF6",
  },
  weekDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    opacity: 0.7,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  weekTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
  },
  weekAmount: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#8B5CF6",
  },
  weekDates: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  paidBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  unavailableBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#6B7280",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#374151",
  },
  totalAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#8B5CF6",
  },
  payButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  payButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
