import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FlipType = 'horizontal' | 'vertical';

export default function ImageRotateTool() {
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      setOriginalUri(result.assets[0].uri);
      setCurrentUri(result.assets[0].uri);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    }
  };

  const applyTransform = async (newRotation: number, newFlipH: boolean, newFlipV: boolean) => {
    if (!originalUri) return;

    setIsProcessing(true);
    try {
      const actions: ImageManipulator.Action[] = [];

      // Add rotation
      if (newRotation !== 0) {
        actions.push({ rotate: newRotation });
      }

      // Add flips
      if (newFlipH) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
      if (newFlipV) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }

      if (actions.length > 0) {
        const result = await ImageManipulator.manipulateAsync(
          originalUri,
          actions,
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        setCurrentUri(result.uri);
      } else {
        setCurrentUri(originalUri);
      }

      setRotation(newRotation);
      setFlipH(newFlipH);
      setFlipV(newFlipV);
    } catch (error) {
      console.error(error);
      showToast('Failed to transform', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const rotate = (degrees: number) => {
    const newRotation = (rotation + degrees + 360) % 360;
    applyTransform(newRotation, flipH, flipV);
  };

  const flip = (type: FlipType) => {
    if (type === 'horizontal') {
      applyTransform(rotation, !flipH, flipV);
    } else {
      applyTransform(rotation, flipH, !flipV);
    }
  };

  const resetAll = () => {
    if (originalUri) {
      setCurrentUri(originalUri);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    }
  };

  const saveImage = async () => {
    if (!currentUri) return;
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(currentUri);
        showToast('Saved to gallery!', 'success');
      } else {
        showToast('Permission denied', 'error');
      }
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {!originalUri ? (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
        >
          <MaterialIcons name="rotate-90-degrees-ccw" size={64} color={primaryColor} />
          <Text style={[styles.uploadTitle, { color: textColor }]}>Select Image</Text>
          <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
            Choose an image to rotate or flip
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Image Preview */}
          <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PREVIEW</Text>
              <Text style={[styles.rotationText, { color: primaryColor }]}>{rotation}°</Text>
            </View>
            <View style={styles.imageContainer}>
              {isProcessing && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={primaryColor} />
                </View>
              )}
              <Image source={{ uri: currentUri! }} style={styles.imagePreview} resizeMode="contain" />
            </View>
          </View>

          {/* Rotation Controls */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>ROTATE</Text>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={() => rotate(-90)}
                disabled={isProcessing}
                style={[styles.controlBtn, { backgroundColor }]}
              >
                <MaterialIcons name="rotate-left" size={28} color={primaryColor} />
                <Text style={[styles.controlLabel, { color: textColor }]}>-90°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => rotate(90)}
                disabled={isProcessing}
                style={[styles.controlBtn, { backgroundColor }]}
              >
                <MaterialIcons name="rotate-right" size={28} color={primaryColor} />
                <Text style={[styles.controlLabel, { color: textColor }]}>+90°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => rotate(180)}
                disabled={isProcessing}
                style={[styles.controlBtn, { backgroundColor }]}
              >
                <MaterialIcons name="sync" size={28} color={primaryColor} />
                <Text style={[styles.controlLabel, { color: textColor }]}>180°</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Flip Controls */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>FLIP</Text>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={() => flip('horizontal')}
                disabled={isProcessing}
                style={[styles.controlBtn, { backgroundColor: flipH ? primaryColor + '20' : backgroundColor }]}
              >
                <MaterialIcons name="flip" size={28} color={primaryColor} />
                <Text style={[styles.controlLabel, { color: textColor }]}>Horizontal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => flip('vertical')}
                disabled={isProcessing}
                style={[styles.controlBtn, { backgroundColor: flipV ? primaryColor + '20' : backgroundColor }]}
              >
                <MaterialIcons name="flip" size={28} color={primaryColor} style={{ transform: [{ rotate: '90deg' }] }} />
                <Text style={[styles.controlLabel, { color: textColor }]}>Vertical</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={pickImage} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="photo-library" size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetAll} disabled={isProcessing} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="refresh" size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={saveImage} disabled={isProcessing} style={[styles.saveBtn, { backgroundColor: primaryColor }]}>
              <MaterialIcons name="save-alt" size={20} color="white" />
              <Text style={styles.saveBtnText}>Save Image</Text>
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
  rotationText: { fontWeight: '700' },
  imageContainer: { position: 'relative', minHeight: 250 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: 12 },
  imagePreview: { width: '100%', height: 250, borderRadius: 12 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  controlsRow: { flexDirection: 'row', gap: 10 },
  controlBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 12, gap: 6 },
  controlLabel: { fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
