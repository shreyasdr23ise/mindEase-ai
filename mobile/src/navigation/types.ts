import type { NavigatorScreenParams } from "@react-navigation/native";

export type HomeStackParamList = { Home: undefined };
export type ChatStackParamList = { ChatList: undefined };
export type MoodStackParamList = {
  MoodHome: undefined;
  MoodHistory: undefined;
  JournalList: undefined;
  JournalEditor: { entryId?: string } | undefined;
};
export type WellnessStackParamList = {
  WellnessList: undefined;
};
export type ProfileStackParamList = {
  ProfileHome: undefined;
  PrivacySettings: undefined;
  ExportData: undefined;
  NotificationsSettings: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ChatTab: NavigatorScreenParams<ChatStackParamList>;
  MoodTab: NavigatorScreenParams<MoodStackParamList>;
  WellnessTab: NavigatorScreenParams<WellnessStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ChatScreen: { conversationId?: string; title?: string } | undefined;
  WellnessDetail: { id: string; title?: string };
  Breathing: { exerciseId?: string; title?: string; durationMinutes?: number; instructions?: string[] };
  Grounding: { exerciseId?: string; title?: string; instructions?: string[] };
  Cbt: { exerciseId?: string; title?: string };
  MedicineSearch: undefined;
  MedicineDetail: { id: string; name: string };
  ProfessionalHelp: undefined;
  CounselorRequest: { counselorId: string; counselorName: string };
  Emergency: { openTanApp?: boolean } | undefined;
  Crisis: { severity?: string; helplines?: unknown } | undefined;
  TrustContact: undefined;
  HelpGuide: undefined;
  MoodHistory: undefined;
  JournalList: undefined;
  JournalEditor: { entryId?: string } | undefined;
};