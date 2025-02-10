"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

export default function OrderSummaryScreen({ navigation, route }) {
  const { cart, paymentMethod, address } = route.params
  const [couponCode, setCouponCode] = useState("")

  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const discount = 9.5
  const deliveryCharge = 5.0
  const total = subtotal - discount + deliveryCharge

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart Summary</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Payment Method */}
        <View style={styles.section}>
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

        {/* Delivery Address */}
        <View style={styles.section}>
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

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {cart.map((item) => (
            <View key={item.product.id} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemQuantity}>x {item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{item.product.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Coupon Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Coupon</Text>
          <View style={styles.couponContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter Code Here"
              value={couponCode}
              onChangeText={setCouponCode}
            />
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal ({cart.length} Items):</Text>
            <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Promotional Discounts:</Text>
            <Text style={styles.priceDiscount}>-₹{discount.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges:</Text>
            <Text style={styles.priceValue}>₹{deliveryCharge.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.placeOrderButton}
        onPress={() =>
          navigation.navigate("OrderTracking", {
            orderId: Math.floor(Math.random() * 90000) + 10000,
            total,
            items: cart.length,
          })
        }
      >
        <Text style={styles.placeOrderButtonText}>Place Order</Text>
      </TouchableOpacity>
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
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
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
  addressInfo: {
    flexDirection: "row",
  },
  addressIcon: {
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 14,
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
  placeOrderButton: {
    backgroundColor: "#69C779",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
})

