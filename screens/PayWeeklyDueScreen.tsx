import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "../contexts/UserContext";
import Toast from "react-native-toast-message";
import { TOAST_DURATION } from "../components/SonnerToast";

interface WeeklyDue {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  isPaid: boolean;
  amount: number;
  dueDate: Date;
  status: "pending" | "overdue" | "paid";
  paidDate?: Date;
}

export default function PayWeeklyDueScreen({ navigation }) {
  const { userId } = useUser();
  const [weeklyDues, setWeeklyDues] = useState<WeeklyDue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyDues();
  }, []);

  const fetchWeeklyDues = async () => {
    try {
      const db = getFirestore();
      const settingsDoc = await getDoc(doc(db, "weeklyDueSettings", "config"));
      if (!settingsDoc.exists()) {
        throw new Error("Weekly due amount not set");
      }

      const weeklyAmount = settingsDoc.data().amount;
      const startDate = new Date("2025-02-01"); // Updated to 2025
      const now = new Date();

      const userDuesDoc = await getDoc(doc(db, "weeklyDuePayments", userId));
      const paidWeeks = userDuesDoc.exists()
        ? userDuesDoc.data().paidWeeks || []
        : [];

      const weeks: WeeklyDue[] = [];
      let currentDate = new Date(startDate);
      let weekNumber = 1;

      while (currentDate <= now) {
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const dueDate = new Date(weekEnd);
        const isPaid = paidWeeks.includes(weekNumber);
        const isOverdue = !isPaid && dueDate < now;

        weeks.push({
          weekNumber,
          startDate: new Date(currentDate),
          endDate: new Date(weekEnd),
          dueDate: new Date(dueDate),
          isPaid,
          amount: weeklyAmount,
          status: isPaid ? "paid" : isOverdue ? "overdue" : "pending",
        });

        currentDate.setDate(currentDate.getDate() + 7);
        weekNumber++;
      }

      // Sort weeks in reverse order (latest week first)
      weeks.sort((a, b) => b.weekNumber - a.weekNumber);

      setWeeklyDues(weeks);
    } catch (error) {
      console.error("Error fetching weekly dues:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load weekly dues",
        visibilityTime: TOAST_DURATION,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayDue = async (weekNumber: number) => {
    try {
      setIsLoading(true);
      const db = getFirestore();
      const paidDate = new Date();

      const userDuesRef = doc(db, "weeklyDuePayments", userId);
      await setDoc(
        userDuesRef,
        {
          paidWeeks: [
            ...weeklyDues.filter((w) => w.isPaid).map((w) => w.weekNumber),
            weekNumber,
          ],
          [`paidDates.${weekNumber}`]: paidDate,
          lastUpdated: paidDate,
        },
        { merge: true }
      );

      setWeeklyDues((prev) =>
        prev.map((due) =>
          due.weekNumber === weekNumber
            ? { ...due, isPaid: true, status: "paid", paidDate }
            : due
        )
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Weekly due paid successfully",
        visibilityTime: TOAST_DURATION,
      });
    } catch (error) {
      console.error("Error paying weekly due:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pay weekly due",
        visibilityTime: TOAST_DURATION,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderWeeklyDue = ({ item }: { item: WeeklyDue }) => (
    <View
      style={[
        styles.dueCard,
        item.status === "overdue" && styles.overdueCard,
        item.status === "paid" && styles.paidCard,
      ]}
    >
      <View style={styles.dueHeader}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekNumber}>Week {item.weekNumber}</Text>
        </View>
        {getStatusBadge(item.status, item.paidDate)}
      </View>

      <View style={styles.dueInfo}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Period:</Text>
          <Text style={styles.dateText}>
            {item.startDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}{" "}
            -{" "}
            {item.endDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount Due:</Text>
          <Text style={styles.amountText}>₹{item.amount}</Text>
        </View>

        <View style={styles.dueDateContainer}>
          <Text style={styles.dueDateLabel}>Due By:</Text>
          <Text
            style={[
              styles.dueDateText,
              item.status === "overdue" && styles.overdueDateText,
            ]}
          >
            {item.dueDate.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        {item.status === "paid" && (
          <View style={styles.stampOverlay}>
            <View style={styles.paidStamp}>
              <View style={styles.paidStampInner} />
              <Text style={styles.paidStampText}>PAID</Text>
            </View>
          </View>
        )}
      </View>

      {!item.isPaid && (
        <TouchableOpacity
          style={[
            styles.payButton,
            item.status === "overdue" && styles.overduePayButton,
          ]}
          onPress={() => handlePayDue(item.weekNumber)}
        >
          <Text style={styles.payButtonText}>
            {item.status === "overdue" ? "Pay Overdue" : "Pay Now"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getStatusBadge = (status: WeeklyDue["status"], paidDate?: Date) => {
    const badgeStyles = {
      paid: styles.paidBadge,
      pending: styles.pendingBadge,
      overdue: styles.overdueBadge,
    };

    const textStyles = {
      paid: styles.paidText,
      pending: styles.pendingText,
      overdue: styles.overdueText,
    };

    return (
      <View
        style={[
          badgeStyles[status],
          status === "paid" && styles.paidBadgeContainer,
        ]}
      >
        <Text style={textStyles[status]}>{status.toUpperCase()}</Text>
        {status === "paid" && paidDate && (
          <Text style={styles.paidDateText}>
            {paidDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.header}>
        <Text style={styles.title}>Weekly Dues</Text>
      </LinearGradient>

      <FlatList
        data={weeklyDues}
        renderItem={renderWeeklyDue}
        keyExtractor={(item) => item.weekNumber.toString()}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom:80,
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  dueCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  overdueCard: {
    borderLeftColor: "#EF4444",
  },
  paidCard: {
    borderLeftColor: "#059669",
    backgroundColor: "#F0FDF4",
    opacity: 0.9,
  },
  dueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  weekBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  weekNumber: {
    color: "#8B5CF6",
    fontWeight: "600",
    fontSize: 14,
  },
  dueInfo: {
    gap: 12,
    position: "relative", // Added for absolute positioning of paid stamp
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 14,
    color: "#6B7280",
    width: 80,
  },
  dateText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
    width: 80,
  },
  amountText: {
    fontSize: 16,
    color: "#8B5CF6",
    fontWeight: "700",
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDateLabel: {
    fontSize: 14,
    color: "#6B7280",
    width: 80,
  },
  dueDateText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  overdueDateText: {
    color: "#EF4444",
  },
  payButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  overduePayButton: {
    backgroundColor: "#EF4444",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  paidBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#059669",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D97706",
  },
  overdueBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  paidText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
  },
  pendingText: {
    color: "#D97706",
    fontSize: 12,
    fontWeight: "600",
  },
  overdueText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },
  paidBadgeContainer: {
    alignItems: "center",
  },
  paidDateText: {
    color: "#059669",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
  stampOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 230,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  paidStamp: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-32deg" }],
  },
  paidStampInner: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "rgba(5, 150, 105, 0.3)",
    borderStyle: "dashed",
  },
  paidStampText: {
    color: "rgba(5, 150, 105, 0.4)",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
