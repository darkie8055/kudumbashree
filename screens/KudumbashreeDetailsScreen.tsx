import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
  Dimensions,
  Alert,
  Linking,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStackNavigator } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { KMemberTabsParamList } from "../types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importing screens (unchanged)
import SavingsScreen from "./SavingsScreen";
import LoanScreen from "./LoanScreen";
import BalanceScreen from "./BalanceScreen";
import PendingScreen from "./PendingScreen";
import LinkageLoanScreen from "./LinkageLoanScreen";
import ApplyLoanScreen from "./ApplyLoanScreen";
import PayPendingLoanScreen from "./PayPendingLoanScreen";
import PayWeeklyDueScreen from "./PayWeeklyDueScreen";

const Stack = createStackNavigator<RootStackParamList>();

// Update the navigation type
type MainDetailsScreenNavigationProp = NavigationProp<RootStackParamList>;

interface MainDetailsScreenProps {
  navigation: MainDetailsScreenNavigationProp;
  route: RouteProp<KMemberTabsParamList, "Details">;
}

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.44;

interface MemberData {
  unitName: string;
  unitNumber: string;
  name: string;
  id: string;
}

interface UnitDetails {
  committees: {
    samatheeka: {
      coordinator: string;
      members: string[];
      coordinatorPhone?: string;
    };
    adisthana: {
      coordinator: string;
      members: string[];
      coordinatorPhone?: string;
    };
    vidyabhyasa: {
      coordinator: string;
      members: string[];
      coordinatorPhone?: string;
    };
    upjeevana: {
      coordinator: string;
      members: string[];
      coordinatorPhone?: string;
    };
  };
  presidentDetails: { name: string; phone: string; role: string };
  secretaryDetails: { name: string; phone?: string; role: string };
}

interface ContactOptionsProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  phone: string;
}

