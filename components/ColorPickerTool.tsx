import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#000000',
];

export default function ColorPickerTool() {
  const [red, setRed] = useState(53);
  const [green, setGreen] = useState(158);
  const [blue, setBlue] = useState(255);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
  const rgbColor = `rgb(${red}, ${green}, ${blue})`;
  const hslColor = rgbToHsl(red, green, blue);

  const copyHex = async () => { await Clipboard.setStringAsync(hexColor); showToast('HEX copied!'); };
  const copyRgb = async () => { await Clipboard.setStringAsync(rgbColor); showToast('RGB copied!'); };
  const copyHsl = async () => { await Clipboard.setStringAsync(hslColor); showToast('HSL copied!'); };

  const applyPreset = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setRed(r);
    setGreen(g);
    setBlue(b);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.preview, { backgroundColor: hexColor }]}>
        <Text style={[styles.previewText, { color: red + green + blue > 380 ? '#000' : '#fff' }]}>{hexColor.toUpperCase()}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PRESETS</Text>
      <View style={styles.presetsRow}>
        {PRESETS.map((c) => (
          <TouchableOpacity key={c} onPress={() => applyPreset(c)} style={[styles.presetCircle, { backgroundColor: c }]} />
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <SliderRow label="Red" value={red} onChange={setRed} color="#ef4444" textColor={textColor} secondaryColor={textSecondaryColor} />
        <SliderRow label="Green" value={green} onChange={setGreen} color="#22c55e" textColor={textColor} secondaryColor={textSecondaryColor} />
        <SliderRow label="Blue" value={blue} onChange={setBlue} color="#3b82f6" textColor={textColor} secondaryColor={textSecondaryColor} />
      </View>

      <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>COLOR VALUES</Text>
      <View style={[styles.valuesCard, { backgroundColor: cardColor }]}>
        <ValueRow label="HEX" value={hexColor.toUpperCase()} onCopy={copyHex} textColor={textColor} secondaryColor={textSecondaryColor} primaryColor={primaryColor} />
        <ValueRow label="RGB" value={rgbColor} onCopy={copyRgb} textColor={textColor} secondaryColor={textSecondaryColor} primaryColor={primaryColor} />
        <ValueRow label="HSL" value={hslColor} onCopy={copyHsl} textColor={textColor} secondaryColor={textSecondaryColor} primaryColor={primaryColor} />
      </View>
    </ScrollView>
  );
}

const SliderRow = ({ label, value, onChange, color, textColor, secondaryColor }: any) => (
  <View style={styles.sliderRow}>
    <Text style={[styles.sliderLabel, { color: secondaryColor }]}>{label}</Text>
    <View style={styles.sliderContainer}>
      <TouchableOpacity onPress={() => onChange(Math.max(0, value - 10))} style={[styles.sliderBtn, { backgroundColor: color + '1A' }]}>
        <MaterialIcons name="remove" size={18} color={color} />
      </TouchableOpacity>
      <TextInput
        style={[styles.sliderInput, { color: textColor }]}
        keyboardType="numeric"
        value={String(value)}
        onChangeText={(t) => onChange(Math.min(255, Math.max(0, parseInt(t) || 0)))}
      />
      <TouchableOpacity onPress={() => onChange(Math.min(255, value + 10))} style={[styles.sliderBtn, { backgroundColor: color + '1A' }]}>
        <MaterialIcons name="add" size={18} color={color} />
      </TouchableOpacity>
    </View>
  </View>
);

const ValueRow = ({ label, value, onCopy, textColor, secondaryColor, primaryColor }: any) => (
  <View style={styles.valueRow}>
    <Text style={[styles.valueLabel, { color: secondaryColor }]}>{label}</Text>
    <Text style={[styles.valueText, { color: textColor }]}>{value}</Text>
    <TouchableOpacity onPress={onCopy} style={[styles.copyBtn, { backgroundColor: primaryColor + '1A' }]}>
      <MaterialIcons name="content-copy" size={16} color={primaryColor} />
    </TouchableOpacity>
  </View>
);

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  preview: { height: 120, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  previewText: { fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  presetCircle: { width: 36, height: 36, borderRadius: 18 },
  card: { borderRadius: 16, padding: 20, marginBottom: 24 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sliderLabel: { width: 50, fontWeight: '500' },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sliderInput: { width: 50, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  valuesCard: { borderRadius: 16, padding: 16 },
  valueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  valueLabel: { width: 40, fontWeight: '500' },
  valueText: { flex: 1, fontFamily: 'monospace', fontSize: 14 },
  copyBtn: { padding: 8, borderRadius: 8 },
});
