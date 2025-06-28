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
  TextStyle,
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
  deleteDoc,
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
  createdAt?: Date | string; // Allow both Date and string
}

interface CartItem {
  product: Product;
  quantity: number;
}

// Helper functions to serialize/deserialize cart data
const serializeCartForNavigation = (cart: CartItem[]): CartItem[] => {
  return cart.map((item) => ({
    ...item,
    product: {
      ...item.product,
      createdAt:
        item.product.createdAt instanceof Date
          ? item.product.createdAt.toISOString()
          : item.product.createdAt,
    },
  }));
};

const deserializeCartFromNavigation = (cart: CartItem[]): CartItem[] => {
  return cart.map((item) => ({
    ...item,
    product: {
      ...item.product,
      createdAt:
        typeof item.product.createdAt === "string"
          ? new Date(item.product.createdAt)
          : item.product.createdAt,
    },
  }));
};

// Add this type to your existing Props interface
interface Props {
  navigation: StackNavigationProp<RootStackParamList>;
  route?: {
    params?: {
      cart?: CartItem[];
      userType?: "normal" | "K-member" | "president"; // Add this
    };
  };
}

const categories = [
  "All",
  "Food",
  "Beauty",
  "Handicrafts",
  "Clothing",
  "Others",
];
const sortOptions = ["name", "priceLow", "priceHigh", "location"];

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 32) / 2; // 16px padding on each side, split evenly

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

