import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CartItem } from "./types";

// Root stack navigator
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Verification: { phoneNumber: string };
  SignUp: { phoneNumber: string };
  ForgotPassword: { phoneNumber?: string };
  WaitingApproval: { phoneNumber: string };
  PresidentDashboard: undefined;
  KMemberTabs: { phoneNumber: string };
  NormalUserTabs: { phoneNumber: string };
  KMemberApproval: undefined;
  PresidentStack: undefined;
  CheckoutStack: undefined;
  Home: undefined;
  Cart: {
    cart: CartItem[];
    onCartUpdate: (cart: CartItem[]) => void;
  };
  Market: undefined;
};

// President stack
export type PresidentStackParamList = {
  ApprovedMembers: undefined;
  ScheduleMeeting: undefined;
  AddNoticeNews: undefined;
};

// KMember tab navigator
export type KMemberTabsParamList = {
  Home: undefined;
  Details: undefined;
  Market: undefined;
  Profile: { phoneNumber: string };
};

// NormalUser tab navigator
export type NormalUserTabsParamList = {
  Market: undefined;
  Profile: { phoneNumber: string };
};

// Checkout stack navigator
export type CheckoutStackParamList = {
  CartScreen: undefined;
  Payment: undefined;
  Address: undefined;
  OrderSummary: undefined;
  OrderTracking: undefined;
};

// Navigation props for each stack/tab navigator
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type PresidentStackNavigationProp =
  StackNavigationProp<PresidentStackParamList>;
export type KMemberTabsNavigationProp =
  BottomTabNavigationProp<KMemberTabsParamList>;
export type NormalUserTabsNavigationProp =
  BottomTabNavigationProp<NormalUserTabsParamList>;
export type CheckoutStackNavigationProp =
  StackNavigationProp<CheckoutStackParamList>;
