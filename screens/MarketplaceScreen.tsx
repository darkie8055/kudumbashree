import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useNavigation } from "@react-navigation/native"
import { debounce } from "lodash"

interface Product {
  id: string
  name: string
  price: number
  imageUrl: string
  unit: string
  phone: string
  description: string
  category: string
}

const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Handmade Soap",
    price: 150,
    imageUrl: "https://picsum.photos/400/400?random=1",
    unit: "Ernakulam Kudumbashree",
    phone: "9876543210",
    description: "Natural, handmade soap with essential oils.",
    category: "Beauty",
  },
  {
    id: "2",
    name: "Organic Honey",
    price: 250,
    imageUrl: "https://www.quickpantry.in/cdn/shop/products/dabur-honey-bottle-quick-pantry-1.jpg?v=1710538000&width=750",
    unit: "Kozhikode Kudumbashree",
    phone: "9876543211",
    description: "Pure, organic honey from local beekeepers.",
    category: "Food",
  },
  {
    id: "3",
    name: "Handwoven Basket",
    price: 300,
    imageUrl: "https://picsum.photos/400/400?random=3",
    unit: "Thrissur Kudumbashree",
    phone: "9876543212",
    description: "Beautiful, handwoven basket made from sustainable materials.",
    category: "Home",
  },
  {
    id: "4",
    name: "Spice Mix",
    price: 100,
    imageUrl: "https://picsum.photos/400/400?random=4",
    unit: "Kannur Kudumbashree",
    phone: "9876543213",
    description: "Traditional Kerala spice mix for curries.",
    category: "Food",
  },
  {
    id: "5",
    name: "Coconut Oil",
    price: 200,
    imageUrl: "https://picsum.photos/400/400?random=5",
    unit: "Alappuzha Kudumbashree",
    phone: "9876543214",
    description: "Cold-pressed, pure coconut oil.",
    category: "Beauty",
  },
]

export default function MarketplaceScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortOption, setSortOption] = useState("name")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigation = useNavigation()

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProducts(sampleProducts)
    } catch (err) {
      setError("Failed to fetch products. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchQuery, selectedCategory, sortOption]) //Corrected dependency array

  const filterAndSortProducts = useCallback(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedCategory === "All" || product.category === selectedCategory),
    )

    switch (sortOption) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "priceLow":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "priceHigh":
        filtered.sort((a, b) => b.price - a.price)
        break
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, selectedCategory, sortOption])

  const handleProductPress = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsModalVisible(true)
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchProducts()
    setIsRefreshing(false)
  }, [fetchProducts])

  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text)
    }, 300),
    [],
  )

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <TouchableOpacity onPress={() => handleProductPress(item)} style={styles.productCard}>
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
      </TouchableOpacity>
    ),
    [handleProductPress],
  )

  const categories = ["All", "Beauty", "Food", "Home"]

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search products..." onChangeText={debouncedSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryButton, selectedCategory === category && styles.selectedCategoryButton]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setSortOption("name")}>
          <Text style={[styles.sortButtonText, sortOption === "name" && styles.activeSortButton]}>Name</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton} onPress={() => setSortOption("priceLow")}>
          <Text style={[styles.sortButtonText, sortOption === "priceLow" && styles.activeSortButton]}>
            Price: Low to High
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton} onPress={() => setSortOption("priceHigh")}>
          <Text style={[styles.sortButtonText, sortOption === "priceHigh" && styles.activeSortButton]}>
            Price: High to Low
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#8B5CF6"]} />}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No products found. Try adjusting your search or filters.</Text>
        }
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        {selectedProduct && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedProduct.imageUrl }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
              <Text style={styles.modalPrice}>₹{selectedProduct.price}</Text>
              <Text style={styles.modalDescription}>{selectedProduct.description}</Text>
              <Text style={styles.modalUnit}>{selectedProduct.unit}</Text>
              <Text style={styles.modalPhone}>Contact: {selectedProduct.phone}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  categoryButton: {
    paddingHorizontal: 16,
    height: 25,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCategoryButton: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  categoryText: {
    color: "#333",
    fontWeight: "600",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sortLabel: {
    marginRight: 10,
    fontWeight: "bold",
  },
  sortButton: {
    marginRight: 10,
  },
  sortButtonText: {
    color: "#666",
  },
  activeSortButton: {
    color: "#8B5CF6",
    fontWeight: "bold",
  },
  productList: {
    paddingHorizontal: 5,
  },
  productCard: {
    flex: 1,
    margin: 5,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "80%",
    alignItems: "center",
  },
  modalImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalPrice: {
    fontSize: 18,
    color: "#8B5CF6",
    marginBottom: 10,
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: 10,
  },
  modalUnit: {
    fontStyle: "italic",
    marginBottom: 5,
  },
  modalPhone: {
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontSize: 16,
  },
})

