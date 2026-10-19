import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as PdfUtils from '../../modules/image-to-pdf';

export default function PdfToImageTool() {
    const [pdfName, setPdfName] = useState('');
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const pickPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setPdfName(file.name);
            setPdfUri(file.uri);
            setImages([]);
        } catch (err) {
            console.error(err);
            showToast('Failed to pick PDF', 'error');
        }
    };

    const convertToImages = async () => {
        if (!pdfUri) return;

        setIsProcessing(true);
        try {
            const result = await PdfUtils.pdfToImages(pdfUri, 90);
            setImages(result.images);
            showToast(`Converted ${result.pageCount} pages to images!`, 'success');
            onToolComplete();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to convert PDF', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const saveAllImages = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                showToast('Permission required to save images', 'error');
                return;
            }

            for (const uri of images) {
                await MediaLibrary.saveToLibraryAsync(uri);
            }
            showToast(`Saved ${images.length} images to gallery!`, 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to save images', 'error');
        }
    };

    const shareImage = async (uri: string) => {
        try {
            await Sharing.shareAsync(uri, { mimeType: 'image/jpeg' });
        } catch (error) {
            showToast('Failed to share', 'error');
        }
    };

    const reset = () => {
        setPdfUri(null);
        setPdfName('');
        setImages([]);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Pick PDF */}
            <TouchableOpacity
                onPress={pickPdf}
                style={[styles.addCard, { backgroundColor: cardColor, borderColor: "#ef4444" }]}
            >
                <MaterialIcons name="picture-as-pdf" size={40} color={"#ef4444"} />
                <Text style={[styles.addText, { color: textColor }]}>Select PDF</Text>
                <Text style={[styles.addDesc, { color: textSecondaryColor }]}>
                    Convert each page to a high-quality image
                </Text>
            </TouchableOpacity>

            {/* Selected PDF */}
            {pdfUri && images.length === 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.fileRow}>
                        <MaterialIcons name="description" size={24} color={"#ef4444"} />
                        <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                            {pdfName}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={convertToImages}
                        disabled={isProcessing}
                        style={[styles.convertBtn, { backgroundColor: "#ef4444", opacity: isProcessing ? 0.7 : 1 }]}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <MaterialIcons name="image" size={24} color="white" />
                        )}
                        <Text style={styles.convertBtnText}>
                            {isProcessing ? 'Converting...' : 'Convert to Images'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Result Images */}
            {images.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>
                            CONVERTED IMAGES ({images.length})
                        </Text>
                        <TouchableOpacity onPress={saveAllImages}>
                            <Text style={{ color: "#ef4444", fontWeight: '600' }}>Save All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.imageGrid}>
                        {images.map((uri, index) => (
                            <TouchableOpacity key={index} style={styles.imageItem} onPress={() => shareImage(uri)}>
                                <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
                                <View style={styles.imageNumber}>
                                    <Text style={styles.imageNumberText}>{index + 1}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity onPress={reset} style={styles.newBtn}>
                        <MaterialIcons name="add" size={18} color="#ef4444" />
                        <Text style={{ color: "#ef4444", fontWeight: '600' }}>Convert Another PDF</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    Each page is converted to a high-resolution JPEG image. Tap any image to share it.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    addCard: { borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', padding: 30, alignItems: 'center', gap: 8, marginBottom: 16 },
    addText: { fontSize: 16, fontWeight: 'bold' },
    addDesc: { fontSize: 13, textAlign: 'center' },
    card: { borderRadius: 16, padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
    fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    fileName: { flex: 1, fontSize: 15, fontWeight: '500' },
    convertBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
    convertBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    imageItem: { position: 'relative' },
    thumbnail: { width: 80, height: 100, borderRadius: 8 },
    imageNumber: { position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
    imageNumberText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
    newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
