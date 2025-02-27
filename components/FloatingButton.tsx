"use client"

import { useState } from "react"
import {
  View,
  TouchableOpacity,
  Text,
  Linking,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as ImagePicker from "expo-image-picker"
import Toast from "react-native-toast-message"

const CUSTOMER_SERVICE_NUMBER = "+918891115593"
const WHATSAPP_NUMBER = "+918891115593" // You can change this if it's different

const FloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const animation = useState(new Animated.Value(0))[0]

  // Product form state
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productCategory, setProductCategory] = useState("Food")
  const [productLocation, setProductLocation] = useState("")
  const [productImage, setProductImage] = useState(null)

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start()
    setIsOpen(!isOpen)
  }

  const rotation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "45deg"],
        }),
      },
    ],
  }

  const callCustomerService = () => {
    Linking.openURL(`tel:${CUSTOMER_SERVICE_NUMBER}`)
  }

  const openWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}`)
  }

  const talkWithAgent = () => {
    // Implement your bot system here
    // For now, we'll just show an alert
    alert("Connecting you with an agent...")
  }

  const openAddProductForm = () => {
    setIsOpen(false)
    setShowAddProductModal(true)
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setProductImage(result.assets[0].uri)
    }
  }

  const handleSubmitProduct = () => {
    // Validate form
    if (!productName || !productPrice || !productDescription || !productCategory || !productLocation) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill all required fields",
      })
      return
    }

    if (!productImage) {
      Toast.show({
        type: "error",
        text1: "Missing Image",
        text2: "Please add a product image",
      })
      return
    }

    // Here you would typically send this data to your backend
    // For now, we'll just show a success message and close the modal

    // Create a new product object
    const newProduct = {
      id: Date.now().toString(), // Generate a temporary ID
      name: productName,
      price: Number.parseFloat(productPrice),
      description: productDescription,
      category: productCategory,
      location: productLocation,
      imageUrl: productImage,
      unit: "Your Kudumbashree", // This would come from user profile
      phone: WHATSAPP_NUMBER, // This would come from user profile
    }

    // Add to global product list (this would be handled by your state management)
    // For demonstration, we'll use a global event to notify the marketplace screen
    if (global.addNewProduct) {
      global.addNewProduct(newProduct)
    }

    Toast.show({
      type: "success",
      text1: "Product Added",
      text2: "Your product has been listed in the marketplace",
    })

    // Reset form and close modal
    resetForm()
    setShowAddProductModal(false)
  }

  const resetForm = () => {
    setProductName("")
    setProductPrice("")
    setProductDescription("")
    setProductCategory("Food")
    setProductLocation("")
    setProductImage(null)
  }

  const buttonScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMenu} style={styles.button}>
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View style={rotation}>
            <Ionicons name="add" size={24} color="white" />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.menu}>
          {/* Add Product Button (New) */}
          <Animated.View style={[styles.menuItem, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity onPress={openAddProductForm} style={styles.menuButton}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuGradient}
              >
                <Ionicons name="basket-outline" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.menuText}></Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Existing Buttons */}
          <Animated.View style={[styles.menuItem, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity onPress={talkWithAgent} style={styles.menuButton}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuGradient}
              >
                <Ionicons name="chatbubbles-outline" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.menuText}></Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.menuItem, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity onPress={callCustomerService} style={styles.menuButton}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuGradient}
              >
                <Ionicons name="call-outline" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.menuText}></Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.menuItem, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity onPress={openWhatsApp} style={styles.menuButton}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuGradient}
              >
                <Ionicons name="logo-whatsapp" size={20} color="white" />
              </LinearGradient>
              <Text style={styles.menuText}></Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Add Product Modal */}
      <Modal
        visible={showAddProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddProductModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <TouchableOpacity onPress={() => setShowAddProductModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              {/* Product Image */}
              <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
                {productImage ? (
                  <Image source={{ uri: productImage }} style={styles.productImagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={40} color="#8B5CF6" />
                    <Text style={styles.imagePlaceholderText}>Add Product Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Product Name */}
              <Text style={styles.inputLabel}>Product Name*</Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="Enter product name"
              />

              {/* Product Price */}
              <Text style={styles.inputLabel}>Price (₹)*</Text>
              <TextInput
                style={styles.input}
                value={productPrice}
                onChangeText={setProductPrice}
                placeholder="Enter price"
                keyboardType="numeric"
              />

              {/* Product Description */}
              <Text style={styles.inputLabel}>Description*</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={productDescription}
                onChangeText={setProductDescription}
                placeholder="Describe your product"
                multiline={true}
                numberOfLines={4}
              />

              {/* Product Category */}
              <Text style={styles.inputLabel}>Category*</Text>
              <View style={styles.categoryContainer}>
                {["Food", "Beauty", "Home"].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryButton, productCategory === category && styles.selectedCategoryButton]}
                    onPress={() => setProductCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        productCategory === category && styles.selectedCategoryButtonText,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Product Location */}
              <Text style={styles.inputLabel}>Location*</Text>
              <TextInput
                style={styles.input}
                value={productLocation}
                onChangeText={setProductLocation}
                placeholder="Enter your location"
              />

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitProduct}>
                <LinearGradient
                  colors={["#8B5CF6", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>List Product</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 10,
    paddingBottom: 60,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  gradient: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    position: "absolute",
    bottom: 100,
    right: 0,
  },
  menuItem: {
    marginBottom: 15,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    width: 50,
    height: 50,
  },
  menuGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: -2,
  },
  menuText: {
    fontSize: 14,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  formContainer: {
    padding: 16,
  },
  imagePickerContainer: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  productImagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: "#666",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  categoryContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  selectedCategoryButton: {
    backgroundColor: "#8B5CF6",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#333",
  },
  selectedCategoryButtonText: {
    color: "#fff",
  },
  submitButton: {
    marginVertical: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default FloatingButton

