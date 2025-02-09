import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import ScreenWithFloatingButton from "../components/ScreenWithFloatingButton"

// Import your screens
import OnboardingScreen from "../screens/OnboardingScreen"
import HomeScreen from "../screens/HomeScreen"
import ProfileScreen from "../screens/KMemberProfileScreen"
// ... import other screens

const Stack = createStackNavigator()

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen
          name="Home"
          component={(props) => (
            <ScreenWithFloatingButton>
              <HomeScreen {...props} />
            </ScreenWithFloatingButton>
          )}
        />
        <Stack.Screen
          name="Profile"
          component={(props) => (
            <ScreenWithFloatingButton>
              <ProfileScreen {...props} />
            </ScreenWithFloatingButton>
          )}
        />
        {/* Add other screens here, wrapped with ScreenWithFloatingButton */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator

