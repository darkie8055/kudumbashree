export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Verification: undefined;
  SignUp: { phoneNumber: string };
  ForgotPassword: { phoneNumber?: string };
  PresidentDashboard: undefined;
  KMemberTabs: { phoneNumber: string };
  NormalUserTabs: { phoneNumber: string };
  WaitingApproval: { phoneNumber: string };
  KMemberApproval: undefined;
  ViewReports: undefined;
  PresidentStack: {
    screen: 'ApprovedMembers' | 'ScheduleMeeting' | 'AddNoticeNews';
  };
  Home: undefined;
};

export type PresidentStackParamList = {
  ApprovedMembers: undefined;
  ScheduleMeeting: undefined;
  AddNoticeNews: undefined;
};

export type KMemberTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type NormalUserTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

