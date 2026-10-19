import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Image as RNImage, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ImageFormat = 'jpeg' | 'png' | 'webp';

const FORMATS: { label: string; value: ImageFormat; icon: string; desc: string }[] = [
  { label: 'JPEG', value: 'jpeg', icon: 'image', desc: 'Best for photos, smaller size' },
  { label: 'PNG', value: 'png', icon: 'image', desc: 'Lossless, supports transparency' },
  { label: 'WebP', value: 'webp', icon: 'image', desc: 'Modern format, best compression' },
];

const QUALITY_OPTIONS = [
  { label: 'Low', value: 0.4 },
  { label: 'Medium', value: 0.7 },
  { label: 'High', value: 0.9 },
  { label: 'Max', value: 1.0 },
];

export default function ImageFormatTool() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState(0.9);
  const [isConverting, setIsConverting] = useState(false);
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = '#a855f7';

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setOriginalImage(result.assets[0].uri);
      setConvertedImage(null);
    }
  };

  const convertImage = async () => {
    if (!originalImage) return;

    setIsConverting(true);
    try {
      let format: ImageManipulator.SaveFormat;
      switch (selectedFormat) {
        case 'png':
          format = ImageManipulator.SaveFormat.PNG;
          break;
        case 'webp':
          format = ImageManipulator.SaveFormat.WEBP;
          break;
        default:
          format = ImageManipulator.SaveFormat.JPEG;
      }

      const result = await ImageManipulator.manipulateAsync(
        originalImage,
        [],
        { compress: quality, format }
      );

      setConvertedImage(result.uri);
      showToast(`Converted to ${selectedFormat.toUpperCase()}!`, 'success');
      onToolComplete();
    } catch (error) {
      console.error(error);
      showToast('Conversion failed', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  const saveImage = async () => {
    if (!convertedImage) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(convertedImage);
        showToast('Saved to gallery!', 'success');
      } else {
        showToast('Permission denied', 'error');
      }
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const shareImage = async () => {
    if (!convertedImage) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(convertedImage);
      } else {
        showToast('Sharing not available', 'error');
      }
    } catch (error) {
      showToast('Failed to share', 'error');
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setConvertedImage(null);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Image Selection */}
      {!originalImage ? (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
        >
          <MaterialIcons name="add-photo-alternate" size={64} color={primaryColor} />
          <Text style={[styles.uploadTitle, { color: textColor }]}>Select Image</Text>
          <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
            Choose an image to convert to a different format
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Image Preview */}
          <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>
                {convertedImage ? 'CONVERTED IMAGE' : 'ORIGINAL IMAGE'}
              </Text>
              <TouchableOpacity onPress={pickImage}>
                <Text style={{ color: primaryColor, fontWeight: '600' }}>Change</Text>
              </TouchableOpacity>
            </View>
            <RNImage
              source={{ uri: convertedImage || originalImage }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          </View>

          {/* Format Selection */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>OUTPUT FORMAT</Text>
            <View style={styles.formatGrid}>
              {FORMATS.map((format) => {
                const isSelected = format.value === selectedFormat;
                return (
                  <TouchableOpacity
                    key={format.value}
                    onPress={() => setSelectedFormat(format.value)}
                    style={[
                      styles.formatBtn,
                      {
                        backgroundColor: isSelected ? primaryColor : backgroundColor,
                        borderColor: isSelected ? primaryColor : textSecondaryColor + '30',
                      },
                    ]}
                  >
                    <Text style={[styles.formatLabel, { color: isSelected ? 'white' : textColor }]}>
                      {format.label}
                    </Text>
                    <Text style={[styles.formatDesc, { color: isSelected ? 'rgba(255,255,255,0.8)' : textSecondaryColor }]}>
                      {format.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quality Selection (only for JPEG, WebP, AVIF) */}
          {selectedFormat !== 'png' && (
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>QUALITY</Text>
              <View style={styles.qualityGrid}>
                {QUALITY_OPTIONS.map((opt) => {
                  const isSelected = opt.value === quality;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setQuality(opt.value)}
                      style={[
                        styles.qualityBtn,
                        { backgroundColor: isSelected ? primaryColor : backgroundColor },
                      ]}
                    >
                      <Text style={[styles.qualityLabel, { color: isSelected ? 'white' : textColor }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.qualityPercent, { color: isSelected ? 'rgba(255,255,255,0.8)' : textSecondaryColor }]}>
                        {Math.round(opt.value * 100)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Actions */}
          {!convertedImage ? (
            <TouchableOpacity
              onPress={convertImage}
              disabled={isConverting}
              style={[styles.convertBtn, { backgroundColor: primaryColor, opacity: isConverting ? 0.7 : 1 }]}
            >
              {isConverting ? (
                <ActivityIndicator color="white" />
              ) : (
                <MaterialIcons name="swap-horiz" size={24} color="white" />
              )}
              <Text style={styles.convertBtnText}>
                {isConverting ? 'Converting...' : `Convert to ${selectedFormat.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.resultActions}>
              <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                <MaterialIcons name="refresh" size={20} color={textColor} />
                <Text style={[styles.actionBtnText, { color: textColor }]}>New</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={shareImage} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                <MaterialIcons name="share" size={20} color={primaryColor} />
                <Text style={[styles.actionBtnText, { color: primaryColor }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveImage} style={[styles.actionBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name="save-alt" size={20} color="white" />
                <Text style={[styles.actionBtnText, { color: 'white' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  uploadArea: { borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 12 },
  uploadTitle: { fontSize: 18, fontWeight: 'bold' },
  uploadDesc: { textAlign: 'center', lineHeight: 22 },
  previewCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  formatGrid: { gap: 10 },
  formatBtn: { padding: 14, borderRadius: 12, borderWidth: 1 },
  formatLabel: { fontSize: 16, fontWeight: '700' },
  formatDesc: { fontSize: 12, marginTop: 2 },
  qualityGrid: { flexDirection: 'row', gap: 10 },
  qualityBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 },
  qualityLabel: { fontWeight: '600' },
  qualityPercent: { fontSize: 12, marginTop: 2 },
  convertBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  convertBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  resultActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { fontWeight: '600' },
});
