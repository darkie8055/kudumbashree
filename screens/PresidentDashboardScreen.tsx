import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
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
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect } from "react";
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
      onPress: () =>
        navigation.navigate("PresidentStack", { screen: "ApprovedMembers" }),
      color: "rgb(162,39,142)",
    },
    {
      title: "Approve Requests",
      icon: "clipboard",
      onPress: () => navigation.navigate("KMemberApproval"),
      color: "rgb(162,39,142)",
    },
    {
      title: "Schedule Meetings",
      icon: "calendar",
      onPress: () =>
        navigation.navigate("PresidentStack", { screen: "ScheduleMeeting" }),
      color: "rgb(162,39,142)",
    },
    {
      title: "Add Notice/News",
      icon: "newspaper" as keyof typeof Ionicons.glyphMap,
      onPress: () =>
        navigation.navigate("PresidentStack", { screen: "AddNoticeNews" }),
      color: "rgb(162,39,142)",
    },
    {
      title: "View Reports",
      icon: "bar-chart",
      onPress: () => navigation.navigate("ViewReports"),
      color: "rgb(162,39,142)",
    },
    {
      title: "Loan Approval",
      icon: "cash",
      onPress: () => navigation.navigate("LoanApproval"),
      color: "rgb(162,39,142)",
    },
    {
      title: "Set Weekly Dues",
      icon: "calendar",
      onPress: () => navigation.navigate("WeeklyDueSetup"),
      color: "rgb(162,39,142)",
    },
    {
      title: "Product Approval",
      icon: "cart",
      onPress: () => navigation.navigate("ProductApproval"),
      color: "rgb(162,39,142)",
    },
  ];

  return (
    <LinearGradient
      colors={[
        isPressed ? "rgba(162,39,142,0.03)" : "rgba(162,39,142,0.01)",
        isPressed ? "rgba(162,39,142,0.08)" : "rgba(162,39,142,0.03)",
      ]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.formContainer,
              { opacity: animation, transform: [{ translateY }] },
            ]}
          >
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.2)"]}
              style={styles.borderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                style={styles.formGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.title}>President Dashboard</Text>
                <View style={styles.cardContainer}>
                  {dashboardItems.map((item, index) => (
                    <View key={index} style={styles.cardWrapper}>
                      <LinearGradient
                        colors={[
                          "rgba(139, 92, 246, 0.8)",
                          "rgba(236, 72, 153, 0.8)",
                        ]}
                        style={styles.cardGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <TouchableOpacity
                          style={styles.card}
                          onPress={item.onPress}
                          onPressIn={() => setIsPressed(true)}
                          onPressOut={() => setIsPressed(false)}
                        >
                          <Ionicons
                            name={
                              (item.icon +
                                "-outline") as keyof typeof Ionicons.glyphMap
                            }
                            size={40}
                            color={item.color}
                          />
                          <Text style={styles.cardTitle}>{item.title}</Text>
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  borderGradient: {
    borderRadius: 20,
    padding: 2,
  },
  formGradient: {
    padding: 20,
    borderRadius: 18,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: "white",
    textAlign: "center",
    marginBottom: 30,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  cardWrapper: {
    width: "47%",
    marginBottom: 16,
    aspectRatio: 1,
  },
  cardGradientBorder: {
    borderRadius: 15,
    padding: 2,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 13,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "rgb(162,39,142)",
    marginTop: 10,
    textAlign: "center",
  },
});
