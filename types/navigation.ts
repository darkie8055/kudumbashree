export type RootStackParamList = {
  Onboarding: undefined
  Login: undefined
  SignUp: undefined
  PresidentDashboard: undefined
  KMDashboard: undefined
  UserDashboard: undefined
  WaitingApproval: undefined
  ForgotPassword: { userType: "president" | "km" | "normal" }
  Home: undefined
  Marketplace: undefined
}

