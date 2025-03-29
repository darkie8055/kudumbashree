import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import ScreenWithFloatingButton from "../components/ScreenWithFloatingButton";

// Import your screens
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/KMemberProfileScreen";
import LawsAndRegulationsScreen from "../screens/LawsAndRegulationsScreen";
import ActivitiesScreen from "../screens/ActivitiesScreen";
// ... import other screens

const Stack = createStackNavigator();

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
        <Stack.Screen
          name="LawsAndRegulations"
          component={LawsAndRegulationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Activities"
          component={ActivitiesScreen}
          options={{
            headerShown: false,
          }}
        />
        {/* Add other screens here, wrapped with ScreenWithFloatingButton */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
