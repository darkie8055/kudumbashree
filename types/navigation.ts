export type RootStackParamList = {
  Onboarding: undefined
  Login: undefined
  SignUp: { phoneNumber: string } | undefined
  PresidentDashboard: undefined
  KMDashboard: undefined
  UserDashboard: undefined
  WaitingApproval: { phone: string }
  ForgotPassword: { userType: "president" | "km" | "normal" }
  Home: undefined
  Marketplace: undefined
  Verification: undefined
  ApprovedMembers: undefined
  ScheduleMeeting: undefined
  AddNoticeNews: undefined
}

