import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
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
import { Ionicons } from "@expo/vector-icons";

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

interface FilterOptions {
  status: "all" | "pending" | "paid" | "overdue";
  sortBy: "newest" | "oldest";
}

interface MonthlyGroup {
  monthYear: string;
  dues: WeeklyDue[];
  totalAmount: number;
  paidAmount: number;
}

export default function PayWeeklyDueScreen({ navigation }) {
  const { userId } = useUser();
  const [weeklyDues, setWeeklyDues] = useState<WeeklyDue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: "all",
    sortBy: "oldest",
  });
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    fetchWeeklyDues();
  }, []);

  const fetchWeeklyDues = async () => {
    try {
      const db = getFirestore();

      // Get member's join date from unit details
      const unitDoc = await getDoc(doc(db, "unitDetails", "123"));
      if (!unitDoc.exists()) {
        throw new Error("Unit details not found");
      }

      // Find member in the members array
      const memberData = unitDoc
        .data()
        .members.find((member) => member.phone === userId);

      // Set start date - either member's join date or March 1st 2025
      let startDate;
      if (memberData?.joinedAt) {
        startDate = new Date(memberData.joinedAt);
      } else {
        startDate = new Date("2025-03-01");
      }

      // Ensure startDate is at the beginning of its week
      startDate.setHours(0, 0, 0, 0);
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek); // Move to start of week

      const settingsDoc = await getDoc(doc(db, "weeklyDueSettings", "config"));
      if (!settingsDoc.exists()) {
        throw new Error("Weekly due amount not set");
      }

      const weeklyAmount = settingsDoc.data().amount;
      const now = new Date();

      const userDuesDoc = await getDoc(doc(db, "weeklyDuePayments", userId));
      const paidWeeks = userDuesDoc.exists()
        ? userDuesDoc.data().paidWeeks || []
        : [];
      const paidDates = userDuesDoc.exists()
        ? userDuesDoc.data().paidDates || {}
        : {};

      const weeks: WeeklyDue[] = [];
      let currentDate = new Date(startDate);
      let weekNumber = 1;

      while (currentDate <= now) {
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const dueDate = new Date(weekEnd);
        const isPaid = paidWeeks.includes(weekNumber);
        const paidDate = isPaid ? new Date(paidDates[weekNumber]) : undefined;
        const isOverdue = !isPaid && dueDate < now;

        weeks.push({
          weekNumber,
          startDate: new Date(currentDate),
          endDate: new Date(weekEnd),
          dueDate: new Date(dueDate),
          isPaid,
          paidDate,
          amount: weeklyAmount,
          status: isPaid ? "paid" : isOverdue ? "overdue" : "pending",
        });

        currentDate.setDate(currentDate.getDate() + 7);
        weekNumber++;
      }

      // Sort weeks in ascending order (first week first)
      weeks.sort((a, b) => a.weekNumber - b.weekNumber);

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
      const userDuesDoc = await getDoc(userDuesRef);
      const existingPaidWeeks = userDuesDoc.exists()
        ? userDuesDoc.data().paidWeeks || []
        : [];

      await setDoc(
        userDuesRef,
        {
          paidWeeks: [...existingPaidWeeks, weekNumber],
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

  const getFilteredDues = (): MonthlyGroup[] => {
    let filtered = [...weeklyDues];

    // Apply status filter
    if (filterOptions.status !== "all") {
      filtered = filtered.filter((due) => due.status === filterOptions.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (filterOptions.sortBy === "newest") {
        return b.weekNumber - a.weekNumber;
      }
      return a.weekNumber - b.weekNumber;
    });

    // Group by month
    const monthlyGroups = filtered.reduce((groups, due) => {
      const monthYear = due.startDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
      if (!groups[monthYear]) {
        groups[monthYear] = {
          monthYear,
          dues: [],
          totalAmount: 0,
          paidAmount: 0,
        };
      }
      groups[monthYear].dues.push(due);
      groups[monthYear].totalAmount += due.amount;
      if (due.isPaid) {
        groups[monthYear].paidAmount += due.amount;
      }
      return groups;
    }, {});

    // Convert to array and sort by date
    return Object.values(monthlyGroups).sort((a, b) => {
      const dateA = new Date(a.dues[0].startDate);
      const dateB = new Date(b.dues[0].startDate);
      return filterOptions.sortBy === "newest"
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });
  };

  const renderMonthlyGroup = ({ item }: { item: MonthlyGroup }) => (
    <View style={styles.monthlyGroup}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>{item.monthYear}</Text>
        <View style={styles.monthStats}>
          <Text style={styles.monthAmount}>
            Paid: ₹{item.paidAmount.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.monthAmount}>
            Total: ₹{item.totalAmount.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>
      {item.dues.map((due) => renderWeeklyDue({ item: due }))}
    </View>
  );

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

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              {(["all", "pending", "paid", "overdue"] as const).map(
                (status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.filterOption,
                      filterOptions.status === status &&
                        styles.filterOptionSelected,
                    ]}
                    onPress={() =>
                      setFilterOptions((prev) => ({ ...prev, status: status }))
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterOptions.status === status &&
                          styles.filterOptionTextSelected,
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              {(["oldest", "newest"] as const).map((sort) => (
                <Pressable
                  key={sort}
                  style={[
                    styles.filterOption,
                    filterOptions.sortBy === sort &&
                      styles.filterOptionSelected,
                  ]}
                  onPress={() =>
                    setFilterOptions((prev) => ({ ...prev, sortBy: sort }))
                  }
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filterOptions.sortBy === sort &&
                        styles.filterOptionTextSelected,
                    ]}
                  >
                    {sort.charAt(0).toUpperCase() + sort.slice(1)} First
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Weekly Dues</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="funnel-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList<MonthlyGroup>
        data={getFilteredDues()}
        renderItem={renderMonthlyGroup}
        keyExtractor={(item) => item.monthYear}
        contentContainerStyle={styles.listContent}
      />

      <FilterModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 60,
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
  filterButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterOptionSelected: {
    backgroundColor: "#8B5CF6",
  },
  filterOptionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6B7280",
  },
  filterOptionTextSelected: {
    color: "#fff",
  },
  monthlyGroup: {
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 12,
  },
  monthTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
  },
  monthStats: {
    flexDirection: "row",
    gap: 12,
  },
  monthAmount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6B7280",
  },
});
