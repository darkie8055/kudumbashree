import React, { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

interface Product {
  id: string
  name: string
  price: string
  imageUrl: string
  unit: string
  phone: string
}

interface ProductsByDistrict {
  [key: string]: Product[]
}

const sampleProducts: ProductsByDistrict = {
  Ernakulam: [
    {
      id: "1",
      name: "Handmade Soap",
      price: "₹150",
      imageUrl: "https://picsum.photos/400/400?random=1",
      unit: "Ernakulam Kudumbashree",
      phone: "9876543210",
    },
    {
      id: "2",
      name: "Organic Honey",
      price: "₹250",
      imageUrl: "https://picsum.photos/400/400?random=2",
      unit: "Ernakulam Kudumbashree",
      phone: "9876543210",
    },
    // ... (other Ernakulam products)
  ],
  Thiruvananthapuram: [
    {
      id: "9",
      name: "Eco-friendly Tote Bag",
      price: "₹120",
      imageUrl: "https://picsum.photos/400/400?random=9",
      unit: "Thiruvananthapuram Kudumbashree",
      phone: "9876543210",
    },
    {
      id: "10",
      name: "Recycled Paper Journal",
      price: "₹220",
      imageUrl: "https://picsum.photos/400/400?random=10",
      unit: "Thiruvananthapuram Kudumbashree",
      phone: "9876543210",
    },
    // ... (other Thiruvananthapuram products)
  ],
  Kozhikode: [
    {
      id: "17",
      name: "Cotton Handkerchiefs",
      price: "₹80",
      imageUrl: "https://picsum.photos/400/400?random=17",
      unit: "Kozhikode Kudumbashree",
      phone: "9876543210",
    },
    {
      id: "18",
      name: "Organic Spices",
      price: "₹250",
      imageUrl: "https://picsum.photos/400/400?random=18",
      unit: "Kozhikode Kudumbashree",
      phone: "9876543210",
    },
    // ... (other Kozhikode products)
  ],
}

type SortOption = "none" | "priceLowToHigh" | "priceHighToLow"

export default function MarketplaceScreen() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Ernakulam")
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isSortMenuVisible, setIsSortMenuVisible] = useState<boolean>(false)
  const [sortOption, setSortOption] = useState<SortOption>("none")

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district)
    setIsDropdownVisible(false)
  }

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product)
    setIsModalVisible(true)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSortOption = (option: SortOption) => {
    setSortOption(option)
    setIsSortMenuVisible(false)
  }

  const sortedProducts = (products: Product[]): Product[] => {
    if (sortOption === "priceLowToHigh") {
      return [...products].sort(
        (a, b) => Number.parseInt(a.price.replace("₹", "")) - Number.parseInt(b.price.replace("₹", "")),
      )
    }
    if (sortOption === "priceHighToLow") {
      return [...products].sort(
        (a, b) => Number.parseInt(b.price.replace("₹", "")) - Number.parseInt(a.price.replace("₹", "")),
      )
    }
    return products
  }

  const renderProduct = ({ item }: { item: Product }) => {
    if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return (
        <TouchableOpacity onPress={() => handleProductPress(item)} style={styles.productContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>{item.price}</Text>
        </TouchableOpacity>
      )
    }
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Marketplace</Text>

      <LinearGradient
        colors={["rgba(129, 69, 155, 0.7)", "rgba(166, 223, 184, 0.7)"]}
        style={styles.pickerSearchContainer}
      >
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setIsDropdownVisible(!isDropdownVisible)}>
          <Text style={styles.dropdownButtonText}>{selectedDistrict}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="black" />
        </TouchableOpacity>

        {isDropdownVisible && (
          <View style={styles.dropdownContainer}>
            <FlatList
              data={["Ernakulam", "Thiruvananthapuram", "Kozhikode"]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDistrictChange(item)}>
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <TextInput
          style={styles.searchBox}
          placeholder="Search Products..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </LinearGradient>

      <FlatList
        data={sortedProducts(sampleProducts[selectedDistrict])}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
      />

      <TouchableOpacity style={styles.sortButton} onPress={() => setIsSortMenuVisible(!isSortMenuVisible)}>
        <MaterialIcons name="sort" size={30} color="white" />
      </TouchableOpacity>

      {isSortMenuVisible && (
        <View style={styles.sortMenu}>
          <TouchableOpacity onPress={() => handleSortOption("priceLowToHigh")} style={styles.sortMenuItem}>
            <Text style={styles.sortMenuText}>Price: Low to High</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSortOption("priceHighToLow")} style={styles.sortMenuItem}>
            <Text style={styles.sortMenuText}>Price: High to Low</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
        transparent={true}
      >
        {selectedProduct && (
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
              <Image source={{ uri: selectedProduct.imageUrl }} style={styles.modalImage} />
              <Text style={styles.modalPrice}>{selectedProduct.price}</Text>
              <Text style={styles.modalUnit}>{selectedProduct.unit}</Text>
              <Text style={styles.modalPhone}>Contact: {selectedProduct.phone}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
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
    paddingTop: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  pickerSearchContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "50%",
    height: 51,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },
  searchBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "45%",
  },
  dropdownContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    elevation: 5,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dropdownItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  productList: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  productContainer: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 10,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    maxWidth: "45%",
    paddingBottom: 10,
  },
  productImage: {
    width: "100%",
    height: 120,
    marginBottom: 10,
  },
  productName: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: "#888",
  },
  sortButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 50,
    marginBottom: 60,
  },
  sortMenu: {
    position: "absolute",
    bottom: 140,
    right: 20,
    backgroundColor: "#fff",
    elevation: 5,
    width: 150,
  },
  sortMenuItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  sortMenuText: {
    fontSize: 16,
    color: "#333",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingBottom: 20,
    paddingTop: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    elevation: 5,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalImage: {
    width: "100%",
    height: 250,
    marginBottom: 10,
  },
  modalPrice: {
    fontSize: 20,
    color: "#333",
    marginBottom: 10,
  },
  modalUnit: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  modalPhone: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
})

