import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import * as ImageToPdf from '../../modules/image-to-pdf';

interface SelectedImage {
  uri: string;
  width: number;
  height: number;
}

type PageSize = 'A4' | 'Letter' | 'A3' | 'A5';
type FitMode = 'contain' | 'cover' | 'fill';

export default function ImageToPdfTool() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfResult, setPdfResult] = useState<{ uri: string; fileName: string } | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const pageSizes: { label: string; value: PageSize }[] = [
    { label: 'A4', value: 'A4' },
    { label: 'Letter', value: 'Letter' },
    { label: 'A3', value: 'A3' },
    { label: 'A5', value: 'A5' },
  ];

  const fitModes: { label: string; value: FitMode; icon: string }[] = [
    { label: 'Contain', value: 'contain', icon: 'fit-screen' },
    { label: 'Cover', value: 'cover', icon: 'crop-free' },
    { label: 'Fill', value: 'fill', icon: 'fullscreen' },
  ];

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width || 300,
        height: asset.height || 400,
      }));
      setImages([...images, ...newImages]);
      setPdfResult(null);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPdfResult(null);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setImages(newImages);
    setPdfResult(null);
  };

  const generatePdf = async () => {
    if (images.length === 0) return;

    setIsGenerating(true);
    try {
      const imageUris = images.map((img) => img.uri);

      const result = await ImageToPdf.createPdf(imageUris, {
        fileName: `PDF_${Date.now()}`,
        pageSize,
        quality: 90,
        fitMode,
      });

      setPdfResult({
        uri: result.uri,
        fileName: result.fileName,
      });
      showToast('PDF created successfully!', 'success');
      onToolComplete();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to create PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToDownloads = async () => {
    if (!pdfResult) return;

    if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version < 29) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to storage to save the PDF file to your Downloads folder.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        showToast('Storage permission needed to save', 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      const fileName = `PDF_${Date.now()}`;
      const result = await ImageToPdf.savePdfToDownloads(pdfResult.uri, fileName);

      if (result.success) {
        showToast('PDF saved to Downloads!', 'success');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to save PDF', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const sharePdf = async () => {
    if (!pdfResult) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        showToast('Sharing not available', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to share', 'error');
    }
  };

  const clearAll = () => {
    setImages([]);
    setPdfResult(null);
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

      {/* Settings */}
      {images.length > 0 && !pdfResult && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PDF SETTINGS</Text>

          {/* Page Size */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Page Size</Text>
            <View style={styles.optionRow}>
              {pageSizes.map((size) => (
                <TouchableOpacity
                  key={size.value}
                  onPress={() => setPageSize(size.value)}
                  style={[
                    styles.optionBtn,
                    pageSize === size.value && { backgroundColor: '#ef4444' },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: pageSize === size.value ? '#fff' : textSecondaryColor },
                    ]}
                  >
                    {size.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Fit Mode */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Image Fit</Text>
            <View style={styles.optionRow}>
              {fitModes.map((mode) => (
                <TouchableOpacity
                  key={mode.value}
                  onPress={() => setFitMode(mode.value)}
                  style={[
                    styles.optionBtn,
                    fitMode === mode.value && { backgroundColor: '#ef4444' },
                  ]}
                >
                  <MaterialIcons
                    name={mode.icon as any}
                    size={16}
                    color={fitMode === mode.value ? '#fff' : textSecondaryColor}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      { color: fitMode === mode.value ? '#fff' : textSecondaryColor },
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

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

      {/* Generate Button */}
      {images.length > 0 && !pdfResult && (
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
      {pdfResult && (
        <View style={[styles.successCard, { backgroundColor: '#10b98120' }]}>
          <MaterialIcons name="check-circle" size={48} color="#10b981" />
          <Text style={[styles.successText, { color: textColor }]}>PDF Created Successfully!</Text>
          <Text style={[styles.successDesc, { color: textSecondaryColor }]}>
            {images.length} {images.length === 1 ? 'image' : 'images'} converted to PDF
          </Text>

          {/* Save to Downloads */}
          {Platform.OS === 'android' && (
            <TouchableOpacity
              onPress={saveToDownloads}
              disabled={isSaving}
              style={[styles.saveBtn, { backgroundColor: '#10b981' }]}
            >
              {isSaving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <MaterialIcons name="download" size={22} color="white" />
              )}
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving...' : 'Save to Downloads'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Share Button */}
          <TouchableOpacity
            onPress={sharePdf}
            style={[styles.shareBtn, { borderColor: '#10b981' }]}
          >
            <MaterialIcons name="share" size={22} color="#10b981" />
            <Text style={[styles.shareBtnText, { color: '#10b981' }]}>Share PDF</Text>
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
          Uses native Android PDF APIs for high-quality conversion. Each image will be placed on a separate page. Images are automatically rotated based on EXIF data.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  addCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  addText: { fontSize: 16, fontWeight: 'bold' },
  addDesc: { fontSize: 13, textAlign: 'center' },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  settingRow: { marginBottom: 16 },
  settingLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  optionText: { fontSize: 13, fontWeight: '600' },
  imageGrid: { gap: 12 },
  imageItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageContainer: { position: 'relative' },
  thumbnail: { width: 60, height: 60, borderRadius: 10 },
  imageNumber: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageNumberText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  imageActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  imageActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 14,
    marginBottom: 16
  },
  generateBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  successCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  successText: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  successDesc: { fontSize: 14 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    width: '100%',
    marginTop: 16
  },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    width: '100%',
    marginTop: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  shareBtnText: { fontWeight: '700', fontSize: 16 },
  newPdfBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
