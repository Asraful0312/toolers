import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CaseConverterTool() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const conversions = [
    { label: 'UPPERCASE', fn: (s: string) => s.toUpperCase() },
    { label: 'lowercase', fn: (s: string) => s.toLowerCase() },
    { label: 'Title Case', fn: (s: string) => s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) },
    { label: 'Sentence case', fn: (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() },
    { label: 'aLtErNaTiNg', fn: (s: string) => s.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('') },
    { label: 'InVeRsE', fn: (s: string) => s.split('').map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('') },
  ];

  const applyConversion = (fn: (s: string) => string) => {
    setResult(fn(text));
  };

  const copyResult = async () => {
    await Clipboard.setStringAsync(result);
    showToast('Copied to clipboard!');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.inputContainer, { backgroundColor: cardColor }]}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          multiline
          placeholder="Enter text to convert..."
          placeholderTextColor={textSecondaryColor}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>CONVERSIONS</Text>
      <View style={styles.buttonsGrid}>
        {conversions.map((conv) => (
          <TouchableOpacity
            key={conv.label}
            style={[styles.conversionButton, { backgroundColor: cardColor }]}
            onPress={() => applyConversion(conv.fn)}
          >
            <Text style={[styles.buttonText, { color: primaryColor }]}>{conv.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>RESULT</Text>
      <View style={[styles.resultContainer, { backgroundColor: cardColor }]}>
        <Text style={[styles.resultText, { color: textColor }]}>{result || 'Result will appear here...'}</Text>
        {result ? (
          <TouchableOpacity onPress={copyResult} style={[styles.copyButton, { backgroundColor: primaryColor }]}>
            <MaterialIcons name="content-copy" size={18} color="white" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  inputContainer: { borderRadius: 16, padding: 16, marginBottom: 24, minHeight: 120 },
  input: { fontSize: 16, minHeight: 100 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  buttonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  conversionButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  buttonText: { fontWeight: '600' },
  resultContainer: { borderRadius: 16, padding: 16, minHeight: 100 },
  resultText: { fontSize: 16, lineHeight: 24 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  copyButtonText: { color: 'white', fontWeight: '600' },
});
