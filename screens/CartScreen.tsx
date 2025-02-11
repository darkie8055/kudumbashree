import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message';
import { toastConfig, TOAST_DURATION } from '../components/SonnerToast';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const CartScreen = ({ route, navigation }) => {
  const [cart, setCart] = useState<CartItem[]>(route.params?.cart || []);
  const onCartUpdate = route.params?.onCartUpdate;
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [optimizedPrices, setOptimizedPrices] = useState<{[key: string]: number}>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const handleQuantityChange = (item: CartItem, change: number) => {
    const updatedCart = cart.map((cartItem) => {
      if (cartItem.product.id === item.product.id) {
        const newQuantity = Math.max(0, cartItem.quantity + change);
        if (newQuantity === 0) return null;
        return { ...cartItem, quantity: newQuantity };
      }
      return cartItem;
    }).filter(Boolean) as CartItem[];

    setCart(updatedCart);
    if (onCartUpdate) {
      onCartUpdate(updatedCart);
    }
  };

  const getTotalAmount = () => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const clearCart = () => {
    setCart([]);
    if (onCartUpdate) {
      onCartUpdate([]);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      if (onCartUpdate) {
        onCartUpdate(cart);
      }
    });

    return unsubscribe;
  }, [navigation, cart, onCartUpdate]);

  // Add AI-powered cart recommendations
  useEffect(() => {
    const getCartRecommendations = async () => {
      if (cart.length > 0) {
        // Placeholder for Claude AI recommendation logic
        const recommended = cart.slice(0, 3).map(item => ({
          ...item.product,
          id: `rec_${item.product.id}`
        }));
        setRecommendations(recommended);
      }
    };
    getCartRecommendations();
  }, [cart]);

  // Add dynamic price optimization
  useEffect(() => {
    const optimizePrices = async () => {
      // Placeholder for Claude AI price optimization
      const optimized = cart.reduce((acc, item) => ({
        ...acc,
        [item.product.id]: item.product.price * 0.9 // 10% discount example
      }), {});
      setOptimizedPrices(optimized);
    };
    optimizePrices();
  }, [cart]);

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  const renderProductDetails = () => {
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
            <Text style={styles.modalProductPrice}>₹{selectedProduct.price}</Text>
            <Text style={styles.modalProductDescription}>
              {selectedProduct.description || 'No description available'}
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
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.product.imageUrl }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <Text style={styles.productPrice}>₹{item.product.price}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item, -1)}
            style={styles.quantityButton}
          >
            <Ionicons name="remove" size={24} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item, 1)}
            style={styles.quantityButton}
          >
            <Ionicons name="add" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const handleAddToCart = (product: Product) => {
    const existingItemIndex = cart.findIndex(
      (item) => item.product.id === product.id
    );
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      const updatedItem = { 
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
      updatedCart[existingItemIndex] = updatedItem;
      setCart(updatedCart);
      if (onCartUpdate) {
        onCartUpdate(updatedCart);
      }
    } else {
      const updatedCart = [...cart, { product, quantity: 1 }];
      setCart(updatedCart);
      if (onCartUpdate) {
        onCartUpdate(updatedCart);
      }
    }
    
    // Show toast message
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${product.name} has been added`,
      visibilityTime: TOAST_DURATION,
      autoHide: true,
      topOffset: 40,
      bottomOffset: 100,
      position: 'bottom',
      onPress: () => Toast.hide(),
    });
  };

  const renderRecommendations = () => {
    if (!showRecommendations || recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsSection}>
        <View style={styles.recommendationsHeader}>
          <Text style={styles.recommendationsTitle}>You May Also Like</Text>
          <TouchableOpacity 
            onPress={() => setShowRecommendations(false)}
            style={styles.closeRecommendationsButton}
          >
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.recommendationsContainer}>
          <FlatList
            horizontal
            data={recommendations}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recommendedItem}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.recommendedImage}
                  resizeMode="cover"
                />
                <Text style={styles.recommendedName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.recommendedPrice}>₹{item.price}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.continueShopping}
            onPress={() => navigation.navigate("Marketplace")}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={styles.cartList}
          />
          {cart.length > 0 && renderRecommendations()}
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total:</Text>
              <Text style={styles.totalAmount}>₹{getTotalAmount()}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => navigation.navigate("Payment", { cart })}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearCartButton}
              onPress={clearCart}
            >
              <Text style={styles.clearCartText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {renderProductDetails()}
      <Toast config={toastConfig} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  productPrice: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
    color: "#333",
  },
  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#69C779",
  },
  checkoutButton: {
    backgroundColor: "#69C779",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  clearCartButton: {
    backgroundColor: "#f44336",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  clearCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyCartText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  continueShopping: {
    backgroundColor: "#69C779",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  recommendationsSection: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    maxHeight: 180, // Reduced height
  },
  recommendationsContainer: {
    height: 140, // Fixed height for recommendations container
  },
  recommendedItem: {
    width: 100,
    height: 140, // Fixed height for item
    marginRight: 8,
  },
  recommendedImage: {
    width: 100,
    height: 80, // Adjusted image height
    borderRadius: 8,
  },
  recommendedName: {
    fontSize: 12,
    marginTop: 4,
    height: 32, // Fixed height for text
    numberOfLines: 2,
    ellipsizeMode: 'tail',
  },
  recommendedPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#69C779',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalProductName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalProductPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#69C779',
    marginBottom: 8,
  },
  modalProductDescription: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
  },
  modalAddToCartButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAddToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700', // Changed to bold
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeRecommendationsButton: {
    padding: 4,
  },
});

export default CartScreen;
