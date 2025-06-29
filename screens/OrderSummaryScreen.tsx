"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-toast-message";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

// Create a separate Timer component outside the main component
const TimerComponent = () => {
  return <Text style={styles.timerText}>Time remaining: 5:00</Text>;
};

export default function OrderSummaryScreen({ navigation, route }) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  
  const { cart = [], paymentMethod = {}, address = null } = route.params || {};

  useEffect(() => {
    if (!address) {
      navigation.replace("Address", route.params);
    }
  }, [address]);

  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentTimer, setPaymentTimer] = useState(300); // 5 minutes
  const [isPaymentTimedOut, setIsPaymentTimedOut] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const discount = promoApplied ? subtotal * 0.99 : 9.5;
  const deliveryCharge = 5.0;
  const total = subtotal - discount + deliveryCharge;

  const qrValue = useMemo(() => {
    return `upi://pay?pa=gamestriker8055@okaxis&pn=Kudumbashree&am=${total.toFixed(
      2
    )}&cu=INR`;
  }, [total]);

  // Memoize QR code component to prevent re-renders
  const QRCodeComponent = useMemo(() => {
    return (
      <View style={styles.qrContainer}>
        <QRCode
          value={qrValue}
          size={200}
          quietZone={10}
          backgroundColor="#fff"
          color="#000"
          ecl="H"
          logo={require("../assets/icon.png")}
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
        animationType="fade"
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
                  <Ionicons name="checkmark-circle" size={60} color="#7C3AED" />
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleDone}
                >
                  <LinearGradient
                    colors={["#7C3AED", "#C026D3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.doneButtonGradient}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Scan to Pay</Text>
                <Text style={styles.modalSubtitle}>
                  Use any UPI app to scan and pay
                </Text>
                {QRCodeComponent}
                <TimerComponent />
                {isPaymentTimedOut ? (
                  <Text style={styles.timeoutText}>
                    Payment timed out. Please try again.
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.verifyPaymentButton,
                      isProcessingPayment && styles.processingButton,
                    ]}
                    onPress={handlePaymentVerification}
                    disabled={isProcessingPayment}
                  >
                    <LinearGradient
                      colors={
                        isProcessingPayment
                          ? ["#cccccc", "#999999"]
                          : ["#7C3AED", "#C026D3"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.verifyPaymentGradient}
                    >
                      {isProcessingPayment ? (
                        <View style={styles.processingContainer}>
                          <ActivityIndicator color="#fff" />
                          <Text
                            style={[
                              styles.verifyPaymentButtonText,
                              styles.processingText,
                            ]}
                          >
                            Processing...
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.verifyPaymentButtonText}>
                          I have made the payment
                        </Text>
                      )}
                    </LinearGradient>
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
  }, [
    showPaymentQR,
    isProcessingPayment,
    paymentSuccess,
    QRCodeComponent,
    paymentTimer,
    isPaymentTimedOut,
  ]);

  const handlePlaceOrder = useCallback(() => {
    if (paymentMethod.type === "upi") {
      setPaymentTimer(300);
      setIsPaymentTimedOut(false);
      setShowPaymentQR(true);
    } else {
      proceedWithOrder();
    }
  }, [paymentMethod]);

  const proceedWithOrder = () => {
    const orderId = Math.floor(Math.random() * 90000) + 10000;
    const orderStatus = {
      orderId,
      total,
      items: cart.length,
      status: "PLACED",
      placedAt: new Date().toISOString(),
    };
    navigation.navigate("OrderTracking", orderStatus);
  };

  const handlePaymentVerification = async () => {
    setIsProcessingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
      if (couponCode.toUpperCase() === "OFF99") {
        setAppliedDiscount(99);
        setPromoApplied(true);
        Toast.show({
          type: "success",
          text1: "Promo Code Applied!",
          text2: "99% discount has been applied to your order",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Invalid Promo Code",
          text2: "Please enter a valid promo code",
        });
      }
      setIsApplyingCoupon(false);
      setCouponCode("");
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
              <Image
                source={{ uri: paymentMethod.upiIcon }}
                style={styles.upiAppIcon}
              />
              <View style={styles.upiDetails}>
                <Text style={styles.upiAppName}>{paymentMethod.upiApp}</Text>
                <Text style={styles.upiId}>{paymentMethod.upiId}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.cardInfo}>
          <View style={styles.cardIcon}>
            <Ionicons
              name={paymentMethod.type === "visa" ? "card" : "card-outline"}
              size={24}
              color="#333"
            />
          </View>
          <View>
            <Text style={styles.cardNumber}>{paymentMethod.number}</Text>
            <Text style={styles.cardExpiry}>
              Expiry: {paymentMethod.expiry} CVV: {paymentMethod.cvv}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
            <Text style={styles.itemPrice}>
              ₹{(item.product.price * item.quantity).toFixed(2)}
            </Text>
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
            style={[
              styles.applyButton,
              (!couponCode || isApplyingCoupon) && styles.disabledButton,
            ]}
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
        <Text style={styles.discountApplied}>99% discount applied!</Text>
      )}
    </View>
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionsContainer}>
          {renderAddress()}
          {renderPaymentMethod()}
          {renderOrderItems()}
          {renderPromoCode()}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceDetailsContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Subtotal ({cart.length} items)
                </Text>
                <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={styles.priceDiscount}>
                  -₹{discount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Charges</Text>
                <Text style={styles.priceValue}>
                  ₹{deliveryCharge.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <LinearGradient colors={["#ffffff", "#f8f9fa"]} style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.footerTotal}>₹{total.toFixed(2)}</Text>
          <Text style={styles.totalCaption}>Total Amount</Text>
        </View>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
        >
          <LinearGradient
            colors={["#7C3AED", "#C026D3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.placeOrderGradient}
          >
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <PaymentQRModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  priceDetailsContainer: {
    paddingTop: 8,
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
    width: 48,
    height: 48,
    backgroundColor: "#f8f9fa",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  cardExpiry: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  upiInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  upiAppIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  upiDetails: {
    flex: 1,
  },
  upiAppName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  upiId: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  addressInfo: {
    flexDirection: "row",
  },
  addressIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#f8f9fa",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  addressContent: {
    flex: 1,
    paddingRight: 40,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  addressText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  defaultBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "600",
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: "#f8f9fa",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#6b7280",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  couponContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginRight: 12,
    backgroundColor: "#fff",
  },
  applyButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  discountApplied: {
    color: "#7C3AED",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "600",
  },
  disabledInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#d1d5db",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: "#6b7280",
  },
  priceValue: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  priceDiscount: {
    fontSize: 16,
    color: "#7C3AED",
    fontWeight: "600",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7C3AED",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalContainer: {
    flex: 1,
  },
  footerTotal: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  totalCaption: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  placeOrderButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  placeOrderGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  modalContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
  },
  qrContainer: {
    width: 240,
    height: 240,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginVertical: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 16,
    color: "#1a1a1a",
  },
  timeoutText: {
    color: "#ef4444",
    fontSize: 16,
    marginVertical: 16,
    textAlign: "center",
  },
  verifyPaymentButton: {
    borderRadius: 12,
    marginVertical: 16,
    width: "100%",
    overflow: "hidden",
  },
  verifyPaymentGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyPaymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    marginLeft: 8,
  },
  processingButton: {
    opacity: 0.8,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 32,
    textAlign: "center",
  },
  doneButton: {
    borderRadius: 16,
    width: "100%",
    overflow: "hidden",
  },
  doneButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
