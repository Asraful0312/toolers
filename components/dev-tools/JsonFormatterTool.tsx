import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function JsonFormatterTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const beautify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const copyOutput = async () => {
    await Clipboard.setStringAsync(output);
    showToast('Copied to clipboard!');
    onToolComplete();
  };

  const pasteInput = async () => {
    const content = await Clipboard.getStringAsync();
    setInput(content);
    showToast('Pasted from clipboard', 'info');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: textSecondaryColor }]}>Input JSON</Text>
          <TouchableOpacity onPress={pasteInput} style={[styles.iconBtn, { backgroundColor: primaryColor + '1A' }]}>
            <MaterialIcons name="content-paste" size={18} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor }]}
          multiline
          placeholder='{"key": "value"}'
          placeholderTextColor={textSecondaryColor}
          value={input}
          onChangeText={setInput}
          textAlignVertical="top"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={beautify} style={[styles.actionBtn, { backgroundColor: primaryColor }]}>
            <MaterialIcons name="format-align-left" size={18} color="white" />
            <Text style={styles.actionBtnText}>Beautify</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={minify} style={[styles.actionBtn, { backgroundColor: primaryColor }]}>
            <MaterialIcons name="compress" size={18} color="white" />
            <Text style={styles.actionBtnText}>Minify</Text>
          </TouchableOpacity>
        </View>
      </View>

      {output ? (
        <>
          <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>OUTPUT</Text>
          <View style={[styles.outputCard, { backgroundColor: cardColor }]}>
            <ScrollView horizontal>
              <Text style={[styles.outputText, { color: textColor }]}>{output}</Text>
            </ScrollView>
            <TouchableOpacity onPress={copyOutput} style={[styles.copyBtn, { backgroundColor: primaryColor }]}>
              <MaterialIcons name="content-copy" size={18} color="white" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500' },
  iconBtn: { padding: 8, borderRadius: 8 },
  input: { borderRadius: 12, padding: 16, fontSize: 14, minHeight: 150, fontFamily: 'monospace' },
  errorText: { color: '#ef4444', marginTop: 8, fontSize: 12 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { color: 'white', fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  outputCard: { borderRadius: 16, padding: 16 },
  outputText: { fontFamily: 'monospace', fontSize: 12, lineHeight: 20 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  copyBtnText: { color: 'white', fontWeight: '600' },
});
