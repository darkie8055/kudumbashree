"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

export default function OrderSummaryScreen({ navigation, route }) {
  const { cart, paymentMethod, address } = route.params
  const [couponCode, setCouponCode] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const discount = 9.5
  const deliveryCharge = 5.0
  const total = subtotal - discount + deliveryCharge

  const handlePlaceOrder = () => {
    const orderId = Math.floor(Math.random() * 90000) + 10000

    const orderStatus = {
      orderId,
      total,
      items: cart.length,
      status: "PLACED",
      placedAt: new Date().toISOString(),
    }

    navigation.navigate("OrderTracking", orderStatus)
  }

  const renderPaymentMethod = () => {
    if (paymentMethod.type === "upi") {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentInfo}>
            <View style={styles.upiInfo}>
              <Image source={{ uri: paymentMethod.upiIcon }} style={styles.upiAppIcon} />
              <View style={styles.upiDetails}>
                <Text style={styles.upiAppName}>{paymentMethod.upiApp}</Text>
                <Text style={styles.upiId}>{paymentMethod.upiId}</Text>
              </View>
            </View>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.cardInfo}>
          <View style={styles.cardIcon}>
            <Ionicons name={paymentMethod.type === "visa" ? "card" : "card-outline"} size={24} color="#333" />
          </View>
          <View>
            <Text style={styles.cardNumber}>{paymentMethod.number}</Text>
            <Text style={styles.cardExpiry}>
              Expiry: {paymentMethod.expiry} CVV: {paymentMethod.cvv}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderPaymentMethod()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressInfo}>
            <View style={styles.addressIcon}>
              <Ionicons name="location-outline" size={24} color="#333" />
            </View>
            <View>
              <Text style={styles.addressName}>{address.name}</Text>
              <Text style={styles.addressText}>{address.street}</Text>
              <Text style={styles.addressText}>{address.city}</Text>
              <Text style={styles.addressPhone}>{address.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {cart.map((item) => (
            <View key={item.product.id} style={styles.orderItem}>
              <Image source={{ uri: item.product.image }} style={styles.productImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.product.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.couponContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter promo code"
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity
              style={[styles.applyButton, (!couponCode || isApplyingCoupon) && styles.disabledButton]}
              disabled={!couponCode || isApplyingCoupon}
              onPress={() => {
                setIsApplyingCoupon(true)
                // Simulate coupon application
                setTimeout(() => {
                  setIsApplyingCoupon(false)
                  setCouponCode("")
                }, 1000)
              }}
            >
              <Text style={styles.applyButtonText}>{isApplyingCoupon ? "Applying..." : "Apply"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal ({cart.length} items)</Text>
            <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Discount</Text>
            <Text style={styles.priceDiscount}>-₹{discount.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={styles.priceValue}>₹{deliveryCharge.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.footerTotal}>₹{total.toFixed(2)}</Text>
          <Text style={styles.totalCaption}>Total Amount</Text>
        </View>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderButtonText}>Place Order</Text>
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
    flexDirection: "row",
    alignItems: "center",
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cardExpiry: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  upiInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  upiAppIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  upiDetails: {
    flex: 1,
  },
  upiAppName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  upiId: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  addressInfo: {
    flexDirection: "row",
  },
  addressIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  couponContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginRight: 12,
  },
  applyButton: {
    backgroundColor: "#69C779",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  priceDiscount: {
    fontSize: 14,
    color: "#69C779",
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#69C779",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  totalContainer: {
    flex: 1,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  totalCaption: {
    fontSize: 12,
    color: "#666",
  },
  placeOrderButton: {
    backgroundColor: "#69C779",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

