import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { COLORS } from '../utils/constants';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import FriendsScreen from '../screens/FriendsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

const fadeOptions = TransitionPresets.FadeTransition;

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...fadeOptions, headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator screenOptions={fadeOptions}>
    <Stack.Screen
      name="Discover"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Friends"
      component={FriendsScreen}
      options={{
        title: 'Friends',
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
      }}
    />
  </Stack.Navigator>
);

const ChatStack = () => (
  <Stack.Navigator screenOptions={fadeOptions}>
    <Stack.Screen
      name="ChatList"
      component={ChatListScreen}
      options={{
        title: 'Messages',
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
      }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={({ route }) => ({
        title: route.params?.userName || 'Chat',
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
      })}
    />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { unreadMessages, pendingRequests } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'DiscoverTab') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'ChatsTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 2,
          borderTopColor: COLORS.black,
        },
        tabBarBadgeStyle: {
          backgroundColor: COLORS.primary,
          color: COLORS.black,
          fontSize: 10,
          fontWeight: '800',
        },
      })}
    >
      <Tab.Screen
        name="DiscoverTab"
        component={HomeStack}
        options={{
          title: 'Discover',
          tabBarBadge: pendingRequests > 0 ? pendingRequests : undefined,
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatStack}
        options={{
          title: 'Chats',
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
