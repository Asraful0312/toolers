import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as PdfUtils from '../../modules/image-to-pdf';

interface SelectedPdf {
    uri: string;
    name: string;
    size: number;
}

export default function PdfMergeTool() {
    const [pdfs, setPdfs] = useState<SelectedPdf[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{ uri: string; pageCount: number } | null>(null);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const pickPdfs = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
                multiple: true,
            });

            if (result.canceled) return;

            const newPdfs = result.assets.map((asset) => ({
                uri: asset.uri,
                name: asset.name,
                size: asset.size || 0,
            }));
            setPdfs([...pdfs, ...newPdfs]);
            setResult(null);
        } catch (err) {
            console.error(err);
            showToast('Failed to pick PDFs', 'error');
        }
    };

    const removePdf = (index: number) => {
        setPdfs(pdfs.filter((_, i) => i !== index));
        setResult(null);
    };

    const movePdf = (index: number, direction: 'up' | 'down') => {
        const newPdfs = [...pdfs];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= pdfs.length) return;
        [newPdfs[index], newPdfs[newIndex]] = [newPdfs[newIndex], newPdfs[index]];
        setPdfs(newPdfs);
        setResult(null);
    };

    const mergePdfs = async () => {
        if (pdfs.length < 2) {
            showToast('Select at least 2 PDFs to merge', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const uris = pdfs.map((p) => p.uri);
            const mergeResult = await PdfUtils.mergePdfs(uris);
            setResult({
                uri: mergeResult.uri,
                pageCount: mergeResult.pageCount,
            });
            showToast('PDFs merged successfully!', 'success');
            onToolComplete();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to merge PDFs', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const sharePdf = async () => {
        if (!result) return;
        try {
            await Sharing.shareAsync(result.uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Merged PDF',
            });
        } catch (error) {
            showToast('Failed to share', 'error');
        }
    };

    const savePdf = async () => {
        if (!result) return;
        setIsSaving(true);
        try {
            const fileName = `merged_${Date.now()}`;
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
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const reset = () => {
        setPdfs([]);
        setResult(null);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Add PDFs */}
            <TouchableOpacity
                onPress={pickPdfs}
                style={[styles.addCard, { backgroundColor: cardColor, borderColor: '#ef4444' }]}
            >
                <MaterialIcons name="post-add" size={40} color="#ef4444" />
                <Text style={[styles.addText, { color: textColor }]}>Add PDF Files</Text>
                <Text style={[styles.addDesc, { color: textSecondaryColor }]}>
                    Select multiple PDFs to merge into one
                </Text>
            </TouchableOpacity>

            {/* Selected PDFs */}
            {pdfs.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>
                            SELECTED PDFs ({pdfs.length})
                        </Text>
                        <TouchableOpacity onPress={reset}>
                            <Text style={{ color: '#ef4444', fontWeight: '600' }}>Clear All</Text>
                        </TouchableOpacity>
                    </View>

                    {pdfs.map((pdf, index) => (
                        <View key={index} style={styles.pdfItem}>
                            <View style={styles.pdfNumber}>
                                <Text style={styles.pdfNumberText}>{index + 1}</Text>
                            </View>
                            <View style={styles.pdfInfo}>
                                <Text style={[styles.pdfName, { color: textColor }]} numberOfLines={1}>
                                    {pdf.name}
                                </Text>
                                <Text style={[styles.pdfSize, { color: textSecondaryColor }]}>
                                    {formatSize(pdf.size)}
                                </Text>
                            </View>
                            <View style={styles.pdfActions}>
                                <TouchableOpacity
                                    onPress={() => movePdf(index, 'up')}
                                    disabled={index === 0}
                                    style={[styles.actionBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                                >
                                    <MaterialIcons name="keyboard-arrow-up" size={20} color={textSecondaryColor} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => movePdf(index, 'down')}
                                    disabled={index === pdfs.length - 1}
                                    style={[styles.actionBtn, { opacity: index === pdfs.length - 1 ? 0.3 : 1 }]}
                                >
                                    <MaterialIcons name="keyboard-arrow-down" size={20} color={textSecondaryColor} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removePdf(index)} style={styles.actionBtn}>
                                    <MaterialIcons name="close" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Merge Button */}
            {pdfs.length >= 2 && !result && (
                <TouchableOpacity
                    onPress={mergePdfs}
                    disabled={isProcessing}
                    style={[styles.mergeBtn, { backgroundColor: '#ef4444', opacity: isProcessing ? 0.7 : 1 }]}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <MaterialIcons name="merge-type" size={24} color="white" />
                    )}
                    <Text style={styles.mergeBtnText}>
                        {isProcessing ? 'Merging...' : `Merge ${pdfs.length} PDFs`}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Result */}
            {result && (
                <View style={[styles.successCard, { backgroundColor: '#10b98120' }]}>
                    <MaterialIcons name="check-circle" size={48} color="#10b981" />
                    <Text style={[styles.successText, { color: textColor }]}>PDFs Merged!</Text>
                    <Text style={[styles.successDesc, { color: textSecondaryColor }]}>
                        {result.pageCount} pages total
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
                        <Text style={[styles.shareBtnText, { color: '#10b981' }]}>Share Merged PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={reset} style={styles.newBtn}>
                        <MaterialIcons name="add" size={18} color="#ef4444" />
                        <Text style={{ color: '#ef4444', fontWeight: '600' }}>Merge More PDFs</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    PDFs will be merged in the order shown. Drag to reorder before merging.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    addCard: {
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        padding: 30,
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    addText: { fontSize: 16, fontWeight: 'bold' },
    addDesc: { fontSize: 13, textAlign: 'center' },
    card: { borderRadius: 16, padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
    pdfItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    pdfNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
    pdfNumberText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    pdfInfo: { flex: 1 },
    pdfName: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    pdfSize: { fontSize: 12 },
    pdfActions: { flexDirection: 'row', gap: 6 },
    actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
    mergeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 14, marginBottom: 16 },
    mergeBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
    successCard: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
    successText: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
    successDesc: { fontSize: 14 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, width: '100%', marginTop: 10, borderWidth: 2, backgroundColor: 'transparent' },
    shareBtnText: { fontWeight: '700', fontSize: 16 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, width: '100%', marginTop: 16 },
    saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
    newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
