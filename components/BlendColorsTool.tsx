import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

const blendColors = (color1: string, color2: string, ratio: number): string => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return '#888888';
  
  const r = rgb1.r * (1 - ratio) + rgb2.r * ratio;
  const g = rgb1.g * (1 - ratio) + rgb2.g * ratio;
  const b = rgb1.b * (1 - ratio) + rgb2.b * ratio;
  
  return rgbToHex(r, g, b);
};

const PRESET_COLORS = [
  '#FF0000', '#FF6B00', '#FFD700', '#00FF00', '#00CED1', 
  '#0080FF', '#8000FF', '#FF00FF', '#FF1493', '#000000', '#FFFFFF',
];

const BLEND_MODES = [
  { id: 'normal', label: 'Normal', steps: 5 },
  { id: 'smooth', label: 'Smooth', steps: 9 },
  { id: 'detailed', label: 'Detailed', steps: 15 },
];

export default function BlendColorsTool() {
  const [color1, setColor1] = useState('#FF0000');
  const [color2, setColor2] = useState('#0080FF');
  const [blendMode, setBlendMode] = useState(BLEND_MODES[1]);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  // Generate blended colors
  const blendedColors = useMemo(() => {
    const colors: string[] = [];
    const steps = blendMode.steps;
    for (let i = 0; i <= steps; i++) {
      colors.push(blendColors(color1, color2, i / steps));
    }
    return colors;
  }, [color1, color2, blendMode]);

  const copyColor = async (color: string) => {
    await Clipboard.setStringAsync(color);
    showToast(`Copied ${color}`, 'success');
  };

  const copyAllColors = async () => {
    const colorsText = blendedColors.join(', ');
    await Clipboard.setStringAsync(colorsText);
    showToast('All colors copied!', 'success');
  };

  const swapColors = () => {
    const temp = color1;
    setColor1(color2);
    setColor2(temp);
  };

  const handleColorInput = (value: string, setter: (v: string) => void) => {
    let hex = value.toUpperCase();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9A-F]{0,6}$/.test(hex)) {
      setter(hex);
    }
  };

  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex);

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Color Inputs */}
      <View style={styles.colorInputsRow}>
        {/* Color 1 */}
        <View style={[styles.colorInputCard, { backgroundColor: cardColor }]}>
          <View style={[styles.colorPreview, { backgroundColor: isValidHex(color1) ? color1 : '#888' }]} />
          <TextInput
            value={color1}
            onChangeText={(v) => handleColorInput(v, setColor1)}
            style={[styles.colorInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
            placeholder="#FF0000"
            placeholderTextColor={textSecondaryColor}
            maxLength={7}
          />
        </View>

        {/* Swap Button */}
        <TouchableOpacity onPress={swapColors} style={[styles.swapBtn, { backgroundColor: cardColor }]}>
          <MaterialIcons name="swap-horiz" size={24} color={primaryColor} />
        </TouchableOpacity>

        {/* Color 2 */}
        <View style={[styles.colorInputCard, { backgroundColor: cardColor }]}>
          <View style={[styles.colorPreview, { backgroundColor: isValidHex(color2) ? color2 : '#888' }]} />
          <TextInput
            value={color2}
            onChangeText={(v) => handleColorInput(v, setColor2)}
            style={[styles.colorInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
            placeholder="#0080FF"
            placeholderTextColor={textSecondaryColor}
            maxLength={7}
          />
        </View>
      </View>

      {/* Preset Colors */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>QUICK COLORS</Text>
        <View style={styles.presetRow}>
          {PRESET_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setColor1(color)}
              onLongPress={() => setColor2(color)}
              style={[styles.presetColor, { backgroundColor: color, borderColor: textSecondaryColor + '30' }]}
            />
          ))}
        </View>
        <Text style={[styles.hint, { color: textSecondaryColor }]}>
          Tap for Color 1 • Long press for Color 2
        </Text>
      </View>

      {/* Blend Mode */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>BLEND STEPS</Text>
        <View style={styles.modeRow}>
          {BLEND_MODES.map((mode) => {
            const isSelected = mode.id === blendMode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                onPress={() => setBlendMode(mode)}
                style={[styles.modeBtn, { backgroundColor: isSelected ? primaryColor : backgroundColor }]}
              >
                <Text style={[styles.modeBtnText, { color: isSelected ? 'white' : textColor }]}>
                  {mode.label}
                </Text>
                <Text style={[styles.modeBtnSteps, { color: isSelected ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>
                  {mode.steps + 1} colors
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Gradient Preview */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.gradientHeader}>
          <Text style={[styles.label, { color: textSecondaryColor }]}>GRADIENT BLEND</Text>
          <TouchableOpacity onPress={copyAllColors}>
            <MaterialIcons name="content-copy" size={18} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.gradientBar}>
          {blendedColors.map((color, index) => (
            <View key={index} style={[styles.gradientSegment, { backgroundColor: color }]} />
          ))}
        </View>
      </View>

      {/* Color Swatches */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>COLOR PALETTE</Text>
        <View style={styles.swatchGrid}>
          {blendedColors.map((color, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => copyColor(color)}
              style={styles.swatchItem}
            >
              <View style={[styles.swatchColor, { backgroundColor: color }]}>
                {index === 0 && <Text style={styles.swatchLabel}>Start</Text>}
                {index === blendedColors.length - 1 && <Text style={styles.swatchLabel}>End</Text>}
              </View>
              <Text style={[styles.swatchHex, { color: textSecondaryColor }]}>{color}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: primaryColor + '15' }]}>
        <MaterialIcons name="touch-app" size={18} color={primaryColor} />
        <Text style={[styles.infoText, { color: textSecondaryColor }]}>
          Tap any color in the palette to copy its hex code
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  colorInputsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  colorInputCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 8 },
  colorPreview: { width: 50, height: 50, borderRadius: 25 },
  colorInput: { width: '100%', textAlign: 'center', fontSize: 14, fontWeight: '600', padding: 8, borderRadius: 8, borderWidth: 1 },
  swapBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetColor: { width: 28, height: 28, borderRadius: 14, borderWidth: 1 },
  hint: { fontSize: 11, marginTop: 10, textAlign: 'center' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modeBtnText: { fontWeight: '600', fontSize: 13 },
  modeBtnSteps: { fontSize: 10, marginTop: 2 },
  gradientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gradientBar: { flexDirection: 'row', height: 40, borderRadius: 10, overflow: 'hidden' },
  gradientSegment: { flex: 1 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchItem: { alignItems: 'center', gap: 4 },
  swatchColor: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { color: 'white', fontSize: 8, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  swatchHex: { fontSize: 9 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12 },
  infoText: { flex: 1, fontSize: 12 },
});
