import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Unicode text styles
const styles_map: Record<string, (char: string) => string> = {
  'bold': (c) => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1D400 + c.charCodeAt(0) - 65);
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x1D41A + c.charCodeAt(0) - 97);
    if (c >= '0' && c <= '9') return String.fromCodePoint(0x1D7CE + c.charCodeAt(0) - 48);
    return c;
  },
  'italic': (c) => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1D434 + c.charCodeAt(0) - 65);
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x1D44E + c.charCodeAt(0) - 97);
    return c;
  },
  'script': (c) => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1D49C + c.charCodeAt(0) - 65);
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x1D4B6 + c.charCodeAt(0) - 97);
    return c;
  },
  'monospace': (c) => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1D670 + c.charCodeAt(0) - 65);
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x1D68A + c.charCodeAt(0) - 97);
    if (c >= '0' && c <= '9') return String.fromCodePoint(0x1D7F6 + c.charCodeAt(0) - 48);
    return c;
  },
  'strikethrough': (c) => c + '\u0336',
  'underline': (c) => c + '\u0332',
  'circled': (c) => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x24B6 + c.charCodeAt(0) - 65);
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x24D0 + c.charCodeAt(0) - 97);
    if (c >= '1' && c <= '9') return String.fromCodePoint(0x2460 + c.charCodeAt(0) - 49);
    if (c === '0') return '\u24EA';
    return c;
  },
  'squared': (c) => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1F130 + c.charCodeAt(0) - 65);
    return c;
  },
};

const STYLE_OPTIONS = [
  { id: 'bold', label: '𝐁𝐨𝐥𝐝' },
  { id: 'italic', label: '𝐼𝑡𝑎𝑙𝑖𝑐' },
  { id: 'script', label: '𝒮𝒸𝓇𝒾𝓅𝓉' },
  { id: 'monospace', label: '𝙼𝚘𝚗𝚘' },
  { id: 'strikethrough', label: 'S̶t̶r̶i̶k̶e̶' },
  { id: 'underline', label: 'U̲n̲d̲e̲r̲' },
  { id: 'circled', label: 'Ⓒⓘⓡⓒⓛⓔ' },
  { id: 'squared', label: '🅂🅀🅄🄰🅁🄴' },
];

export default function StylishTextTool() {
  const [text, setText] = useState('');
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const applyStyle = (styleId: string): string => {
    if (!text) return '';
    const converter = styles_map[styleId];
    if (!converter) return text;
    return text.split('').map(converter).join('');
  };

  const copyStyle = async (styleId: string) => {
    const styled = applyStyle(styleId);
    if (styled) {
      await Clipboard.setStringAsync(styled);
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
          <Text style={[styles.label, { color: textSecondaryColor }]}>YOUR TEXT</Text>
          <TouchableOpacity onPress={pasteText}>
            <MaterialIcons name="content-paste" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Enter text to style..."
          placeholderTextColor={textSecondaryColor}
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Styles */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>STYLISH FONTS</Text>
        <View style={styles.stylesGrid}>
          {STYLE_OPTIONS.map((style) => {
            const preview = text ? applyStyle(style.id).substring(0, 20) : style.label;
            return (
              <TouchableOpacity
                key={style.id}
                onPress={() => copyStyle(style.id)}
                style={[styles.styleCard, { backgroundColor }]}
              >
                <Text style={[styles.stylePreview, { color: textColor }]} numberOfLines={1}>
                  {preview}
                </Text>
                <View style={styles.copyHint}>
                  <MaterialIcons name="content-copy" size={14} color={primaryColor} />
                  <Text style={{ fontSize: 10, color: textSecondaryColor }}>Tap to copy</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: primaryColor + '15' }]}>
        <MaterialIcons name="info-outline" size={18} color={primaryColor} />
        <Text style={[styles.infoText, { color: textSecondaryColor }]}>
          These are Unicode fonts, so they work on most social media platforms!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  textInput: { fontSize: 18, padding: 14, borderRadius: 10, borderWidth: 1 },
  stylesGrid: { gap: 10 },
  styleCard: { padding: 14, borderRadius: 12 },
  stylePreview: { fontSize: 18, marginBottom: 4 },
  copyHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12 },
  infoText: { flex: 1, fontSize: 12 },
});
