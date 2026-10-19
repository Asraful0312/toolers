import { CATEGORIES, TOOLS } from '@/constants/ToolsData';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tool icon mapping
const TOOL_ICONS: Record<string, { icon: string; color: string }> = {
  'calculator': { icon: 'calculate', color: '#6366f1' },
  'qr-code': { icon: 'qr-code', color: '#6366f1' },
  'unit-converter': { icon: 'scale', color: '#f97316' },
  'color-picker': { icon: 'palette', color: '#a855f7' },
  'password-gen': { icon: 'vpn-key', color: '#22c55e' },
  'resize': { icon: 'photo-size-select-large', color: '#3b82f6' },
  'crop': { icon: 'crop', color: '#3b82f6' },
  'json-formatter': { icon: 'code', color: '#10b981' },
  'image-to-pdf': { icon: 'picture-as-pdf', color: '#ef4444' },
  'pdf-merge': { icon: 'merge-type', color: '#ef4444' },
  'pdf-compress': { icon: 'compress', color: '#ef4444' },
  'barcode-scanner': { icon: 'qr-code-scanner', color: '#8b5cf6' },
  'text-counter': { icon: 'text-fields', color: '#06b6d4' },
  'percentage': { icon: 'percent', color: '#f59e0b' },
};

// Default quick access tool IDs
const DEFAULT_QUICK_ACCESS = ['calculator', 'qr-code', 'unit-converter', 'color-picker', 'password-gen'];
const STORAGE_KEY = 'quick_access_tools';

export default function ToolyHomeDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAccessIds, setQuickAccessIds] = useState<string[]>(DEFAULT_QUICK_ACCESS);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>([]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  // Load saved quick access on mount
  useEffect(() => {
    loadQuickAccess();
  }, []);

  const loadQuickAccess = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setQuickAccessIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load quick access:', e);
    }
  };

  const saveQuickAccess = async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      setQuickAccessIds(ids);
    } catch (e) {
      console.error('Failed to save quick access:', e);
    }
  };

  // Get all tools flattened
  const allTools = useMemo(() => {
    const tools: { id: string; name: string; desc: string; category: string; categoryName: string; icon: string }[] = [];
    for (const categoryId in TOOLS) {
      const category = CATEGORIES.find((c) => c.id === categoryId);
      TOOLS[categoryId as keyof typeof TOOLS].forEach((tool) => {
        tools.push({
          id: tool.id,
          name: tool.name,
          desc: tool.desc,
          category: categoryId,
          categoryName: category?.name || categoryId,
          icon: tool.icon,
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

  // Get quick access tools with details
  const quickAccessTools = useMemo(() => {
    return quickAccessIds.map((id) => {
      const tool = allTools.find((t) => t.id === id);
      const iconInfo = TOOL_ICONS[id] || { icon: 'build', color: '#6366f1' };
      return {
        id,
        name: tool?.name || id,
        icon: iconInfo.icon,
        color: iconInfo.color,
      };
    }).filter(Boolean);
  }, [quickAccessIds, allTools]);

  const navigateToTool = (toolId: string) => {
    router.push(`/tool/${toolId}` as any);
  };

  const openEditModal = () => {
    setTempSelection([...quickAccessIds]);
    setIsEditModalOpen(true);
  };

  const toggleToolSelection = (toolId: string) => {
    if (tempSelection.includes(toolId)) {
      setTempSelection(tempSelection.filter((id) => id !== toolId));
    } else if (tempSelection.length < 6) {
      setTempSelection([...tempSelection, toolId]);
    }
  };

  const handleSave = () => {
    saveQuickAccess(tempSelection);
    setIsEditModalOpen(false);
  };

  const handleReset = () => {
    setTempSelection([...DEFAULT_QUICK_ACCESS]);
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
          <Text style={[styles.logoText, { color: textColor }]}>Toolers</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.section}>
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
              <TouchableOpacity onPress={openEditModal} style={[styles.editBtn, { backgroundColor: cardColor }]}>
                <MaterialIcons name="edit" size={16} color={primaryColor} />
                <Text style={[styles.editBtnText, { color: primaryColor }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAccessList}>
              {quickAccessTools.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickAccessItem}
                  onPress={() => navigateToTool(item.id)}
                >
                  <View
                    style={[
                      styles.quickAccessIcon,
                      {
                        backgroundColor: index === 0 ? primaryColor : cardColor,
                        borderColor: index === 0 ? undefined : item.color + '1A',
                        borderWidth: index === 0 ? 0 : 1,
                      },
                    ]}
                  >
                    <MaterialIcons name={item.icon as any} size={24} color={index === 0 ? 'white' : item.color} />
                  </View>
                  <Text style={[styles.quickAccessLabel, { color: textSecondaryColor }]} numberOfLines={1}>
                    {item.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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

      {/* Edit Quick Access Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Edit Quick Access</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <MaterialIcons name="close" size={24} color={textSecondaryColor} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: textSecondaryColor }]}>
              Select up to 6 tools ({tempSelection.length}/6)
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <View key={cat.id} style={styles.categorySection}>
                  <Text style={[styles.categoryLabel, { color: textSecondaryColor }]}>{cat.name}</Text>
                  {TOOLS[cat.id as keyof typeof TOOLS]?.map((tool) => {
                    const isSelected = tempSelection.includes(tool.id);
                    return (
                      <TouchableOpacity
                        key={tool.id}
                        style={[styles.toolOption, { backgroundColor: cardColor, borderColor: isSelected ? primaryColor : 'transparent', borderWidth: isSelected ? 2 : 0 }]}
                        onPress={() => toggleToolSelection(tool.id)}
                      >
                        <View style={styles.toolOptionLeft}>
                          <MaterialIcons name={tool.icon as any} size={20} color={isSelected ? primaryColor : textSecondaryColor} />
                          <Text style={[styles.toolOptionName, { color: textColor }]}>{tool.name}</Text>
                        </View>
                        {isSelected && <MaterialIcons name="check-circle" size={22} color={primaryColor} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={handleReset} style={[styles.resetBtn, { borderColor: textSecondaryColor }]}>
                <Text style={[styles.resetBtnText, { color: textSecondaryColor }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: primaryColor }]}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 20, fontWeight: 'bold' },
  section: { paddingHorizontal: 24, marginTop: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  searchIcon: { position: 'absolute', left: 16, zIndex: 1 },
  searchInput: { flex: 1, height: 48, borderRadius: 12, paddingLeft: 44, paddingRight: 48, fontSize: 16, fontWeight: '500' },
  clearButton: { position: 'absolute', right: 12, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 13, fontWeight: '600' },
  quickAccessList: { gap: 8, paddingBottom: 4 },
  quickAccessItem: { alignItems: 'center', gap: 8, width: 64 },
  quickAccessIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  quickAccessLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  searchResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  searchResultName: { fontSize: 16, fontWeight: '600' },
  searchResultCategory: { fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '47%', padding: 16, borderRadius: 16, gap: 12, elevation: 2 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardDesc: { fontSize: 12, marginTop: 2 },
  moreCard: { backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', elevation: 0 },
  moreIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 14, fontWeight: '600' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 14, paddingHorizontal: 24, marginBottom: 16 },
  modalScroll: { paddingHorizontal: 24 },
  categorySection: { marginBottom: 20 },
  categoryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  toolOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginBottom: 8 },
  toolOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toolOptionName: { fontSize: 15, fontWeight: '500' },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 24, paddingBottom: 32 },
  resetBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  resetBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 2, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
