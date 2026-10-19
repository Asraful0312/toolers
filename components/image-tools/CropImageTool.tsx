import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: [1, 1] as [number, number] },
  { label: '4:3', value: [4, 3] as [number, number] },
  { label: '3:4', value: [3, 4] as [number, number] },
  { label: '16:9', value: [16, 9] as [number, number] },
  { label: '9:16', value: [9, 16] as [number, number] },
];

export default function CropImageTool() {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<[number, number] | undefined>(undefined);
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = '#a855f7';

  const pickAndCropImage = async (ratio?: [number, number]) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: ratio,
      quality: 1,
    });

    if (!result.canceled) {
      setCroppedImage(result.assets[0].uri);
      showToast('Image cropped!', 'success');
    }
  };

  const saveImage = async () => {
    if (!croppedImage) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(croppedImage);
        showToast('Saved to gallery!', 'success');
        onToolComplete();
      } else {
        showToast('Permission denied', 'error');
      }
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const resetImage = () => {
    setCroppedImage(null);
  };

  if (croppedImage) {
    return (
      <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.resultCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.resultTitle, { color: textColor }]}>Cropped Image</Text>
          <Image source={{ uri: croppedImage }} style={styles.resultImage} resizeMode="contain" />
          <View style={styles.resultActions}>
            <TouchableOpacity onPress={resetImage} style={[styles.actionBtn, { backgroundColor: textSecondaryColor + '20' }]}>
              <MaterialIcons name="refresh" size={20} color={textColor} />
              <Text style={[styles.actionBtnText, { color: textColor }]}>Crop Another</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveImage} style={[styles.actionBtn, { backgroundColor: primaryColor }]}>
              <MaterialIcons name="save-alt" size={20} color="white" />
              <Text style={[styles.actionBtnText, { color: 'white' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Aspect Ratio Selection */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>ASPECT RATIO</Text>
        <View style={styles.ratioGrid}>
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = JSON.stringify(ratio.value) === JSON.stringify(selectedRatio);
            return (
              <TouchableOpacity
                key={ratio.label}
                onPress={() => setSelectedRatio(ratio.value)}
                style={[
                  styles.ratioBtn,
                  { backgroundColor: isSelected ? primaryColor : backgroundColor },
                ]}
              >
                <Text style={[styles.ratioBtnText, { color: isSelected ? 'white' : textColor }]}>
                  {ratio.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Select Image Button */}
      <TouchableOpacity
        onPress={() => pickAndCropImage(selectedRatio)}
        style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
      >
        <MaterialIcons name="crop" size={64} color={primaryColor} />
        <Text style={[styles.uploadTitle, { color: textColor }]}>Select & Crop Image</Text>
        <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
          Tap to choose an image. The native crop editor will open automatically.
        </Text>
      </TouchableOpacity>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: primaryColor + '15' }]}>
        <MaterialIcons name="info-outline" size={20} color={primaryColor} />
        <Text style={[styles.infoText, { color: textColor }]}>
          Select an aspect ratio above, then tap to pick an image. You'll be able to crop it using the native editor.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  ratioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ratioBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  ratioBtnText: { fontWeight: '600' },
  uploadArea: { borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 12, marginBottom: 20 },
  uploadTitle: { fontSize: 18, fontWeight: 'bold' },
  uploadDesc: { textAlign: 'center', lineHeight: 22 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 12 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  resultCard: { borderRadius: 20, padding: 20, alignItems: 'center' },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  resultImage: { width: '100%', height: 350, borderRadius: 12 },
  resultActions: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { fontWeight: '600' },
});
