"use client"

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
  location: string
}

interface CartItem {
  product: Product
  quantity: number
}

const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Handmade Soap",
    price: 150,
    imageUrl:
      "https://www.quickpantry.in/cdn/shop/products/dabur-honey-bottle-quick-pantry-1.jpg?v=1710538000&width=750",
    unit: "Ernakulam Kudumbashree",
    phone: "9876543210",
    description: "Natural, handmade soap with essential oils.",
    category: "Beauty",
    location: "Ernakulam",
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
    location: "Kozhikode",
  },
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
      location: ["Ernakulam", "Kozhikode", "Thrissur", "Kannur"][Math.floor(Math.random() * 4)],
    })),
]

const { width } = Dimensions.get("window")
const ITEM_WIDTH = width * 0.44

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export default function MarketplaceScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortOption, setSortOption] = useState("name")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocationDropdownVisible, setIsLocationDropdownVisible] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("")
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
  }, [products, searchQuery, selectedCategory, sortOption, selectedLocation]) //Corrected dependency array

  const filterAndSortProducts = useCallback(() => {
    const filtered = products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const categoryMatch = selectedCategory === "All" || product.category === selectedCategory
      const locationMatch =
        selectedLocation === "" || selectedLocation === "All" || product.location === selectedLocation
      return nameMatch && categoryMatch && locationMatch
    })

    const sortedProducts = [...filtered]

    if (sortOption === "priceLow") {
      sortedProducts.sort((a, b) => a.price - b.price)
    } else if (sortOption === "priceHigh") {
      sortedProducts.sort((a, b) => b.price - a.price)
    } else if (sortOption === "location") {
      sortedProducts.sort((a, b) => a.location.localeCompare(b.location))
    } else {
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name))
    }

    setFilteredProducts(sortedProducts)
  }, [products, searchQuery, selectedCategory, sortOption, selectedLocation])

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

  const handleAddToCart = useCallback(
    (product: Product) => {
      const existingItemIndex = cart.findIndex((item) => item.product.id === product.id)
      if (existingItemIndex !== -1) {
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += 1
        setCart(updatedCart)
      } else {
        setCart([...cart, { product, quantity: 1 }])
      }
    },
    [cart],
  )

  const handleRemoveFromCart = useCallback(
    (product: Product) => {
      const updatedCart = cart.filter((item) => item.product.id !== product.id)
      setCart(updatedCart)
    },
    [cart],
  )

  const handleQuantityChange = useCallback(
    (product: Product, quantity: number) => {
      if (quantity <= 0) {
        handleRemoveFromCart(product)
      } else {
        const updatedCart = cart.map((item) => (item.product.id === product.id ? { ...item, quantity } : item))
        setCart(updatedCart)
      }
    },
    [cart, handleRemoveFromCart],
  )

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      return (
        <View style={styles.productCard}>
          <TouchableOpacity onPress={() => handleProductPress(item)}>
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>₹{item.price}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addToCartButton} onPress={() => handleAddToCart(item)}>
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      )
    },
    [handleProductPress, handleAddToCart],
  )

  const categories = ["All", "Beauty", "Food", "Home"]
  const locations = [
    "All",
    "Ernakulam",
    "Kozhikode",
    "Thrissur",
    "Kannur",
    "Kottayam",
    "Palakkad",
    "Malappuram",
    "Thiruvananthapuram",
    "Alappuzha",
    "Kollam",
    "Pathanamthitta",
    "Idukki",
    "Wayanad",
    "Kasaragod",
  ]
  const sortOptions = ["name", "priceLow", "priceHigh", "location"]

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

        <TouchableOpacity style={styles.cartIcon} onPress={() => navigation.navigate("CartScreen",{ cart })}>
          <Ionicons name="cart" size={30} color="#fff" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.reduce((acc, item) => acc + item.quantity, 0)}</Text>
            </View>
          )}
        </TouchableOpacity>

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
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Sort By</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={sortOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryButton, sortOption === item && styles.selectedCategoryButton]}
                onPress={() => setSortOption(item)}
              >
                <Text style={[styles.categoryText, sortOption === item && styles.selectedCategoryText]}>
                  {item.charAt(0).toUpperCase() + item.slice(1).replace(/([A-Z])/g, " $1")}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Animated.View>
    )
  }, [selectedCategory, cart, debouncedSearch, scrollY, sortOption])

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AnimatedFlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productListContainer}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      />
      <Modal visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        {/* Modal Content */}
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 90,
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  gradientHeader: {
    padding: 16,
    borderRadius: 8,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  searchContainer: {
    marginTop: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  cartIcon: {
    position: "absolute",
    top: 30,
    right: 25,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EC4899",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
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
  categoryText: {
    fontSize: 14,
    color: "#333",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  productCard: {
    width: ITEM_WIDTH,
    margin: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  productImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    marginVertical: 8,
    marginLeft: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff0000",
    marginBottom: 8,
    marginLeft: 8,
  },
  addToCartButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: "center",
  },
  addToCartButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  productListContainer: {
    paddingBottom: 70,
  },
})

