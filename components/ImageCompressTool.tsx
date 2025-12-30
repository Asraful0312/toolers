import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COMPRESSION_LEVELS = [
  { label: 'Light', value: 0.8, desc: '~20% smaller', icon: 'looks-one' },
  { label: 'Medium', value: 0.6, desc: '~40% smaller', icon: 'looks-two' },
  { label: 'Strong', value: 0.4, desc: '~60% smaller', icon: 'looks-3' },
  { label: 'Maximum', value: 0.2, desc: '~80% smaller', icon: 'looks-4' },
];

interface ImageInfo {
  uri: string;
  size: number;
  width: number;
  height: number;
}

export default function ImageCompressTool() {
  const [originalImage, setOriginalImage] = useState<ImageInfo | null>(null);
  const [compressedImage, setCompressedImage] = useState<ImageInfo | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(0.6);
  const [isCompressing, setIsCompressing] = useState(false);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      const size = (fileInfo as any).size || 0;
      
      setOriginalImage({
        uri: asset.uri,
        size,
        width: asset.width || 0,
        height: asset.height || 0,
      });
      setCompressedImage(null);
    }
  };

  const compressImage = async () => {
    if (!originalImage) return;

    setIsCompressing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        originalImage.uri,
        [],
        { compress: selectedLevel, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Get compressed file info
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      const size = (fileInfo as any).size || 0;

      // Get dimensions
      const compressedInfo: ImageInfo = {
        uri: result.uri,
        size,
        width: result.width,
        height: result.height,
      };

      setCompressedImage(compressedInfo);
      
      const savedPercent = Math.round((1 - size / originalImage.size) * 100);
      showToast(`Compressed! Saved ${savedPercent}%`, 'success');
    } catch (error) {
      console.error(error);
      showToast('Compression failed', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const saveImage = async () => {
    if (!compressedImage) return;
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(compressedImage.uri);
        showToast('Saved to gallery!', 'success');
      } else {
        showToast('Permission denied', 'error');
      }
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const shareImage = async () => {
    if (!compressedImage) return;
    
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(compressedImage.uri);
      } else {
        showToast('Sharing not available', 'error');
      }
    } catch (error) {
      showToast('Failed to share', 'error');
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setCompressedImage(null);
  };

  const getSavingsPercent = (): number => {
    if (!originalImage || !compressedImage) return 0;
    return Math.round((1 - compressedImage.size / originalImage.size) * 100);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {!originalImage ? (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
        >
          <MaterialIcons name="compress" size={64} color={primaryColor} />
          <Text style={[styles.uploadTitle, { color: textColor }]}>Select Image to Compress</Text>
          <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
            Choose an image to reduce its file size
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Image Preview */}
          <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
            <Image 
              source={{ uri: compressedImage?.uri || originalImage.uri }} 
              style={styles.imagePreview} 
              resizeMode="contain" 
            />
          </View>

          {/* Size Comparison */}
          <View style={[styles.sizeCard, { backgroundColor: cardColor }]}>
            <View style={styles.sizeRow}>
              <View style={styles.sizeItem}>
                <Text style={[styles.sizeLabel, { color: textSecondaryColor }]}>Original</Text>
                <Text style={[styles.sizeValue, { color: textColor }]}>{formatFileSize(originalImage.size)}</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color={primaryColor} />
              <View style={styles.sizeItem}>
                <Text style={[styles.sizeLabel, { color: textSecondaryColor }]}>Compressed</Text>
                <Text style={[styles.sizeValue, { color: compressedImage ? '#22c55e' : textSecondaryColor }]}>
                  {compressedImage ? formatFileSize(compressedImage.size) : '---'}
                </Text>
              </View>
            </View>
            {compressedImage && (
              <View style={[styles.savingsBadge, { backgroundColor: '#22c55e20' }]}>
                <MaterialIcons name="check-circle" size={18} color="#22c55e" />
                <Text style={styles.savingsText}>Saved {getSavingsPercent()}% ({formatFileSize(originalImage.size - compressedImage.size)})</Text>
              </View>
            )}
          </View>

          {/* Compression Level */}
          {!compressedImage && (
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>COMPRESSION LEVEL</Text>
              <View style={styles.levelGrid}>
                {COMPRESSION_LEVELS.map((level) => {
                  const isSelected = level.value === selectedLevel;
                  return (
                    <TouchableOpacity
                      key={level.value}
                      onPress={() => setSelectedLevel(level.value)}
                      style={[
                        styles.levelBtn,
                        { 
                          backgroundColor: isSelected ? primaryColor : backgroundColor,
                          borderColor: isSelected ? primaryColor : textSecondaryColor + '30',
                        },
                      ]}
                    >
                      <MaterialIcons name={level.icon as any} size={24} color={isSelected ? 'white' : primaryColor} />
                      <Text style={[styles.levelLabel, { color: isSelected ? 'white' : textColor }]}>
                        {level.label}
                      </Text>
                      <Text style={[styles.levelDesc, { color: isSelected ? 'rgba(255,255,255,0.8)' : textSecondaryColor }]}>
                        {level.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Actions */}
          {!compressedImage ? (
            <View style={styles.actions}>
              <TouchableOpacity onPress={pickImage} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                <MaterialIcons name="photo-library" size={20} color={textColor} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={compressImage}
                disabled={isCompressing}
                style={[styles.compressBtn, { backgroundColor: primaryColor, opacity: isCompressing ? 0.7 : 1 }]}
              >
                {isCompressing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <MaterialIcons name="compress" size={22} color="white" />
                )}
                <Text style={styles.compressBtnText}>
                  {isCompressing ? 'Compressing...' : 'Compress Image'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultActions}>
              <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor, flex: 1 }]}>
                <MaterialIcons name="refresh" size={20} color={textColor} />
                <Text style={[styles.actionBtnText, { color: textColor }]}>New</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={shareImage} style={[styles.actionBtn, { backgroundColor: cardColor, flex: 1 }]}>
                <MaterialIcons name="share" size={20} color={primaryColor} />
                <Text style={[styles.actionBtnText, { color: primaryColor }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveImage} style={[styles.actionBtn, { backgroundColor: primaryColor, flex: 1 }]}>
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
  previewCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  imagePreview: { width: '100%', height: 200 },
  sizeCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sizeItem: { alignItems: 'center', flex: 1 },
  sizeLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  sizeValue: { fontSize: 18, fontWeight: 'bold' },
  savingsBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8, borderRadius: 8 },
  savingsText: { color: '#22c55e', fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  levelBtn: { width: '48%', padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 4 },
  levelLabel: { fontSize: 14, fontWeight: '700' },
  levelDesc: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  actionBtnText: { fontWeight: '600' },
  compressBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  compressBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  resultActions: { flexDirection: 'row', gap: 10 },
});