const ContactOptions: React.FC<ContactOptionsProps> = ({
  visible,
  onClose,
  name,
  phone,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#7C3AED", "#C026D3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Contact {name}</Text>
          </LinearGradient>

          <View style={styles.modalContent}>
            <Pressable
              style={styles.contactOption}
              onPress={() => {
                onClose();
                Linking.openURL(`tel:${phone}`);
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="call" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Call</Text>
                <Text style={styles.optionDescription}>{phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
            </Pressable>

            <Pressable
              style={styles.contactOption}
              onPress={() => {
                onClose();
                const url = `whatsapp://send?phone=91${phone}`;
                Linking.canOpenURL(url).then((supported) => {
                  if (supported) {
                    return Linking.openURL(url);
                  }
                  Alert.alert(
                    "WhatsApp not installed",
                    "Please install WhatsApp to use this feature"
                  );
                });
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#10B981" />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>WhatsApp</Text>
                <Text style={styles.optionDescription}>Send a message</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#10B981" />
            </Pressable>
          </View>

          <LinearGradient
            colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </LinearGradient>
        </View>
      </Pressable>
    </Modal>
  );
};

// Update to get data from the tab navigator
function MainDetailsScreen({ navigation }: MainDetailsScreenProps) {
  const [animation] = useState(new Animated.Value(0));
  const [unitData, setUnitData] = useState({
    unitName: "",
    unitNumber: "",
    presidentName: "",
    secretaryName: "",
  });
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [unitDetails, setUnitDetails] = useState<UnitDetails | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentContact, setCurrentContact] = useState({ name: "", phone: "" });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const fetchUnitDetails = async (unitNumber: string) => {
    try {
      const db = getFirestore();
      const unitDoc = await getDoc(doc(db, "unitDetails", unitNumber));
      if (unitDoc.exists()) {
        setUnitDetails(unitDoc.data() as UnitDetails);
      }
    } catch (error) {
      console.error("Error fetching unit details:", error);
    }
  };

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const db = getFirestore();
        // Get phone number from AsyncStorage instead of auth
        const phoneNumber = await AsyncStorage.getItem("userPhoneNumber");

        if (!phoneNumber) {
          console.warn("No phone number found in storage");
          return;
        }

        const cleanPhoneNumber = phoneNumber.replace("+91", "");
        const memberDoc = await getDoc(doc(db, "K-member", cleanPhoneNumber));

        if (memberDoc.exists()) {
          const data = memberDoc.data();
          setMemberData({
            id: cleanPhoneNumber,
            name: data.name || "",
            unitName: data.unitName || "",
            unitNumber: data.unitNumber || "",
          });

          // Also update unit data
          setUnitData({
            unitName: data.unitName || "",
            unitNumber: data.unitNumber || "",
            presidentName: data.presidentName || "",
            secretaryName: data.secretaryName || "",
          });

          // Fetch unit details after getting member data
          await fetchUnitDetails(data.unitNumber);
        } else {
          console.warn("Member document not found");
        }
      } catch (error) {
        console.error("Error fetching member data:", error);
        Alert.alert("Error", "Failed to load member data. Please try again.", [
          { text: "OK" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();

    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContactPress = (name: string, phone: string) => {
    setCurrentContact({ name, phone });
    setModalVisible(true);
  };

  if (!fontsLoaded) {
    return null;
  }

  const fadeIn = {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  };

  // Update the handlePayWeeklyDue function
  const handlePayWeeklyDue = () => {
    if (memberData) {
      // Now using type assertion to tell TypeScript this navigation is valid
      (navigation as NavigationProp<RootStackParamList>).navigate(
        "PayWeeklyDue",
        {
          phoneNumber: memberData.id,
          memberId: memberData.id,
          memberName: memberData.name,
          unitId: `${memberData.unitName}-${memberData.unitNumber}`,
        }
      );
    } else {
      Alert.alert("Error", "Member data not found");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={["#7C3AED", "#C026D3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>{unitData.unitName}</Text>
            <View style={styles.headerBadge}>
              <Ionicons name="location" size={14} color="#fff" />
              <Text style={styles.headerSubtitle}>
                Unit {unitData.unitNumber}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <Animated.View style={fadeIn}>
          {/* Quick Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.cardsGrid}>
              {[
                {
                  title: "Savings",
                  icon: "wallet",
                  description: "View savings details",
                  onPress: () => navigation.navigate("Savings"),
                  color: "#8B5CF6",
                },
                {
                  title: "Loan",
                  icon: "cash",
                  description: "Manage your loans",
                  onPress: () => {
                    if (memberData?.id) {
                      navigation.navigate("Loan", {
                        phoneNumber: memberData.id,
                      });
                    } else {
                      Alert.alert("Error", "Member data not found");
                    }
                  },
                  color: "#EC4899",
                },
                {
                  title: "Balance",
                  icon: "bar-chart",
                  description: "Check your balance",
                  onPress: () => navigation.navigate("Balance"),
                  color: "#10B981",
                },
                {
                  title: "Pending",
                  icon: "hourglass",
                  description: "View pending items",
                  onPress: () => navigation.navigate("Pending"),
                  color: "#F59E0B",
                },
              ].map((item, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.cardWrapper,
                    {
                      transform: [
                        {
                          translateY: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50 * (Math.floor(index / 2) + 1), 0],
                          }),
                        },
                      ],
                      opacity: animation,
                    },
                  ]}
                >
                  <Pressable
                    style={[styles.card, { borderLeftColor: item.color }]}
                    onPress={item.onPress}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: `${item.color}15` },
                          ]}
                        >
                          <Ionicons
                            name={`${item.icon}-outline`}
                            size={22}
                            color={item.color}
                          />
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Unit Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Unit Details</Text>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.08)", "rgba(236, 72, 153, 0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailsContainer}
            >
              {/* President Details */}
              <Pressable
                style={({ pressed }) => [
                  styles.detailItem,
                  pressed && styles.detailItemPressed,
                ]}
                onPress={() =>
                  handleContactPress(
                    unitDetails?.presidentDetails?.name || "",
                    unitDetails?.presidentDetails?.phone || ""
                  )
                }
                android_ripple={{ color: "rgba(139, 92, 246, 0.1)" }}
              >
                <View style={styles.detailIconContainer}>
                  <Ionicons name="person-outline" size={18} color="#8B5CF6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailRole}>President</Text>
                  <View style={styles.namePhoneContainer}>
                    <Text style={styles.detailName}>
                      {unitDetails?.presidentDetails?.name || "Loading..."}
                    </Text>
                    <View style={styles.phoneWrapper}>
                      <Text style={styles.detailPhone}>
                        {unitDetails?.presidentDetails?.phone}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              {/* Secretary Details */}
              <Pressable
                style={({ pressed }) => [
                  styles.detailItem,
                  pressed && styles.detailItemPressed,
                ]}
                onPress={() =>
                  handleContactPress(
                    unitDetails?.secretaryDetails?.name || "",
                    unitDetails?.secretaryDetails?.phone || ""
                  )
                }
                android_ripple={{ color: "rgba(139, 92, 246, 0.1)" }}
              >
                <View style={styles.detailIconContainer}>
                  <Ionicons name="people-outline" size={18} color="#8B5CF6" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailRole}>Secretary</Text>
                  <View style={styles.namePhoneContainer}>
                    <Text style={styles.detailName}>
                      {unitDetails?.secretaryDetails?.name || "Loading..."}
                    </Text>
                    <View style={styles.phoneWrapper}>
                      <Text style={styles.detailPhone}>
                        {unitDetails?.secretaryDetails?.phone}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              {/* Committee Details */}
              {Object.entries(unitDetails?.committees || {}).map(
                ([name, details]) => (
                  <Pressable
                    key={name}
                    style={({ pressed }) => [
                      styles.detailItem,
                      pressed && styles.detailItemPressed,
                    ]}
                    onPress={() =>
                      handleContactPress(
                        details.coordinator || "",
                        details.coordinatorPhone || ""
                      )
                    }
                    android_ripple={{ color: "rgba(139, 92, 246, 0.1)" }}
                  >
                    <View style={styles.detailIconContainer}>
                      <Ionicons
                        name={getCommitteeIcon(name)}
                        size={18}
                        color="#8B5CF6"
                      />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailRole}>
                        {capitalizeFirst(name)}
                      </Text>
                      <View style={styles.namePhoneContainer}>
                        <Text style={styles.detailName}>
                          {details.coordinator || "Not assigned"}
                        </Text>
                        <View style={styles.phoneWrapper}>
                          <Text style={styles.detailPhone}>
                            {details.coordinatorPhone}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                )
              )}
            </LinearGradient>
          </View>

          {/* Linkage Loan Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Linkage Loan</Text>
            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate("LinkageLoan")}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.actionCardHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: "#EDE9FE" },
                    ]}
                  >
                    <Ionicons name="link-outline" size={24} color="#8B5CF6" />
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.actionCardTitle}>
                  View Linkage Loan Details
                </Text>
                <Text style={styles.actionCardDescription}>
                  Check your linkage loan status and details
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Loan Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Loan Actions</Text>
            <View style={styles.loanActionsContainer}>
              <Pressable
                style={styles.actionCard}
                onPress={() => {
                  if (memberData?.id) {
                    navigation.navigate("ApplyLoan", {
                      phoneNumber: memberData.id, // Pass the phone number
                    });
                  } else {
                    Alert.alert("Error", "Member data not found");
                  }
                }}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardHeader}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: "#FCE7F3" },
                      ]}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="#EC4899"
                      />
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#EC4899"
                    />
                  </View>
                  <Text style={styles.actionCardTitle}>Apply for New Loan</Text>
                  <Text style={styles.actionCardDescription}>
                    Submit a new loan application
                  </Text>
                </View>
              </Pressable>

              <Pressable style={styles.actionCard} onPress={handlePayWeeklyDue}>
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardHeader}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: "#ECFDF5" },
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={24}
                        color="#10B981"
                      />
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#10B981"
                    />
                  </View>
                  <Text style={styles.actionCardTitle}>Pay Weekly Due</Text>
                  <Text style={styles.actionCardDescription}>
                    Make your weekly due payment
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      <ContactOptions
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        name={currentContact.name}
        phone={currentContact.phone}
      />
    </SafeAreaView>
  );
}

// Add these helper functions at the file level
const getCommitteeIcon = (committee: string): string => {
  const icons = {
    samatheeka: "book-outline",
    adisthana: "business-outline",
    vidyabhyasa: "school-outline",
    upjeevana: "leaf-outline",
  };
  return icons[committee as keyof typeof icons] || "people-outline";
};

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Main Navigator for all screens (unchanged)
export default function KudumbashreeDetailsScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainDetails"
        component={MainDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Savings"
        component={SavingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Loan"
        component={LoanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Balance"
        component={BalanceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Pending"
        component={PendingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LinkageLoan"
        component={LinkageLoanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ApplyLoan"
        component={ApplyLoanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PayPendingLoan"
        component={PayPendingLoanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PayWeeklyDue"
        component={PayWeeklyDueScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 70,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
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
  },
  pageHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
  },
  unitNumber: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 16,
    marginTop: 10,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  quickActionItem: {
    width: ITEM_WIDTH,
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontFamily: "Poppins_400Regular",
    marginTop: 5,
    color: "#4B5563",
  },
  detailsContainer: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
  },
  detailItemPressed: {
    backgroundColor: "rgba(139, 92, 246, 0.05)",
    transform: [{ scale: 0.98 }],
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  detailContent: {
    flex: 1,
  },
  detailRole: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#1F2937",
  },
  detailPhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  namePhoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  phoneWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  linkageLoanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkageLoanText: {
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginLeft: 10,
  },
  loanActionsContainer: {
    flexDirection: "column",
  },
  loanActionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loanActionText: {
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginLeft: 10,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    height: 140, // Increased height
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    height: "100%", // Ensure content takes full height
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14, // Adjust back to original size
    color: "#1F2937",
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12, // Adjust back to original size
    color: "#6B7280",
    lineHeight: 16,
  },
  actionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
    minHeight: 120, // Added minimum height
  },
  actionCardContent: {
    flex: 1,
    justifyContent: "space-between",
    height: "100%", // Ensure content takes full height
  },
  actionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  actionCardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 4,
  },
  actionCardDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#fff",
    flex: 1,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  headerMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
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
  badgeIcon: {
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#fff",
  },
  modalContent: {
    padding: 16,
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 2,
  },
  optionDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6B7280",
  },
  cancelButton: {
    marginTop: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  cancelButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#8B5CF6",
    letterSpacing: 0.5,
  },
});
