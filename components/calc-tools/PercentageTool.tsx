import { useAds } from '@/context/AdContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PercentageTool() {
  const [number, setNumber] = useState('');
  const [percentage, setPercentage] = useState('');
  const [results, setResults] = useState<{ label: string; value: string }[]>([]);
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = "#22c55e";

  const calculate = () => {
    const num = parseFloat(number);
    const pct = parseFloat(percentage);
    if (isNaN(num) || isNaN(pct)) return;

    setResults([
      { label: `${pct}% of ${num}`, value: ((pct / 100) * num).toFixed(2) },
      { label: `${num} + ${pct}%`, value: (num + (pct / 100) * num).toFixed(2) },
      { label: `${num} − ${pct}%`, value: (num - (pct / 100) * num).toFixed(2) },
      { label: `${num} is what % of ${num * (100 / pct)}?`, value: `${pct}%` },
    ]);
    onToolComplete();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>Number</Text>
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: backgroundColor }]}
          keyboardType="numeric"
          placeholder="Enter a number"
          placeholderTextColor={textSecondaryColor}
          value={number}
          onChangeText={setNumber}
        />

        <Text style={[styles.label, { color: textSecondaryColor, marginTop: 16 }]}>Percentage (%)</Text>
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: backgroundColor }]}
          keyboardType="numeric"
          placeholder="Enter percentage"
          placeholderTextColor={textSecondaryColor}
          value={percentage}
          onChangeText={setPercentage}
        />

        <TouchableOpacity onPress={calculate} style={[styles.calculateBtn, { backgroundColor: primaryColor }]}>
          <MaterialIcons name="calculate" size={20} color="white" />
          <Text style={styles.calculateBtnText}>Calculate</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>RESULTS</Text>
          <View style={[styles.resultsCard, { backgroundColor: cardColor }]}>
            {results.map((r, i) => (
              <View key={i} style={[styles.resultRow, i < results.length - 1 && styles.resultRowBorder]}>
                <Text style={[styles.resultLabel, { color: textSecondaryColor }]}>{r.label}</Text>
                <Text style={[styles.resultValue, { color: textColor }]}>{r.value}</Text>
              </View>
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
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  calculateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  calculateBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  resultsCard: { borderRadius: 16, padding: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  resultRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  resultLabel: { fontSize: 14 },
  resultValue: { fontSize: 16, fontWeight: 'bold' },
});
