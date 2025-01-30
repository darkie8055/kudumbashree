import React from "react"
import { View, StatusBar, StyleSheet } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"

// Import screens
import OnboardingScreen from "./screens/OnboardingScreen"
import LoginScreen from "./screens/LoginScreen"
import SignUpScreen from "./screens/SignUpScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"
import WaitingApprovalScreen from "./screens/WaitingApprovalScreen"
import PresidentDashboardScreen from "./screens/PresidentDashboardScreen"
import KMDashboardScreen from "./screens/KMDashboardScreen"
import UserDashboardScreen from "./screens/UserDashBoardScreen"
import HomeScreen from "./screens/HomeScreen"
import KudumbashreeDetailsScreen from "./screens/KudumbashreeDetailsScreen"
import MarketplaceScreen from "./screens/MarketplaceScreen"
import ProfileScreen from "./screens/ProfileScreen"

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
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
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Details" component={KudumbashreeDetailsScreen} />
      <Tab.Screen name="Market" component={MarketplaceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="WaitingApproval" component={WaitingApprovalScreen} />
        <Stack.Screen name="PresidentDashboard" component={PresidentDashboardScreen} />
        <Stack.Screen name="KMDashboard" component={KMDashboardScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0)",
    elevation: 0,
    borderTopWidth: 0,
    height: 55,
    bottom: 10,
    left: 10,
    right: 10,
    borderRadius: 20,
  },
  tabCircle: {
    width: 70,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  inactiveTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
})

