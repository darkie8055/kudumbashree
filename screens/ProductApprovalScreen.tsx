import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Toast from "react-native-toast-message";
import { Product } from "../types/types";

const auth = getAuth();

export default function ProductApprovalScreen({ navigation }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const q = query(
        collection(db, "products"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const pendingProducts = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id, // Use Firestore's auto-generated document ID
        createdAt: doc.data().createdAt?.toDate(),
      })) as Product[];

      console.log("Fetched pending products:", pendingProducts);
      setProducts(pendingProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load pending products",
        visibilityTime: 3000,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (product: Product) => {
    try {
      const db = getFirestore();
      // Use the Firestore document ID from the product object
      const productRef = doc(db, "products", product.id);
      const productDoc = await getDoc(productRef);

      console.log("Attempting to approve product:", {
        id: product.id,
        name: product.name,
        exists: productDoc.exists(),
      });

      if (!productDoc.exists()) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Product no longer exists",
          visibilityTime: 3000,
          position: "bottom",
        });
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        setModalVisible(false);
        return;
      }

      // Update product status
      await updateDoc(productRef, {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: auth.currentUser?.uid || null,
      });

      // Verify the update
      const verifyDoc = await getDoc(productRef);
      console.log("Product updated successfully:", {
        id: product.id,
        name: product.name,
        status: verifyDoc.data()?.status,
      });

      // Update local state
      setProducts((prev) => prev.filter((p) => p.id !== product.id));

      Toast.show({
        type: "success",
        text1: "Product Approved",
        text2: `${product.name} has been approved and is now live in the marketplace`,
        visibilityTime: 3000,
        position: "bottom",
      });

      // Refresh products list
      await fetchPendingProducts();
      setModalVisible(false);
    } catch (error) {
      console.error("Error approving product:", error);
      Toast.show({
        type: "error",
        text1: "Approval Failed",
        text2:
          error instanceof Error ? error.message : "Failed to approve product",
        visibilityTime: 3000,
        position: "bottom",
      });
    }
  };

  const handleReject = async (product: Product) => {
    try {
      const db = getFirestore();
      const productRef = doc(db, "products", product.id);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Product no longer exists",
          visibilityTime: 3000,
          position: "bottom",
        });
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        setModalVisible(false);
        return;
      }

      // Update the product with all necessary fields
      const updateData = {
        ...productDoc.data(),
        status: "rejected" as const,
        rejectedAt: new Date(),
        rejectedBy: auth.currentUser?.uid || null,
      };

      await updateDoc(productRef, updateData);

      // Update local state
      setProducts((prev) => prev.filter((p) => p.id !== product.id));

      Toast.show({
        type: "success",
        text1: "Product Rejected",
        text2: `${product.name} has been rejected`,
        visibilityTime: 3000,
        position: "bottom",
      });

      // Refresh the products list
      fetchPendingProducts();
      setModalVisible(false);
    } catch (error) {
      console.error("Error rejecting product:", error);
      Toast.show({
        type: "error",
        text1: "Rejection Failed",
        text2:
          error instanceof Error ? error.message : "Failed to reject product",
        visibilityTime: 3000,
        position: "bottom",
      });
    }
  };

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <TouchableOpacity
        key={`product-${item.id}`} // Add unique key prefix
        style={styles.productCard}
        onPress={() => {
          setSelectedProduct(item);
          setModalVisible(true);
        }}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <Text style={styles.productUnit}>{item.unit}</Text>
          <Text style={styles.productDate}>
            {item.createdAt?.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["#8B5CF6", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Product Approval</Text>
          <Text style={styles.headerSubtitle}>Manage product listings</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={80} color="#8B5CF6" />
            <Text style={styles.emptyStateText}>No pending products</Text>
            <Text style={styles.emptyStateSubtext}>
              New product listings will appear here for approval
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedProduct && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Image
                  source={{ uri: selectedProduct.imageUrl }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Text style={styles.modalPrice}>₹{selectedProduct.price}</Text>
                <Text style={styles.modalDescription}>
                  {selectedProduct.description}
                </Text>
                <Text style={styles.modalDetail}>
                  Category: {selectedProduct.category}
                </Text>
                <Text style={styles.modalDetail}>
                  Location: {selectedProduct.location}
                </Text>
                <Text style={styles.modalDetail}>
                  Unit: {selectedProduct.unit}
                </Text>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => {
                    handleReject(selectedProduct);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => {
                    handleApprove(selectedProduct);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#f8f8f8",
  },
  listContainer: {
    padding: 20,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 6,
  },
  productUnit: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 6,
  },
  productDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    padding: 24,
  },
  modalImage: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalDetail: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 8,
  },
  approveButton: {
    backgroundColor: "#8B5CF6",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
