import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Bookmark, MapPin, Wallet, User } from '@/components/common/CustomIcons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1B2A4A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F3F5',
          borderTopWidth: 1,
          height: 54 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 7,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Home size={22} color={color} fill={focused ? color : 'none'} strokeWidth={focused ? 2.1 : 1.7} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: '보관함',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Bookmark size={22} color={color} fill={focused ? color : 'none'} strokeWidth={focused ? 2.1 : 1.7} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: '일정/동선',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <MapPin size={22} color={color} fill={focused ? color : 'none'} strokeWidth={focused ? 2.1 : 1.7} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: '가계부',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Wallet size={22} color={color} fill={focused ? color : 'none'} strokeWidth={focused ? 2.1 : 1.7} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <User size={22} color={color} fill={focused ? color : 'none'} strokeWidth={focused ? 2.1 : 1.7} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
