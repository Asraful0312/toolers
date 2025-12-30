import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PrefixSuffixTool() {
  const [text, setText] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [applyTo, setApplyTo] = useState<'lines' | 'words'>('lines');
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const result = useMemo(() => {
    if (!text.trim()) return '';
    
    if (applyTo === 'lines') {
      return text.split('\n').map(line => {
        if (!line.trim()) return line;
        return `${prefix}${line}${suffix}`;
      }).join('\n');
    } else {
      return text.split(/\s+/).map(word => {
        if (!word.trim()) return word;
        return `${prefix}${word}${suffix}`;
      }).join(' ');
    }
  }, [text, prefix, suffix, applyTo]);

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

  const presets = [
    { prefix: '"', suffix: '"', label: 'Quotes' },
    { prefix: '(', suffix: ')', label: 'Parentheses' },
    { prefix: '[', suffix: ']', label: 'Brackets' },
    { prefix: '<', suffix: '>', label: 'Angle' },
    { prefix: '• ', suffix: '', label: 'Bullet' },
    { prefix: '- ', suffix: '', label: 'Dash' },
  ];

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
          placeholder="Enter text..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Prefix & Suffix Inputs */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>PREFIX</Text>
            <TextInput
              value={prefix}
              onChangeText={setPrefix}
              placeholder="Before..."
              placeholderTextColor={textSecondaryColor}
              style={[styles.smallInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>SUFFIX</Text>
            <TextInput
              value={suffix}
              onChangeText={setSuffix}
              placeholder="After..."
              placeholderTextColor={textSecondaryColor}
              style={[styles.smallInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
            />
          </View>
        </View>

        {/* Presets */}
        <Text style={[styles.label, { color: textSecondaryColor, marginTop: 16 }]}>QUICK PRESETS</Text>
        <View style={styles.presetsRow}>
          {presets.map((preset, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => { setPrefix(preset.prefix); setSuffix(preset.suffix); }}
              style={[styles.presetBtn, { backgroundColor }]}
            >
              <Text style={[styles.presetBtnText, { color: textColor }]}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Apply To */}
        <Text style={[styles.label, { color: textSecondaryColor, marginTop: 16 }]}>APPLY TO</Text>
        <View style={styles.applyRow}>
          <TouchableOpacity
            onPress={() => setApplyTo('lines')}
            style={[styles.applyBtn, { backgroundColor: applyTo === 'lines' ? primaryColor : backgroundColor }]}
          >
            <Text style={{ color: applyTo === 'lines' ? 'white' : textColor, fontWeight: '600' }}>Each Line</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setApplyTo('words')}
            style={[styles.applyBtn, { backgroundColor: applyTo === 'words' ? primaryColor : backgroundColor }]}
          >
            <Text style={{ color: applyTo === 'words' ? 'white' : textColor, fontWeight: '600' }}>Each Word</Text>
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
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  textInput: { fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, minHeight: 100, lineHeight: 22 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  smallInput: { fontSize: 14, padding: 12, borderRadius: 10, borderWidth: 1 },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  presetBtnText: { fontSize: 13, fontWeight: '500' },
  applyRow: { flexDirection: 'row', gap: 10 },
  applyBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  resultText: { fontSize: 14, lineHeight: 22 },
});
