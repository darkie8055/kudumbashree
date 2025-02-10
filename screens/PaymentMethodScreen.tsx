"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

interface PaymentMethod {
  id: string
  type: "visa" | "mastercard" | "upi"
  number?: string
  expiry?: string
  cvv?: string
  isDefault?: boolean
  upiApp?: string
  upiIcon?: string
  upiId?: string
}

const samplePaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    type: "visa",
    number: "XXXX XXXX XXXX 3694",
    expiry: "01/22",
    cvv: "658",
    isDefault: true,
  },
  {
    id: "2",
    type: "mastercard",
    number: "XXXX XXXX XXXX 3694",
    expiry: "01/22",
    cvv: "658",
  },
  {
    id: "3",
    type: "upi",
    upiApp: "BHIM",
    upiIcon:  "https://drive.google.com/file/d/1wQnlHhK2lOhhkTyPHrBlvg-sgn2tnbjY/view?usp=sharing",
  },
  {
    id: "4",
    type: "upi",
    upiApp: "PhonePe",
    upiIcon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/upi-CdI8LUHVB7LdWuls6vIZDm9PREJasC.png",
  },
  {
    id: "5",
    type: "upi",
    upiApp: "Paytm",
    upiIcon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/upi-CdI8LUHVB7LdWuls6vIZDm9PREJasC.png",
  },
  {
    id: "6",
    type: "upi",
    upiApp: "Google Pay",
    upiIcon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/upi-CdI8LUHVB7LdWuls6vIZDm9PREJasC.png",
  },
]

export default function PaymentMethodScreen({ navigation, route }) {
  const [selectedMethod, setSelectedMethod] = useState<string>(samplePaymentMethods[0].id)
  const [paymentType, setPaymentType] = useState<"card" | "upi">("card")
  const [upiId, setUpiId] = useState<string>("")
  const [showUpiInput, setShowUpiInput] = useState<boolean>(false)

  const handlePaymentProceed = () => {
    const selectedPayment = samplePaymentMethods.find((m) => m.id === selectedMethod)

    if (selectedPayment?.type === "upi") {
      setShowUpiInput(true)
    } else {
      navigation.navigate("OrderSummary", {
        ...route.params,
        paymentMethod: selectedPayment,
      })
    }
  }

  const handleUpiPayment = () => {
    const selectedPayment = samplePaymentMethods.find((m) => m.id === selectedMethod)
    navigation.navigate("OrderSummary", {
      ...route.params,
      paymentMethod: {
        ...selectedPayment,
        upiId: upiId,
      },
    })
  }

  const UpiInputModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showUpiInput}
      onRequestClose={() => setShowUpiInput(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter UPI ID</Text>
          <TextInput
            style={styles.upiInput}
            placeholder="example@upi"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowUpiInput(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.proceedButton]} onPress={handleUpiPayment}>
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Payment Method</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, paymentType === "card" && styles.activeTab]}
          onPress={() => setPaymentType("card")}
        >
          <Text style={[styles.tabText, paymentType === "card" && styles.activeTabText]}>Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, paymentType === "upi" && styles.activeTab]}
          onPress={() => setPaymentType("upi")}
        >
          <Text style={[styles.tabText, paymentType === "upi" && styles.activeTabText]}>UPI</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {paymentType === "card" ? (
          // Credit Card Section
          samplePaymentMethods
            .filter((method) => method.type === "visa" || method.type === "mastercard")
            .map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[styles.paymentCard, selectedMethod === method.id && styles.selectedCard]}
                onPress={() => setSelectedMethod(method.id)}
              >
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>DEFAULT</Text>
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Image
                    source={
                      method.type === "visa" ? require("../assets/visa.png") : require("../assets/mastercard.png")
                    }
                    style={styles.cardTypeImage}
                  />
                  <Text style={styles.cardNumber}>{method.number}</Text>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardDetailText}>Expiry: {method.expiry}</Text>
                    <Text style={styles.cardDetailText}>CVV: {method.cvv}</Text>
                  </View>
                </View>

                {selectedMethod === method.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color="#69C779" />
                  </View>
                )}
              </TouchableOpacity>
            ))
        ) : (
          // UPI Section
          <View style={styles.upiContainer}>
            <Text style={styles.upiTitle}>Select your UPI app</Text>
            <View style={styles.upiGrid}>
              {samplePaymentMethods
                .filter((method) => method.type === "upi")
                .map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[styles.upiOption, selectedMethod === method.id && styles.selectedUpiOption]}
                    onPress={() => setSelectedMethod(method.id)}
                  >
                    <Image source={{ uri: method.upiIcon }} style={styles.upiIcon} />
                    <Text style={styles.upiAppName}>{method.upiApp}</Text>
                    {selectedMethod === method.id && (
                      <View style={styles.upiCheckmark}>
                        <Ionicons name="checkmark-circle" size={20} color="#69C779" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={styles.otherUpiButton}>
              <Text style={styles.otherUpiButtonText}>OTHER UPI APPS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpLink}>
              <Text style={styles.helpLinkText}>How to pay using UPI?</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() =>
          navigation.navigate("Address", {
            ...route.params,
            paymentMethod: samplePaymentMethods.find((m) => m.id === selectedMethod),
          })
        }
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>

      <UpiInputModal />
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
  addButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#69C779",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#69C779",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCard: {
    borderColor: "#69C779",
    borderWidth: 2,
  },
  defaultBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    color: "#69C779",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardInfo: {
    marginTop: 24,
  },
  cardTypeImage: {
    width: 60,
    height: 40,
    resizeMode: "contain",
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDetailText: {
    color: "#666",
    fontSize: 14,
  },
  checkmark: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  upiContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  upiTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 16,
  },
  upiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  upiOption: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  selectedUpiOption: {
    borderColor: "#69C779",
    borderWidth: 2,
  },
  upiIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginBottom: 8,
  },
  upiAppName: {
    fontSize: 14,
    color: "#333",
  },
  upiCheckmark: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  otherUpiButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  otherUpiButtonText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  helpLink: {
    alignItems: "center",
  },
  helpLinkText: {
    fontSize: 14,
    color: "#69C779",
    textDecorationLine: "underline",
  },
  nextButton: {
    backgroundColor: "#69C779",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  upiInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  proceedButton: {
    backgroundColor: "#69C779",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 16,
  },
})

