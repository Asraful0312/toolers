import AdBanner from '@/components/AdBanner';
import { CATEGORIES, TOOLS } from '@/constants/ToolsData';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const category = CATEGORIES.find((c) => c.id === id);
  const tools = TOOLS[id as keyof typeof TOOLS] || [];
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  // Filter tools based on search query
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    const query = searchQuery.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.desc.toLowerCase().includes(query)
    );
  }, [tools, searchQuery]);

  if (!category) {
    return (
      <View style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: textColor }}>Category not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: category.name, headerBackTitle: 'Home' }} />
      <View style={[styles.container, { backgroundColor }]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: cardColor }]}>
            <MaterialIcons name="search" size={22} color={textSecondaryColor} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${category.name.toLowerCase()}...`}
              placeholderTextColor={textSecondaryColor}
              style={[styles.searchInput, { color: textColor }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={textSecondaryColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer} style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: category.bg }]}>
              <MaterialIcons name={category.icon as any} size={32} color={category.color} />
            </View>
            <Text style={[styles.toolCount, { color: textSecondaryColor }]}>
              {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} {searchQuery ? 'found' : 'available'}
            </Text>
          </View>

          {/* Tools List */}
          <View style={styles.toolsList}>
            {filteredTools.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={48} color={textSecondaryColor} />
                <Text style={[styles.emptyText, { color: textSecondaryColor }]}>
                  No tools found for "{searchQuery}"
                </Text>
              </View>
            ) : (
              filteredTools.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.toolCard, { backgroundColor: cardColor }]}
                  onPress={() => router.push(`/tool/${tool.id}` as any)}
                >
                  <View style={[styles.toolIcon, { backgroundColor: category.bg }]}>
                    <MaterialIcons name={tool.icon as any} size={24} color={category.color} />
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={[styles.toolName, { color: textColor }]}>{tool.name}</Text>
                    <Text style={[styles.toolDesc, { color: textSecondaryColor }]}>{tool.desc}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={textSecondaryColor} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
        <AdBanner />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolCount: {
    fontSize: 14,
  },
  toolsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toolDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
