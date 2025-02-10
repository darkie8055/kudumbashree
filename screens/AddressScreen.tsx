import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

interface Address {
  id: string
  name: string
  street: string
  city: string
  phone: string
  isDefault?: boolean
}

const sampleAddresses: Address[] = [
  {
    id: "1",
    name: "Jessica Simpson",
    street: "2811 Crescent Day, LA Port",
    city: "California, United States, 77571",
    phone: "+1 202 555 0142",
    isDefault: true,
  },
  {
    id: "2",
    name: "William Crown",
    street: "2811 Crescent Day, LA Port",
    city: "California, United States, 77571",
    phone: "+1 202 555 0142",
  },
]

export default function AddressScreen({ navigation, route }) {
  const [selectedAddress, setSelectedAddress] = useState<string>(sampleAddresses[0].id)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Address</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {sampleAddresses.map((address) => (
          <TouchableOpacity
            key={address.id}
            style={[styles.addressCard, selectedAddress === address.id && styles.selectedCard]}
            onPress={() => setSelectedAddress(address.id)}
          >
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>DEFAULT</Text>
              </View>
            )}

            <View style={styles.addressInfo}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={24} color="#69C779" />
              </View>
              <View style={styles.addressDetails}>
                <Text style={styles.name}>{address.name}</Text>
                <Text style={styles.street}>{address.street}</Text>
                <Text style={styles.city}>{address.city}</Text>
                <Text style={styles.phone}>{address.phone}</Text>
              </View>
            </View>

            {selectedAddress === address.id && (
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
          navigation.navigate("OrderSummary", {
            ...route.params,
            address: sampleAddresses.find((a) => a.id === selectedAddress),
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
  addressCard: {
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
  addressInfo: {
    flexDirection: "row",
    marginTop: 24,
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 4,
  },
  addressDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  street: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  city: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: "#666",
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

