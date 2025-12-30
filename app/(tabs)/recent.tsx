import { TOOLS } from '@/constants/ToolsData';
import { useStorage } from '@/context/StorageContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recentTools, clearRecent } = useStorage();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  // Get full tool details from recent IDs
  const recentToolDetails = recentTools.map((toolId) => {
    for (const category in TOOLS) {
      const tool = TOOLS[category as keyof typeof TOOLS].find((t) => t.id === toolId);
      if (tool) return { ...tool, category };
    }
    return null;
  }).filter(Boolean);

  return (
    <ScrollView style={[styles.container, { backgroundColor, paddingTop: insets.top }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>Recent Tools</Text>
          <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
            {recentToolDetails.length} recently used
          </Text>
        </View>
        {recentToolDetails.length > 0 && (
          <TouchableOpacity onPress={clearRecent} style={[styles.clearBtn, { backgroundColor: '#ef44441A' }]}>
            <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentToolDetails.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
          <MaterialIcons name="history" size={64} color={textSecondaryColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>No recent tools</Text>
          <Text style={[styles.emptyDesc, { color: textSecondaryColor }]}>
            Tools you use will appear here for quick access
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {recentToolDetails.map((tool: any, index: number) => (
            <TouchableOpacity
              key={`${tool.id}-${index}`}
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
              <MaterialIcons name="chevron-right" size={24} color={textSecondaryColor} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  clearBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  emptyState: { borderRadius: 20, padding: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyDesc: { textAlign: 'center', lineHeight: 22 },
  list: { gap: 12 },
  toolCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolInfo: { flex: 1 },
  toolName: { fontSize: 16, fontWeight: '600' },
  toolDesc: { fontSize: 12, marginTop: 2 },
});
