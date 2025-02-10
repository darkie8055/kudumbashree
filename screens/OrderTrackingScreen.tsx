import type React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OrderTrackingScreenProps {
  orderId: string;
  items: string;
  total: number;
  steps: {
    id: string;
    title: string;
    date: string;
    completed: boolean;
    icon: string;
  }[] | undefined; // Allow undefined for steps
}

const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ orderId, items, total, steps }) => {
  // Check if total is a valid number before calling toFixed()
  const formattedTotal = typeof total === 'number' && !isNaN(total) ? total.toFixed(2) : "0.00";

  // Ensure steps is always an array (even if undefined or null)
  const validSteps = Array.isArray(steps) ? steps : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.orderIcon}>
          <Ionicons name="cube-outline" size={32} color="#69C779" />
        </View>
        <View>
          <Text style={styles.orderId}>Order #{orderId}</Text>
          <Text style={styles.orderDate}>Placed on December 15, 2020</Text>
          <Text style={styles.orderDetails}>
            Items: {items} Total: ₹{formattedTotal}
          </Text>
        </View>
      </View>

      <View style={styles.timeline}>
        {validSteps.map((step, index) => (
          <View key={step.id} style={styles.timelineItem}>
            <View style={styles.timelineIconContainer}>
              <View style={[styles.timelineIcon, step.completed ? styles.completedIcon : styles.pendingIcon]}>
                <Ionicons name={step.icon} size={24} color={step.completed ? "#fff" : "#999"} />
              </View>
              {index < validSteps.length - 1 && (
                <View style={[styles.timelineLine, step.completed ? styles.completedLine : styles.pendingLine]} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{step.title}</Text>
              <Text style={styles.timelineDate}>{step.date}</Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
  },
  orderIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#E8F5E9",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  orderDetails: {
    fontSize: 14,
    color: "#666",
  },
  timeline: {
    flex: 1,
    padding: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 24,
  },
  timelineIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  completedIcon: {
    backgroundColor: "#69C779",
  },
  pendingIcon: {
    backgroundColor: "#f0f0f0",
  },
  timelineLine: {
    width: 2,
    height: 40,
    position: "absolute",
    top: 48,
    left: 23,
  },
  completedLine: {
    backgroundColor: "#69C779",
  },
  pendingLine: {
    backgroundColor: "#e0e0e0",
  },
  timelineContent: {
    flex: 1,
    paddingTop: 12,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: "#666",
  },
});

export default OrderTrackingScreen;
