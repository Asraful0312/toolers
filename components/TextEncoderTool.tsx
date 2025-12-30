import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type EncodeType = 'base64-encode' | 'base64-decode' | 'url-encode' | 'url-decode' | 'html-encode' | 'html-decode';

const ENCODE_OPTIONS: { id: EncodeType; label: string; category: string }[] = [
  { id: 'base64-encode', label: 'Encode', category: 'Base64' },
  { id: 'base64-decode', label: 'Decode', category: 'Base64' },
  { id: 'url-encode', label: 'Encode', category: 'URL' },
  { id: 'url-decode', label: 'Decode', category: 'URL' },
  { id: 'html-encode', label: 'Encode', category: 'HTML' },
  { id: 'html-decode', label: 'Decode', category: 'HTML' },
];

const htmlEntities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

const reverseHtmlEntities: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
};

export default function TextEncoderTool() {
  const [text, setText] = useState('');
  const [encodeType, setEncodeType] = useState<EncodeType>('base64-encode');
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const result = useMemo(() => {
    if (!text) { setError(''); return ''; }
    
    try {
      setError('');
      switch (encodeType) {
        case 'base64-encode':
          return btoa(unescape(encodeURIComponent(text)));
        case 'base64-decode':
          return decodeURIComponent(escape(atob(text)));
        case 'url-encode':
          return encodeURIComponent(text);
        case 'url-decode':
          return decodeURIComponent(text);
        case 'html-encode':
          return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
        case 'html-decode':
          return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, entity => reverseHtmlEntities[entity] || entity);
        default:
          return text;
      }
    } catch (e) {
      setError('Invalid input for this encoding');
      return '';
    }
  }, [text, encodeType]);

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

  const swapInputOutput = () => {
    if (result) {
      setText(result);
      // Toggle between encode/decode
      const newType = encodeType.includes('-encode') 
        ? encodeType.replace('-encode', '-decode') as EncodeType
        : encodeType.replace('-decode', '-encode') as EncodeType;
      setEncodeType(newType);
    }
  };

  // Group by category
  const categories = ['Base64', 'URL', 'HTML'];

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
          placeholder="Enter text to encode/decode..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Encode Options */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>ENCODING TYPE</Text>
        {categories.map((cat) => (
          <View key={cat} style={styles.categoryRow}>
            <Text style={[styles.categoryLabel, { color: textSecondaryColor }]}>{cat}</Text>
            <View style={styles.optionsRow}>
              {ENCODE_OPTIONS.filter(o => o.category === cat).map((option) => {
                const isSelected = option.id === encodeType;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setEncodeType(option.id)}
                    style={[styles.optionBtn, { backgroundColor: isSelected ? primaryColor : backgroundColor }]}
                  >
                    <Text style={{ color: isSelected ? 'white' : textColor, fontWeight: '600' }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Error */}
      {error && (
        <View style={[styles.errorCard, { backgroundColor: '#ef444420' }]}>
          <MaterialIcons name="error-outline" size={18} color="#ef4444" />
          <Text style={{ color: '#ef4444' }}>{error}</Text>
        </View>
      )}

      {/* Result */}
      {result && !error && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>RESULT</Text>
            <View style={styles.resultActions}>
              <TouchableOpacity onPress={swapInputOutput}>
                <MaterialIcons name="swap-vert" size={20} color={primaryColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={copyResult}>
                <MaterialIcons name="content-copy" size={20} color={primaryColor} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.resultText, { color: textColor }]} selectable>{result}</Text>
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
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryLabel: { width: 60, fontSize: 12 },
  optionsRow: { flex: 1, flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  resultActions: { flexDirection: 'row', gap: 16 },
  resultText: { fontSize: 14, lineHeight: 22 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 16 },
});
