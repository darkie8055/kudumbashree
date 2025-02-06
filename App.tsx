import { View, StatusBar, StyleSheet } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"

// Import screens
import OnboardingScreen from "./screens/OnboardingScreen"
import LoginScreen from "./screens/LoginScreen"
import VerificationScreen from "./screens/VerificationScreen"
import SignUpScreen from "./screens/SignUpScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"
import WaitingApprovalScreen from "./screens/WaitingApprovalScreen"
import PresidentDashboardScreen from "./screens/PresidentDashboardScreen"
import KMemberProfileScreen from "./screens/KMemberProfileScreen"
import NormalUserProfileScreen from "./screens/NormalUserProfileScreen"
import HomeScreen from "./screens/HomeScreen"
import KudumbashreeDetailsScreen from "./screens/KudumbashreeDetailsScreen"
import MarketplaceScreen from "./screens/MarketplaceScreen"
import KMemberApprovalScreen from "./screens/KMemberApprovalScreen"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function KMemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Details") {
            iconName = focused ? "information-circle" : "information-circle-outline"
          } else if (route.name === "Market") {
            iconName = focused ? "basket" : "basket-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return (
            <View style={[styles.tabCircle, focused ? styles.activeTab : styles.inactiveTab]}>
              <Ionicons name={iconName} size={size} color={focused ? "#FFFFFF" : "#FF7EE2"} />
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Details" component={KudumbashreeDetailsScreen} />
      <Tab.Screen name="Market" component={MarketplaceScreen} />
      <Tab.Screen name="Profile" component={KMemberProfileScreen} />
    </Tab.Navigator>
  )
}

function NormalUserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Market") {
            iconName = focused ? "basket" : "basket-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return (
            <View style={[styles.tabCircle, focused ? styles.activeTab : styles.inactiveTab]}>
              <Ionicons name={iconName} size={size} color={focused ? "#FFFFFF" : "#FF7EE2"} />
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Market" component={MarketplaceScreen} />
      <Tab.Screen name="Profile" component={NormalUserProfileScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
        <Stack.Screen name="WaitingApproval" component={WaitingApprovalScreen} />
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
        <Stack.Screen name="KMemberApproval" component={KMemberApprovalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    elevation: 0,
    borderTopWidth: 0,
    height: 60,
    bottom: 5,
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
    backgroundColor: "#FF7EE2",
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
})

