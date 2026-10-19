import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SocialSize {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  icon: string;
}

const SOCIAL_SIZES: SocialSize[] = [
  { id: 'ig-post', label: 'Post', platform: 'Instagram', width: 1080, height: 1080, icon: 'crop-square' },
  { id: 'ig-story', label: 'Story', platform: 'Instagram', width: 1080, height: 1920, icon: 'crop-portrait' },
  { id: 'ig-landscape', label: 'Landscape', platform: 'Instagram', width: 1080, height: 566, icon: 'crop-landscape' },
  { id: 'fb-post', label: 'Post', platform: 'Facebook', width: 1200, height: 630, icon: 'crop-16-9' },
  { id: 'fb-cover', label: 'Cover', platform: 'Facebook', width: 820, height: 312, icon: 'crop-landscape' },
  { id: 'twitter', label: 'Post', platform: 'Twitter/X', width: 1200, height: 675, icon: 'crop-16-9' },
  { id: 'youtube', label: 'Thumbnail', platform: 'YouTube', width: 1280, height: 720, icon: 'smart-display' },
  { id: 'linkedin', label: 'Post', platform: 'LinkedIn', width: 1200, height: 627, icon: 'work' },
];

export default function SocialResizerTool() {
  const [image, setImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<SocialSize>(SOCIAL_SIZES[0]);
  const [isResizing, setIsResizing] = useState(false);
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
      setImage(result.assets[0].uri);
      setResizedImage(null);
    }
  };

  const resizeImage = async () => {
    if (!image) return;

    setIsResizing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        image,
        [{ resize: { width: selectedSize.width, height: selectedSize.height } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setResizedImage(result.uri);
      showToast(`Resized to ${selectedSize.width}x${selectedSize.height}!`, 'success');
      onToolComplete();
    } catch (error) {
      console.error(error);
      showToast('Failed to resize', 'error');
    } finally {
      setIsResizing(false);
    }
  };

  const saveImage = async () => {
    if (!resizedImage) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(resizedImage);
        showToast('Saved to gallery!', 'success');
      } else {
        showToast('Permission denied', 'error');
      }
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const reset = () => {
    setImage(null);
    setResizedImage(null);
    setSelectedSize(SOCIAL_SIZES[0]);
  };

  // Group sizes by platform
  const groupedSizes = SOCIAL_SIZES.reduce((acc, size) => {
    if (!acc[size.platform]) acc[size.platform] = [];
    acc[size.platform].push(size);
    return acc;
  }, {} as Record<string, SocialSize[]>);

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {!image ? (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
        >
          <MaterialIcons name="share" size={64} color={primaryColor} />
          <Text style={[styles.uploadTitle, { color: textColor }]}>Select Image</Text>
          <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
            Choose an image to resize for social media
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Image Preview */}
          <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>
                {resizedImage ? 'RESIZED IMAGE' : 'ORIGINAL IMAGE'}
              </Text>
              <Text style={[styles.sizeText, { color: primaryColor }]}>
                {selectedSize.width} × {selectedSize.height}
              </Text>
            </View>
            <Image source={{ uri: resizedImage || image }} style={styles.imagePreview} resizeMode="contain" />
          </View>

          {/* Platform Selection */}
          {!resizedImage && (
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>SELECT SIZE</Text>
              {Object.entries(groupedSizes).map(([platform, sizes]) => (
                <View key={platform} style={styles.platformGroup}>
                  <Text style={[styles.platformLabel, { color: textSecondaryColor }]}>{platform}</Text>
                  <View style={styles.sizeRow}>
                    {sizes.map((size) => {
                      const isSelected = size.id === selectedSize.id;
                      return (
                        <TouchableOpacity
                          key={size.id}
                          onPress={() => setSelectedSize(size)}
                          style={[
                            styles.sizeBtn,
                            { backgroundColor: isSelected ? primaryColor : backgroundColor }
                          ]}
                        >
                          <MaterialIcons name={size.icon as any} size={20} color={isSelected ? 'white' : primaryColor} />
                          <Text style={[styles.sizeBtnLabel, { color: isSelected ? 'white' : textColor }]}>
                            {size.label}
                          </Text>
                          <Text style={[styles.sizeBtnDim, { color: isSelected ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>
                            {size.width}×{size.height}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          {!resizedImage ? (
            <View style={styles.actions}>
              <TouchableOpacity onPress={pickImage} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                <MaterialIcons name="photo-library" size={20} color={primaryColor} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resizeImage}
                disabled={isResizing}
                style={[styles.resizeBtn, { backgroundColor: primaryColor, opacity: isResizing ? 0.7 : 1 }]}
              >
                {isResizing ? <ActivityIndicator color="white" /> : <MaterialIcons name="aspect-ratio" size={20} color="white" />}
                <Text style={styles.resizeBtnText}>{isResizing ? 'Resizing...' : 'Resize Image'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                <MaterialIcons name="refresh" size={20} color={textColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={saveImage} style={[styles.saveBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name="save-alt" size={20} color="white" />
                <Text style={styles.saveBtnText}>Save Image</Text>
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
  sizeText: { fontWeight: '700' },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  platformGroup: { marginBottom: 16 },
  platformLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center', minWidth: 80 },
  sizeBtnLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  sizeBtnDim: { fontSize: 9, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resizeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  resizeBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
