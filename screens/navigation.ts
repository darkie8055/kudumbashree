export type RootStackParamList = {
  Onboarding: undefined
  Login: undefined
  Verification: undefined
  SignUp: { phoneNumber: string }
  PresidentDashboard: undefined
  KMemberTabs: undefined
  NormalUserTabs: undefined
  WaitingApproval: undefined
  ForgotPassword: { phoneNumber: string }
  KMemberApproval: undefined
  MainTabs: undefined
  Home: undefined
  Details: undefined
  Market: undefined
  Profile: undefined
  
  //ForgotPassword: { userType: "president" | "km" | "normal" };
}

