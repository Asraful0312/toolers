import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ReverseType = 'text' | 'words' | 'lines';

const REVERSE_OPTIONS: { id: ReverseType; label: string; desc: string; icon: string }[] = [
  { id: 'text', label: 'Reverse Text', desc: 'Reverse all characters', icon: 'swap-horiz' },
  { id: 'words', label: 'Reverse Words', desc: 'Reverse word order', icon: 'compare-arrows' },
  { id: 'lines', label: 'Reverse Lines', desc: 'Reverse line order', icon: 'swap-vert' },
];

export default function ReverseTextTool() {
  const [text, setText] = useState('');
  const [reverseType, setReverseType] = useState<ReverseType>('text');
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const result = useMemo(() => {
    if (!text) return '';
    
    switch (reverseType) {
      case 'text':
        return text.split('').reverse().join('');
      case 'words':
        return text.split(' ').reverse().join(' ');
      case 'lines':
        return text.split('\n').reverse().join('\n');
      default:
        return text;
    }
  }, [text, reverseType]);

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
          <Text style={[styles.label, { color: textSecondaryColor }]}>INPUT TEXT</Text>
          <TouchableOpacity onPress={pasteText}>
            <MaterialIcons name="content-paste" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Enter text to reverse..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Reverse Type */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>REVERSE MODE</Text>
        <View style={styles.optionsGrid}>
          {REVERSE_OPTIONS.map((option) => {
            const isSelected = option.id === reverseType;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setReverseType(option.id)}
                style={[styles.optionCard, { 
                  backgroundColor: isSelected ? primaryColor + '15' : backgroundColor,
                  borderColor: isSelected ? primaryColor : textSecondaryColor + '30'
                }]}
              >
                <MaterialIcons name={option.icon as any} size={24} color={isSelected ? primaryColor : textSecondaryColor} />
                <Text style={[styles.optionTitle, { color: isSelected ? primaryColor : textColor }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDesc, { color: textSecondaryColor }]}>
                  {option.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  textInput: { fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, minHeight: 100, lineHeight: 22 },
  optionsGrid: { gap: 10 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  optionTitle: { fontWeight: '600', flex: 1 },
  optionDesc: { fontSize: 12 },
  resultText: { fontSize: 14, lineHeight: 22 },
});
