import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CharacterCounterTool() {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({ chars: 0, words: 0, noSpaces: 0, lines: 0 });
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const noSpaces = text.replace(/\s/g, '').length;
    const lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length;
    setStats({ chars, words, noSpaces, lines });
  }, [text]);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(text);
    showToast('Text copied!');
  };

  const pasteFromClipboard = async () => {
    const content = await Clipboard.getStringAsync();
    setText(content);
    showToast('Text pasted!', 'info');
  };

  const clearText = () => {
    setText('');
    showToast('Text cleared', 'info');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.inputContainer, { backgroundColor: cardColor }]}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          multiline
          placeholder="Type or paste your text here..."
          placeholderTextColor={textSecondaryColor}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />
        <View style={styles.actions}>
          <TouchableOpacity onPress={copyToClipboard} style={[styles.actionButton, { backgroundColor: primaryColor + '1A' }]}>
            <MaterialIcons name="content-copy" size={20} color={primaryColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={pasteFromClipboard} style={[styles.actionButton, { backgroundColor: primaryColor + '1A' }]}>
            <MaterialIcons name="content-paste" size={20} color={primaryColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearText} style={[styles.actionButton, { backgroundColor: '#ef44441A' }]}>
            <MaterialIcons name="delete" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>STATISTICS</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="abc" label="Characters" value={stats.chars} color={primaryColor} bg={cardColor} textColor={textColor} secondaryColor={textSecondaryColor} />
        <StatCard icon="segment" label="Words" value={stats.words} color={primaryColor} bg={cardColor} textColor={textColor} secondaryColor={textSecondaryColor} />
        <StatCard icon="space-bar" label="No Spaces" value={stats.noSpaces} color={primaryColor} bg={cardColor} textColor={textColor} secondaryColor={textSecondaryColor} />
        <StatCard icon="format-align-justify" label="Lines" value={stats.lines} color={primaryColor} bg={cardColor} textColor={textColor} secondaryColor={textSecondaryColor} />
      </View>

      <View style={[styles.extendedStats, { backgroundColor: cardColor, borderColor }]}>
        <View style={[styles.statRow, { borderBottomColor: borderColor }]}>
          <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Reading Time</Text>
          <Text style={[styles.statValue, { color: textColor }]}>~{Math.ceil(stats.words / 200)} min</Text>
        </View>
        <View style={[styles.statRow, { borderBottomColor: borderColor }]}>
          <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Speaking Time</Text>
          <Text style={[styles.statValue, { color: textColor }]}>~{Math.ceil(stats.words / 130)} min</Text>
        </View>
        <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Sentence Count</Text>
          <Text style={[styles.statValue, { color: textColor }]}>{text === '' ? 0 : text.split(/[.!?]+/).filter(Boolean).length}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const StatCard = ({ icon, label, value, color, bg, textColor, secondaryColor }: any) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <View style={styles.statHeader}>
      <MaterialIcons name={icon} size={20} color={color} />
      <Text style={[styles.statLabel, { color: secondaryColor }]}>{label}</Text>
    </View>
    <Text style={[styles.statValueLarge, { color: textColor }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  inputContainer: { borderRadius: 16, padding: 16, marginBottom: 24, minHeight: 200, position: 'relative' },
  input: { fontSize: 16, minHeight: 160, marginBottom: 40 },
  actions: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8, borderRadius: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '48%', padding: 16, borderRadius: 16, gap: 8 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { fontSize: 14, fontWeight: '500' },
  statValueLarge: { fontSize: 24, fontWeight: 'bold' },
  extendedStats: { borderRadius: 16, padding: 16, borderWidth: 1 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  statValue: { fontSize: 14, fontWeight: '600' },
});
