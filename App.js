import React from "react";
import { View, SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Import screens
import HomeScreen from "./screens/HomeScreen";
import KudumbashreeDetailsScreen from "./screens/KudumbashreeDetailsScreen";
import MarketplaceScreen from "./screens/MarketplaceScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: styles.tabBar, // Transparent tab bar
            tabBarIcon: ({ focused }) => {
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
                    size={24}
                    color={focused ? "#FFFFFF" : "#000"}
                  />
                </View>
              );
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Details" component={KudumbashreeDetailsScreen} />
          <Tab.Screen name="Market" component={MarketplaceScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute", // Overlays on content
    backgroundColor: "rgba(255, 255, 255, 0)", // Transparent white background
    elevation: 0, // Removes shadow on Android
    borderTopWidth: 0, // Removes top border on iOS
    height: 55,
    bottom: 10, // Slightly above the bottom of the screen
    left: 10,
    right: 10,
    borderRadius: 20, // Rounded edges for the tab bar
  },
  tabCircle: {
    width: 70,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30, // Circular shape
  },
  activeTab: {
    backgroundColor: "#000", // Purple background for active tab
    shadowColor: "#000", // Add shadow for inactive tabs
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  inactiveTab: {
    backgroundColor: "#fff", // Very light purple background for inactive tab
    shadowColor: "#000", // Add shadow for inactive tabs
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
});
