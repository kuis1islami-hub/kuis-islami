// App.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

// Import screens
import HomeScreen from "./screens/HomeScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import LevelScreen from "./screens/LevelScreen";
import ProfileScreen from "./screens/ProfileScreen";

// Definisi route dan param
export type RootStackParamList = {
  Home: undefined;
  Level: { level: number };
  Leaderboard: { player?: string } | undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Kuis Islami" }}
        />
        <Stack.Screen
          name="Level"
          component={LevelScreen}
          options={{ title: "Level" }}
        />
        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: "Papan Skor" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profil Saya" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
