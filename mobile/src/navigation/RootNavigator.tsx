import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import type { RootStackParamList } from "./types";
import { MainTabs } from "./MainTabs";

import { SplashScreen } from "../screens/SplashScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { WellnessDetailScreen } from "../screens/WellnessDetailScreen";
import { BreathingScreen } from "../screens/BreathingScreen";
import { GroundingScreen } from "../screens/GroundingScreen";
import { CbtScreen } from "../screens/CbtScreen";
import { MedicineSearchScreen } from "../screens/MedicineSearchScreen";
import { MedicineDetailScreen } from "../screens/MedicineDetailScreen";
import { ProfessionalHelpScreen } from "../screens/ProfessionalHelpScreen";
import { CounselorRequestScreen } from "../screens/CounselorRequestScreen";
import { EmergencyScreen } from "../screens/EmergencyScreen";
import { CrisisScreen } from "../screens/CrisisScreen";
import { TrustContactScreen } from "../screens/TrustContactScreen";
import { HelpGuideScreen } from "../screens/HelpGuideScreen";
import { MoodHistoryScreen } from "../screens/MoodHistoryScreen";
import { JournalListScreen } from "../screens/JournalListScreen";
import { JournalEditorScreen } from "../screens/JournalEditorScreen";
import {
  PrivacySettingsScreen,
  ExportDataScreen,
  NotificationsSettingsScreen,
  AboutScreen,
  PrivacyPolicyScreen,
  TermsScreen,
} from "../screens/ProfileScreens";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { palette } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: "fade" }} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: "fade" }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: "fade" }} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ gestureEnabled: true }} />
      <Stack.Screen name="WellnessDetail" component={WellnessDetailScreen} />
      <Stack.Screen name="Breathing" component={BreathingScreen} />
      <Stack.Screen name="Grounding" component={GroundingScreen} />
      <Stack.Screen name="Cbt" component={CbtScreen} />
      <Stack.Screen name="MedicineSearch" component={MedicineSearchScreen} />
      <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
      <Stack.Screen name="ProfessionalHelp" component={ProfessionalHelpScreen} />
      <Stack.Screen name="CounselorRequest" component={CounselorRequestScreen} />
      <Stack.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{ presentation: "card", animation: "fade_from_bottom" }}
      />
      <Stack.Screen
        name="Crisis"
        component={CrisisScreen}
        options={{ presentation: "fullScreenModal", animation: "fade" }}
      />
      <Stack.Screen name="TrustContact" component={TrustContactScreen} />
      <Stack.Screen name="HelpGuide" component={HelpGuideScreen} />
      <Stack.Screen name="MoodHistory" component={MoodHistoryScreen} />
      <Stack.Screen name="JournalList" component={JournalListScreen} />
      <Stack.Screen name="JournalEditor" component={JournalEditorScreen} />
    </Stack.Navigator>
  );
}