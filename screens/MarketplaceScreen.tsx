"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Animated,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator,
  TextStyle, // Add this import
  ViewStyle,
  ImageStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { debounce } from "lodash";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import Toast from "react-native-toast-message";
import { toastConfig, TOAST_DURATION } from "../components/SonnerToast";
import { useUser } from "../contexts/UserContext";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description: string;
  unit: string;
  phone: string;
  category: string;
  location: string;
  status?: string;
  createdAt?: Date;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// Add missing constants
const categories = [
  "All",
  "Food",
  "Beauty",
  "Handicrafts",
  "Clothing",
  "Others",
];
const sortOptions = ["name", "priceLow", "priceHigh", "location"];

// Update Props interface
interface Props {
  navigation: StackNavigationProp<RootStackParamList>;
  route?: {
    params?: {
      cart?: CartItem[];
    };
  };
}

const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Lavender Bliss Handmade Soap",
    price: 150,
    imageUrl:
      "https://www.quickpantry.in/cdn/shop/products/dabur-honey-bottle-quick-pantry-1.jpg?v=1710538000&width=750",
    unit: "Ernakulam Kudumbashree",
    phone: "9876543210",
    description:
      "A calming lavender-scented handmade soap enriched with natural oils.",
    category: "Beauty",
    location: "Ernakulam",
  },
  {
    id: "2",
    name: "Pure Kerala Organic Honey",
    price: 250,
    imageUrl:
      "https://www.quickpantry.in/cdn/shop/products/dabur-honey-bottle-quick-pantry-1.jpg?v=1710538000&width=750",
    unit: "Kozhikode Kudumbashree",
    phone: "9876543211",
    description:
      "Fresh, organic honey sourced directly from Kerala's local beekeepers.",
    category: "Food",
    location: "Kozhikode",
  },
  // ... other sample products
];

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.44;

const AnimatedFlatList = Animated.createAnimatedComponent<any>(FlatList);

// Add Claude AI client
const claudeClient = {
  getRecommendations: async (products: Product[], userPreferences: any) => {
    // Placeholder for Claude AI integration
    return products.slice(0, 5); // Return top 5 recommended products
  },

  enhanceSearch: async (query: string) => {
    // Placeholder for AI-enhanced search
    return query;
  },
};

// Add global type declaration
declare global {
  var addNewProduct: ((product: Product) => void) | null;
}

