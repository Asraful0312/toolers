import { useAds } from '@/context/AdContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const UNITS = {
  Length: {
    meter: 1, kilometer: 0.001, centimeter: 100, millimeter: 1000,
    mile: 0.000621371, yard: 1.09361, foot: 3.28084, inch: 39.3701,
  },
  Weight: {
    kilogram: 1, gram: 1000, milligram: 1000000, pound: 2.20462,
    ounce: 35.274, ton: 0.001,
  },
  Temperature: { celsius: 'c', fahrenheit: 'f', kelvin: 'k' },
  Volume: {
    liter: 1, milliliter: 1000, gallon: 0.264172, quart: 1.05669,
    pint: 2.11338, cup: 4.22675,
  },
  Area: {
    'square meter': 1, 'square kilometer': 0.000001, 'square foot': 10.7639,
    'square yard': 1.19599, acre: 0.000247105, hectare: 0.0001,
  },
  Time: {
    second: 1, minute: 1 / 60, hour: 1 / 3600, day: 1 / 86400,
    week: 1 / 604800, month: 1 / 2628000, year: 1 / 31536000,
  },
};

type Category = keyof typeof UNITS;

export default function UnitConverterTool() {
  const [category, setCategory] = useState<Category>('Length');
  const [fromUnit, setFromUnit] = useState('meter');
  const [toUnit, setToUnit] = useState('kilometer');
  const [value, setValue] = useState('');
  const [result, setResult] = useState('');
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = '#f97316';

  const units = Object.keys(UNITS[category]);

  const convert = () => {
    const val = parseFloat(value);
    if (isNaN(val)) return;

    if (category === 'Temperature') {
      let celsius: number;
      if (fromUnit === 'celsius') celsius = val;
      else if (fromUnit === 'fahrenheit') celsius = (val - 32) * 5 / 9;
      else celsius = val - 273.15;

      let res: number;
      if (toUnit === 'celsius') res = celsius;
      else if (toUnit === 'fahrenheit') res = celsius * 9 / 5 + 32;
      else res = celsius + 273.15;

      setResult(res.toFixed(4));
    } else {
      const unitData = UNITS[category] as Record<string, number>;
      const inBase = val / unitData[fromUnit];
      const res = inBase * unitData[toUnit];
      setResult(res.toFixed(6));
    }
    onToolComplete();
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {(Object.keys(UNITS) as Category[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => { setCategory(cat); setFromUnit(Object.keys(UNITS[cat])[0]); setToUnit(Object.keys(UNITS[cat])[1]); }}
            style={[styles.categoryChip, category === cat && { backgroundColor: primaryColor, }]}
          >
            <Text style={[styles.categoryText, { color: category === cat ? 'white' : textColor }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>Value</Text>
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor }]}
          keyboardType="numeric"
          placeholder="Enter value"
          placeholderTextColor={textSecondaryColor}
          value={value}
          onChangeText={setValue}
        />

        <View style={styles.unitsRow}>
          <View style={styles.unitPicker}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>From</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {units.map((u) => (
                <TouchableOpacity key={u} onPress={() => setFromUnit(u)} style={[styles.unitChip, fromUnit === u && { backgroundColor: primaryColor }]}>
                  <Text style={[styles.unitText, { color: fromUnit === u ? 'white' : textColor }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity onPress={swapUnits} style={[styles.swapBtn, { backgroundColor: primaryColor + '1A' }]}>
            <MaterialIcons name="swap-vert" size={24} color={primaryColor} />
          </TouchableOpacity>

          <View style={styles.unitPicker}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>To</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {units.map((u) => (
                <TouchableOpacity key={u} onPress={() => setToUnit(u)} style={[styles.unitChip, toUnit === u && { backgroundColor: primaryColor }]}>
                  <Text style={[styles.unitText, { color: toUnit === u ? 'white' : textColor }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity onPress={convert} style={[styles.convertBtn, { backgroundColor: primaryColor }]}>
          <MaterialIcons name="swap-horiz" size={20} color="white" />
          <Text style={styles.convertBtnText}>Convert</Text>
        </TouchableOpacity>
      </View>

      {result ? (
        <View style={[styles.resultCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.resultLabel, { color: textSecondaryColor }]}>Result</Text>
          <Text style={[styles.resultValue, { color: textColor }]}>{result} {toUnit}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  categoryScroll: { marginBottom: 20 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
  categoryText: { fontWeight: '600', fontSize: 14 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  unitsRow: { gap: 12 },
  unitPicker: { marginBottom: 12 },
  unitChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
  unitText: { fontSize: 12, fontWeight: '500' },
  swapBtn: { alignSelf: 'center', padding: 12, borderRadius: 12, marginVertical: 8 },
  convertBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  convertBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  resultCard: { borderRadius: 16, padding: 20, alignItems: 'center' },
  resultLabel: { fontSize: 14, marginBottom: 8 },
  resultValue: { fontSize: 28, fontWeight: 'bold' },
});
