import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type SortOrder = 'asc' | 'desc' | 'reverse' | 'shuffle' | 'length';

const SORT_OPTIONS: { id: SortOrder; label: string; icon: string }[] = [
  { id: 'asc', label: 'A → Z', icon: 'sort-by-alpha' },
  { id: 'desc', label: 'Z → A', icon: 'sort-by-alpha' },
  { id: 'length', label: 'Length', icon: 'straighten' },
  { id: 'reverse', label: 'Reverse', icon: 'swap-vert' },
  { id: 'shuffle', label: 'Shuffle', icon: 'shuffle' },
];

export default function SortLinesTool() {
  const [text, setText] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const getSortedText = (): string => {
    if (!text.trim()) return '';

    let lines = text.split('\n');
    
    // Remove empty lines if enabled
    if (removeEmpty) {
      lines = lines.filter(line => line.trim() !== '');
    }

    // Remove duplicates if enabled
    if (removeDuplicates) {
      lines = [...new Set(lines)];
    }

    // Sort based on selected order
    switch (sortOrder) {
      case 'asc':
        lines.sort((a, b) => a.localeCompare(b));
        break;
      case 'desc':
        lines.sort((a, b) => b.localeCompare(a));
        break;
      case 'length':
        lines.sort((a, b) => a.length - b.length);
        break;
      case 'reverse':
        lines.reverse();
        break;
      case 'shuffle':
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        break;
    }

    return lines.join('\n');
  };

  const result = getSortedText();
  const lineCount = text.split('\n').filter(l => l.trim()).length;

  const copyResult = async () => {
    if (result) {
      await Clipboard.setStringAsync(result);
      showToast('Copied!', 'success');
    }
  };

  const pasteText = async () => {
    const clipboard = await Clipboard.getStringAsync();
    if (clipboard) {
      setText(clipboard);
      showToast('Pasted!', 'success');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Input */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.label, { color: textSecondaryColor }]}>INPUT ({lineCount} lines)</Text>
          <TouchableOpacity onPress={pasteText}>
            <MaterialIcons name="content-paste" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Enter text (one item per line)..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Sort Options */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>SORT ORDER</Text>
        <View style={styles.optionsGrid}>
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.id === sortOrder;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSortOrder(option.id)}
                style={[styles.optionBtn, { backgroundColor: isSelected ? primaryColor : backgroundColor }]}
              >
                <MaterialIcons name={option.icon as any} size={18} color={isSelected ? 'white' : textColor} />
                <Text style={[styles.optionBtnText, { color: isSelected ? 'white' : textColor }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Toggles */}
        <View style={styles.togglesRow}>
          <TouchableOpacity onPress={() => setRemoveEmpty(!removeEmpty)} style={styles.toggleItem}>
            <MaterialIcons name={removeEmpty ? 'check-box' : 'check-box-outline-blank'} size={20} color={primaryColor} />
            <Text style={[styles.toggleText, { color: textColor }]}>Remove empty</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRemoveDuplicates(!removeDuplicates)} style={styles.toggleItem}>
            <MaterialIcons name={removeDuplicates ? 'check-box' : 'check-box-outline-blank'} size={20} color={primaryColor} />
            <Text style={[styles.toggleText, { color: textColor }]}>Remove duplicates</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Result */}
      {result && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>RESULT</Text>
            <TouchableOpacity onPress={copyResult}>
              <MaterialIcons name="content-copy" size={20} color={primaryColor} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.resultText, { color: textColor }]}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  textInput: { fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, minHeight: 120, lineHeight: 22 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  optionBtnText: { fontSize: 13, fontWeight: '600' },
  togglesRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { fontSize: 13 },
  resultText: { fontSize: 14, lineHeight: 22 },
});
