import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FindReplaceTool() {
  const [text, setText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [result, setResult] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const findAndReplace = () => {
    if (!text || !findText) {
      setResult(text);
      setMatchCount(0);
      return;
    }

    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const matches = text.match(regex);
    setMatchCount(matches ? matches.length : 0);
    setResult(text.replace(regex, replaceText));
  };

  const copyResult = async () => {
    if (result) {
      await Clipboard.setStringAsync(result);
      showToast('Copied!', 'success');
      onToolComplete();
    }
  };

  const applyResult = () => {
    if (result) {
      setText(result);
      setResult('');
      setMatchCount(0);
      showToast('Applied!', 'success');
      onToolComplete();
    }
  };

  const clear = () => {
    setText('');
    setFindText('');
    setReplaceText('');
    setResult('');
    setMatchCount(0);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Input Text */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>INPUT TEXT</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Enter or paste your text here..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Find & Replace Inputs */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>FIND</Text>
            <TextInput
              value={findText}
              onChangeText={setFindText}
              placeholder="Text to find..."
              placeholderTextColor={textSecondaryColor}
              style={[styles.smallInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>REPLACE WITH</Text>
            <TextInput
              value={replaceText}
              onChangeText={setReplaceText}
              placeholder="Replacement..."
              placeholderTextColor={textSecondaryColor}
              style={[styles.smallInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
            />
          </View>
        </View>

        {/* Options */}
        <TouchableOpacity
          onPress={() => setCaseSensitive(!caseSensitive)}
          style={styles.optionRow}
        >
          <MaterialIcons
            name={caseSensitive ? 'check-box' : 'check-box-outline-blank'}
            size={22}
            color={primaryColor}
          />
          <Text style={[styles.optionText, { color: textColor }]}>Case Sensitive</Text>
        </TouchableOpacity>

        {/* Replace Button */}
        <TouchableOpacity onPress={findAndReplace} style={[styles.replaceBtn, { backgroundColor: primaryColor }]}>
          <MaterialIcons name="find-replace" size={20} color="white" />
          <Text style={styles.replaceBtnText}>Find & Replace</Text>
        </TouchableOpacity>
      </View>

      {/* Result */}
      {result !== '' && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.resultHeader}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>
              RESULT ({matchCount} {matchCount === 1 ? 'match' : 'matches'} replaced)
            </Text>
            <View style={styles.resultActions}>
              <TouchableOpacity onPress={applyResult}>
                <MaterialIcons name="check" size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity onPress={copyResult}>
                <MaterialIcons name="content-copy" size={20} color={primaryColor} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.resultText, { color: textColor }]}>{result}</Text>
        </View>
      )}

      {/* Clear Button */}
      {text && (
        <TouchableOpacity onPress={clear} style={[styles.clearBtn, { borderColor: textSecondaryColor }]}>
          <MaterialIcons name="delete-outline" size={20} color={textSecondaryColor} />
          <Text style={{ color: textSecondaryColor }}>Clear All</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  textInput: { fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, minHeight: 120, lineHeight: 22 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  smallInput: { fontSize: 14, padding: 12, borderRadius: 10, borderWidth: 1 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  optionText: { fontSize: 14 },
  replaceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, marginTop: 16 },
  replaceBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultActions: { flexDirection: 'row', gap: 16 },
  resultText: { fontSize: 14, lineHeight: 22 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1 },
});
