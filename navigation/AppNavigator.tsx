import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import ScreenWithFloatingButton from "../components/ScreenWithFloatingButton";

// Import your screens
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/KMemberProfileScreen";
import LawsAndRegulationsScreen from "../screens/LawsAndRegulationsScreen";
import ActivitiesScreen from "../screens/ActivitiesScreen";
import AddressScreen from "../screens/AddressScreen";
import PaymentMethodScreen from "../screens/PaymentMethodScreen";
import OrderSummaryScreen from "../screens/OrderSummaryScreen";
// ... import other screens

// Create strongly typed navigation stack
export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Profile: undefined;
  LawsAndRegulations: undefined;
  Activities: undefined;
  Address: { 
    cart: any;
  };
  PaymentMethod: { 
    cart: any;
    address: any;
  };
  OrderSummary: {
    cart: any;
    address: any;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
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
        <Stack.Screen
          name="Address"
          component={AddressScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PaymentMethod"
          component={PaymentMethodScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderSummary"
          component={OrderSummaryScreen}
          options={{ headerShown: false }}
        />
        {/* Add other screens here, wrapped with ScreenWithFloatingButton */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
