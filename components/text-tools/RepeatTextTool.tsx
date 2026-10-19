import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RepeatTextTool() {
  const [text, setText] = useState('');
  const [repeatCount, setRepeatCount] = useState('3');
  const [separator, setSeparator] = useState('newline');
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const separators = [
    { id: 'newline', label: 'New Line', value: '\n' },
    { id: 'space', label: 'Space', value: ' ' },
    { id: 'comma', label: 'Comma', value: ', ' },
    { id: 'none', label: 'None', value: '' },
  ];

  const result = useMemo(() => {
    if (!text.trim()) return '';
    const count = Math.min(parseInt(repeatCount) || 1, 100); // Max 100
    const sep = separators.find(s => s.id === separator)?.value ?? '\n';
    return Array(count).fill(text).join(sep);
  }, [text, repeatCount, separator]);

  const copyResult = async () => {
    if (result) {
      await Clipboard.setStringAsync(result);
      showToast('Copied!', 'success');
      onToolComplete();
    }
  };

  const adjustCount = (delta: number) => {
    const current = parseInt(repeatCount) || 1;
    const newValue = Math.max(1, Math.min(100, current + delta));
    setRepeatCount(String(newValue));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Input */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>TEXT TO REPEAT</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Enter text to repeat..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Options */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        {/* Repeat Count */}
        <Text style={[styles.label, { color: textSecondaryColor }]}>REPEAT COUNT</Text>
        <View style={styles.countRow}>
          <TouchableOpacity
            onPress={() => adjustCount(-1)}
            style={[styles.countBtn, { backgroundColor: backgroundColor }]}
          >
            <MaterialIcons name="remove" size={24} color={primaryColor} />
          </TouchableOpacity>
          <TextInput
            value={repeatCount}
            onChangeText={setRepeatCount}
            keyboardType="number-pad"
            style={[styles.countInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
          />
          <TouchableOpacity
            onPress={() => adjustCount(1)}
            style={[styles.countBtn, { backgroundColor: backgroundColor }]}
          >
            <MaterialIcons name="add" size={24} color={primaryColor} />
          </TouchableOpacity>
        </View>

        {/* Separator */}
        <Text style={[styles.label, { color: textSecondaryColor, marginTop: 16 }]}>SEPARATOR</Text>
        <View style={styles.separatorRow}>
          {separators.map((sep) => {
            const isSelected = sep.id === separator;
            return (
              <TouchableOpacity
                key={sep.id}
                onPress={() => setSeparator(sep.id)}
                style={[styles.sepBtn, { backgroundColor: isSelected ? primaryColor : backgroundColor }]}
              >
                <Text style={[styles.sepBtnText, { color: isSelected ? 'white' : textColor }]}>
                  {sep.label}
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
            <Text style={[styles.label, { color: textSecondaryColor }]}>
              RESULT ({result.length} chars)
            </Text>
            <TouchableOpacity onPress={copyResult}>
              <MaterialIcons name="content-copy" size={20} color={primaryColor} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.resultText, { color: textColor }]} numberOfLines={10}>
            {result}
          </Text>
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
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  textInput: { fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, minHeight: 80, lineHeight: 22 },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  countBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  countInput: { width: 80, textAlign: 'center', fontSize: 24, fontWeight: 'bold', padding: 10, borderRadius: 10, borderWidth: 1 },
  separatorRow: { flexDirection: 'row', gap: 8 },
  sepBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  sepBtnText: { fontWeight: '600', fontSize: 13 },
  resultText: { fontSize: 14, lineHeight: 22 },
});
