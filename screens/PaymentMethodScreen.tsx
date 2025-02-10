import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

interface PaymentMethod {
  id: string
  type: "visa" | "mastercard"
  number: string
  expiry: string
  cvv: string
  isDefault?: boolean
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
    type: "visa",
    number: "XXXX XXXX XXXX 3694",
    expiry: "01/22",
    cvv: "658",
  },
]

export default function PaymentMethodScreen({ navigation, route }) {
  const [selectedMethod, setSelectedMethod] = useState<string>(samplePaymentMethods[0].id)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select A Card</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {samplePaymentMethods.map((method) => (
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
                source={method.type === "visa" ? require("../assets/visa.png") : require("../assets/mastercard.png")}
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
        ))}
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
})

