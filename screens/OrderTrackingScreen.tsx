"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Linking, ScrollView, StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins"

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
  
  // ALL hooks must be called at the top, before any early returns
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })
  
  const [currentStep, setCurrentStep] = useState(0)
  const [progressAnimation] = useState(new Animated.Value(0))

  // Move useEffect hooks here, before the early return
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

  // Early return AFTER all hooks are declared
  if (!fontsLoaded) {
    return null
  }

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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.orderInfo}>
          <View style={styles.orderIcon}>
            <Ionicons name="cube-outline" size={28} color="#7C3AED" />
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
                  <Ionicons name={step.icon as any} size={24} color={index <= currentStep ? "#fff" : "#999"} />
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
          <LinearGradient
            colors={["#7C3AED", "#C026D3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.supportButtonGradient}
          >
            <Ionicons name="call-outline" size={20} color="#fff" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </LinearGradient>
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
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  shareButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  content: {
    flex: 1,
  },
  orderInfo: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  orderIcon: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  orderDetails: {
    marginBottom: 20,
  },
  orderId: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  orderDate: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginBottom: 6,
  },
  orderItems: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#4B5563",
  },
  estimatedDelivery: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  estimatedTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  estimatedDate: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#7C3AED",
    letterSpacing: 0.3,
  },
  progressContainer: {
    height: 6,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 3,
  },
  timeline: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 0,
  },
  timelineIconContainer: {
    alignItems: "center",
    marginRight: 20,
  },
  timelineIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedStep: {
    backgroundColor: "#7C3AED",
  },
  activeStep: {
    backgroundColor: "#7C3AED",
  },
  pendingStep: {
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  timelineLine: {
    width: 3,
    height: 40,
    position: "absolute",
    top: 56,
    left: 26.5,
    borderRadius: 1.5,
  },
  completedLine: {
    backgroundColor: "#7C3AED",
  },
  pendingLine: {
    backgroundColor: "#E5E7EB",
  },
  timelineContent: {
    flex: 1,
    paddingTop: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  completedStepText: {
    color: "#7C3AED",
  },
  activeStepText: {
    color: "#7C3AED",
  },
  pendingStepText: {
    color: "#9CA3AF",
  },
  timelineDescription: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginBottom: 6,
    lineHeight: 20,
  },
  timelineTime: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#7C3AED",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  supportButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  supportButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  supportButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#EF4444",
    letterSpacing: 0.3,
  },
})

