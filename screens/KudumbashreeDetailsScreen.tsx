import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Alert,
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

// Update the navigation type at the top
type MainDetailsScreenNavigationProp = NavigationProp<
  RootStackParamList & KMemberTabsParamList
>;

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

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

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
                  onPress: () => navigation.navigate("Loan"),
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
                  <TouchableOpacity
                    style={[styles.card, { borderLeftColor: item.color }]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
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
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Unit Details Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Unit Details</Text>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
              style={styles.detailsContainer}
            >
              <View style={styles.detailItem}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#8B5CF6"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>President</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color="#8B5CF6"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>Secretary</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color="#8B5CF6"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>Samatheeka</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color="#8B5CF6"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>Adisthana</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="school-outline"
                  size={20}
                  color="#8B5CF6"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>Vidyabhyasa</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="leaf-outline"
                  size={20}
                  color="#8B5CF6"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>Upjeevana</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Linkage Loan Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Linkage Loan</Text>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("LinkageLoan")}
              activeOpacity={0.7}
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
            </TouchableOpacity>
          </View>

          {/* Loan Actions Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Loan Actions</Text>
            <View style={styles.loanActionsContainer}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() =>
                  (navigation as MainDetailsScreenNavigationProp).navigate(
                    "ApplyLoan",
                    {
                      phoneNumber: memberData?.id || "",
                    }
                  )
                }
                activeOpacity={0.7}
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
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={handlePayWeeklyDue}
                activeOpacity={0.7}
              >
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
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingBottom: 90,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginTop:10,
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
    padding: 15,
    borderRadius: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    flex: 1,
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
});
