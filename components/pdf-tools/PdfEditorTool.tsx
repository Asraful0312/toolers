import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import * as PdfUtils from '../../modules/image-to-pdf';
import { EditOperation } from '../../modules/image-to-pdf';

const PDF_COLOR = '#ef4444';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PageInfo {
    index: number;
    imageUri: string;
    rotation: number;
    deleted: boolean;
}

interface PendingAnnotation {
    type: 'text' | 'image';
    pageIndex: number;
    x: number;
    y: number;
    text?: string;
    fontSize?: number;
    color?: string;
    imageUri?: string;
    width?: number;
    height?: number;
}

export default function PdfEditorTool() {
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [pdfName, setPdfName] = useState('');
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [annotations, setAnnotations] = useState<PendingAnnotation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUri, setResultUri] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pages' | 'annotate'>('pages');


    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColorVal = useThemeColor({}, 'text');
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

            const asset = result.assets[0];
            setPdfUri(asset.uri);
            setPdfName(asset.name);
            setResultUri(null);
            setAnnotations([]);
            await loadPages(asset.uri);
        } catch (err) {
            showToast('Failed to pick PDF', 'error');
        }
    };

    const loadPages = async (uri: string) => {
        setIsLoading(true);
        try {
            const result = await PdfUtils.pdfToImages(uri, 80);
            const pageInfos: PageInfo[] = result.images.map((img, idx) => ({
                index: idx,
                imageUri: img,
                rotation: 0,
                deleted: false,
            }));
            setPages(pageInfos);
        } catch (err) {
            showToast('Failed to load PDF pages', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const rotatePage = (index: number) => {
        setPages((prev) =>
            prev.map((p) => (p.index === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
        );
    };

    const deletePage = (index: number) => {
        setPages((prev) => prev.map((p) => (p.index === index ? { ...p, deleted: !p.deleted } : p)));
    };

    const movePage = (index: number, direction: 'up' | 'down') => {
        const currentIdx = pages.findIndex((p) => p.index === index);
        const newIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
        if (newIdx < 0 || newIdx >= pages.length) return;

        const newPages = [...pages];
        [newPages[currentIdx], newPages[newIdx]] = [newPages[newIdx], newPages[currentIdx]];
        setPages(newPages);
    };


    const applyChanges = async () => {
        if (!pdfUri) return;
        setIsProcessing(true);

        try {
            let currentUri = pdfUri;

            // Build page operations - only delete and rotate
            const operations: EditOperation[] = [];

            // Add rotate operations for pages with rotation
            pages.forEach((p) => {
                if (p.rotation !== 0) {
                    operations.push({ type: 'rotate', pageIndex: p.index, degrees: p.rotation });
                }
            });

            // Add delete operations for deleted pages
            pages.filter((p) => p.deleted).forEach((p) => {
                operations.push({ type: 'delete', pageIndex: p.index });
            });

            // Build pageOrder array - current order of original indices (excluding deleted)
            const pageOrder: number[] = pages
                .filter((p) => !p.deleted)
                .map((p) => p.index);

            // Check if there are any changes to apply
            const hasOperations = operations.length > 0;
            const orderChanged = pageOrder.some((originalIdx, newPos) => originalIdx !== newPos);

            if (hasOperations || orderChanged) {
                const editResult = await PdfUtils.editPdfPages(currentUri, operations, pageOrder);
                currentUri = editResult.uri;
            }


            setResultUri(currentUri);
            showToast('PDF edited successfully!', 'success');
            onToolComplete();
        } catch (err) {
            console.error(err);
            showToast('Failed to apply changes', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const sharePdf = async () => {
        if (!resultUri) return;
        try {
            await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf' });
        } catch (err) {
            showToast('Failed to share PDF', 'error');
        }
    };

    const savePdf = async () => {
        if (!resultUri) return;
        try {
            const fileName = `edited_${Date.now()}`;
            await PdfUtils.savePdfToDownloads(resultUri, fileName);
            showToast('Saved to Downloads!', 'success');
        } catch (err) {
            showToast('Failed to save PDF', 'error');
        }
    };

    const reset = () => {
        setPdfUri(null);
        setPdfName('');
        setPages([]);
        setAnnotations([]);
        setResultUri(null);
        setActiveTab('pages');
    };

    const visiblePages = pages.filter((p) => !p.deleted);
    const hasChanges = pages.some((p) => p.rotation !== 0 || p.deleted) || annotations.length > 0 ||
        pages.some((p, i) => p.index !== i);

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: PDF_COLOR + '15' }]}>
                <MaterialIcons name="edit-document" size={32} color={PDF_COLOR} />
                <Text style={[styles.headerTitle, { color: textColorVal }]}>PDF Editor</Text>
                <Text style={[styles.headerSubtitle, { color: textSecondaryColor }]}>
                    Edit pages, add text & images
                </Text>
            </View>

            {!pdfUri ? (
                <TouchableOpacity style={[styles.pickBtn, { backgroundColor: PDF_COLOR }]} onPress={pickPdf}>
                    <MaterialIcons name="upload-file" size={24} color="white" />
                    <Text style={styles.pickBtnText}>Select PDF</Text>
                </TouchableOpacity>
            ) : isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PDF_COLOR} />
                    <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Loading pages...</Text>
                </View>
            ) : (
                <>
                    {/* File Info */}
                    <View style={[styles.fileInfo, { backgroundColor: cardColor }]}>
                        <MaterialIcons name="picture-as-pdf" size={24} color={PDF_COLOR} />
                        <Text style={[styles.fileName, { color: textColorVal }]} numberOfLines={1}>
                            {pdfName}
                        </Text>
                        <TouchableOpacity onPress={reset}>
                            <MaterialIcons name="close" size={24} color={textSecondaryColor} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabs, { backgroundColor: cardColor }]}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'pages' && { backgroundColor: PDF_COLOR }]}
                            onPress={() => setActiveTab('pages')}
                        >
                            <MaterialIcons name="layers" size={20} color={activeTab === 'pages' ? 'white' : textSecondaryColor} />
                            <Text style={[styles.tabText, { color: activeTab === 'pages' ? 'white' : textSecondaryColor }]}>
                                Pages ({visiblePages.length})
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* Pages Tab */}
                    {activeTab === 'pages' && (
                        <View style={[styles.card, { backgroundColor: cardColor }]}>
                            {pages.map((page, idx) => (
                                <View
                                    key={page.index}
                                    style={[
                                        styles.pageRow,
                                        page.deleted && styles.pageDeleted,
                                        idx > 0 && { borderTopWidth: 1, borderTopColor: textSecondaryColor + '20' },
                                    ]}
                                >
                                    <Image
                                        source={{ uri: page.imageUri }}
                                        style={[styles.thumbnail, { transform: [{ rotate: `${page.rotation}deg` }] }]}
                                    />
                                    <View style={styles.pageInfo}>
                                        <Text style={[styles.pageNum, { color: textColorVal }]}>Page {page.index + 1}</Text>
                                        {page.rotation !== 0 && (
                                            <Text style={[styles.pageRotation, { color: PDF_COLOR }]}>↻ {page.rotation}°</Text>
                                        )}
                                        {page.deleted && <Text style={styles.pageDeletedText}>Will be deleted</Text>}
                                    </View>
                                    <View style={styles.pageActions}>
                                        <TouchableOpacity onPress={() => movePage(page.index, 'up')} disabled={idx === 0}>
                                            <MaterialIcons name="arrow-upward" size={22} color={idx === 0 ? textSecondaryColor + '40' : textSecondaryColor} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => movePage(page.index, 'down')} disabled={idx === pages.length - 1}>
                                            <MaterialIcons name="arrow-downward" size={22} color={idx === pages.length - 1 ? textSecondaryColor + '40' : textSecondaryColor} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => rotatePage(page.index)}>
                                            <MaterialIcons name="rotate-right" size={22} color={primaryColor} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deletePage(page.index)}>
                                            <MaterialIcons name={page.deleted ? 'restore' : 'delete'} size={22} color={page.deleted ? '#22c55e' : PDF_COLOR} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                    {/* Apply Changes */}
                    {hasChanges && !resultUri && (
                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: PDF_COLOR }]}
                            onPress={applyChanges}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <MaterialIcons name="check" size={24} color="white" />
                                    <Text style={styles.applyBtnText}>Apply Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Result */}
                    {resultUri && (
                        <View style={[styles.resultCard, { backgroundColor: '#22c55e' }]}>
                            <MaterialIcons name="check-circle" size={32} color="white" />
                            <Text style={styles.resultText}>PDF edited successfully!</Text>
                            <View style={styles.resultActions}>
                                <TouchableOpacity style={styles.resultBtn} onPress={sharePdf}>
                                    <MaterialIcons name="share" size={20} color="white" />
                                    <Text style={styles.resultBtnText}>Share</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.resultBtn} onPress={savePdf}>
                                    <MaterialIcons name="download" size={20} color="white" />
                                    <Text style={styles.resultBtnText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </>
            )}


        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    header: { alignItems: 'center', padding: 24, borderRadius: 16, gap: 8 },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 14 },
    pickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 12 },
    pickBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    loadingContainer: { alignItems: 'center', padding: 40, gap: 16 },
    loadingText: { fontSize: 14 },
    fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12 },
    fileName: { flex: 1, fontSize: 14, fontWeight: '500' },
    tabs: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8 },
    tabText: { fontSize: 14, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    pageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    pageDeleted: { opacity: 0.5 },
    thumbnail: { width: 50, height: 70, borderRadius: 6, backgroundColor: '#f0f0f0' },
    pageInfo: { flex: 1, gap: 2 },
    pageNum: { fontSize: 14, fontWeight: '600' },
    pageRotation: { fontSize: 12 },
    pageDeletedText: { fontSize: 11, color: '#ef4444' },
    pageActions: { flexDirection: 'row', gap: 12 },
    pageSelector: { marginBottom: 16 },
    pageSelectorItem: { marginRight: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent', padding: 4 },
    pageSelectorThumb: { width: 60, height: 80, borderRadius: 4 },
    pageSelectorText: { fontSize: 12, marginTop: 4 },
    annotateArea: { gap: 12 },
    annotateHint: { fontSize: 12, textAlign: 'center' },
    previewContainer: { alignItems: 'center' },
    previewImage: { width: SCREEN_WIDTH - 64, height: (SCREEN_WIDTH - 64) * 1.4, borderRadius: 8, backgroundColor: '#f0f0f0' },
    annotateActions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
    annotateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    annotateBtnText: { color: 'white', fontWeight: '600' },
    annotationsList: { marginTop: 16 },
    annotationItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, marginBottom: 8 },
    annotationText: { flex: 1, fontSize: 13 },
    applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 12 },
    applyBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    resultCard: { alignItems: 'center', padding: 24, borderRadius: 16, gap: 12 },
    resultText: { color: 'white', fontSize: 16, fontWeight: '600' },
    resultActions: { flexDirection: 'row', gap: 16 },
    resultBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    resultBtnText: { color: 'white', fontWeight: '500' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: SCREEN_WIDTH - 48, borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    textInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
    textOptions: { marginTop: 16, gap: 16 },
    textOption: { gap: 8 },
    textOptionLabel: { fontSize: 13 },
    sizeButtons: { flexDirection: 'row', gap: 8 },
    sizeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: '#f0f0f0' },
    colorButtons: { flexDirection: 'row', gap: 10 },
    colorBtn: { width: 32, height: 32, borderRadius: 16 },
    colorBtnSelected: { borderWidth: 3, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
});
