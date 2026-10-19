import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

interface FilterOption {
  id: string;
  label: string;
  style: object;
}

const FILTERS: FilterOption[] = [
  { id: 'original', label: 'Original', style: {} },
  { id: 'grayscale', label: 'Grayscale', style: { filter: 'grayscale(1)' } },
  { id: 'sepia', label: 'Sepia', style: { tintColor: '#704214', opacity: 0.8 } },
  { id: 'bright', label: 'Bright', style: { opacity: 1.2 } },
  { id: 'dark', label: 'Dark', style: { opacity: 0.6 } },
  { id: 'warm', label: 'Warm', style: { tintColor: '#ff6b35' } },
  { id: 'cool', label: 'Cool', style: { tintColor: '#4a90d9' } },
  { id: 'vintage', label: 'Vintage', style: { tintColor: '#d4a574' } },
];

export default function ImageFilterTool() {
  const [image, setImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(FILTERS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<View>(null);
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
      setSelectedFilter(FILTERS[0]);
    }
  };

  const getFilterStyle = () => {
    switch (selectedFilter.id) {
      case 'grayscale':
        return { opacity: 0.9 };
      case 'sepia':
        return { tintColor: '#704214' };
      case 'bright':
        return {};
      case 'dark':
        return { opacity: 0.5 };
      case 'warm':
        return { tintColor: 'rgba(255, 107, 53, 0.3)' };
      case 'cool':
        return { tintColor: 'rgba(74, 144, 217, 0.3)' };
      case 'vintage':
        return { tintColor: 'rgba(212, 165, 116, 0.4)' };
      default:
        return {};
    }
  };

  const getOverlayColor = () => {
    switch (selectedFilter.id) {
      case 'grayscale':
        return 'rgba(128, 128, 128, 0.4)';
      case 'sepia':
        return 'rgba(112, 66, 20, 0.3)';
      case 'warm':
        return 'rgba(255, 107, 53, 0.2)';
      case 'cool':
        return 'rgba(74, 144, 217, 0.2)';
      case 'vintage':
        return 'rgba(212, 165, 116, 0.25)';
      case 'dark':
        return 'rgba(0, 0, 0, 0.4)';
      case 'bright':
        return 'rgba(255, 255, 255, 0.15)';
      default:
        return 'transparent';
    }
  };

  const saveImage = async () => {
    if (!imageRef.current) return;

    setIsSaving(true);
    try {
      const uri = await captureRef(imageRef, {
        format: 'png',
        quality: 1,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        showToast('Saved to gallery!', 'success');
        onToolComplete();
      } else {
        showToast('Permission denied', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setImage(null);
    setSelectedFilter(FILTERS[0]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {!image ? (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
        >
          <MaterialIcons name="filter" size={64} color={primaryColor} />
          <Text style={[styles.uploadTitle, { color: textColor }]}>Select Image</Text>
          <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
            Choose an image to apply filters
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Image Preview */}
          <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PREVIEW</Text>
              <Text style={[styles.filterName, { color: primaryColor }]}>{selectedFilter.label}</Text>
            </View>
            <View
              ref={imageRef}
              style={styles.imageWrapper}
              collapsable={false}
            >
              <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
              <View style={[styles.filterOverlay, { backgroundColor: getOverlayColor() }]} />
            </View>
          </View>

          {/* Filter Selection */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>FILTERS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <View style={styles.filterGrid}>
                {FILTERS.map((filter) => {
                  const isSelected = filter.id === selectedFilter.id;
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      onPress={() => setSelectedFilter(filter)}
                      style={styles.filterItem}
                    >
                      <View style={[
                        styles.filterPreview,
                        { borderColor: isSelected ? primaryColor : 'transparent', borderWidth: 3 }
                      ]}>
                        <Image source={{ uri: image }} style={styles.filterThumb} resizeMode="cover" />
                        {filter.id !== 'original' && (
                          <View style={[styles.thumbOverlay, {
                            backgroundColor:
                              filter.id === 'grayscale' ? 'rgba(128,128,128,0.4)' :
                                filter.id === 'sepia' ? 'rgba(112,66,20,0.3)' :
                                  filter.id === 'warm' ? 'rgba(255,107,53,0.2)' :
                                    filter.id === 'cool' ? 'rgba(74,144,217,0.2)' :
                                      filter.id === 'vintage' ? 'rgba(212,165,116,0.25)' :
                                        filter.id === 'dark' ? 'rgba(0,0,0,0.4)' :
                                          filter.id === 'bright' ? 'rgba(255,255,255,0.15)' : 'transparent'
                          }]} />
                        )}
                      </View>
                      <Text style={[styles.filterLabel, { color: isSelected ? primaryColor : textColor }]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="refresh" size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="photo-library" size={20} color={primaryColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveImage}
              disabled={isSaving}
              style={[styles.saveBtn, { backgroundColor: primaryColor, opacity: isSaving ? 0.7 : 1 }]}
            >
              <MaterialIcons name="save-alt" size={20} color="white" />
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Image'}</Text>
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
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  filterName: { fontWeight: '700' },
  imageWrapper: { borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: 280 },
  filterOverlay: { ...StyleSheet.absoluteFillObject },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  filterScroll: { marginHorizontal: -8 },
  filterGrid: { flexDirection: 'row', paddingHorizontal: 8, gap: 12 },
  filterItem: { alignItems: 'center', gap: 6 },
  filterPreview: { width: 70, height: 70, borderRadius: 12, overflow: 'hidden' },
  filterThumb: { width: '100%', height: '100%' },
  thumbOverlay: { ...StyleSheet.absoluteFillObject },
  filterLabel: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
