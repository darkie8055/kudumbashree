import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
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
  addDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch, // Add this import
} from "firebase/firestore";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import { Calendar, DateData } from "react-native-calendars";
import { format, startOfWeek, endOfWeek } from "date-fns";

type PayWeeklyDueScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PayWeeklyDue"
>;

interface Props {
  navigation: PayWeeklyDueScreenNavigationProp;
}

interface WeeklyDue {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  amount: number;
  isPaid: boolean;
}

// Add these interfaces at the top with the others
interface UserDetails {
  id: string;
  name: string;
  unitName: string;
  unitNumber: string;
}

// Update the MarkedDates interface
interface MarkedDates {
  [date: string]: {
    selected?: boolean;
    marked?: boolean;
    selectedColor?: string;
    dotColor?: string;
    disabled?: boolean;
    startingDay?: boolean;
    endingDay?: boolean;
    color?: string;
    textColor?: string;
  };
}

// Add before the component
const getWeekNumber = (date: Date): number => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekStart = startOfWeek(firstDayOfMonth);
  const daysSinceFirstWeek = Math.floor(
    (date.getTime() - firstWeekStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.floor(daysSinceFirstWeek / 7) + 1;
};

// Add this helper function after the getWeekNumber function
const isWeekSelectable = (weekStartDate: Date, weekEndDate: Date): boolean => {
  const today = new Date();
  const nextWeekStart = new Date();
  nextWeekStart.setDate(nextWeekStart.getDate() + (7 - nextWeekStart.getDay()));

  // Current week is always selectable
  if (today >= weekStartDate && today <= weekEndDate) {
    return true;
  }

  // Future weeks are only selectable from their start date
  return weekStartDate <= nextWeekStart;
};

export default function PayWeeklyDueScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [weeklyDueAmount, setWeeklyDueAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [weeklyDues, setWeeklyDues] = useState<WeeklyDue[]>([]);
  // Add these state variables
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    Promise.all([fetchWeeklyDueSettings(), fetchUserDetails()]);
  }, []);

  // Add this function to fetch user details
  const fetchUserDetails = async () => {
    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, "K-member", "9747424242")); // Replace with actual user ID

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserDetails({
          id: userDoc.id,
          name: userData.name,
          unitName: userData.unitName,
          unitNumber: userData.unitNumber,
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchWeeklyDueSettings = async () => {
    try {
      const db = getFirestore();
      const [settingsDoc, paymentsSnapshot] = await Promise.all([
        getDoc(doc(db, "weeklyDueSettings", "current")),
        getDocs(
          query(
            collection(db, "weeklyDuePayments"),
            where("memberId", "==", "9747424242"), // Replace with userDetails.id once available
            where("month", "==", new Date().getMonth() + 1),
            where("year", "==", new Date().getFullYear())
          )
        ),
      ]);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setWeeklyDueAmount(data.amount);
        setDescription(data.description);

        // Generate weeks for current month
        const today = new Date();
        const weeksInMonth = getWeeksInMonth(today);

        // Mark weeks as paid based on payment records
        const paidWeeks = paymentsSnapshot.docs.map(
          (doc) => doc.data().weekNumber
        );
        weeksInMonth.forEach((week) => {
          week.isPaid = paidWeeks.includes(week.weekNumber);
        });

        setWeeklyDues(weeksInMonth);
      }
    } catch (error) {
      console.error("Error fetching weekly due settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update the getWeeksInMonth function to properly calculate week periods
  const getWeeksInMonth = (date: Date) => {
    const weeks: WeeklyDue[] = [];
    const month = date.getMonth();
    const year = date.getFullYear();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Keep weekStartsOn: 1 for Monday
    let currentWeekStart = startOfWeek(firstDay, { weekStartsOn: 1 });
    let weekNumber = 1;

    while (currentWeekStart <= lastDay) {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

      // Only add weeks that have days in the current month
      if (weekEnd >= firstDay) {
        weeks.push({
          weekNumber,
          startDate: currentWeekStart,
          endDate: weekEnd > lastDay ? lastDay : weekEnd,
          amount: weeklyDueAmount,
          isPaid: false,
        });
      }

      currentWeekStart = new Date(weekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      weekNumber++;
    }

    return weeks;
  };

  const handlePayment = async () => {
    if (!userDetails) {
      Alert.alert("Error", "User details not found");
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore();
      const batch = writeBatch(db);

      for (const weekNumber of selectedWeeks) {
        const selectedWeek = weeklyDues.find(
          (w) => w.weekNumber === weekNumber
        );
        if (selectedWeek) {
          const paymentRef = doc(collection(db, "weeklyDuePayments"));
          batch.set(paymentRef, {
            memberId: userDetails.id,
            memberName: userDetails.name,
            unitId: `${userDetails.unitName}-${userDetails.unitNumber}`,
            weekNumber,
            month: selectedWeek.startDate.getMonth() + 1,
            year: selectedWeek.startDate.getFullYear(),
            amount: weeklyDueAmount,
            description,
            paidAt: new Date(),
            startDate: selectedWeek.startDate,
            endDate: selectedWeek.endDate,
            status: "paid",
          });

          // Update member's payment history
          const memberPaymentRef = doc(
            db,
            "members",
            userDetails.id,
            "paymentHistory",
            `${selectedWeek.startDate.getFullYear()}-${
              selectedWeek.startDate.getMonth() + 1
            }`
          );
          batch.set(
            memberPaymentRef,
            {
              weeklyDues: {
                [weekNumber]: {
                  paid: true,
                  paidAt: new Date(),
                  amount: weeklyDueAmount,
                },
              },
            },
            { merge: true }
          );
        }
      }

      await batch.commit();
      Alert.alert(
        "Success",
        `Payment successful for ${selectedWeeks.length} week(s)`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error processing payment:", error);
      Alert.alert("Error", "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  // Update the updateCalendarMarkings function to mark the entire week period
  const updateCalendarMarkings = (dues: WeeklyDue[]) => {
    const marks: MarkedDates = {};

    dues.forEach((week) => {
      // Get all dates between start and end of week
      let currentDate = new Date(week.startDate);
      while (currentDate <= week.endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");

        marks[dateStr] = {
          ...marks[dateStr],
          marked: true,
          color: week.isPaid
            ? "#10B981"
            : selectedWeeks.includes(week.weekNumber)
            ? "#8B5CF6"
            : "#EF4444",
          textColor: "white",
          startingDay:
            format(currentDate, "yyyy-MM-dd") ===
            format(week.startDate, "yyyy-MM-dd"),
          endingDay:
            format(currentDate, "yyyy-MM-dd") ===
            format(week.endDate, "yyyy-MM-dd"),
        };

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    setMarkedDates(marks);
  };

  useEffect(() => {
    updateCalendarMarkings(weeklyDues);
  }, [weeklyDues, selectedWeeks]);

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
          <Text style={styles.headerTitle}>Pay Weekly Due</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#8B5CF6"
            style={styles.loader}
          />
        ) : (
          <View style={styles.content}>
            {userDetails && (
              <View style={styles.userInfoContainer}>
                <Text style={styles.userName}>{userDetails.name}</Text>
                <Text style={styles.unitInfo}>
                  Unit {userDetails.unitName}-{userDetails.unitNumber}
                </Text>
              </View>
            )}
            <View style={styles.amountContainer}>
              <Text style={styles.label}>Weekly Due Amount</Text>
              <Text style={styles.amount}>₹{weeklyDueAmount}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>

            <View style={styles.calendarContainer}>
              <Text style={styles.sectionTitle}>Select Weeks to Pay</Text>
              <Calendar
                current={currentMonth.toISOString()}
                minDate={new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  1
                ).toISOString()}
                maxDate={new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  0
                ).toISOString()}
                onDayPress={(day: DateData) => {
                  const date = new Date(day.timestamp);
                  const selectedWeek = weeklyDues.find(
                    (week) => date >= week.startDate && date <= week.endDate
                  );

                  if (
                    selectedWeek &&
                    !selectedWeek.isPaid &&
                    isWeekSelectable(
                      selectedWeek.startDate,
                      selectedWeek.endDate
                    )
                  ) {
                    setSelectedWeeks((prev) =>
                      prev.includes(selectedWeek.weekNumber)
                        ? prev.filter((w) => w !== selectedWeek.weekNumber)
                        : [...prev, selectedWeek.weekNumber]
                    );
                  } else if (
                    selectedWeek &&
                    !isWeekSelectable(
                      selectedWeek.startDate,
                      selectedWeek.endDate
                    )
                  ) {
                    Alert.alert(
                      "Week not available",
                      "You can only select future weeks starting from their first day."
                    );
                  }
                }}
                onMonthChange={(month: DateData) => {
                  const newDate = new Date(month.timestamp);
                  setCurrentMonth(newDate);
                  // Fetch new weeks for the changed month
                  const weeksInMonth = getWeeksInMonth(newDate);
                  setWeeklyDues(weeksInMonth);
                }}
                markingType="period"
                markedDates={markedDates}
                firstDay={1} // Move firstDay here as a direct prop
                theme={{
                  todayTextColor: "#8B5CF6",
                  selectedDayBackgroundColor: "#8B5CF6",
                  selectedDayTextColor: "#ffffff",
                  textDisabledColor: "#d9e1e8",
                  arrowColor: "#8B5CF6",
                  textSectionTitleColor: "#374151",
                  dayTextColor: "#1F2937",
                  textDayFontFamily: "Poppins_400Regular",
                  textMonthFontFamily: "Poppins_600SemiBold",
                  textDayHeaderFontFamily: "Poppins_600SemiBold",
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14,
                  dotColor: "#8B5CF6",
                  selectedDotColor: "#ffffff",
                  monthTextColor: "#1F2937",
                  indicatorColor: "#8B5CF6",
                }}
              />

              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#10B981" }]}
                  />
                  <Text style={styles.legendText}>Paid</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#8B5CF6" }]}
                  />
                  <Text style={styles.legendText}>Selected</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#EF4444" }]}
                  />
                  <Text style={styles.legendText}>Pending</Text>
                </View>
              </View>
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                ₹{weeklyDueAmount * selectedWeeks.length}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.payButton,
                selectedWeeks.length === 0 && styles.payButtonDisabled,
              ]}
              onPress={handlePayment}
              disabled={loading || selectedWeeks.length === 0}
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
  content: {
    padding: 20,
  },
  amountContainer: {
    backgroundColor: "#F3F4F6",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 8,
  },
  amount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    color: "#1F2937",
    marginBottom: 8,
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
    marginBottom: 12,
  },
  weekItem: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  weekItemSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#8B5CF6",
    borderWidth: 1,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
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
  weeksList: {
    paddingVertical: 10,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginVertical: 10,
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
  payButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  payButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  weekItemPaid: {
    backgroundColor: "#F3F4F6",
    opacity: 0.7,
  },
  weekStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paidBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  paidText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  userInfoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  userName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
  },
  unitInfo: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
});