export default function MarketplaceScreen({ navigation, route }: Props) {
  const { userId, userDetails } = useUser();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [cart, setCart] = useState<CartItem[]>(
    route?.params?.cart ? deserializeCartFromNavigation(route.params.cart) : []
  );
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

  // Add this ref for the recommendations FlatList
  const recommendationsRef = useRef<FlatList>(null);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] =
    useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Add this useEffect for auto-scrolling
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;

    if (recommendations.length > 1 && !isUserScrolling) {
      scrollTimer = setInterval(() => {
        if (
          recommendationsRef.current &&
          recommendations.length > 1 &&
          !isUserScrolling
        ) {
          const nextIndex =
            (currentRecommendationIndex + 1) % recommendations.length;

          try {
            recommendationsRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
              viewPosition: 0.5,
            });
            setCurrentRecommendationIndex(nextIndex);
          } catch (error) {
            // If scrollToIndex fails, scroll to offset instead
            const itemWidth = 108; // 100 + 8 margin
            recommendationsRef.current.scrollToOffset({
              offset: nextIndex * itemWidth,
              animated: true,
            });
            setCurrentRecommendationIndex(nextIndex);
          }
        }
      }, 4000); // Increased to 4 seconds for better UX
    }

    return () => {
      if (scrollTimer) {
        clearInterval(scrollTimer);
      }
    };
  }, [currentRecommendationIndex, recommendations.length, isUserScrolling]);

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
        setCart((prevCart) => {
          const existingItem = prevCart.find(
            (item) => item.product.id === product.id
          );
          if (existingItem) {
            return prevCart.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prevCart, { product, quantity: 1 }];
        });

        // Update navigation params to reflect new cart state
        const updatedCart = cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        navigation.setParams({
          cart: serializeCartForNavigation(updatedCart),
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

  const handleQuantityChange = useCallback(
    async (product: Product, quantity: number) => {
      if (!userId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please sign in to update cart",
        });
        return;
      }

      try {
        const db = getFirestore();

        if (quantity <= 0) {
          // Remove from Firestore if quantity is zero
          const cartRef = doc(db, "K-member", userId, "cart", product.id);
          await deleteDoc(cartRef);

          // Update local state
          const updatedCart = cart.filter(
            (item) => item.product.id !== product.id
          );
          setCart(updatedCart);

          // Update navigation params
          navigation.setParams({
            cart: serializeCartForNavigation(updatedCart),
          });
        } else {
          // Update quantity in Firestore
          const cartRef = doc(db, "K-member", userId, "cart", product.id);
          await setDoc(
            cartRef,
            {
              productId: product.id,
              quantity: quantity,
              addedAt: new Date(),
              price: product.price,
              name: product.name,
              imageUrl: product.imageUrl,
            },
            { merge: true }
          );

          // Update local state
          const existingItemIndex = cart.findIndex(
            (item) => item.product.id === product.id
          );

          if (existingItemIndex !== -1) {
            // Item exists, update quantity
            const updatedCart = [...cart];
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity,
            };
            setCart(updatedCart);

            // Update navigation params
            navigation.setParams({
              cart: serializeCartForNavigation(updatedCart),
            });
          } else {
            // Item doesn't exist, add it
            const updatedCart = [...cart, { product, quantity }];
            setCart(updatedCart);

            // Update navigation params
            navigation.setParams({
              cart: serializeCartForNavigation(updatedCart),
            });
          }
        }

        Toast.show({
          type: "success",
          text1: "Cart Updated",
          text2: quantity === 0 ? "Item removed from cart" : "Quantity updated",
          visibilityTime: TOAST_DURATION,
        });
      } catch (error) {
        console.error("Error updating cart:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to update cart",
        });
      }
    },
    [cart, userId, navigation]
  );

  // Update the renderProduct function with quantity controls
  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      // Find if product is already in cart
      const cartItem = cart.find((i) => i.product.id === item.id);
      const quantity = cartItem ? cartItem.quantity : 0;

      return (
        <View style={styles.productCard}>
          <TouchableOpacity onPress={() => handleProductPress(item)}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
            />
            <Text
              style={styles.productName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            <Text style={styles.productPrice}>₹{item.price}</Text>
          </TouchableOpacity>

          {quantity > 0 ? (
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item, quantity - 1)}
              >
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(item, quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item)}
            >
              <Text style={styles.addToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [handleProductPress, handleAddToCart, cart, handleQuantityChange]
  );

  const fetchProducts = useCallback(async (shouldRefresh = false) => {
    if (isLoading && !shouldRefresh) return;

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
        // Don't set filteredProducts directly - let useEffect handle filtering
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNewProducts = newProducts.filter(
            (p) => !existingIds.has(p.id)
          );
          const updatedProducts = [...prev, ...uniqueNewProducts];
          // Don't set filteredProducts directly - let useEffect handle filtering
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
  }, []);

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
    if (!products?.length) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products]; // Create a copy to avoid mutation

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim()) ||
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim()) ||
          product.category
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim())
      );
    }

    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Apply sorting
    const sortedProducts = [...filtered];
    switch (sortOption) {
      case "priceLow":
        sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "priceHigh":
        sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "location":
        sortedProducts.sort((a, b) =>
          (a.location || "").localeCompare(b.location || "")
        );
        break;
      case "name":
      default:
        sortedProducts.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        break;
    }

    setFilteredProducts(sortedProducts);
  }, [products, searchQuery, selectedCategory, sortOption]);

  const renderProductDetails = useCallback(() => {
    if (!selectedProduct) return null;

    // Find if product is already in cart
    const cartItem = cart.find((i) => i.product.id === selectedProduct.id);
    const quantity = cartItem ? cartItem.quantity : 0;

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

            {quantity > 0 ? (
              <View style={styles.modalQuantityContainer}>
                <TouchableOpacity
                  style={styles.modalQuantityButton}
                  onPress={() =>
                    handleQuantityChange(selectedProduct, quantity - 1)
                  }
                >
                  <Ionicons name="remove" size={20} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.modalQuantityText}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.modalQuantityButton}
                  onPress={() =>
                    handleQuantityChange(selectedProduct, quantity + 1)
                  }
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.modalAddToCartButton}
                onPress={() => {
                  handleAddToCart(selectedProduct);
                }}
              >
                <Text style={styles.modalAddToCartButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  }, [
    selectedProduct,
    isModalVisible,
    closeModal,
    handleAddToCart,
    cart,
    handleQuantityChange,
  ]);

  const renderRecommendations = useCallback(() => {
    if (recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsHeader}>Recommended for You</Text>
        <FlatList
          ref={recommendationsRef}
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
          onScrollBeginDrag={() => {
            setIsUserScrolling(true);
          }}
          onScrollEndDrag={() => {
            // Resume auto-scroll after 3 seconds of user inactivity
            setTimeout(() => setIsUserScrolling(false), 3000);
          }}
          onScrollToIndexFailed={(info) => {
            // Better error handling for scroll failures
            setTimeout(() => {
              if (
                recommendationsRef.current &&
                info.index < recommendations.length
              ) {
                try {
                  recommendationsRef.current.scrollToIndex({
                    index: info.index,
                    animated: false,
                    viewPosition: 0.5,
                  });
                } catch (error) {
                  // Fallback to scrollToOffset
                  const itemWidth = 108; // 100 + 8 margin
                  recommendationsRef.current.scrollToOffset({
                    offset: info.index * itemWidth,
                    animated: false,
                  });
                }
              }
            }, 100);
          }}
          getItemLayout={(data, index) => ({
            length: 108, // Item width (100) + margin (8)
            offset: 108 * index,
            index,
          })}
          contentContainerStyle={{
            paddingLeft: 16,
            paddingRight: 16,
          }}
          initialScrollIndex={0}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 100,
          }}
        />
      </View>
    );
  }, [recommendations, handleProductPress]);

  // Add a function to calculate total cart items
  const getTotalCartItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Update the renderHeader function
  const renderHeader = useCallback(() => {
    return (
      <View>
        <LinearGradient
          colors={["#7C3AED", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="storefront" size={24} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>K-MART</Text>
            {/* Only show Sell Product button if user is not a normal user */}
            {route?.params?.userType !== "normal" && (
              <TouchableOpacity
                style={styles.headerBadge}
                onPress={goToProductManagement}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.headerSubtitle}>Sell Product</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Search and other sections */}
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
      </View>
    );
  }, [
    selectedCategory,
    cart,
    debouncedSearch,
    sortOption,
    goToCart,
    recommendations,
    renderRecommendations,
    goToProductManagement,
    getTotalCartItems,
    route?.params?.userType,
  ]);

  useEffect(() => {
    const initialFetch = async () => {
      await fetchProducts(true);
    };
    initialFetch();
  }, []);

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
    searchQuery,
    selectedCategory,
    sortOption,
    products,
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
            setProducts((prev) => prev.filter((p) => p.id !== deletedId));
            setFilteredProducts((prev) =>
              prev.filter((p) => p.id !== deletedId)
            );

            // Remove from cart if present
            setCart((prev) =>
              prev.filter((item) => item.product.id !== deletedId)
            );
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
        columnWrapperStyle={styles.productRow}
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
      <TouchableOpacity style={styles.floatingCartButton} onPress={goToCart}>
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingCartGradient}
        >
          <Ionicons name="cart" size={24} color="#fff" />
          {getTotalCartItems() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalCartItems()}</Text>
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
    paddingBottom: 30,
    fontFamily: "Poppins_600SemiBold",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: -16, // Negative margin to extend to screen edges
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    height: 48,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#fff",
    flex: 1,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  searchContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    flex: 1,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#f5f5f5",
    resizeMode: "cover",
  },
  productName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 12,
    marginBottom: 4,
    marginHorizontal: 12,
    color: "#1F2937",
    lineHeight: 18,
    minHeight: 36, // Ensure consistent height for 2 lines
  },
  productPrice: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#059669",
    marginBottom: 0,
    marginHorizontal: 12,
  },
  addToCartButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addToCartButtonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  productListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 70,
  },
  productRow: {
    justifyContent: "space-between",
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
  recommendationsContainer: {
    marginTop: 24,
  },
  recommendationsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  recommendedItem: {
    width: 100,
    marginRight: 8,
    opacity: 1, // Add this for smooth transitions
    transform: [{ scale: 1 }], // Add this for smooth transitions
  },
  recommendedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0", // Add placeholder color
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
    position: "absolute",
    bottom: 85, // Position above tabbar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  floatingCartGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EC4899",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 12,
    marginBottom: 12,
    minHeight: 44, // Match button height
  },
  quantityButton: {
    backgroundColor: "#8B5CF6",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#4B5563",
  },
  modalQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
  },
  modalQuantityButton: {
    backgroundColor: "#8B5CF6",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalQuantityText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#4B5563",
  },
});
