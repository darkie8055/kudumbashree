import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ScreenWithFloatingButton from "./components/ScreenWithFloatingButton";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { firebase } from "./firebase";
import Toast from 'react-native-toast-message';

// Import screens
import OnboardingScreen from "./screens/OnboardingScreen";
import LoginScreen from "./screens/LoginScreen";
import VerificationScreen from "./screens/VerificationScreen";
import SignUpScreen from "./screens/SignUpScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import WaitingApprovalScreen from "./screens/WaitingApprovalScreen";
import PresidentDashboardScreen from "./screens/PresidentDashboardScreen";
import KMemberProfileScreen from "./screens/KMemberProfileScreen";
import NormalUserProfileScreen from "./screens/NormalUserProfileScreen";
import HomeScreen from "./screens/HomeScreen";
import KudumbashreeDetailsScreen from "./screens/KudumbashreeDetailsScreen";
import MarketplaceScreen from "./screens/MarketplaceScreen";
import CartScreen from "./screens/CartScreen";
import KMemberApprovalScreen from "./screens/KMemberApprovalScreen";
import ApprovedMembersScreen from "./screens/ApprovedMembersScreen";
import ScheduleMeetingScreen from "./screens/ScheduleMeetingScreen";
import AddNoticeNewsScreen from "./screens/AddNoticeNewsScreen";

// Import new checkout screens
import PaymentMethodScreen from "./screens/PaymentMethodScreen";
import AddressScreen from "./screens/AddressScreen";
import OrderSummaryScreen from "./screens/OrderSummaryScreen";
import OrderTrackingScreen from "./screens/OrderTrackingScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function KMemberTabs({ route }) {
  const phoneNumber = route.params?.phoneNumber;

  return (
    <ScreenWithFloatingButton>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Details") {
              iconName = focused
                ? "information-circle"
                : "information-circle-outline";
            } else if (route.name === "Market") {
              iconName = focused ? "basket" : "basket-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            }

            return (
              <View
                style={[
                  styles.tabCircle,
                  focused ? styles.activeTab : styles.inactiveTab,
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={size}
                  color={focused ? "#FFFFFF" : "#8B5CF6"}
                />
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Details" component={KudumbashreeDetailsScreen} />
        <Tab.Screen name="Market" component={MarketplaceScreen} />
        <Tab.Screen
          name="Profile"
          component={KMemberProfileScreen}
          initialParams={{ phoneNumber }}
        />
      </Tab.Navigator>
    </ScreenWithFloatingButton>
  );
}

function NormalUserTabs({ route }) {
  const phoneNumber = route.params?.phoneNumber;

  return (
    <ScreenWithFloatingButton>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Market") {
              iconName = focused ? "basket" : "basket-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            }

            return (
              <View
                style={[
                  styles.tabCircle,
                  focused ? styles.activeTab : styles.inactiveTab,
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={size}
                  color={focused ? "#FFFFFF" : "#8B5CF6"}
                />
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Market" component={MarketplaceScreen} />
        <Tab.Screen
          name="Profile"
          component={NormalUserProfileScreen}
          initialParams={{ phoneNumber }}
        />
      </Tab.Navigator>
    </ScreenWithFloatingButton>
  );
}

function PresidentStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PresidentDashboard"
        component={PresidentDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ApprovedMembers"
        component={ApprovedMembersScreen}
        options={{
          title: "Manage Members",
          headerStyle: {
            backgroundColor: "#8B5CF6",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
          },
        }}
      />
      <Stack.Screen
        name="ScheduleMeeting"
        component={ScheduleMeetingScreen}
        options={{
          title: "Schedule Meeting",
          headerStyle: {
            backgroundColor: "#8B5CF6",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
          },
        }}
      />
      <Stack.Screen
        name="AddNoticeNews"
        component={AddNoticeNewsScreen}
        options={{
          title: "Add Notice/News",
          headerStyle: {
            backgroundColor: "#8B5CF6",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontFamily: "Poppins_600SemiBold",
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    const notificationsRef = collection(firebase, "appNotifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notification = change.doc.data();
          Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.body,
            },
            trigger: null,
          });
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <NavigationContainer>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="Verification" component={VerificationScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen
            name="WaitingApproval"
            component={WaitingApprovalScreen}
          />
          <Stack.Screen
            name="PresidentDashboard"
            component={PresidentDashboardScreen}
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="KMemberTabs"
            component={KMemberTabs}
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="NormalUserTabs"
            component={NormalUserTabs}
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="KMemberApproval"
            component={KMemberApprovalScreen}
          />
          <Stack.Screen
            name="PresidentStack"
            component={PresidentStack}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Payment" component={PaymentMethodScreen} />
          <Stack.Screen name="Address" component={AddressScreen} />
          <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} />
          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 1)",
    elevation: 0,
    borderTopWidth: 0,
    height: 0,
    bottom: 70,
    left: 20,
    right: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabCircle: {
    width: 50,
    height: 50,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: "#8B5CF6",
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
});
