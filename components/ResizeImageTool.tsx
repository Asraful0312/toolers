import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ResizeImageTool() {
  const [image, setImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const screenWidth = Dimensions.get('window').width - 80;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setOriginalSize({ width: result.assets[0].width || 0, height: result.assets[0].height || 0 });
      setWidth(String(result.assets[0].width || 0));
      setHeight(String(result.assets[0].height || 0));
      setResultImage(null);
      setPreviewScale(1);
    }
  };

  const resizeImage = async () => {
    if (!image) return;
    const w = parseInt(width);
    const h = parseInt(height);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      Alert.alert('Error', 'Please enter valid dimensions');
      return;
    }

    const result = await ImageManipulator.manipulateAsync(
      image,
      [{ resize: { width: w, height: h } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    setResultImage(result.uri);
    showToast('Image resized!', 'success');
  };

  const maintainRatio = (dimension: 'width' | 'height', value: string) => {
    const val = parseInt(value);
    if (isNaN(val) || val <= 0) return;

    if (dimension === 'width') {
      setWidth(value);
      const ratio = originalSize.height / originalSize.width;
      setHeight(String(Math.round(val * ratio)));
    } else {
      setHeight(value);
      const ratio = originalSize.width / originalSize.height;
      setWidth(String(Math.round(val * ratio)));
    }
  };

  const handleScaleChange = (delta: number) => {
    const newScale = Math.max(0.1, Math.min(2, previewScale + delta));
    setPreviewScale(newScale);
    const newWidth = Math.round(originalSize.width * newScale);
    const newHeight = Math.round(originalSize.height * newScale);
    setWidth(String(newWidth));
    setHeight(String(newHeight));
  };

  const presets = [
    { label: '50%', scale: 0.5 },
    { label: '75%', scale: 0.75 },
    { label: '100%', scale: 1 },
    { label: '150%', scale: 1.5 },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity onPress={pickImage} style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <>
            <MaterialIcons name="add-photo-alternate" size={48} color={primaryColor} />
            <Text style={[styles.uploadText, { color: textSecondaryColor }]}>Tap to select an image</Text>
          </>
        )}
      </TouchableOpacity>

      {image && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.originalSize, { color: textSecondaryColor }]}>
            Original: {originalSize.width} × {originalSize.height}
          </Text>

          {/* Scale Presets */}
          <Text style={[styles.label, { color: textSecondaryColor }]}>Quick Resize</Text>
          <View style={styles.presetsRow}>
            {presets.map((p) => (
              <TouchableOpacity
                key={p.label}
                onPress={() => {
                  setPreviewScale(p.scale);
                  setWidth(String(Math.round(originalSize.width * p.scale)));
                  setHeight(String(Math.round(originalSize.height * p.scale)));
                }}
                style={[styles.presetBtn, previewScale === p.scale && { backgroundColor: primaryColor }]}
              >
                <Text style={[styles.presetText, previewScale === p.scale && { color: 'white' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual Scale Slider */}
          <Text style={[styles.label, { color: textSecondaryColor, marginTop: 16 }]}>Drag to Resize: {Math.round(previewScale * 100)}%</Text>
          <View style={styles.sliderRow}>
            <TouchableOpacity onPress={() => handleScaleChange(-0.1)} style={[styles.sliderBtn, { backgroundColor: primaryColor + '1A' }]}>
              <MaterialIcons name="remove" size={20} color={primaryColor} />
            </TouchableOpacity>
            <View style={[styles.sliderTrack, { backgroundColor: backgroundColor }]}>
              <View style={[styles.sliderFill, { backgroundColor: primaryColor, width: `${(previewScale / 2) * 100}%` }]} />
            </View>
            <TouchableOpacity onPress={() => handleScaleChange(0.1)} style={[styles.sliderBtn, { backgroundColor: primaryColor + '1A' }]}>
              <MaterialIcons name="add" size={20} color={primaryColor} />
            </TouchableOpacity>
          </View>

          {/* Dimension Inputs */}
          <View style={styles.inputsRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textSecondaryColor }]}>Width</Text>
              <TextInput
                style={[styles.input, { color: textColor, backgroundColor }]}
                keyboardType="numeric"
                value={width}
                onChangeText={(v) => maintainRatio('width', v)}
              />
            </View>
            <MaterialIcons name="close" size={20} color={textSecondaryColor} style={{ marginTop: 28 }} />
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textSecondaryColor }]}>Height</Text>
              <TextInput
                style={[styles.input, { color: textColor, backgroundColor }]}
                keyboardType="numeric"
                value={height}
                onChangeText={(v) => maintainRatio('height', v)}
              />
            </View>
          </View>

          <TouchableOpacity onPress={resizeImage} style={[styles.resizeBtn, { backgroundColor: primaryColor }]}>
            <MaterialIcons name="aspect-ratio" size={20} color="white" />
            <Text style={styles.resizeBtnText}>Resize Image</Text>
          </TouchableOpacity>
        </View>
      )}

      {resultImage && (
        <>
          <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>RESULT</Text>
          <View style={[styles.resultCard, { backgroundColor: cardColor }]}>
            <Image source={{ uri: resultImage }} style={styles.resultImage} resizeMode="contain" />
            <Text style={[styles.resultSize, { color: textSecondaryColor }]}>
              New Size: {width} × {height}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  uploadArea: { height: 200, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  uploadText: { marginTop: 8, fontSize: 14 },
  previewImage: { width: '100%', height: '100%', borderRadius: 14 },
  card: { borderRadius: 16, padding: 20, marginBottom: 24 },
  originalSize: { textAlign: 'center', marginBottom: 16, fontSize: 14 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  presetsRow: { flexDirection: 'row', gap: 10 },
  presetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  presetText: { fontWeight: '600' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sliderBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sliderTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 4 },
  inputsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20, marginTop: 8 },
  inputGroup: { flex: 1 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, textAlign: 'center' },
  resizeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  resizeBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  resultCard: { borderRadius: 16, padding: 16 },
  resultImage: { width: '100%', height: 200, borderRadius: 12 },
  resultSize: { textAlign: 'center', marginTop: 12, fontSize: 14 },
});
