import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as PdfUtils from '../../modules/image-to-pdf';

export default function PdfCompressTool() {
    const [pdfName, setPdfName] = useState('');
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [pdfSize, setPdfSize] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [quality, setQuality] = useState(70);
    const [result, setResult] = useState<{ uri: string; originalSize: number; compressedSize: number; savings: number } | null>(null);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

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
            setPdfSize(file.size || 0);
            setResult(null);
        } catch (err) {
            console.error(err);
            showToast('Failed to pick PDF', 'error');
        }
    };

    const compressPdf = async () => {
        if (!pdfUri) return;

        setIsProcessing(true);
        try {
            const compressResult = await PdfUtils.compressPdf(pdfUri, quality);
            setResult(compressResult);
            showToast(`Reduced by ${compressResult.savings}%!`, 'success');
            onToolComplete();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to compress PDF', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const sharePdf = async () => {
        if (!result) return;
        try {
            await Sharing.shareAsync(result.uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Compressed PDF',
            });
        } catch (error) {
            showToast('Failed to share', 'error');
        }
    };

    const savePdf = async () => {
        if (!result) return;
        setIsSaving(true);
        try {
            const fileName = `compressed_${Date.now()}`;
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

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const qualityOptions = [
        { label: 'Low', value: 50, desc: 'Smallest file' },
        { label: 'Medium', value: 70, desc: 'Balanced' },
        { label: 'High', value: 90, desc: 'Better quality' },
    ];

    const reset = () => {
        setPdfUri(null);
        setPdfName('');
        setPdfSize(0);
        setResult(null);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Pick PDF */}
            <TouchableOpacity
                onPress={pickPdf}
                style={[styles.addCard, { backgroundColor: cardColor, borderColor: "#ef4444" }]}
            >
                <MaterialIcons name="compress" size={40} color={"#ef4444"} />
                <Text style={[styles.addText, { color: textColor }]}>Select PDF to Compress</Text>
                <Text style={[styles.addDesc, { color: textSecondaryColor }]}>
                    Reduce PDF file size while maintaining quality
                </Text>
            </TouchableOpacity>

            {/* Selected PDF & Options */}
            {pdfUri && !result && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.fileRow}>
                        <MaterialIcons name="description" size={24} color={"#ef4444"} />
                        <View style={styles.fileInfo}>
                            <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                                {pdfName}
                            </Text>
                            <Text style={[styles.fileSize, { color: textSecondaryColor }]}>
                                {formatSize(pdfSize)}
                            </Text>
                        </View>
                    </View>

                    {/* Quality Options */}
                    <Text style={[styles.sectionLabel, { color: textColor }]}>Compression Level</Text>
                    <View style={styles.qualityRow}>
                        {qualityOptions.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => setQuality(opt.value)}
                                style={[
                                    styles.qualityBtn,
                                    quality === opt.value && { backgroundColor: "#ef4444" },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.qualityLabel,
                                        { color: quality === opt.value ? 'white' : textColor },
                                    ]}
                                >
                                    {opt.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.qualityDesc,
                                        { color: quality === opt.value ? 'rgba(255,255,255,0.8)' : textSecondaryColor },
                                    ]}
                                >
                                    {opt.desc}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={compressPdf}
                        disabled={isProcessing}
                        style={[styles.compressBtn, { backgroundColor: "#ef4444", opacity: isProcessing ? 0.7 : 1 }]}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <MaterialIcons name="compress" size={24} color="white" />
                        )}
                        <Text style={styles.compressBtnText}>
                            {isProcessing ? 'Compressing...' : 'Compress PDF'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Result */}
            {result && (
                <View style={[styles.successCard, { backgroundColor: '#10b98120' }]}>
                    <MaterialIcons name="check-circle" size={48} color="#10b981" />
                    <Text style={[styles.successText, { color: textColor }]}>PDF Compressed!</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Original</Text>
                            <Text style={[styles.statValue, { color: textColor }]}>{formatSize(result.originalSize)}</Text>
                        </View>
                        <MaterialIcons name="arrow-forward" size={20} color={textSecondaryColor} />
                        <View style={styles.stat}>
                            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Compressed</Text>
                            <Text style={[styles.statValue, { color: '#10b981' }]}>{formatSize(result.compressedSize)}</Text>
                        </View>
                    </View>

                    <View style={[styles.savingsBadge, { backgroundColor: '#10b981' }]}>
                        <Text style={styles.savingsText}>{result.savings}% smaller</Text>
                    </View>

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
                        <Text style={[styles.shareBtnText, { color: '#10b981' }]}>Share Compressed PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={reset} style={styles.newBtn}>
                        <MaterialIcons name="add" size={18} color="#ef4444" />
                        <Text style={{ color: "#ef4444", fontWeight: '600' }}>Compress Another PDF</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    Compression re-renders PDF pages at lower resolution. Best for documents with images.
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
    fileInfo: { flex: 1 },
    fileName: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
    fileSize: { fontSize: 13 },
    sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    qualityRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    qualityBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
    qualityLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    qualityDesc: { fontSize: 11 },
    compressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
    compressBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    successCard: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
    successText: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
    stat: { alignItems: 'center' },
    statLabel: { fontSize: 12, marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '700' },
    savingsBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    savingsText: { color: 'white', fontWeight: '700', fontSize: 14 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, width: '100%', marginTop: 10, borderWidth: 2, backgroundColor: 'transparent' },
    shareBtnText: { fontWeight: '700', fontSize: 16 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, width: '100%', marginTop: 16 },
    saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
    newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
