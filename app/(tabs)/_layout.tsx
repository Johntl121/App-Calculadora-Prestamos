import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0f766e', // Tu verde característico
        tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8', // Gris adaptativo
        tabBarStyle: {
          backgroundColor: isDark ? '#020617' : '#ffffff', // slate-950 o blanco
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0', // Borde sutil adaptativo
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Simulador',
          tabBarIcon: ({ color }) => <Ionicons name="calculator" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore" // OJO: Si tu archivo de la tabla se llama "two.tsx", cambia "explore" por "two"
        options={{
          title: 'Cuotas',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}