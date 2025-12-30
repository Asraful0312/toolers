import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type NumberStyle = 'numbers' | 'dots' | 'dashes' | 'brackets' | 'roman';

const NUMBER_STYLES: { id: NumberStyle; label: string; example: string }[] = [
  { id: 'numbers', label: '1. 2. 3.', example: '1. ' },
  { id: 'dots', label: '• Bullets', example: '• ' },
  { id: 'dashes', label: '- Dashes', example: '- ' },
  { id: 'brackets', label: '[1] [2]', example: '[1] ' },
  { id: 'roman', label: 'I. II. III.', example: 'I. ' },
];

const toRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

export default function AddNumbersTool() {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<NumberStyle>('numbers');
  const [startFrom, setStartFrom] = useState('1');
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const result = useMemo(() => {
    if (!text.trim()) return '';
    
    const lines = text.split('\n').filter(line => line.trim());
    const start = parseInt(startFrom) || 1;

    return lines.map((line, index) => {
      const num = start + index;
      switch (style) {
        case 'numbers':
          return `${num}. ${line}`;
        case 'dots':
          return `• ${line}`;
        case 'dashes':
          return `- ${line}`;
        case 'brackets':
          return `[${num}] ${line}`;
        case 'roman':
          return `${toRoman(num)}. ${line}`;
        default:
          return line;
      }
    }).join('\n');
  }, [text, style, startFrom]);

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
          placeholder="Enter items (one per line)..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Style Selection */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>NUMBERING STYLE</Text>
        <View style={styles.stylesRow}>
          {NUMBER_STYLES.map((s) => {
            const isSelected = s.id === style;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setStyle(s.id)}
                style={[styles.styleBtn, { backgroundColor: isSelected ? primaryColor : backgroundColor }]}
              >
                <Text style={[styles.styleBtnText, { color: isSelected ? 'white' : textColor }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Start Number */}
        {(style === 'numbers' || style === 'brackets' || style === 'roman') && (
          <View style={styles.startRow}>
            <Text style={[styles.startLabel, { color: textSecondaryColor }]}>Start from:</Text>
            <TextInput
              value={startFrom}
              onChangeText={setStartFrom}
              keyboardType="number-pad"
              style={[styles.startInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
            />
          </View>
        )}
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
  stylesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  styleBtnText: { fontWeight: '600', fontSize: 13 },
  startRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  startLabel: { fontSize: 14 },
  startInput: { width: 60, textAlign: 'center', fontSize: 16, fontWeight: '600', padding: 8, borderRadius: 8, borderWidth: 1 },
  resultText: { fontSize: 14, lineHeight: 22 },
});
