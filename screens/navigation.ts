export type RootStackParamList = {
    // ... (keep existing routes)
    PresidentDashboard: undefined
    KMDashboard: undefined
    UserDashboard: undefined
    WaitingApproval: undefined
    ForgotPassword: { userType: "president" | "km" | "normal" }
  }
  
  // ... (keep the rest of the file as is)
  
  