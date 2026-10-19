import AdBanner from '@/components/AdBanner';
import ToolyHomeDashboard from '@/components/ToolyHomeDashboard';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ToolyHomeDashboard />
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
