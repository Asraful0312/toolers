import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type CleanType = 'spaces' | 'empty' | 'duplicateLines' | 'duplicateWords' | 'trim';

const CLEAN_OPTIONS: { id: CleanType; label: string; desc: string }[] = [
  { id: 'spaces', label: 'Extra Spaces', desc: 'Remove multiple spaces' },
  { id: 'empty', label: 'Empty Lines', desc: 'Remove blank lines' },
  { id: 'duplicateLines', label: 'Duplicate Lines', desc: 'Keep unique lines only' },
  { id: 'duplicateWords', label: 'Duplicate Words', desc: 'Remove repeated words' },
  { id: 'trim', label: 'Trim Lines', desc: 'Remove leading/trailing spaces' },
];

export default function TextCleanerTool() {
  const [text, setText] = useState('');
  const [options, setOptions] = useState<Record<CleanType, boolean>>({
    spaces: true,
    empty: true,
    duplicateLines: false,
    duplicateWords: false,
    trim: true,
  });
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const toggleOption = (id: CleanType) => {
    setOptions({ ...options, [id]: !options[id] });
  };

  const result = useMemo(() => {
    if (!text) return '';

    let cleaned = text;

    // Extra spaces
    if (options.spaces) {
      cleaned = cleaned.replace(/  +/g, ' ');
    }

    // Trim lines
    if (options.trim) {
      cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    }

    // Empty lines
    if (options.empty) {
      cleaned = cleaned.split('\n').filter(line => line.trim() !== '').join('\n');
    }

    // Duplicate lines
    if (options.duplicateLines) {
      cleaned = [...new Set(cleaned.split('\n'))].join('\n');
    }

    // Duplicate words
    if (options.duplicateWords) {
      const words = cleaned.split(/\s+/);
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const word of words) {
        const lower = word.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          unique.push(word);
        }
      }
      cleaned = unique.join(' ');
    }

    return cleaned;
  }, [text, options]);

  const removedCount = text.length - result.length;

  const copyResult = async () => {
    if (result) {
      await Clipboard.setStringAsync(result);
      showToast('Copied!', 'success');
      onToolComplete();
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
          <Text style={[styles.label, { color: textSecondaryColor }]}>INPUT TEXT</Text>
          <TouchableOpacity onPress={pasteText}>
            <MaterialIcons name="content-paste" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Enter messy text to clean..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Clean Options */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>CLEAN OPTIONS</Text>
        <View style={styles.optionsGrid}>
          {CLEAN_OPTIONS.map((option) => {
            const isSelected = options[option.id];
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => toggleOption(option.id)}
                style={[styles.optionRow, { backgroundColor: isSelected ? primaryColor + '10' : 'transparent' }]}
              >
                <MaterialIcons
                  name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={isSelected ? primaryColor : textSecondaryColor}
                />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: textColor }]}>{option.label}</Text>
                  <Text style={[styles.optionDesc, { color: textSecondaryColor }]}>{option.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Result */}
      {result && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>
              RESULT {removedCount > 0 && `(${removedCount} chars removed)`}
            </Text>
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
  textInput: { fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, minHeight: 100, lineHeight: 22 },
  optionsGrid: { gap: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10 },
  optionText: { flex: 1 },
  optionTitle: { fontWeight: '600' },
  optionDesc: { fontSize: 12, marginTop: 1 },
  resultText: { fontSize: 14, lineHeight: 22 },
});
