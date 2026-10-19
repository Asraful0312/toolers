import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { captureRef } from 'react-native-view-shot';
import MlkitOcr from 'rn-mlkit-ocr';

type Phase = 'idle' | 'counting' | 'processing';

export default function PdfOcrTool() {
    const [extractedText, setExtractedText] = useState('');
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [pageCount, setPageCount] = useState(0);
    const [displayPage, setDisplayPage] = useState(1);
    const [pdfSource, setPdfSource] = useState<{ uri: string } | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [shouldProcess, setShouldProcess] = useState(false);
    const [viewReady, setViewReady] = useState(false);

    const pdfRef = useRef<View>(null);
    const totalPagesRef = useRef(0);
    const currentPageRef = useRef(1);
    const collectedTextRef = useRef<string[]>([]);
    const processingRef = useRef(false);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#ef4444';

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setFileName(file.name);
            setExtractedText('');
            setDisplayPage(1);
            currentPageRef.current = 1;
            setPageCount(0);
            collectedTextRef.current = [];
            totalPagesRef.current = 0;
            processingRef.current = false;
            setShouldProcess(false);
            setViewReady(false);
            setPdfSource({ uri: file.uri });
            setPhase('counting');
            setIsLoading(true);
            setProgress('Analyzing PDF...');
        } catch (err) {
            console.error(err);
            showToast('Failed to pick document', 'error');
        }
    };

    const handleCountComplete = (numberOfPages: number) => {
        totalPagesRef.current = numberOfPages;
        setPageCount(numberOfPages);
        collectedTextRef.current = new Array(numberOfPages).fill('');

        setPhase('processing');
        currentPageRef.current = 1;
        setDisplayPage(1);
        processingRef.current = true;
        // Wait for view to mount before setting shouldProcess
        setTimeout(() => setShouldProcess(true), 500);
    };

    // Process loop
    useEffect(() => {
        if (shouldProcess && processingRef.current && phase === 'processing' && viewReady) {
            processCurrentPage();
        }
    }, [shouldProcess, displayPage, viewReady]);

    const processCurrentPage = async () => {
        // Double check ref availability
        if (!pdfRef.current) {
            console.warn("Ref not ready, retrying...");
            setTimeout(() => setShouldProcess(true), 200);
            return;
        }

        setShouldProcess(false); // Prevent re-entry

        const pageNum = currentPageRef.current;
        setProgress(`Extracting Page ${pageNum}/${totalPagesRef.current}...`);

        // Wait for PDF to physically render the new page
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const imageUri = await captureRef(pdfRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
            });

            const ocrResult = await MlkitOcr.recognizeText(imageUri);
            collectedTextRef.current[pageNum - 1] = ocrResult.text || '';

            // Clean up tmp file
            try {
                // Use FileSystem directly, suppressing deprecation for now as it's just a warning
                await FileSystem.deleteAsync(imageUri, { idempotent: true });
            } catch { }

        } catch (error: any) {
            console.error(`Error on page ${pageNum}:`, error);
            collectedTextRef.current[pageNum - 1] = `[Error extracting text from page ${pageNum}]`;
        }

        // Move to next page or finish
        if (pageNum < totalPagesRef.current) {
            const nextPage = pageNum + 1;
            currentPageRef.current = nextPage;
            setDisplayPage(nextPage);
            // Processing for next page will trigger via useEffect when displayPage changes
            setTimeout(() => setShouldProcess(true), 200);
        } else {
            finishProcessing();
        }
    };

    const finishProcessing = () => {
        processingRef.current = false;

        const fullText = collectedTextRef.current
            .map((text, i) => `--- Page ${i + 1} ---\n${text || ''}`)
            .join('\n\n');

        setExtractedText(fullText.trim() || 'No text found in PDF.');
        setIsLoading(false);
        setProgress('');
        setPdfSource(null);
        setPhase('idle');
        showToast('Text extracted successfully!', 'success');
        onToolComplete();
    };

    const copyToClipboard = async () => {
        if (!extractedText) return;
        await Clipboard.setStringAsync(extractedText);
        showToast('Copied to clipboard', 'success');
    };

    const clear = () => {
        setExtractedText('');
        setFileName('');
        setPageCount(0);
        setPdfSource(null);
        setPhase('idle');
        processingRef.current = false;
        collectedTextRef.current = [];
        setViewReady(false);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>

            {/* 1. File Upload Section */}
            {!extractedText && phase === 'idle' && (
                <TouchableOpacity
                    onPress={pickDocument}
                    style={[styles.addCard, { backgroundColor: cardColor, borderColor: primaryColor }]}
                >
                    <MaterialIcons name="upload-file" size={48} color={primaryColor} />
                    <Text style={[styles.addText, { color: textColor }]}>Select PDF File</Text>
                    <Text style={[styles.addDesc, { color: textSecondaryColor }]}>
                        Tap to choose a PDF document to analyze
                    </Text>
                </TouchableOpacity>
            )}

            {/* 2. Processing UI */}
            {(phase === 'counting' || phase === 'processing') && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.processingHeader}>
                        <ActivityIndicator size="large" color={primaryColor} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.processingTitle, { color: textColor }]}>Processing PDF...</Text>
                            <Text style={{ color: textSecondaryColor }}>{progress}</Text>
                        </View>
                    </View>
                    {phase === 'processing' && (
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        backgroundColor: primaryColor,
                                        width: `${(displayPage / (pageCount || 1)) * 100}%`
                                    }
                                ]}
                            />
                        </View>
                    )}
                </View>
            )}

            {/* Hidden PDF for Counting */}
            {phase === 'counting' && pdfSource && (
                <View style={styles.hiddenView}>
                    <Pdf
                        source={pdfSource}
                        style={styles.hiddenPdf}
                        onLoadComplete={handleCountComplete}
                        onError={(error) => {
                            console.error('PDF Error:', error);
                            showToast('Failed to load PDF', 'error');
                            setIsLoading(false);
                            setPhase('idle');
                        }}
                    />
                </View>
            )}

            {/* Visible PDF for Capture - Offscreen but rendered */}
            {phase === 'processing' && pdfSource && (
                <View
                    style={[styles.captureContainer, { backgroundColor: 'white' }]}
                    ref={pdfRef}
                    collapsable={false}
                    onLayout={() => setViewReady(true)}
                >
                    <Pdf
                        key={`pdf-page-${displayPage}`}
                        source={pdfSource}
                        page={displayPage}
                        singlePage
                        style={styles.pdfCapture}
                        onLoadComplete={() => { /* Wait for timeout in process functionality */ }}
                    />
                </View>
            )}

            {/* 3. Results Section */}
            {extractedText ? (
                <View style={[styles.resultCard, { backgroundColor: cardColor }]}>
                    <View style={styles.resultHeader}>
                        <Text style={[styles.resultTitle, { color: textColor }]}>Extracted Text</Text>
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={copyToClipboard} style={[styles.iconBtn, { backgroundColor: primaryColor + '15' }]}>
                                <MaterialIcons name="content-copy" size={20} color={primaryColor} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={clear} style={[styles.iconBtn, { backgroundColor: '#ef444415' }]}>
                                <MaterialIcons name="close" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.textOutput} nestedScrollEnabled>
                        <Text style={[styles.text, { color: textColor }]} selectable>{extractedText}</Text>
                    </ScrollView>
                </View>
            ) : null}

            {/* Info Section */}
            {!isLoading && !extractedText && (
                <View style={[styles.infoCard, { backgroundColor: primaryColor + '10' }]}>
                    <MaterialIcons name="info-outline" size={20} color={primaryColor} />
                    <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                        This tool uses AI to read text from each page of your PDF, including scanned images. Large files may take a moment.
                    </Text>
                </View>
            )}

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
        padding: 40,
        alignItems: 'center',
        gap: 12,
        marginBottom: 20

    },
    addText: { fontSize: 18, fontWeight: 'bold' },
    addDesc: { fontSize: 14, textAlign: 'center' },

    card: { borderRadius: 16, padding: 20, marginBottom: 20 },
    processingHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    processingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },

    hiddenView: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
    hiddenPdf: { width: 1, height: 1 },

    // Important: Move capture container off-screen but keep it rendered
    captureContainer: {
        position: 'absolute',
        top: 3000,
        left: 0,
        width: 1000, // High res for better OCR
        height: 1400,
        opacity: 1 // Must be visible for captureRef
    },
    pdfCapture: { flex: 1, width: '100%', height: '100%' },

    resultCard: { flex: 1, borderRadius: 16, padding: 16, minHeight: 400 },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    resultTitle: { fontSize: 16, fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 8 },
    iconBtn: { padding: 8, borderRadius: 8 },
    textOutput: { flex: 1 },
    text: { fontSize: 15, lineHeight: 24, fontFamily: 'monospace' },

    infoCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 12, alignItems: 'flex-start' },
    infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
