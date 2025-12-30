import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

interface CollageLayout {
  id: string;
  label: string;
  slots: number;
  layout: { x: number; y: number; w: number; h: number }[];
}

const LAYOUTS: CollageLayout[] = [
  { 
    id: '2h', 
    label: '2 Horizontal', 
    slots: 2,
    layout: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ]
  },
  { 
    id: '2v', 
    label: '2 Vertical', 
    slots: 2,
    layout: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ]
  },
  { 
    id: '3a', 
    label: '3 Grid', 
    slots: 3,
    layout: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ]
  },
  { 
    id: '4', 
    label: '4 Grid', 
    slots: 4,
    layout: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ]
  },
];

const COLLAGE_SIZE = Dimensions.get('window').width - 72;

export default function CollageMakerTool() {
  const [selectedLayout, setSelectedLayout] = useState<CollageLayout>(LAYOUTS[0]);
  const [images, setImages] = useState<(string | null)[]>(new Array(4).fill(null));
  const [isSaving, setIsSaving] = useState(false);
  const collageRef = useRef<View>(null);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = [...images];
      newImages[index] = result.assets[0].uri;
      setImages(newImages);
    }
  };

  const saveCollage = async () => {
    if (!collageRef.current) return;
    
    setIsSaving(true);
    try {
      const uri = await captureRef(collageRef, {
        format: 'png',
        quality: 1,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        showToast('Collage saved!', 'success');
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
    setImages(new Array(4).fill(null));
  };

  const hasAnyImage = images.some((img) => img !== null);

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Layout Selection */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>LAYOUT</Text>
        <View style={styles.layoutGrid}>
          {LAYOUTS.map((layout) => {
            const isSelected = layout.id === selectedLayout.id;
            return (
              <TouchableOpacity
                key={layout.id}
                onPress={() => setSelectedLayout(layout)}
                style={[
                  styles.layoutBtn,
                  { backgroundColor: isSelected ? primaryColor : backgroundColor }
                ]}
              >
                <View style={styles.layoutPreview}>
                  {layout.layout.map((slot, i) => (
                    <View
                      key={i}
                      style={[
                        styles.layoutSlot,
                        {
                          left: `${slot.x * 100}%`,
                          top: `${slot.y * 100}%`,
                          width: `${slot.w * 100 - 2}%`,
                          height: `${slot.h * 100 - 2}%`,
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.5)' : textSecondaryColor + '40',
                        }
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.layoutLabel, { color: isSelected ? 'white' : textColor }]}>
                  {layout.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Collage Preview */}
      <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>COLLAGE</Text>
        <View
          ref={collageRef}
          style={[styles.collageContainer, { backgroundColor: '#1a1a1a' }]}
          collapsable={false}
        >
          {selectedLayout.layout.map((slot, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => pickImage(index)}
              style={[
                styles.collageSlot,
                {
                  left: slot.x * COLLAGE_SIZE + 2,
                  top: slot.y * COLLAGE_SIZE + 2,
                  width: slot.w * COLLAGE_SIZE - 4,
                  height: slot.h * COLLAGE_SIZE - 4,
                }
              ]}
            >
              {images[index] ? (
                <Image source={{ uri: images[index]! }} style={styles.slotImage} resizeMode="cover" />
              ) : (
                <View style={[styles.emptySlot, { backgroundColor: cardColor }]}>
                  <MaterialIcons name="add-photo-alternate" size={32} color={primaryColor} />
                  <Text style={[styles.emptySlotText, { color: textSecondaryColor }]}>Tap to add</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
          <MaterialIcons name="refresh" size={20} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={saveCollage} 
          disabled={!hasAnyImage || isSaving}
          style={[styles.saveBtn, { backgroundColor: primaryColor, opacity: (!hasAnyImage || isSaving) ? 0.5 : 1 }]}
        >
          <MaterialIcons name="save-alt" size={20} color="white" />
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Collage'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  layoutGrid: { flexDirection: 'row', gap: 10 },
  layoutBtn: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center' },
  layoutPreview: { width: 50, height: 50, position: 'relative' },
  layoutSlot: { position: 'absolute', borderRadius: 4 },
  layoutLabel: { fontSize: 10, fontWeight: '600', marginTop: 6 },
  previewCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  collageContainer: { width: COLLAGE_SIZE, height: COLLAGE_SIZE, borderRadius: 12, position: 'relative', overflow: 'hidden' },
  collageSlot: { position: 'absolute', borderRadius: 8, overflow: 'hidden' },
  slotImage: { width: '100%', height: '100%' },
  emptySlot: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  emptySlotText: { fontSize: 10, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
