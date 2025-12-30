import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImageInfo {
  uri: string;
  filename: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
  aspectRatio: string;
  megapixels: number;
}

export default function ImageInfoTool() {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  const getFormat = (uri: string): string => {
    const extension = uri.split('.').pop()?.toLowerCase() || '';
    const formats: Record<string, string> = {
      jpg: 'JPEG',
      jpeg: 'JPEG',
      png: 'PNG',
      gif: 'GIF',
      webp: 'WebP',
      heic: 'HEIC',
      heif: 'HEIF',
      bmp: 'BMP',
      tiff: 'TIFF',
    };
    return formats[extension] || extension.toUpperCase() || 'Unknown';
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
      const fileSize = (fileInfo as any).size || 0;
      
      // Extract filename from URI
      const filename = asset.uri.split('/').pop() || 'Unknown';
      
      const width = asset.width || 0;
      const height = asset.height || 0;
      
      setImageInfo({
        uri: asset.uri,
        filename,
        width,
        height,
        fileSize,
        format: getFormat(asset.uri),
        aspectRatio: width && height ? getAspectRatio(width, height) : 'N/A',
        megapixels: width && height ? parseFloat(((width * height) / 1000000).toFixed(2)) : 0,
      });
    }
  };

  const copyInfo = async () => {
    if (!imageInfo) return;
    
    const info = `
Image Information
-----------------
Filename: ${imageInfo.filename}
Width: ${imageInfo.width} px
Height: ${imageInfo.height} px
File Size: ${formatFileSize(imageInfo.fileSize)}
Format: ${imageInfo.format}
Aspect Ratio: ${imageInfo.aspectRatio}
Megapixels: ${imageInfo.megapixels} MP
    `.trim();
    
    await Clipboard.setStringAsync(info);
    showToast('Info copied!', 'success');
  };

  const reset = () => {
    setImageInfo(null);
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={[styles.infoRow, { borderBottomColor: textSecondaryColor + '20' }]}>
      <View style={styles.infoLabel}>
        <MaterialIcons name={icon as any} size={20} color={primaryColor} />
        <Text style={[styles.labelText, { color: textSecondaryColor }]}>{label}</Text>
      </View>
      <Text style={[styles.valueText, { color: textColor }]} numberOfLines={1} ellipsizeMode="middle">{value}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {!imageInfo ? (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
        >
          <MaterialIcons name="info-outline" size={64} color={primaryColor} />
          <Text style={[styles.uploadTitle, { color: textColor }]}>Select Image</Text>
          <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
            Choose an image to view its information
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Image Preview */}
          <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
            <Image source={{ uri: imageInfo.uri }} style={styles.imagePreview} resizeMode="contain" />
          </View>

          {/* Image Info */}
          <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
            <View style={styles.infoHeader}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>IMAGE DETAILS</Text>
              <TouchableOpacity onPress={copyInfo}>
                <MaterialIcons name="content-copy" size={20} color={primaryColor} />
              </TouchableOpacity>
            </View>

            <InfoRow label="Filename" value={imageInfo.filename} icon="insert-drive-file" />
            <InfoRow label="Width" value={`${imageInfo.width} px`} icon="straighten" />
            <InfoRow label="Height" value={`${imageInfo.height} px`} icon="height" />
            <InfoRow label="Resolution" value={`${imageInfo.width} × ${imageInfo.height}`} icon="crop-din" />
            <InfoRow label="File Size" value={formatFileSize(imageInfo.fileSize)} icon="sd-storage" />
            <InfoRow label="Format" value={imageInfo.format} icon="image" />
            <InfoRow label="Aspect Ratio" value={imageInfo.aspectRatio} icon="aspect-ratio" />
            <InfoRow label="Megapixels" value={`${imageInfo.megapixels} MP`} icon="camera" />
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: cardColor }]}>
              <MaterialIcons name="photo-size-select-actual" size={24} color={primaryColor} />
              <Text style={[styles.statValue, { color: textColor }]}>{imageInfo.megapixels}</Text>
              <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Megapixels</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardColor }]}>
              <MaterialIcons name="sd-storage" size={24} color={primaryColor} />
              <Text style={[styles.statValue, { color: textColor }]}>{formatFileSize(imageInfo.fileSize)}</Text>
              <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Size</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardColor }]}>
              <MaterialIcons name="aspect-ratio" size={24} color={primaryColor} />
              <Text style={[styles.statValue, { color: textColor }]}>{imageInfo.aspectRatio}</Text>
              <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Ratio</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="refresh" size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={[styles.selectBtn, { backgroundColor: primaryColor }]}>
              <MaterialIcons name="photo-library" size={20} color="white" />
              <Text style={styles.selectBtnText}>Select Another</Text>
            </TouchableOpacity>
          </View>
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
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  infoCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  infoLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  labelText: { fontSize: 14 },
  valueText: { fontSize: 14, fontWeight: '600', maxWidth: '50%', textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  selectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  selectBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
