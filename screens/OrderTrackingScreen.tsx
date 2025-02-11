"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Linking, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const orderSteps = [
  {
    id: "1",
    title: "Order Placed",
    description: "Your order has been placed successfully",
    icon: "receipt-outline",
  },
  {
    id: "2",
    title: "Order Confirmed",
    description: "Seller has processed your order ",
    icon: "checkmark-circle-outline",
  },
  {
    id: "3",
    title: "Order Shipped",
    description: "Your item has been picked up by courier partner",
    icon: "cube-outline",
  },
  {
    id: "4",
    title: "Out for Delivery",
    description: "Our delivery partner is on the way",
    icon: "bicycle-outline",
  },
  {
    id: "5",
    title: "Delivered",
    description: "Order has been delivered",
    icon: "home-outline",
  },
]

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId, total, items, status, placedAt } = route.params
  const [currentStep, setCurrentStep] = useState(0)
  const [progressAnimation] = useState(new Animated.Value(0))

  useEffect(() => {
    // Simulate order progress
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < orderSteps.length - 1) {
          return prev + 1
        }
        clearInterval(timer)
        return prev
      })
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: (currentStep / (orderSteps.length - 1)) * 100,
      duration: 500,
      useNativeDriver: false,
    }).start()
  }, [currentStep, progressAnimation])

  const getStepStyle = (index) => {
    if (index < currentStep) return styles.completedStep
    if (index === currentStep) return styles.activeStep
    return styles.pendingStep
  }

  const getStepTextStyle = (index) => {
    if (index < currentStep) return styles.completedStepText
    if (index === currentStep) return styles.activeStepText
    return styles.pendingStepText
  }

  const handleSupport = () => {
    Linking.openURL("tel:+918891115593")
  }

  const handleShare = () => {
    // Implement order sharing functionality
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.orderInfo}>
          <View style={styles.orderIcon}>
            <Ionicons name="cube-outline" size={32} color="#69C779" />
          </View>
          <View style={styles.orderDetails}>
            <Text style={styles.orderId}>Order #{orderId}</Text>
            <Text style={styles.orderDate}>Placed on {new Date(placedAt).toLocaleDateString()}</Text>
            <Text style={styles.orderItems}>
              {items} {items === 1 ? "item" : "items"} • ₹{total.toFixed(2)}
            </Text>
          </View>
          <View style={styles.estimatedDelivery}>
            <Text style={styles.estimatedTitle}>Estimated Delivery</Text>
            <Text style={styles.estimatedDate}>Tomorrow, by 7:00 PM</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.timeline}>
          {orderSteps.map((step, index) => (
            <View key={step.id} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={[styles.timelineIcon, getStepStyle(index)]}>
                  <Ionicons name={step.icon} size={24} color={index <= currentStep ? "#fff" : "#999"} />
                </View>
                {index < orderSteps.length - 1 && (
                  <View
                    style={[styles.timelineLine, index < currentStep ? styles.completedLine : styles.pendingLine]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, getStepTextStyle(index)]}>{step.title}</Text>
                <Text style={styles.timelineDescription}>{step.description}</Text>
                {index <= currentStep && (
                  <Text style={styles.timelineTime}>
                    {new Date(new Date(placedAt).getTime() + index * 1800000).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
          <Ionicons name="call-outline" size={24} color="#69C779" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  orderInfo: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  orderIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#E8F5E9",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  orderDetails: {
    marginBottom: 16,
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
  orderItems: {
    fontSize: 14,
    color: "#666",
  },
  estimatedDelivery: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  estimatedTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  estimatedDate: {
    fontSize: 16,
    fontWeight: "500",
    color: "#69C779",
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#69C779",
  },
  timeline: {
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
  completedStep: {
    backgroundColor: "#69C779",
  },
  activeStep: {
    backgroundColor: "#69C779",
  },
  pendingStep: {
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
    marginBottom: 4,
  },
  completedStepText: {
    color: "#69C779",
  },
  activeStepText: {
    color: "#69C779",
  },
  pendingStepText: {
    color: "#999",
  },
  timelineDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: "#999",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  supportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  supportButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#69C779",
    fontWeight: "500",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff4444",
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#ff4444",
    fontWeight: "500",
  },
})

