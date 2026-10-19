import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as PdfUtils from '../../modules/image-to-pdf';

const PDF_COLOR = '#ef4444';

export default function PdfWatermarkTool() {
    const [pdfName, setPdfName] = useState('');
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [fontSize, setFontSize] = useState(48);
    const [opacity, setOpacity] = useState(0.3);
    const [rotation, setRotation] = useState(-45);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{ uri: string; pageCount: number } | null>(null);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');

    const pickPdf = async () => {
        try {
            const pickerResult = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (pickerResult.canceled) return;

            const file = pickerResult.assets[0];
            setPdfName(file.name);
            setPdfUri(file.uri);
            setResult(null);
        } catch (err) {
            console.error(err);
            showToast('Failed to pick PDF', 'error');
        }
    };

    const applyWatermark = async () => {
        if (!pdfUri || !watermarkText.trim()) {
            showToast('Enter watermark text', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const watermarkResult = await PdfUtils.watermarkPdf(pdfUri, watermarkText, {
                fontSize,
                opacity,
                rotation,
                color: '#888888',
            });
            setResult(watermarkResult);
            showToast('Watermark added successfully!', 'success');
            onToolComplete();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to add watermark', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const sharePdf = async () => {
        if (!result) return;
        try {
            await Sharing.shareAsync(result.uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Watermarked PDF',
            });
        } catch (error) {
            showToast('Failed to share', 'error');
        }
    };

    const savePdf = async () => {
        if (!result) return;
        setIsSaving(true);
        try {
            const fileName = `watermarked_${Date.now()}`;
            const filePath = result.uri.startsWith('file://') ? result.uri.replace('file://', '') : result.uri;
            await PdfUtils.savePdfToDownloads(filePath, fileName);
            showToast('Saved to Downloads!', 'success');
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to save', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const reset = () => {
        setPdfUri(null);
        setPdfName('');
        setResult(null);
    };

    const opacityOptions = [
        { label: 'Light', value: 0.2 },
        { label: 'Medium', value: 0.3 },
        { label: 'Strong', value: 0.5 },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Pick PDF */}
            <TouchableOpacity
                onPress={pickPdf}
                style={[styles.addCard, { backgroundColor: cardColor, borderColor: PDF_COLOR }]}
            >
                <MaterialIcons name="water-drop" size={40} color={PDF_COLOR} />
                <Text style={[styles.addText, { color: textColor }]}>Select PDF</Text>
                <Text style={[styles.addDesc, { color: textSecondaryColor }]}>
                    Add text watermark to all pages
                </Text>
            </TouchableOpacity>

            {/* Watermark Options */}
            {pdfUri && !result && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.fileRow}>
                        <MaterialIcons name="description" size={24} color={PDF_COLOR} />
                        <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                            {pdfName}
                        </Text>
                    </View>

                    {/* Watermark Text */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>Watermark Text</Text>
                    <TextInput
                        style={[styles.input, { color: textColor, borderColor: textSecondaryColor + '40' }]}
                        placeholder="Enter watermark text..."
                        placeholderTextColor={textSecondaryColor}
                        value={watermarkText}
                        onChangeText={setWatermarkText}
                    />

                    {/* Opacity */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>Opacity</Text>
                    <View style={styles.optionRow}>
                        {opacityOptions.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => setOpacity(opt.value)}
                                style={[
                                    styles.optionBtn,
                                    opacity === opt.value && { backgroundColor: PDF_COLOR },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        { color: opacity === opt.value ? 'white' : textColor },
                                    ]}
                                >
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Font Size */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>Size</Text>
                    <View style={styles.optionRow}>
                        {[36, 48, 64].map((size) => (
                            <TouchableOpacity
                                key={size}
                                onPress={() => setFontSize(size)}
                                style={[
                                    styles.optionBtn,
                                    fontSize === size && { backgroundColor: PDF_COLOR },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        { color: fontSize === size ? 'white' : textColor },
                                    ]}
                                >
                                    {size === 36 ? 'Small' : size === 48 ? 'Medium' : 'Large'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={applyWatermark}
                        disabled={isProcessing}
                        style={[styles.applyBtn, { backgroundColor: PDF_COLOR, opacity: isProcessing ? 0.7 : 1 }]}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <MaterialIcons name="water-drop" size={24} color="white" />
                        )}
                        <Text style={styles.applyBtnText}>
                            {isProcessing ? 'Applying...' : 'Apply Watermark'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Result */}
            {result && (
                <View style={[styles.successCard, { backgroundColor: '#10b98120' }]}>
                    <MaterialIcons name="check-circle" size={48} color="#10b981" />
                    <Text style={[styles.successText, { color: textColor }]}>Watermark Added!</Text>
                    <Text style={[styles.successDesc, { color: textSecondaryColor }]}>
                        Applied to {result.pageCount} pages
                    </Text>

                    <TouchableOpacity
                        onPress={savePdf}
                        disabled={isSaving}
                        style={[styles.saveBtn, { backgroundColor: '#10b981', opacity: isSaving ? 0.7 : 1 }]}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <MaterialIcons name="download" size={22} color="white" />
                        )}
                        <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save to Downloads'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={sharePdf}
                        style={[styles.shareBtn, { borderColor: '#10b981' }]}
                    >
                        <MaterialIcons name="share" size={22} color="#10b981" />
                        <Text style={[styles.shareBtnText, { color: '#10b981' }]}>Share PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={reset} style={styles.newBtn}>
                        <MaterialIcons name="add" size={18} color={PDF_COLOR} />
                        <Text style={{ color: PDF_COLOR, fontWeight: '600' }}>Watermark Another PDF</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    Adds a diagonal repeating text watermark to all pages of the PDF.
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
    fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    fileName: { flex: 1, fontSize: 15, fontWeight: '500' },
    sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 8 },
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12 },
    optionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    optionBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
    optionText: { fontSize: 14, fontWeight: '600' },
    applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, marginTop: 8 },
    applyBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    successCard: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
    successText: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
    successDesc: { fontSize: 14 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, width: '100%', marginTop: 16 },
    saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, width: '100%', marginTop: 10, borderWidth: 2, backgroundColor: 'transparent' },
    shareBtnText: { fontWeight: '700', fontSize: 16 },
    newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
