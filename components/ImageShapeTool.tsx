import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

interface ShapeOption {
  id: string;
  label: string;
  icon: string;
  borderRadius: number | string;
  aspectRatio?: number;
}

const SHAPES: ShapeOption[] = [
  { id: 'square', label: 'Square', icon: 'crop-square', borderRadius: 0, aspectRatio: 1 },
  { id: 'rounded', label: 'Rounded', icon: 'rounded-corner', borderRadius: 20, aspectRatio: 1 },
  { id: 'circle', label: 'Circle', icon: 'circle', borderRadius: 1000, aspectRatio: 1 },
  { id: 'portrait', label: 'Portrait', icon: 'crop-portrait', borderRadius: 0, aspectRatio: 3/4 },
  { id: 'landscape', label: 'Landscape', icon: 'crop-landscape', borderRadius: 0, aspectRatio: 4/3 },
  { id: 'wide', label: 'Wide', icon: 'crop-16-9', borderRadius: 0, aspectRatio: 16/9 },
];

export default function ImageShapeTool() {
  const [image, setImage] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState<ShapeOption>(SHAPES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<View>(null);
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
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getImageStyle = () => {
    const baseSize = 280;
    const aspectRatio = selectedShape.aspectRatio || 1;
    
    let width = baseSize;
    let height = baseSize;
    
    if (aspectRatio > 1) {
      height = baseSize / aspectRatio;
    } else if (aspectRatio < 1) {
      width = baseSize * aspectRatio;
    }

    return {
      width,
      height,
      borderRadius: typeof selectedShape.borderRadius === 'number' 
        ? Math.min(selectedShape.borderRadius, Math.min(width, height) / 2)
        : 0,
    };
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
    setSelectedShape(SHAPES[0]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {!image ? (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
        >
          <MaterialIcons name="photo-size-select-large" size={64} color={primaryColor} />
          <Text style={[styles.uploadTitle, { color: textColor }]}>Select Image</Text>
          <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
            Choose an image to change its shape
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Image Preview */}
          <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PREVIEW</Text>
            <View style={styles.previewContainer}>
              <View
                ref={imageRef}
                style={[styles.imageWrapper, getImageStyle(), { backgroundColor: 'transparent' }]}
                collapsable={false}
              >
                <Image 
                  source={{ uri: image }} 
                  style={[styles.image, getImageStyle()]}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>

          {/* Shape Selection */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>SHAPE</Text>
            <View style={styles.shapeGrid}>
              {SHAPES.map((shape) => {
                const isSelected = shape.id === selectedShape.id;
                return (
                  <TouchableOpacity
                    key={shape.id}
                    onPress={() => setSelectedShape(shape)}
                    style={[
                      styles.shapeBtn,
                      { 
                        backgroundColor: isSelected ? primaryColor : backgroundColor,
                        borderColor: isSelected ? primaryColor : textSecondaryColor + '30',
                      },
                    ]}
                  >
                    <MaterialIcons 
                      name={shape.icon as any} 
                      size={28} 
                      color={isSelected ? 'white' : primaryColor} 
                    />
                    <Text style={[styles.shapeLabel, { color: isSelected ? 'white' : textColor }]}>
                      {shape.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="refresh" size={20} color={textColor} />
              <Text style={[styles.actionBtnText, { color: textColor }]}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="photo-library" size={20} color={primaryColor} />
              <Text style={[styles.actionBtnText, { color: primaryColor }]}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={saveImage} 
              disabled={isSaving}
              style={[styles.actionBtn, { backgroundColor: primaryColor, flex: 2, opacity: isSaving ? 0.7 : 1 }]}
            >
              <MaterialIcons name="save-alt" size={20} color="white" />
              <Text style={[styles.actionBtnText, { color: 'white' }]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: primaryColor + '15' }]}>
            <MaterialIcons name="info-outline" size={18} color={primaryColor} />
            <Text style={[styles.infoText, { color: textSecondaryColor }]}>
              The image will be saved with the selected shape. Circle and rounded shapes work best with square images.
            </Text>
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
  previewContainer: { alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  imageWrapper: { overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shapeBtn: { width: '31%', padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 6 },
  shapeLabel: { fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
