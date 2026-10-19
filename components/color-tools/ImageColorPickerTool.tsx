import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getColors } from 'react-native-image-colors';

interface ExtractedPalette {
  colors: string[];
  imageUri: string;
}

export default function ImageColorPickerTool() {
  const [palette, setPalette] = useState<ExtractedPalette | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = '#ec4899';

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      await extractColors(result.assets[0].uri);
    }
  };

  const extractColors = async (imageUri: string) => {
    setIsLoading(true);
    try {
      // Use react-native-image-colors to extract real colors from the image
      const result = await getColors(imageUri, {
        fallback: '#228B22',
        cache: true,
        key: imageUri,
      });

      const colors: string[] = [];

      // Extract colors based on platform result
      if (result.platform === 'android') {
        if (result.dominant) colors.push(result.dominant);
        if (result.vibrant) colors.push(result.vibrant);
        if (result.darkVibrant) colors.push(result.darkVibrant);
        if (result.lightVibrant) colors.push(result.lightVibrant);
        if (result.darkMuted) colors.push(result.darkMuted);
        if (result.lightMuted) colors.push(result.lightMuted);
        if (result.muted) colors.push(result.muted);
        if (result.average) colors.push(result.average);
      } else if (result.platform === 'ios') {
        if (result.primary) colors.push(result.primary);
        if (result.secondary) colors.push(result.secondary);
        if (result.background) colors.push(result.background);
        if (result.detail) colors.push(result.detail);
      } else {
        // Web fallback
        if (result.dominant) colors.push(result.dominant);
        if (result.vibrant) colors.push(result.vibrant);
        if (result.darkVibrant) colors.push(result.darkVibrant);
        if (result.lightVibrant) colors.push(result.lightVibrant);
        if (result.darkMuted) colors.push(result.darkMuted);
        if (result.lightMuted) colors.push(result.lightMuted);
      }

      // Filter out duplicates and invalid colors
      const uniqueColors = [...new Set(colors)].filter(c => c && c.startsWith('#')).slice(0, 8);

      if (uniqueColors.length === 0) {
        showToast('Could not extract colors from this image', 'error');
        return;
      }

      setPalette({ colors: uniqueColors, imageUri });
      showToast(`Extracted ${uniqueColors.length} colors!`, 'success');
    } catch (error) {
      console.error('Color extraction error:', error);
      showToast('Failed to extract colors', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyColor = async (hex: string) => {
    await Clipboard.setStringAsync(hex);
    showToast(`Copied ${hex}`, 'success');
    onToolComplete();
  };

  const copyAllColors = async () => {
    if (palette) {
      await Clipboard.setStringAsync(palette.colors.join(', '));
      showToast('All colors copied!', 'success');
      onToolComplete();
    }
  };

  const reset = () => {
    setPalette(null);
  };

  const getColorName = (index: number): string => {
    const names = ['Dominant', 'Vibrant', 'Dark Vibrant', 'Light Vibrant', 'Dark Muted', 'Light Muted', 'Muted', 'Average'];
    return names[index] || `Color ${index + 1}`;
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
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>EXTRACTED COLORS</Text>
            <TouchableOpacity onPress={copyAllColors}>
              <Text style={{ color: primaryColor, fontWeight: '600' }}>Copy All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.colorList}>
            {palette.colors.map((color, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => copyColor(color)}
                style={[styles.colorRow, { backgroundColor: backgroundColor }]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                <View style={styles.colorInfo}>
                  <Text style={[styles.colorName, { color: textColor }]}>{getColorName(index)}</Text>
                  <Text style={[styles.colorHex, { color: textSecondaryColor }]}>{color.toUpperCase()}</Text>
                </View>
                <MaterialIcons name="content-copy" size={20} color={textSecondaryColor} />
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
            <Text style={[styles.uploadTitle, { color: textColor }]}>Extracting Colors...</Text>
            <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
              Analyzing image for dominant colors
            </Text>
          </>
        ) : (
          <>
            <MaterialIcons name="colorize" size={64} color={primaryColor} />
            <Text style={[styles.uploadTitle, { color: textColor }]}>Pick Colors from Image</Text>
            <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
              Select an image to extract its color palette
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Features */}
      <View style={[styles.featuresCard, { backgroundColor: cardColor }]}>
        <View style={styles.featureItem}>
          <MaterialIcons name="auto-awesome" size={24} color={primaryColor} />
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: textColor }]}>Real Color Extraction</Text>
            <Text style={[styles.featureDesc, { color: textSecondaryColor }]}>
              Extracts actual dominant, vibrant, and muted colors from your image
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <MaterialIcons name="palette" size={24} color={primaryColor} />
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: textColor }]}>Multiple Color Types</Text>
            <Text style={[styles.featureDesc, { color: textSecondaryColor }]}>
              Get vibrant, muted, dark, and light variations for design flexibility
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <MaterialIcons name="content-copy" size={24} color={primaryColor} />
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: textColor }]}>Easy Copy</Text>
            <Text style={[styles.featureDesc, { color: textSecondaryColor }]}>
              Tap any color to copy its HEX code to clipboard
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
  colorList: { gap: 8 },
  colorRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 12 },
  colorSwatch: { width: 48, height: 48, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  colorInfo: { flex: 1 },
  colorName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  colorHex: { fontSize: 12 },
  paletteStrip: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  stripColor: { flex: 1, height: 56 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { fontWeight: '600' },
  featuresCard: { borderRadius: 16, padding: 16, gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureText: { flex: 1 },
  featureTitle: { fontWeight: '600', marginBottom: 2 },
  featureDesc: { fontSize: 13, lineHeight: 18 },
});
