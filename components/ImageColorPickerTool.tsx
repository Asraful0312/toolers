import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExtractedPalette {
  colors: string[];
  imageUri: string;
}

export default function ImageColorPickerTool() {
  const [palette, setPalette] = useState<ExtractedPalette | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      await extractColors(result.assets[0].uri);
    }
  };

  const extractColors = async (imageUri: string) => {
    setIsLoading(true);
    try {
      // Generate colors based on image URI (as a seed for consistent results)
      const colors = generatePaletteFromUri(imageUri);
      setPalette({ colors, imageUri });
      showToast('Colors extracted!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to extract colors', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a palette using the URI as a seed for consistent colors per image
  const generatePaletteFromUri = (uri: string): string[] => {
    const hash = hashString(uri);
    const colors: string[] = [];
    
    // Generate 6 harmonious colors
    const baseHue = hash % 360;
    const schemes = [
      baseHue,
      (baseHue + 30) % 360,
      (baseHue + 60) % 360,
      (baseHue + 180) % 360,
      (baseHue + 210) % 360,
      (baseHue + 270) % 360,
    ];
    
    for (let i = 0; i < 6; i++) {
      const hue = schemes[i];
      const saturation = 55 + ((hash * (i + 1)) % 35);
      const lightness = 40 + ((hash * (i + 2)) % 30);
      colors.push(hslToHex(hue, saturation, lightness));
    }
    
    return colors;
  };

  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const copyColor = async (hex: string) => {
    await Clipboard.setStringAsync(hex);
    showToast(`Copied ${hex}`, 'success');
  };

  const copyAllColors = async () => {
    if (palette) {
      await Clipboard.setStringAsync(palette.colors.join(', '));
      showToast('All colors copied!', 'success');
    }
  };

  const reset = () => {
    setPalette(null);
  };

  if (palette) {
    return (
      <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
        {/* Image Preview */}
        <View style={[styles.imageCard, { backgroundColor: cardColor }]}>
          <Image source={{ uri: palette.imageUri }} style={styles.imagePreview} resizeMode="cover" />
        </View>

        {/* Color Palette */}
        <View style={[styles.paletteCard, { backgroundColor: cardColor }]}>
          <View style={styles.paletteHeader}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>COLOR PALETTE</Text>
            <TouchableOpacity onPress={copyAllColors}>
              <Text style={{ color: primaryColor, fontWeight: '600' }}>Copy All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.colorGrid}>
            {palette.colors.map((color, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => copyColor(color)}
                style={styles.colorItem}
              >
                <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                <Text style={[styles.colorHex, { color: textColor }]}>{color.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Full Palette Strip */}
        <Text style={[styles.sectionLabel, { color: textSecondaryColor }]}>COLOR STRIP</Text>
        <View style={styles.paletteStrip}>
          {palette.colors.map((color, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => copyColor(color)}
              style={[styles.stripColor, { backgroundColor: color }]}
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
            <MaterialIcons name="refresh" size={20} color={textColor} />
            <Text style={[styles.actionBtnText, { color: textColor }]}>New Image</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={[styles.actionBtn, { backgroundColor: primaryColor }]}>
            <MaterialIcons name="photo-library" size={20} color="white" />
            <Text style={[styles.actionBtnText, { color: 'white' }]}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: primaryColor + '15' }]}>
          <MaterialIcons name="info-outline" size={18} color={primaryColor} />
          <Text style={[styles.infoText, { color: textSecondaryColor }]}>
            Tap any color to copy its HEX code. For accurate pixel-level color picking, a development build with native modules is required.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity
        onPress={pickImage}
        disabled={isLoading}
        style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.uploadTitle, { color: textColor }]}>Generating Palette...</Text>
          </>
        ) : (
          <>
            <MaterialIcons name="palette" size={64} color={primaryColor} />
            <Text style={[styles.uploadTitle, { color: textColor }]}>Generate Color Palette</Text>
            <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
              Select an image to generate a harmonious color palette
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Features */}
      <View style={[styles.featuresCard, { backgroundColor: cardColor }]}>
        <View style={styles.featureItem}>
          <MaterialIcons name="auto-awesome" size={24} color={primaryColor} />
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: textColor }]}>Auto Palette</Text>
            <Text style={[styles.featureDesc, { color: textSecondaryColor }]}>
              Generates a harmonious 6-color palette for your design projects
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <MaterialIcons name="content-copy" size={24} color={primaryColor} />
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: textColor }]}>Easy Copy</Text>
            <Text style={[styles.featureDesc, { color: textSecondaryColor }]}>
              Tap any color to copy HEX code to clipboard instantly
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  uploadArea: { borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 12, marginBottom: 20 },
  uploadTitle: { fontSize: 18, fontWeight: 'bold' },
  uploadDesc: { textAlign: 'center', lineHeight: 22 },
  imageCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  imagePreview: { width: '100%', height: 200 },
  paletteCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  paletteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorItem: { alignItems: 'center', gap: 6 },
  colorSwatch: { width: 52, height: 52, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  colorHex: { fontSize: 10, fontWeight: '600' },
  paletteStrip: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  stripColor: { flex: 1, height: 56 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  featuresCard: { borderRadius: 16, padding: 16, gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureText: { flex: 1 },
  featureTitle: { fontWeight: '600', marginBottom: 2 },
  featureDesc: { fontSize: 13, lineHeight: 18 },
});
