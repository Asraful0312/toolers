import { CATEGORIES, TOOLS } from '@/constants/ToolsData';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Quick access items with their tool IDs
const QUICK_ACCESS_ITEMS = [
  { id: 'calculator', toolId: 'calculator', icon: 'calculate', label: 'Calc', color: 'white', isPrimary: true },
  { id: 'qr-code', toolId: 'qr-code', icon: 'qr-code', label: 'QR Code', color: '#6366f1' },
  { id: 'unit-converter', toolId: 'unit-converter', icon: 'scale', label: 'Units', color: '#f97316' },
  { id: 'color-picker', toolId: 'color-picker', icon: 'palette', label: 'Colors', color: '#a855f7' },
  { id: 'password-gen', toolId: 'password-gen', icon: 'vpn-key', label: 'Pass Gen', color: '#22c55e' },
];


export default function ToolyHomeDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  // Get all tools flattened for search
  const allTools = useMemo(() => {
    const tools: { id: string; name: string; desc: string; category: string; categoryName: string }[] = [];
    for (const categoryId in TOOLS) {
      const category = CATEGORIES.find((c) => c.id === categoryId);
      TOOLS[categoryId as keyof typeof TOOLS].forEach((tool) => {
        tools.push({
          id: tool.id,
          name: tool.name,
          desc: tool.desc,
          category: categoryId,
          categoryName: category?.name || categoryId,
        });
      });
    }
    return tools;
  }, []);

  // Filter tools based on search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.desc.toLowerCase().includes(query) ||
        tool.categoryName.toLowerCase().includes(query)
    );
  }, [searchQuery, allTools]);

  const navigateToTool = (toolId: string) => {
    router.push(`/tool/${toolId}` as any);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: primaryColor }]}>
            <MaterialIcons name="construction" size={20} color="white" />
          </View>
          <Text style={[styles.logoText, { color: textColor }]}>Tooly</Text>
        </View>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: cardColor }]}>
          <MaterialIcons name="notifications" size={22} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Welcome & Search */}
      <View style={styles.section}>
        <Text style={[styles.welcomeText, { color: textColor }]}>{getGreeting()},</Text>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={textSecondaryColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: cardColor, color: textColor }]}
            placeholder="Search for tools, converters..."
            placeholderTextColor={textSecondaryColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={[styles.clearButton, { backgroundColor: primaryColor + '1A' }]}>
              <MaterialIcons name="close" size={18} color={primaryColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchQuery.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 12 }]}>
            {searchResults.length > 0 ? `Found ${searchResults.length} tools` : 'No tools found'}
          </Text>
          {searchResults.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.searchResult, { backgroundColor: cardColor }]}
              onPress={() => navigateToTool(tool.id)}
            >
              <View>
                <Text style={[styles.searchResultName, { color: textColor }]}>{tool.name}</Text>
                <Text style={[styles.searchResultCategory, { color: textSecondaryColor }]}>{tool.categoryName}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={textSecondaryColor} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Access - Only show when not searching */}
      {searchQuery.length === 0 && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Access</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAccessList}>
              {QUICK_ACCESS_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickAccessItem}
                  onPress={() => navigateToTool(item.toolId)}
                >
                  <View
                    style={[
                      styles.quickAccessIcon,
                      {
                        backgroundColor: item.isPrimary ? primaryColor : cardColor,
                        borderColor: item.isPrimary ? undefined : item.color + '1A',
                        borderWidth: item.isPrimary ? 0 : 1,
                      },
                    ]}
                  >
                    <MaterialIcons name={item.icon as any} size={24} color={item.isPrimary ? 'white' : item.color} />
                  </View>
                  <Text style={[styles.quickAccessLabel, { color: textSecondaryColor }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* AI Banner */}
          <View style={styles.section}>
            <View style={styles.aiBanner}>
              <View style={styles.aiBannerContent}>
                <View style={styles.aiBadge}>
                  <MaterialIcons name="auto-awesome" size={18} color="white" />
                  <Text style={styles.aiBadgeText}>NEW FEATURE</Text>
                </View>
                <Text style={styles.aiTitle}>AI Productivity Assistant</Text>
                <Text style={styles.aiDesc}>Summarize text & generate code snippets instantly.</Text>
                <TouchableOpacity style={styles.aiButton}>
                  <Text style={[styles.aiButtonText, { color: primaryColor }]}>Try Now</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.circle1} />
              <View style={styles.circle2} />
            </View>
          </View>

          {/* Categories Grid */}
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 12 }]}>All Tools</Text>
            <View style={styles.grid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.card, { backgroundColor: cardColor }]}
                  onPress={() => router.push(`/category/${cat.id}` as any)}
                >
                  <View style={[styles.cardIcon, { backgroundColor: cat.bg }]}>
                    <MaterialIcons name={cat.icon as any} size={24} color={cat.color} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: textColor }]}>{cat.name}</Text>
                    <Text style={[styles.cardDesc, { color: textSecondaryColor }]}>{cat.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.card, styles.moreCard, { borderColor }]}>
                <View style={[styles.moreIcon, { backgroundColor: borderColor }]}>
                  <MaterialIcons name="add" size={20} color={textSecondaryColor} />
                </View>
                <Text style={[styles.moreText, { color: textSecondaryColor }]}>More Coming Soon</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 20, fontWeight: 'bold' },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  section: { paddingHorizontal: 24, marginTop: 16 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  searchIcon: { position: 'absolute', left: 16, zIndex: 1 },
  searchInput: { flex: 1, height: 48, borderRadius: 12, paddingLeft: 44, paddingRight: 48, fontSize: 16, fontWeight: '500' },
  clearButton: { position: 'absolute', right: 12, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  quickAccessList: { gap: 16, paddingBottom: 4 },
  quickAccessItem: { alignItems: 'center', gap: 8 },
  quickAccessIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  quickAccessLabel: { fontSize: 12, fontWeight: '500' },
  searchResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  searchResultName: { fontSize: 16, fontWeight: '600' },
  searchResultCategory: { fontSize: 12, marginTop: 2 },
  aiBanner: { backgroundColor: '#359EFF', borderRadius: 16, padding: 20, overflow: 'hidden', position: 'relative' },
  aiBannerContent: { zIndex: 10 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  aiBadgeText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  aiTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  aiDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  aiButton: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 12, alignSelf: 'flex-start' },
  aiButtonText: { fontSize: 12, fontWeight: 'bold' },
  circle1: { position: 'absolute', top: -32, right: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.1)' },
  circle2: { position: 'absolute', bottom: -32, right: 40, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.1)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '47%', padding: 16, borderRadius: 16, gap: 12, elevation: 2 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardDesc: { fontSize: 12, marginTop: 2 },
  moreCard: { backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', elevation: 0 },
  moreIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 14, fontWeight: '600' },
});