export default function MarketplaceScreen({ navigation, route }) {
  const { userId, userDetails } = useUser();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [cart, setCart] = useState<CartItem[]>(route?.params?.cart || []);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("name");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!route?.params?.cart) {
      navigation.setParams({ cart: [] });
    }
  }, []);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(200)).current;

  const handleAddToCart = useCallback(
    async (product: Product) => {
      if (!userId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please sign in to add items to cart",
        });
        return;
      }

      try {
        const db = getFirestore();
        const cartRef = doc(db, "K-member", userId, "cart", product.id);
        await setDoc(
          cartRef,
          {
            productId: product.id,
            quantity: 1,
            addedAt: new Date(),
            price: product.price,
            name: product.name,
            imageUrl: product.imageUrl,
          },
          { merge: true }
        );

        // Update local cart state
        setCart(prevCart => {
          const existingItem = prevCart.find(item => item.product.id === product.id);
          if (existingItem) {
            return prevCart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prevCart, { product, quantity: 1 }];
        });

        // Update navigation params to reflect new cart state
        navigation.setParams({ 
          cart: cart.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        });

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Added to cart",
        });
      } catch (error) {
        console.error("Error adding to cart:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to add to cart",
        });
      }
    },
    [userId, cart, navigation]
  );

  const handleProductPress = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      return (
        <View style={styles.productCard}>
          <TouchableOpacity onPress={() => handleProductPress(item)}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
            />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>₹{item.price}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      );
    },
    [handleProductPress, handleAddToCart]
  );

  const fetchProducts = useCallback(
    async (shouldRefresh = false) => {
      try {
        setIsLoading(true);
        const db = getFirestore();

        let baseQuery = query(
          collection(db, "products"),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        if (!shouldRefresh && lastDoc) {
          baseQuery = query(baseQuery, startAfter(lastDoc));
        }

        const querySnapshot = await getDocs(baseQuery);

        const newProducts: Product[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "",
            imageUrl: data.imageUrl || "",
            price: data.price || 0,
            description: data.description || "",
            unit: data.unit || "",
            phone: data.phone || "",
            category: data.category || "",
            location: data.location || "",
            status: data.status || "pending",
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });

        if (shouldRefresh) {
          setProducts(newProducts);
          setFilteredProducts(newProducts);
        } else {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueNewProducts = newProducts.filter(
              (p) => !existingIds.has(p.id)
            );
            const updatedProducts = [...prev, ...uniqueNewProducts];
            setFilteredProducts(updatedProducts);
            return updatedProducts;
          });
        }

        setHasMore(querySnapshot.docs.length === 10);
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } catch (error) {
        console.error("Error fetching products:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load products",
          visibilityTime: 3000,
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [lastDoc]
  );

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    fetchProducts(true);
  }, [fetchProducts]);

  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 300),
    []
  );

  const handleRemoveFromCart = useCallback(
    (product: Product) => {
      const updatedCart = cart.filter((item) => item.product.id !== product.id);
      setCart(updatedCart);
    },
    [cart, setCart]
  );

  const handleQuantityChange = useCallback(
    (product: Product, quantity: number) => {
      if (quantity <= 0) {
        handleRemoveFromCart(product);
      } else {
        const updatedCart = cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity } : item
        );
        setCart(updatedCart);
      }
    },
    [cart, handleRemoveFromCart, setCart]
  );

  const goToCart = useCallback(() => {
    navigation.navigate("Cart", {
      cart,
      onCartUpdate: (updatedCart: CartItem[]) => {
        setCart(updatedCart);
      },
    });
  }, [cart, navigation, setCart]);

  const goToProductManagement = useCallback(() => {
    navigation.navigate("ProductManagement");
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchProducts();
    }
  }, [hasMore, isLoading, fetchProducts]);

  const filterAndSortProducts = useCallback(() => {
    if (!products?.length) return;

    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    const sortedProducts = [...filtered];
    switch (sortOption) {
      case "priceLow":
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case "priceHigh":
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case "location":
        sortedProducts.sort((a, b) => a.location.localeCompare(b.location));
        break;
      default:
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(sortedProducts);
  }, [products, searchQuery, selectedCategory, sortOption]);

  const renderProductDetails = useCallback(() => {
    if (!selectedProduct) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedProduct.imageUrl }}
              style={styles.modalImage}
            />
            <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
            <Text style={styles.modalProductPrice}>
              ₹{selectedProduct.price}
            </Text>
            <Text style={styles.modalProductUnit}>
              Unit: {selectedProduct.unit}
            </Text>
            <Text style={styles.modalProductDescription}>
              {selectedProduct.description}
            </Text>
            <Text style={styles.modalProductCategory}>
              Category: {selectedProduct.category}
            </Text>
            <Text style={styles.modalProductLocation}>
              Location: {selectedProduct.location}
            </Text>
            <TouchableOpacity
              style={styles.modalAddToCartButton}
              onPress={() => {
                handleAddToCart(selectedProduct);
                closeModal();
              }}
            >
              <Text style={styles.modalAddToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }, [selectedProduct, isModalVisible, closeModal, handleAddToCart]);

  const renderRecommendations = useCallback(() => {
    if (recommendations.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Recommended for You</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={recommendations}
          keyExtractor={(item) => `recommended-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recommendedItem}
              onPress={() => handleProductPress(item)}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.recommendedImage}
              />
              <Text
                style={styles.recommendedName}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
              <Text style={styles.recommendedPrice}>₹{item.price}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }, [recommendations, handleProductPress]);

  // Add a function to calculate total cart items
  const getTotalCartItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const renderHeader = useCallback(() => {
    const headerTranslate = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -50],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          style={styles.gradientHeader}
        >
          <Text style={styles.pageHeading}>K-MART</Text>

          <TouchableOpacity
            style={styles.sellButton}
            onPress={goToProductManagement}
          >
            <View style={styles.sellButtonContent}>
              <Ionicons name="add-circle" size={16} color="#fff" />
              <Text style={styles.sellButtonText}>Sell Product</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
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
                style={[
                  styles.categoryButton,
                  selectedCategory === item && styles.selectedCategoryButton,
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item && styles.selectedCategoryText,
                  ]}
                >
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
                style={[
                  styles.categoryButton,
                  sortOption === item && styles.selectedCategoryButton,
                ]}
                onPress={() => setSortOption(item)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    sortOption === item && styles.selectedCategoryText,
                  ]}
                >
                  {`${item.charAt(0).toUpperCase()}${item
                    .slice(1)
                    .replace(/([A-Z])/g, " $1")}`}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {renderRecommendations()}
      </Animated.View>
    );
  }, [
    selectedCategory,
    cart,
    debouncedSearch,
    scrollY,
    sortOption,
    goToCart,
    recommendations,
    renderRecommendations,
    goToProductManagement,
    getTotalCartItems,
  ]);

  useEffect(() => {
    fetchProducts();

    global.addNewProduct = (newProduct: Product) => {
      if (newProduct.status === "approved") {
        setProducts((prevProducts) => {
          if (prevProducts.some((p) => p.id === newProduct.id)) {
            return prevProducts;
          }
          return [
            {
              ...newProduct,
              id: newProduct.id || String(Date.now()),
              createdAt: newProduct.createdAt || new Date(),
            },
            ...prevProducts,
          ];
        });

        Toast.show({
          type: "success",
          text1: "Product Listed",
          text2: "Your product is now available in the marketplace",
          visibilityTime: 3000,
        });
      }
    };

    return () => {
      global.addNewProduct = null;
    };
  }, [fetchProducts]);

  useEffect(() => {
    filterAndSortProducts();
  }, [
    products,
    searchQuery,
    selectedCategory,
    sortOption,
    filterAndSortProducts,
  ]);

  useEffect(() => {
    const getAIRecommendations = async () => {
      if (products.length > 0) {
        const userPreferences = {
          recentViews: selectedProduct ? [selectedProduct] : [],
          cartItems: cart,
        };
        const recommended = await claudeClient.getRecommendations(
          products,
          userPreferences
        );
        setRecommendations(recommended);
      }
    };
    getAIRecommendations();
  }, [products, selectedProduct, cart]);

  // Add listener for product deletions
  useEffect(() => {
    const db = getFirestore();
    const unsubscribe = onSnapshot(
      doc(db, "system", "marketplace"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const deletedId = data?.deletedProductId;
          
          if (deletedId) {
            // Remove deleted product from products and filtered products
            setProducts(prev => prev.filter(p => p.id !== deletedId));
            setFilteredProducts(prev => prev.filter(p => p.id !== deletedId));
            
            // Remove from cart if present
            setCart(prev => prev.filter(item => item.product.id !== deletedId));
          }
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
    }
  ) as any;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AnimatedFlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => `product-${item.id}`}
        numColumns={2}
        contentContainerStyle={styles.productListContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#8B5CF6" />
            ) : filteredProducts.length === 0 ? (
              <Text style={styles.emptyStateText}>No products found</Text>
            ) : null}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          hasMore && isLoading ? (
            <ActivityIndicator
              size="large"
              color="#8B5CF6"
              style={styles.footerLoader}
            />
          ) : null
        }
      />
      {renderProductDetails()}

      {/* Add floating cart button */}
      <TouchableOpacity 
        style={styles.floatingCartButton} 
        onPress={goToCart}
      >
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingCartGradient}
        >
          <Ionicons name="cart" size={24} color="#fff" />
          {getTotalCartItems() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {getTotalCartItems()}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Toast config={toastConfig} />
    </SafeAreaView>
  );
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  sellButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 1,
    borderRadius: 20,
  },
  sellButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "bold",
    fontSize: 14,
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
    alignItems: "center",
  },
  addToCartButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  productListContainer: {
    paddingBottom: 70,
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
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalProductName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalProductPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#69C779",
    marginBottom: 8,
  },
  modalProductUnit: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalProductDescription: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalProductCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  modalProductLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  modalAddToCartButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalAddToCartButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  recommendationsSection: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    maxHeight: 200,
  },
  recommendedItem: {
    width: 100,
    marginRight: 8,
  },
  recommendedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  recommendedName: {
    fontSize: 12,
    marginTop: 4,
    color: "#333",
    fontWeight: "500",
  } as TextStyle, // Remove numberOfLines and ellipsizeMode from styles
  recommendedPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#69C779",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
  },
  // Remove old cartIcon styles
  cartIcon: undefined,

  // Add new floating cart styles
  floatingCartButton: {
    position: 'absolute',
    bottom: 85, // Position above tabbar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  floatingCartGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EC4899',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
