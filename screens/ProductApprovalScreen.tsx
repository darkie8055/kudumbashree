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
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Product Approval</Text>
          <Text style={styles.headerSubtitle}>
            Review and manage product listings
          </Text>
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
            <View style={styles.emptyStateIcon}>
              <Ionicons name="basket-outline" size={48} color="#8B5CF6" />
            </View>
            <Text style={styles.emptyStateText}>No Pending Products</Text>
            <Text style={styles.emptyStateSubtext}>
              New product listings will appear here for your review and approval
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
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom:12,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 24,
    color: "#fff",
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 0,
  },
  content: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: 16,
  },
  listContainer: {
    padding: 16,
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 6,
  },
  productPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: "#8B5CF6",
    marginBottom: 4,
  },
  productUnit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 4,
  },
  productDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6B7280",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
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
});
