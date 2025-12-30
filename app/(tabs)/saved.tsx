import { TOOLS } from '@/constants/ToolsData';
import { useStorage } from '@/context/StorageContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedTools, removeFromSaved } = useStorage();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  // Get full tool details from saved IDs
  const savedToolDetails = savedTools.map((toolId) => {
    for (const category in TOOLS) {
      const tool = TOOLS[category as keyof typeof TOOLS].find((t) => t.id === toolId);
      if (tool) return { ...tool, category };
    }
    return null;
  }).filter(Boolean);

  return (
    <ScrollView style={[styles.container, { backgroundColor, paddingTop: insets.top }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Saved Tools</Text>
        <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
          {savedToolDetails.length} {savedToolDetails.length === 1 ? 'tool' : 'tools'} saved
        </Text>
      </View>

      {savedToolDetails.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
          <MaterialIcons name="bookmark-border" size={64} color={textSecondaryColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>No saved tools yet</Text>
          <Text style={[styles.emptyDesc, { color: textSecondaryColor }]}>
            Tap the bookmark icon on any tool to save it for quick access
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {savedToolDetails.map((tool: any) => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolCard, { backgroundColor: cardColor }]}
              onPress={() => router.push(`/tool/${tool.id}` as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: primaryColor + '1A' }]}>
                <MaterialIcons name={tool.icon as any} size={24} color={primaryColor} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={[styles.toolName, { color: textColor }]}>{tool.name}</Text>
                <Text style={[styles.toolDesc, { color: textSecondaryColor }]}>{tool.desc}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeFromSaved(tool.id)}
                style={[styles.removeBtn, { backgroundColor: '#ef44441A' }]}
              >
                <MaterialIcons name="bookmark" size={20} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  emptyState: { borderRadius: 20, padding: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyDesc: { textAlign: 'center', lineHeight: 22 },
  list: { gap: 12 },
  toolCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolInfo: { flex: 1 },
  toolName: { fontSize: 16, fontWeight: '600' },
  toolDesc: { fontSize: 12, marginTop: 2 },
  removeBtn: { padding: 10, borderRadius: 10 },
});
