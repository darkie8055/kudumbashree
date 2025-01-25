import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // For safe area handling

// Sample product data for the marketplace
const sampleProducts = [
  { id: "1", name: "Handmade Soap", price: "₹150", imageUrl: "https://placeimg.com/400/200/nature" },
  { id: "2", name: "Organic Honey", price: "₹250", imageUrl: "https://placeimg.com/400/200/tech" },
  { id: "3", name: "Handwoven Basket", price: "₹350", imageUrl: "https://placeimg.com/400/200/people" },
  { id: "4", name: "Eco-friendly Tote Bag", price: "₹120", imageUrl: "https://placeimg.com/400/200/business" },
];

export default function MarketplaceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Page Heading */}
      <Text style={styles.pageHeading}>Marketplace</Text>

      {/* Product Categories Section */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionHeader}>Product Categories</Text>
        <View style={styles.categories}>
          <TouchableOpacity style={styles.categoryItem}>
            <Text style={styles.categoryText}>Handmade</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem}>
            <Text style={styles.categoryText}>Organic</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem}>
            <Text style={styles.categoryText}>Eco-friendly</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Products Section */}
      <View style={styles.productsContainer}>
        <Text style={styles.sectionHeader}>Featured Products</Text>
        <FlatList
          data={sampleProducts}
          keyExtractor={(item) => item.id}
          horizontal
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>
              <TouchableOpacity style={styles.productButton}>
                <Text style={styles.productButtonText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Add Your Product Section */}
      <View style={styles.addProductContainer}>
        <Text style={styles.sectionHeader}>Add Your Product</Text>
        <Text style={styles.addProductText}>
          Are you a member? You can list your products in the marketplace to sell
          them and support the community.
        </Text>
        <TouchableOpacity style={styles.addProductButton}>
          <Text style={styles.addProductButtonText}>Add Your Product</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Light background for the screen
    paddingHorizontal: 10,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#81459b", // Purple color for heading
    textAlign: "center",
    marginVertical: 20,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#81459b", // Purple header color
    marginBottom: 10,
  },
  categories: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  categoryItem: {
    backgroundColor: "#a6dfb8", // Light green color for categories
    padding: 10,
    borderRadius: 8,
    width: 100,
    alignItems: "center",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#81459b", // Purple text color
  },
  productsContainer: {
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: "#ffffff", // White background for each product card
    marginRight: 15,
    borderRadius: 8,
    elevation: 5, // Card shadow effect
    padding: 10,
    width: 180,
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333333", // Dark color for product name
  },
  productPrice: {
    fontSize: 14,
    color: "#333333", // Dark color for price
    marginBottom: 10,
  },
  productButton: {
    backgroundColor: "#81459b", // Purple background for button
    padding: 10,
    borderRadius: 8,
  },
  productButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff", // White text for the button
  },
  addProductContainer: {
    backgroundColor: "#ffffff", // White background for the add product section
    borderRadius: 8,
    padding: 15,
    elevation: 5, // Card shadow effect
  },
  addProductText: {
    fontSize: 16,
    color: "#333333", // Dark text color for the add product description
    marginBottom: 15,
  },
  addProductButton: {
    backgroundColor: "#81459b", // Purple background for the button
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addProductButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff", // White text for the button
  },
});
