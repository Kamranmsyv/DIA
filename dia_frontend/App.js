/**
 * DÍA - Digital Investment Accelerator
 * Main Application Entry Point
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { typography, spacing } from './src/theme/typography';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OTPScreen from './src/screens/OTPScreen';
import HomeScreen from './src/screens/HomeScreen';
import InvestingScreen from './src/screens/InvestingScreen';
import RoundUpScreen from './src/screens/RoundUpScreen';
import FundsScreen from './src/screens/FundsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import MoreScreen from './src/screens/MoreScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar with Theme Support
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.backgroundLight, borderTopColor: theme.border }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const getIconName = (routeName, focused) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Invest: focused ? 'trending-up' : 'trending-up-outline',
            Transfer: focused ? 'swap-vertical' : 'swap-vertical-outline',
            Plan: focused ? 'calendar' : 'calendar-outline',
            More: focused ? 'grid' : 'grid-outline',
          };
          return icons[routeName] || 'ellipse-outline';
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <View key={route.key} style={styles.tabItem}>
            <View
              style={[
                styles.tabButton,
                isFocused && { backgroundColor: theme.primary + '20' },
              ]}
            >
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={24}
                color={isFocused ? theme.primary : theme.textSecondary}
                onPress={onPress}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? theme.primary : theme.textSecondary },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Placeholder screens for tabs
const TransferScreen = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.background }]}>
      <View style={[styles.placeholderIcon, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name="swap-vertical" size={48} color={theme.primary} />
      </View>
      <Text style={[styles.placeholderText, { color: theme.textPrimary }]}>Transfer</Text>
      <Text style={[styles.placeholderSubtext, { color: theme.textSecondary }]}>Coming Soon</Text>
    </View>
  );
};

const PlanScreen = () => {
  const { theme } = useTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.background }]}>
      <View style={[styles.placeholderIcon, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name="calendar" size={48} color={theme.primary} />
      </View>
      <Text style={[styles.placeholderText, { color: theme.textPrimary }]}>Plan</Text>
      <Text style={[styles.placeholderSubtext, { color: theme.textSecondary }]}>Coming Soon</Text>
    </View>
  );
};

// Bottom Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Invest"
        component={InvestingScreen}
        options={{ tabBarLabel: 'Invest' }}
      />
      <Tab.Screen
        name="Transfer"
        component={TransferScreen}
        options={{ tabBarLabel: 'Transfer' }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{ tabBarLabel: 'Plan' }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ tabBarLabel: 'More' }}
      />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator
const AuthStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
    </Stack.Navigator>
  );
};

// Main Stack Navigator
const MainStack = () => {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="RoundUp" component={RoundUpScreen} />
      <Stack.Screen name="Funds" component={FundsScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator
const RootNavigator = () => {
  const { isAuthenticated } = useAuth();
  const { theme, isDarkMode } = useTheme();

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={theme.background} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <Stack.Screen name="Main" component={MainStack} />
        )}
      </Stack.Navigator>
    </>
  );
};

// App Component
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: spacing.xs,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  placeholderText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
  },
  placeholderSubtext: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
});
