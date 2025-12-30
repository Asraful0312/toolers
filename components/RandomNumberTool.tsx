import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RandomNumberTool() {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('1');
  const [results, setResults] = useState<number[]>([]);
  const [history, setHistory] = useState<number[][]>([]);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const generate = () => {
    const minVal = parseInt(min) || 0;
    const maxVal = parseInt(max) || 100;
    const countVal = Math.min(parseInt(count) || 1, 50);

    const nums: number[] = [];
    for (let i = 0; i < countVal; i++) {
      nums.push(Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal);
    }
    setResults(nums);
    setHistory((prev) => [nums, ...prev.slice(0, 9)]);
  };

  const copyResults = async () => {
    await Clipboard.setStringAsync(results.join(', '));
    showToast('Numbers copied!');
  };

  const copyHistoryItem = async (nums: number[]) => {
    await Clipboard.setStringAsync(nums.join(', '));
    showToast('Copied!');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>Min</Text>
            <TextInput style={[styles.input, { color: textColor, backgroundColor }]} keyboardType="numeric" value={min} onChangeText={setMin} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>Max</Text>
            <TextInput style={[styles.input, { color: textColor, backgroundColor }]} keyboardType="numeric" value={max} onChangeText={setMax} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>Count</Text>
            <TextInput style={[styles.input, { color: textColor, backgroundColor }]} keyboardType="numeric" value={count} onChangeText={setCount} />
          </View>
        </View>
        <TouchableOpacity onPress={generate} style={[styles.generateBtn, { backgroundColor: primaryColor }]}>
          <MaterialIcons name="casino" size={20} color="white" />
          <Text style={styles.generateBtnText}>Generate</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>RESULTS</Text>
          <View style={[styles.resultsCard, { backgroundColor: cardColor }]}>
            <View style={styles.resultsGrid}>
              {results.map((num, i) => (
                <View key={i} style={[styles.resultBadge, { backgroundColor: primaryColor + '1A' }]}>
                  <Text style={[styles.resultNum, { color: primaryColor }]}>{num}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={copyResults} style={[styles.copyBtn, { backgroundColor: primaryColor }]}>
              <MaterialIcons name="content-copy" size={16} color="white" />
              <Text style={styles.copyBtnText}>Copy All</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {history.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>HISTORY</Text>
          <View style={[styles.historyCard, { backgroundColor: cardColor }]}>
            {history.map((nums, i) => (
              <TouchableOpacity key={i} onPress={() => copyHistoryItem(nums)} style={styles.historyRow}>
                <Text style={[styles.historyText, { color: textColor }]} numberOfLines={1}>{nums.join(', ')}</Text>
                <MaterialIcons name="content-copy" size={16} color={textSecondaryColor} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  card: { borderRadius: 16, padding: 20, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  inputGroup: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, textAlign: 'center' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  generateBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  resultsCard: { borderRadius: 16, padding: 16, marginBottom: 24 },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultBadge: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  resultNum: { fontSize: 18, fontWeight: 'bold' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  copyBtnText: { color: 'white', fontWeight: '600' },
  historyCard: { borderRadius: 16, padding: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  historyText: { flex: 1, fontSize: 14, marginRight: 12 },
});
