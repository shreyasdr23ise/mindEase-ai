import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import type { MainTabParamList } from "./types";

import { HomeScreen } from "../screens/HomeScreen";
import { ChatListScreen } from "../screens/ChatListScreen";
import { MoodHomeScreen } from "../screens/MoodHomeScreen";
import { WellnessListScreen } from "../screens/WellnessListScreen";
import { ProfileHomeScreen } from "../screens/ProfileHomeScreen";

export const TAB_BAR_HEIGHT = 64;

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { palette } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.tabBar,
          borderTopColor: palette.borderSoft,
          borderTopWidth: 1,
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarItemStyle: { borderRadius: 14 },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatListScreen}
        options={{
          tabBarLabel: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MoodTab"
        component={MoodHomeScreen}
        options={{
          tabBarLabel: "Mood",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "happy" : "happy-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WellnessTab"
        component={WellnessListScreen}
        options={{
          tabBarLabel: "Wellness",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "leaf" : "leaf-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileHomeScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}