import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SelectedImage {
  uri: string;
  base64?: string;
  width: number;
  height: number;
}

export default function ImageToPdfTool() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 || undefined,
        width: asset.width || 300,
        height: asset.height || 400,
      }));
      setImages([...images, ...newImages]);
      setPdfUri(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPdfUri(null);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setImages(newImages);
    setPdfUri(null);
  };

  const generatePdf = async () => {
    if (images.length === 0) return;

    setIsGenerating(true);
    try {
      // Convert images to base64 if not already
      const processedImages = await Promise.all(
        images.map(async (img) => {
          if (img.base64) return img;
          const base64 = await FileSystem.readAsStringAsync(img.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return { ...img, base64 };
        })
      );

      // Create HTML content with base64 images
      const imageHtml = processedImages.map((img) => {
        const mimeType = img.uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        return `
          <div style="page-break-after: always; display: flex; justify-content: center; align-items: center; width: 100%; height: 100vh; padding: 10mm; box-sizing: border-box;">
            <img src="data:${mimeType};base64,${img.base64}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: sans-serif; }
              @page { margin: 0; size: A4; }
            </style>
          </head>
          <body>
            ${imageHtml}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false,
      });
      
      setPdfUri(uri);
      showToast('PDF created successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to create PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const savePdf = async () => {
    if (!pdfUri) return;
    
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save PDF to...',
          UTI: 'com.adobe.pdf',
        });
        showToast('Choose where to save', 'success');
      } else {
        showToast('Sharing not available', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save', 'error');
    }
  };

  const clearAll = () => {
    setImages([]);
    setPdfUri(null);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Add Images */}
      <TouchableOpacity
        onPress={pickImages}
        style={[styles.addCard, { backgroundColor: cardColor, borderColor: '#ef4444' }]}
      >
        <MaterialIcons name="add-photo-alternate" size={40} color="#ef4444" />
        <Text style={[styles.addText, { color: textColor }]}>Add Images</Text>
        <Text style={[styles.addDesc, { color: textSecondaryColor }]}>
          Select one or more images to convert
        </Text>
      </TouchableOpacity>

      {/* Selected Images */}
      {images.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>
              SELECTED IMAGES ({images.length})
            </Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageGrid}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageItem}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: img.uri }} style={styles.thumbnail} resizeMode="cover" />
                  <View style={styles.imageNumber}>
                    <Text style={styles.imageNumberText}>{index + 1}</Text>
                  </View>
                </View>
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    onPress={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    style={[styles.imageActionBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                  >
                    <MaterialIcons name="keyboard-arrow-up" size={20} color={textSecondaryColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    style={[styles.imageActionBtn, { opacity: index === images.length - 1 ? 0.3 : 1 }]}
                  >
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={textSecondaryColor} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeImage(index)} style={styles.imageActionBtn}>
                    <MaterialIcons name="close" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Generate / Result Buttons */}
      {images.length > 0 && !pdfUri && (
        <TouchableOpacity
          onPress={generatePdf}
          disabled={isGenerating}
          style={[styles.generateBtn, { backgroundColor: '#ef4444', opacity: isGenerating ? 0.7 : 1 }]}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" />
          ) : (
            <MaterialIcons name="picture-as-pdf" size={24} color="white" />
          )}
          <Text style={styles.generateBtnText}>
            {isGenerating ? 'Creating PDF...' : `Create PDF (${images.length} ${images.length === 1 ? 'page' : 'pages'})`}
          </Text>
        </TouchableOpacity>
      )}

      {/* PDF Created - Show Actions */}
      {pdfUri && (
        <View style={[styles.successCard, { backgroundColor: '#10b98120' }]}>
          <MaterialIcons name="check-circle" size={48} color="#10b981" />
          <Text style={[styles.successText, { color: textColor }]}>PDF Created Successfully!</Text>
          <Text style={[styles.successDesc, { color: textSecondaryColor }]}>
            {images.length} {images.length === 1 ? 'image' : 'images'} converted to PDF
          </Text>
          
          <TouchableOpacity onPress={savePdf} style={[styles.saveBtn, { backgroundColor: '#10b981' }]}>
            <MaterialIcons name="save-alt" size={22} color="white" />
            <Text style={styles.saveBtnText}>Save / Share PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={clearAll} style={styles.newPdfBtn}>
            <MaterialIcons name="add" size={18} color={primaryColor} />
            <Text style={{ color: primaryColor, fontWeight: '600' }}>Create New PDF</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: '#ef444415' }]}>
        <MaterialIcons name="info-outline" size={18} color="#ef4444" />
        <Text style={[styles.infoText, { color: textSecondaryColor }]}>
          Each image will be placed on a separate A4 page. Tap Save to choose where to save or share the PDF.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  addCard: { borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', padding: 30, alignItems: 'center', gap: 8, marginBottom: 16 },
  addText: { fontSize: 16, fontWeight: 'bold' },
  addDesc: { fontSize: 13, textAlign: 'center' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  imageGrid: { gap: 12 },
  imageItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageContainer: { position: 'relative' },
  thumbnail: { width: 60, height: 60, borderRadius: 10 },
  imageNumber: { position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  imageNumberText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  imageActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  imageActionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 14, marginBottom: 16 },
  generateBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  successCard: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
  successText: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  successDesc: { fontSize: 14 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, width: '100%', marginTop: 16 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  newPdfBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
