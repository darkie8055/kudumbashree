import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  BackHandler,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import LoanApprovalScreen from "./LoanApprovalScreen";

type PresidentDashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PresidentDashboard"
>;

type Props = {
  navigation: PresidentDashboardScreenNavigationProp;
};

export default function PresidentDashboardScreen({ navigation }: Props) {
  const [animation] = useState(new Animated.Value(0));
  const [isPressed, setIsPressed] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true; // Prevent going back
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      navigation.setOptions({
        gestureEnabled: false,
      });

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [navigation])
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [animation]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  if (!fontsLoaded) {
    return null;
  }

  const dashboardItems = [
    {
      title: "Manage Members",
      icon: "people",
      description: "Add and manage unit members",
      onPress: () =>
        navigation.navigate("PresidentStack", { screen: "ApprovedMembers" }),
      color: "#8B5CF6",
    },
    {
      title: "Approve Requests",
      icon: "clipboard",
      description: "Review member applications",
      onPress: () => navigation.navigate("KMemberApproval"),
      color: "#EC4899",
    },
    {
      title: "Schedule Meetings",
      icon: "calendar",
      description: "Plan upcoming meetings",
      onPress: () =>
        navigation.navigate("PresidentStack", { screen: "ScheduleMeeting" }),
      color: "#10B981",
    },
    {
      title: "Add Notice/News",
      icon: "newspaper",
      description: "Post updates for members",
      onPress: () =>
        navigation.navigate("PresidentStack", { screen: "AddNoticeNews" }),
      color: "#F59E0B",
    },
    {
      title: "View Reports",
      icon: "bar-chart",
      description: "Access unit statistics",
      onPress: () => navigation.navigate("ViewReports"),
      color: "#3B82F6",
    },
    {
      title: "Loan Approval",
      icon: "cash",
      description: "Review loan applications",
      onPress: () => navigation.navigate("LoanApproval"),
      color: "#6366F1",
    },
    {
      title: "Set Weekly Dues",
      icon: "calendar",
      description: "Manage weekly payments",
      onPress: () => navigation.navigate("WeeklyDueSetup"),
      color: "#14B8A6",
    },
    {
      title: "Product Approval",
      icon: "cart",
      description: "Review product listings",
      onPress: () => navigation.navigate("ProductApproval"),
      color: "#D946EF",
    },
    {
      title: "Attendance",
      icon: "people",
      description: "Track meeting attendance",
      onPress: () => navigation.navigate("Attendance"),
      color: "#F43F5E",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#7C3AED", "#C026D3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>DashBoard</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderCard}>
          <LinearGradient
            colors={["#F9FAFB", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sectionHeaderContent}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="grid-outline" size={24} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.sectionHeaderTitle}>Manage Your Unit</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Access all administrative functions
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.cardsGrid}>
          {dashboardItems.map((item, index) => (
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
                        name={
                          (item.icon +
                            "-outline") as keyof typeof Ionicons.glyphMap
                        }
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 0,
    paddingBottom: 7,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 5,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  greeting: {
    fontFamily: "Poppins_700Bold",
    fontSize: 30,
    color: "#fff",
    marginBottom: 0,
    paddingBottom: 0,
    alignSelf: "center",
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 0.5,
    left: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16, // Reduced from 24
    paddingBottom: 32,
  },
  sectionHeaderCard: {
    marginHorizontal: -16, // Extend beyond padding
    marginBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionHeaderContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconContainer: {
    backgroundColor: "#F5F3FF",
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeaderTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionHeaderSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
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
    height: 140,
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
    fontSize: 15,
    color: "#1F2937",
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
});
