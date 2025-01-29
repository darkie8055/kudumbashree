export type RootStackParamList = {
  Onboarding: undefined
  Login: undefined
  SignUp: undefined
  ForgotPassword: undefined
  MainTabs: undefined
  Home: undefined
  Details: undefined
  Market: undefined
  Profile: undefined
  MainDetails: undefined
  Savings: undefined
  Loan: undefined
  Balance: undefined
  Pending: undefined
  LinkageLoan: undefined
  ApplyLoan: undefined
  PayPendingLoan: undefined
  PayWeeklyDue: undefined
  Marketplace: undefined
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

