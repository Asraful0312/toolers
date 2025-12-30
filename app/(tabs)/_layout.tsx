import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const activeColor = Colors[theme].tint;
  const inactiveColor = Colors[theme].tabIconDefault;
  const backgroundColor = Colors[theme].card;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: backgroundColor,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="favorite" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mic"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <View style={styles.micButton}>
              <MaterialIcons size={28} name="mic" color="white" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            // Handle mic press (e.g., open modal)
            alert('Mic pressed');
          },
        })}
      />
      <Tabs.Screen
        name="recent"
        options={{
          title: 'Recent',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#359EFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Push it up
    shadowColor: '#359EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
