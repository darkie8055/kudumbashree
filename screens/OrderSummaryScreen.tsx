"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Modal, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import QRCode from 'react-native-qrcode-svg'
import Toast from 'react-native-toast-message'

// Create a separate Timer component outside the main component
const TimerComponent = ({ seconds, onTimeout }) => {
  useEffect(() => {
    const interval = setInterval(() => {
      seconds > 0 && onTimeout(seconds - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <Text style={styles.timerText}>
      Time remaining: {minutes}:{remainingSeconds.toString().padStart(2, '0')}
    </Text>
  );
};

export default function OrderSummaryScreen({ navigation, route }) {
  const { 
    cart = [], 
    paymentMethod = {},
    address = null
  } = route.params || {}

  useEffect(() => {
    if (!address) {
      navigation.replace('Address', route.params)
    }
  }, [address])

  const [couponCode, setCouponCode] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [showPaymentQR, setShowPaymentQR] = useState(false)
  const [paymentTimer, setPaymentTimer] = useState(300) // 5 minutes
  const [isPaymentTimedOut, setIsPaymentTimedOut] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState(false)

  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const discount = promoApplied ? (subtotal * 0.99) : 9.5
  const deliveryCharge = 5.0
  const total = subtotal - discount + deliveryCharge

  const qrValue = useMemo(() => {
    return `upi://pay?pa=gamestriker8055@okaxis&pn=Kudumbashree&am=${total.toFixed(2)}&cu=INR`;
  }, [total]);

  // Memoize QR code component to prevent re-renders
  const QRCodeComponent = useMemo(() => {
    return (
      <View style={[styles.qrContainer, styles.qrShadow]}>
        <QRCode
          value={qrValue}
          size={200}
          quietZone={10}
          backgroundColor="#fff"
          color="#000"
          ecl="H"
          logo={require('../assets/icon.png')}
          logoSize={50}
          logoBackgroundColor="white"
        />
      </View>
    );
  }, [qrValue]);

  // Update PaymentQRModal to use TimerComponent
  const PaymentQRModal = useMemo(() => {
    return () => (
      <Modal
        animationType="none"
        transparent={true}
        visible={showPaymentQR}
        onRequestClose={() => !isProcessingPayment && setShowPaymentQR(false)}
        statusBarTranslucent
      >
        <View style={[styles.modalContainer, StyleSheet.absoluteFill]}>
          <View style={styles.modalContent}>
            {paymentSuccess ? (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={60} color="#69C779" />
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={handleDone}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Scan to Pay</Text>
                {QRCodeComponent}
                <TimerComponent
                  seconds={paymentTimer}
                  onTimeout={setPaymentTimer}
                />
                {isPaymentTimedOut ? (
                  <Text style={styles.timeoutText}>Payment timed out. Please try again.</Text>
                ) : (
                  <TouchableOpacity 
                    style={[styles.verifyPaymentButton, isProcessingPayment && styles.processingButton]}
                    onPress={handlePaymentVerification}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <View style={styles.processingContainer}>
                        <ActivityIndicator color="#fff" />
                        <Text style={[styles.verifyPaymentButtonText, styles.processingText]}>
                          Processing...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.verifyPaymentButtonText}>
                        I have made the payment
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                {!isProcessingPayment && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowPaymentQR(false);
                      setPaymentTimer(300);
                      setIsPaymentTimedOut(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  }, [showPaymentQR, isProcessingPayment, paymentSuccess, QRCodeComponent, paymentTimer, isPaymentTimedOut]);

  const handlePlaceOrder = useCallback(() => {
    if (paymentMethod.type === 'upi') {
      setPaymentTimer(300);
      setIsPaymentTimedOut(false);
      setShowPaymentQR(true);
    } else {
      proceedWithOrder();
    }
  }, [paymentMethod]);

  const proceedWithOrder = () => {
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

  const handlePaymentVerification = async () => {
    setIsProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessingPayment(false);
    setPaymentSuccess(true);
  };

  const handleDone = () => {
    setShowPaymentQR(false);
    setPaymentSuccess(false);
    setPaymentTimer(300);
    setIsPaymentTimedOut(false);
    proceedWithOrder();
  };

  const handleApplyCoupon = () => {
    setIsApplyingCoupon(true);
    setTimeout(() => {
      if (couponCode.toUpperCase() === 'OFF99') {
        setAppliedDiscount(99);
        setPromoApplied(true);
        Toast.show({
          type: 'success',
          text1: 'Promo Code Applied!',
          text2: '99% discount has been applied to your order',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Invalid Promo Code',
          text2: 'Please enter a valid promo code',
        });
      }
      setIsApplyingCoupon(false);
      setCouponCode('');
    }, 1000);
  };

  const renderPaymentMethod = () => {
    if (!paymentMethod.type) {
      return null;
    }

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

  const renderOrderItems = () => {
    if (!cart.length) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <Text style={styles.emptyText}>No items in cart</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {cart.map((item) => (
          <View key={item.product.id} style={styles.orderItem}>
            <Image 
              source={{ uri: item.product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>₹{(item.product.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAddress = () => {
    if (!address) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.addressInfo}>
          <View style={styles.addressIcon}>
            <Ionicons name="location-outline" size={24} color="#333" />
          </View>
          <View style={styles.addressContent}>
            <Text style={styles.addressName}>{address.name}</Text>
            <Text style={styles.addressText}>{address.street}</Text>
            <Text style={styles.addressText}>{address.city}</Text>
            <Text style={styles.addressPhone}>{address.phone}</Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>DEFAULT</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPromoCode = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Promo Code</Text>
      <View style={styles.couponContainer}>
        <TextInput
          style={[styles.couponInput, promoApplied && styles.disabledInput]}
          placeholder="Enter promo code"
          value={couponCode}
          onChangeText={setCouponCode}
          editable={!promoApplied}
        />
        {promoApplied ? (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => {
              setPromoApplied(false);
              setAppliedDiscount(0);
            }}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.applyButton, (!couponCode || isApplyingCoupon) && styles.disabledButton]}
            disabled={!couponCode || isApplyingCoupon}
            onPress={handleApplyCoupon}
          >
            <Text style={styles.applyButtonText}>
              {isApplyingCoupon ? "Applying..." : "Apply"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {promoApplied && (
        <Text style={styles.discountApplied}>
          99% discount applied!
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderAddress()}
        {renderPaymentMethod()}
        {renderOrderItems()}
        {renderPromoCode()}

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

      <PaymentQRModal />
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
  addressContent: {
    flex: 1,
    paddingRight: 40,
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
  defaultBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    color: '#69C779',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: '#f0f0f0',
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
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
  },
  qrContainer: {
    width: 240,
    height: 240,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qrShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  timeoutText: {
    color: 'red',
    marginVertical: 10,
  },
  verifyPaymentButton: {
    backgroundColor: '#69C779',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  verifyPaymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginLeft: 8,
  },
  processingButton: {
    opacity: 0.8,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: '#69C779',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  discountApplied: {
    color: '#69C779',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
});

