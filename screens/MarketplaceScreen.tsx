import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useNavigation } from "@react-navigation/native"
import { debounce } from "lodash"
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins"

interface Product {
  id: string
  name: string
  imageUrl: string
  price: number
  description: string
  unit: string
  phone: string
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
    imageUrl:
      "https://www.quickpantry.in/cdn/shop/products/dabur-honey-bottle-quick-pantry-1.jpg?v=1710538000&width=750",
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
  // Add more sample products to ensure scrolling
  ...Array(15)
    .fill(null)
    .map((_, index) => ({
      id: `${index + 6}`,
      name: `Product ${index + 6}`,
      price: Math.floor(Math.random() * 500) + 50,
      imageUrl: `https://picsum.photos/400/400?random=${index + 6}`,
      unit: "Sample Kudumbashree",
      phone: "9876543200",
      description: "Sample product description.",
      category: ["Beauty", "Food", "Home"][Math.floor(Math.random() * 3)],
    })),
]

const { width } = Dimensions.get("window")
const ITEM_WIDTH = width * 0.44

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
  const scrollY = useRef(new Animated.Value(0)).current
  const headerHeight = useRef(new Animated.Value(200)).current

  const navigation = useNavigation()

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  })

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Simulate fetching products from an API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProducts(sampleProducts)
    } catch (error) {
      setError("Failed to fetch products")
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
    const filtered = products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const categoryMatch = selectedCategory === "All" || product.category === selectedCategory
      return nameMatch && categoryMatch
    })

    const sortedProducts = [...filtered]

    if (sortOption === "priceLow") {
      sortedProducts.sort((a, b) => a.price - b.price)
    } else if (sortOption === "priceHigh") {
      sortedProducts.sort((a, b) => b.price - a.price)
    } else {
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name))
    }

    setFilteredProducts(sortedProducts)
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
    ({ item, index }: { item: Product; index: number }) => {
      const inputRange = [-1, 0, 200 + 230 * index - 100, 200 + 230 * (index + 2) - 100]
      const scale = scrollY.interpolate({
        inputRange,
        outputRange: [1, 1, 1, 0.8],
        extrapolate: "clamp",
      })
      const opacity = scrollY.interpolate({
        inputRange,
        outputRange: [1, 1, 1, 0],
        extrapolate: "clamp",
      })
      return (
        <Animated.View style={[styles.productCard, { transform: [{ scale }], opacity }]}>
          <TouchableOpacity onPress={() => handleProductPress(item)}>
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>₹{item.price}</Text>
          </TouchableOpacity>
        </Animated.View>
      )
    },
    [handleProductPress, scrollY],
  )

  const categories = ["All", "Beauty", "Food", "Home"]

  const renderHeader = useCallback(() => {
    const headerTranslate = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -50],
      extrapolate: "clamp",
    })

    return (
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslate }] }]}>
        <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.gradientHeader}>
          <Text style={styles.pageHeading}>Marketplace</Text>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            onChangeText={debouncedSearch}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Categories</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryButton, selectedCategory === item && styles.selectedCategoryButton]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.categoryText, selectedCategory === item && styles.selectedCategoryText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Sort by</Text>
          <View style={styles.sortContainer}>
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
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Products</Text>
        </View>
      </Animated.View>
    )
  }, [scrollY, debouncedSearch, selectedCategory, sortOption])

  if (!fontsLoaded) {
    return null
  }

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
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      <Animated.FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#8B5CF6"]} />}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No products found. Try adjusting your search or filters.</Text>
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        {selectedProduct && (
          <View style={styles.modalContainer}>
            <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.modalContent}>
              <Image source={{ uri: selectedProduct.imageUrl }} style={styles.modalImage} />
              <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
              <Text style={styles.modalPrice}>₹{selectedProduct.price}</Text>
              <Text style={styles.modalDescription}>{selectedProduct.description}</Text>
              <Text style={styles.modalUnit}>{selectedProduct.unit}</Text>
              <Text style={styles.modalPhone}>Contact: {selectedProduct.phone}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradientHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    backgroundColor: "#fff",
    zIndex: 1000,
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
    fontFamily: "Poppins_400Regular",
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
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  pageHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    paddingVertical: 10,
    color: "#333",
  },
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  categoriesContainer: {
    paddingBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#F3F4F6",
  },
  selectedCategoryButton: {
    backgroundColor: "#8B5CF6",
  },
  categoryText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#4B5563",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  sortContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sortButton: {
    marginRight: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
  },
  sortButtonText: {
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
  },
  activeSortButton: {
    color: "#8B5CF6",
    fontFamily: "Poppins_600SemiBold",
  },
  productList: {
    paddingHorizontal: 10,
  },
  productCard: {
    flex: 1,
    margin: 5,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    width: ITEM_WIDTH,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
    color: "#333",
  },
  productPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#8B5CF6",
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
    width: "90%",
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
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    marginBottom: 10,
    color: "#fff",
  },
  modalPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#fff",
    marginBottom: 10,
  },
  modalDescription: {
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 10,
    color: "#fff",
  },
  modalUnit: {
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
    marginBottom: 5,
    color: "#fff",
  },
  modalPhone: {
    fontFamily: "Poppins_400Regular",
    marginBottom: 15,
    color: "#fff",
  },
  closeButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#8B5CF6",
  },
  emptyListText: {
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 20,
    color: "#4B5563",
    fontSize: 16,
  },
})

