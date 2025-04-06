import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NavigationProp, RouteProp } from "@react-navigation/native";

// Root stack navigator
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Verification: { phoneNumber: string };
  SignUp: undefined;
  ForgotPassword: undefined;
  WaitingApproval: undefined;
  PresidentDashboard: undefined;
  KMemberTabs: undefined;
  NormalUserTabs: undefined;
  ProductManagement: undefined;
  Cart: { cart: CartItem[]; onCartUpdate: (cart: CartItem[]) => void };
  Market: undefined;
  Payment: { cart: CartItem[] };
  ApplyLoan: {
    phoneNumber: string;
  };
  LoanApproval: undefined;
  MainDetails: {
    phoneNumber: string;
  };
  Savings: undefined;
  Loan:
    | {
        phoneNumber?: string;
      }
    | undefined;
  Balance: undefined;
  Pending: undefined;
  LinkageLoan: undefined;
  PayPendingLoan: undefined;
  PayWeeklyDue: {
    phoneNumber: string;
    memberId: string;
    memberName: string;
    unitId: string;
  };
  WeeklyDueSetup: undefined;
  ViewReports: undefined;
  PayLoanDue: {
    loanId: string;
    totalMonths: number;
    paidMonths: number[];
    monthlyDue: number;
    loanType: string;
    startDate: Date;
  };
  ProductApproval: undefined;
  PresidentStack: {
    screen:
      | "ApprovedMembers"
      | "ScheduleMeeting"
      | "AddNoticeNews"
      | "ProductApproval";
  };
  Attendance: undefined;
  LawsAndRegulations: undefined;
  TodayStory: undefined;
  AllNews: undefined;
  Notices: undefined;
};

// President stack
export type PresidentStackParamList = {
  ApprovedMembers: undefined;
  ScheduleMeeting: undefined;
  AddNoticeNews: undefined;
  LoanApproval: undefined;
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

export type Product = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description?: string;
  unit?: string;
  phone?: string;
  category?: string;
  location?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

// Update MainDetailsScreenProps to use KMemberTabsParamList
export type MainDetailsScreenProps = {
  navigation: NavigationProp<RootStackParamList & KMemberTabsParamList>;
  route: RouteProp<KMemberTabsParamList, "Details">;
};
