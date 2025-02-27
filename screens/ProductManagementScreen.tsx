"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as ImagePicker from "expo-image-picker"
import Toast from "react-native-toast-message"
import { toastConfig, TOAST_DURATION } from "../components/SonnerToast"

interface Product {
  id: string
  name: string
  imageUrl: string
  price: number
  description: string
  unit: string
  phone: string
  category: string
  location: string
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: Date
}

const ProductManagementScreen = ({ navigation }) => {
  // Product form state
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productCategory, setProductCategory] = useState("Food")
  const [productLocation, setProductLocation] = useState("")
  const [productImage, setProductImage] = useState(null)
  const [productUnit, setProductUnit] = useState("Your Kudumbashree")
  const [productPhone, setProductPhone] = useState("+918891115593")

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("add") // 'add' or 'manage'
  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)

  // Load user's products
  useEffect(() => {
    // In a real app, you would fetch this from your backend
    // For now, we'll use mock data
    const mockProducts: Product[] = [
      {
        id: "1001",
        name: "Homemade Pickle",
        price: 120,
        imageUrl: "https://picsum.photos/400/400?random=101",
        unit: "Your Kudumbashree",
        phone: "+918891115593",
        description: "Traditional homemade pickle made with fresh ingredients.",
        category: "Food",
        location: "Kochi",
        status: "approved",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: "1002",
        name: "Handcrafted Soap",
        price: 80,
        imageUrl: "https://picsum.photos/400/400?random=102",
        unit: "Your Kudumbashree",
        phone: "+918891115593",
        description: "Natural handcrafted soap with essential oils.",
        category: "Beauty",
        location: "Thrissur",
        status: "pending",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]

    setMyProducts(mockProducts)
  }, [])

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

  const validateForm = () => {
    if (!productName) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please enter a product name",
      })
      return false
    }

    if (!productPrice || isNaN(Number(productPrice))) {
      Toast.show({
        type: "error",
        text1: "Invalid Price",
        text2: "Please enter a valid price",
      })
      return false
    }

    if (!productDescription) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please enter a product description",
      })
      return false
    }

    if (!productLocation) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please enter your location",
      })
      return false
    }

    if (!productImage) {
      Toast.show({
        type: "error",
        text1: "Missing Image",
        text2: "Please add a product image",
      })
      return false
    }

    return true
  }

  const handlePreview = () => {
    if (!validateForm()) return

    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName,
      price: Number(productPrice),
      imageUrl: productImage,
      description: productDescription,
      category: productCategory,
      location: productLocation,
      unit: productUnit,
      phone: productPhone,
      status: "pending",
      createdAt: new Date(),
    }

    setPreviewProduct(newProduct)
    setIsPreviewVisible(true)
  }

  const handleSubmitProduct = () => {
    if (!previewProduct) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      // Add to user's products
      setMyProducts((prevProducts) => [previewProduct, ...prevProducts])

      // In a real app, you would send this to your backend
      // When approved, you would add it to the global product list
      if (global.addNewProduct) {
        // This would happen after admin approval in a real app
        // global.addNewProduct(previewProduct)
      }

      Toast.show({
        type: "success",
        text1: "Product Submitted",
        text2: "Your product is pending approval",
        visibilityTime: TOAST_DURATION,
      })

      // Reset form and state
      resetForm()
      setIsPreviewVisible(false)
      setIsLoading(false)

      // Switch to manage tab to show the pending product
      setActiveTab("manage")
    }, 1500)
  }

  const resetForm = () => {
    setProductName("")
    setProductPrice("")
    setProductDescription("")
    setProductCategory("Food")
    setProductLocation("")
    setProductImage(null)
    setPreviewProduct(null)
  }

  const handleDeleteProduct = (productId: string) => {
    Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => {
          setMyProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId))

          Toast.show({
            type: "success",
            text1: "Product Deleted",
            text2: "Your product has been deleted",
            visibilityTime: TOAST_DURATION,
          })
        },
        style: "destructive",
      },
    ])
  }

  const handleEditProduct = (product: Product) => {
    // Set form values
    setProductName(product.name)
    setProductPrice(product.price.toString())
    setProductDescription(product.description)
    setProductCategory(product.category)
    setProductLocation(product.location)
    setProductImage(product.imageUrl)

    // Switch to add tab
    setActiveTab("add")

    // Scroll to top
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true })
    }

    Toast.show({
      type: "info",
      text1: "Edit Mode",
      text2: "You can now edit your product",
      visibilityTime: TOAST_DURATION,
    })
  }

  const scrollViewRef = React.useRef(null)

  const renderProductItem = ({ item }: { item: Product }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "approved":
          return "#22c55e"
        case "pending":
          return "#f59e0b"
        case "rejected":
          return "#ef4444"
        default:
          return "#6b7280"
      }
    }

    return (
      <View style={styles.productItem}>
        <Image source={{ uri: item.imageUrl }} style={styles.productItemImage} />
        <View style={styles.productItemContent}>
          <Text style={styles.productItemName}>{item.name}</Text>
          <Text style={styles.productItemPrice}>₹{item.price}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.productItemDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.productItemActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEditProduct(item)}>
            <Ionicons name="pencil" size={18} color="#8B5CF6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteProduct(item.id)}>
            <Ionicons name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderAddProductForm = () => {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} style={styles.formContainer} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.formTitle}>Add New Product</Text>
          <Text style={styles.formSubtitle}>
            Fill in the details below to add your product to the marketplace. Your product will be reviewed before it
            appears in the marketplace.
          </Text>

          {/* Product Image */}
          <Text style={styles.inputLabel}>Product Image*</Text>
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
                  style={[styles.categoryButtonText, productCategory === category && styles.selectedCategoryButtonText]}
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
          <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewButtonGradient}
            >
              <Text style={styles.previewButtonText}>Preview Product</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  const renderManageProducts = () => {
    return (
      <View style={styles.manageContainer}>
        <Text style={styles.formTitle}>Manage Your Products</Text>
        <Text style={styles.formSubtitle}>
          View, edit, and delete your products. Products must be approved before they appear in the marketplace.
        </Text>

        {myProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyStateText}>You haven't added any products yet</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setActiveTab("add")}>
              <Text style={styles.emptyStateButtonText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={myProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    )
  }

  const renderProductPreview = () => {
    if (!previewProduct) return null

    return (
      <View style={styles.previewOverlay}>
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Product Preview</Text>
            <TouchableOpacity onPress={() => setIsPreviewVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.previewContent}>
            <Image source={{ uri: previewProduct.imageUrl }} style={styles.previewImage} />
            <Text style={styles.previewProductName}>{previewProduct.name}</Text>
            <Text style={styles.previewProductPrice}>₹{previewProduct.price}</Text>
            <Text style={styles.previewProductUnit}>Unit: {previewProduct.unit}</Text>
            <Text style={styles.previewProductDescription}>{previewProduct.description}</Text>
            <Text style={styles.previewProductCategory}>Category: {previewProduct.category}</Text>
            <Text style={styles.previewProductLocation}>Location: {previewProduct.location}</Text>

            <View style={styles.previewNote}>
              <Ionicons name="information-circle" size={20} color="#8B5CF6" />
              <Text style={styles.previewNoteText}>
                Your product will be reviewed before it appears in the marketplace.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.previewEditButton} onPress={() => setIsPreviewVisible(false)}>
              <Text style={styles.previewEditButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.previewSubmitButton} onPress={handleSubmitProduct} disabled={isLoading}>
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewSubmitButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.previewSubmitButtonText}>Submit Product</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Management</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "add" && styles.activeTab]}
          onPress={() => setActiveTab("add")}
        >
          <Ionicons name="add-circle" size={20} color={activeTab === "add" ? "#8B5CF6" : "#6b7280"} />
          <Text style={[styles.tabText, activeTab === "add" && styles.activeTabText]}>Add Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "manage" && styles.activeTab]}
          onPress={() => setActiveTab("manage")}
        >
          <Ionicons name="list" size={20} color={activeTab === "manage" ? "#8B5CF6" : "#6b7280"} />
          <Text style={[styles.tabText, activeTab === "manage" && styles.activeTabText]}>Manage Products</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "add" ? renderAddProductForm() : renderManageProducts()}

      {/* Product Preview Modal */}
      {isPreviewVisible && renderProductPreview()}

      <Toast config={toastConfig} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#8B5CF6",
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  activeTabText: {
    color: "#8B5CF6",
    fontWeight: "bold",
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  formSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
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
  previewButton: {
    marginVertical: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  previewButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  previewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  manageContainer: {
    flex: 1,
    padding: 16,
  },
  productItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  productItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  productItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  productItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginTop: 4,
  },
  productItemDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  productItemActions: {
    justifyContent: "space-around",
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  previewContent: {
    padding: 16,
    maxHeight: 400,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewProductName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  previewProductPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 8,
  },
  previewProductUnit: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewProductDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  previewProductCategory: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  previewProductLocation: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  previewNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewNoteText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 8,
    flex: 1,
  },
  previewActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 16,
  },
  previewEditButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  previewEditButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  previewSubmitButton: {
    flex: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  previewSubmitButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  previewSubmitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})

export default ProductManagementScreen

