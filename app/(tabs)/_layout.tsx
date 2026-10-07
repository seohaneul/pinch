import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Compass, Bookmark, MapPin, Wallet, User, Sparkles } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#8D99AE',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0F0F5',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-primary/10 p-1.5 rounded-xl' : ''}>
              <Compass size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: '보관함',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-primary/10 p-1.5 rounded-xl' : ''}>
              <Bookmark size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: '일정/동선',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-primary/10 p-1.5 rounded-xl' : ''}>
              <MapPin size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: '가계부',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-primary/10 p-1.5 rounded-xl' : ''}>
              <Wallet size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '마이',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-primary/10 p-1.5 rounded-xl' : ''}>
              <User size={focused ? 22 : 20} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
