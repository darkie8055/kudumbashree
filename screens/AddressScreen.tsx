import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native"
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
    name: "Anitha Kumari",
    street: "Vadakkevila, Near St. Joseph's Church",
    city: "Kollam, Kerala, 691010",
    phone: "+91 9847123456",
    isDefault: true,
  },
  {
    id: "2",
    name: "Sunitha Babu",
    street: "Palayam Junction, Near Secretariat",
    city: "Thiruvananthapuram, Kerala, 695033",
    phone: "+91 9995678901",
  },
]

export default function AddressScreen({ navigation, route }) {
  const [selectedAddress, setSelectedAddress] = useState<string>(sampleAddresses[0].id)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>(sampleAddresses)
  const [newAddress, setNewAddress] = useState({
    name: "",
    street: "",
    city: "",
    phone: "",
  })
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  if (!fontsLoaded) {
    return null
  }

  const handleNext = () => {
    const selected = addresses.find((a) => a.id === selectedAddress);
    if (selected) {
      navigation.navigate("OrderSummary", {
        cart: route.params?.cart,
        address: selected,
        paymentMethod: route.params?.paymentMethod
      });
    }
  };

  const handleAddAddress = () => {
    if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.phone) {
      return; // Basic validation
    }

    const address: Address = {
      id: Date.now().toString(),
      name: newAddress.name,
      street: newAddress.street,
      city: newAddress.city,
      phone: newAddress.phone,
      isDefault: addresses.length === 0,
    };

    setAddresses([...addresses, address]);
    setNewAddress({ name: "", street: "", city: "", phone: "" });
    setShowAddModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Address</Text>
        <TouchableOpacity style={styles.headerAddButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {addresses.map((address) => (
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
                <Ionicons name="location-outline" size={24} color="#8B5CF6" />
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
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextButton, !selectedAddress && styles.disabledButton]}
        disabled={!selectedAddress}
        onPress={handleNext}
      >
        <LinearGradient
          colors={selectedAddress ? ["#7C3AED", "#C026D3"] : ["#E5E7EB", "#E5E7EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nextButtonGradient}
        >
          <Text style={[styles.nextButtonText, !selectedAddress && styles.disabledButtonText]}>
            Next
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Address Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.addressIconContainer}>
                  <Ionicons name="location-outline" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>Add New Address</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAddress.name}
                  onChangeText={(text) => setNewAddress({ ...newAddress, name: text })}
                  placeholder="Enter full name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Street Address</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={newAddress.street}
                  onChangeText={(text) => setNewAddress({ ...newAddress, street: text })}
                  placeholder="Enter street address"
                  placeholderTextColor="#9CA3AF"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>City, State, PIN</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAddress.city}
                  onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
                  placeholder="Enter city, state, and PIN code"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newAddress.phone}
                  onChangeText={(text) => setNewAddress({ ...newAddress, phone: text })}
                  placeholder="Enter phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={handleAddAddress}
              >
                <LinearGradient
                  colors={["#7C3AED", "#C026D3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>Add Address</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 12,
  },
  headerAddButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  selectedCard: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F5F3FF",
  },
  defaultBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#059669",
    fontSize: 12,
  },
  addressInfo: {
    flexDirection: "row",
    marginTop: 8,
  },
  iconContainer: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  addressDetails: {
    flex: 1,
  },
  name: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 8,
  },
  street: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    lineHeight: 20,
  },
  city: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    lineHeight: 20,
  },
  phone: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#4B5563",
  },
  checkmark: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#8B5CF6",
    borderRadius: 20,
    padding: 4,
  },
  nextButton: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    borderRadius: 16,
  },
  nextButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
    fontSize: 18,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: "#9CA3AF",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addressIconContainer: {
    backgroundColor: "#7C3AED",
    padding: 8,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  modalCloseButton: {
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 12,
  },
  modalScrollView: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#4B5563",
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
  },
  modalAddButton: {
    flex: 1,
  },
  addButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
})

