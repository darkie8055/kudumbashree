import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { getFirestore, doc, deleteDoc, setDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserContext";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description?: string;
  unit?: string;
  category?: string;
  location?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartScreenProps {
  navigation: any;
  route: {
    params: {
      cart: CartItem[];
      onCartUpdate: (updatedCart: CartItem[]) => void;
    };
  };
}

export default function CartScreen({ navigation, route }: CartScreenProps) {
  const { userId } = useUser();
  const [cart, setCart] = useState<CartItem[]>(route.params.cart || []);
  const [loading, setLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    // Update the cart if the params change
    if (route.params?.cart) {
      setCart(route.params.cart);
    }
  }, [route.params]);

  const handleQuantityChange = useCallback(
    async (product: Product, quantity: number) => {
      if (!userId) {
        Alert.alert("Error", "Please sign in to update cart");
        return;
      }

      try {
        setUpdatingItem(product.id);
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

          // Update parent screen
          if (route.params?.onCartUpdate) {
            route.params.onCartUpdate(updatedCart);
          }
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
          const updatedCart = cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity } : item
          );
          setCart(updatedCart);

          // Update parent screen
          if (route.params?.onCartUpdate) {
            route.params.onCartUpdate(updatedCart);
          }
        }
      } catch (error) {
        console.error("Error updating cart:", error);
        Alert.alert("Error", "Failed to update cart");
      } finally {
        setUpdatingItem(null);
      }
    },
    [cart, userId, route.params]
  );

  const calculateTotal = useCallback(() => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }, [cart]);

  const handleCheckout = useCallback(() => {
    navigation.navigate("Payment", {
      cart,
      totalAmount: calculateTotal(),
    });
  }, [navigation, cart, calculateTotal]);

  const renderCartItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <View style={styles.cartItem}>
        <Image
          source={{ uri: item.product.imageUrl }}
          style={styles.productImage}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <Text style={styles.productPrice}>₹{item.product.price}</Text>

          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                handleQuantityChange(item.product, item.quantity - 1)
              }
              disabled={updatingItem === item.product.id}
            >
              <Ionicons name="remove" size={18} color="#fff" />
            </TouchableOpacity>

            {updatingItem === item.product.id ? (
              <ActivityIndicator
                size="small"
                color="#8B5CF6"
                style={styles.quantityText}
              />
            ) : (
              <Text style={styles.quantityText}>{item.quantity}</Text>
            )}

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                handleQuantityChange(item.product, item.quantity + 1)
              }
              disabled={updatingItem === item.product.id}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.itemTotal}>
          ₹{(item.product.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    ),
    [handleQuantityChange, updatingItem]
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
      </LinearGradient>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={80} color="#8B5CF6" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.shopButtonText}>Shop Now</Text>
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

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                ₹{calculateTotal().toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery</Text>
              <Text style={styles.totalValue}>₹0.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                ₹{calculateTotal().toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.checkoutButtonText}>Checkout</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
  },
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyCartText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shopButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  productName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 4,
  },
  productPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#10B981",
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#4B5563",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  itemTotal: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#4B5563",
  },
  totalContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  totalLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
  },
  totalValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#4B5563",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  grandTotalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
  },
  grandTotalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#10B981",
  },
  checkoutButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 16,
  },
  checkoutButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#fff",
    marginRight: 8,
  },
});
