import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BarcodeScannerTool() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [scannedType, setScannedType] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [history, setHistory] = useState<{ data: string; type: string }[]>([]);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#6366f1';

    const handleBarCodeScanned = (result: BarcodeScanningResult) => {
        if (!isScanning) return;

        setScannedData(result.data);
        setScannedType(result.type);
        setIsScanning(false);

        // Add to history if not duplicate
        if (!history.find(h => h.data === result.data)) {
            setHistory(prev => [{ data: result.data, type: result.type }, ...prev].slice(0, 10));
        }

        showToast('Barcode scanned!', 'success');
        onToolComplete();
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };

    const openLink = async () => {
        if (!scannedData) return;

        try {
            // Check if it's a URL
            if (scannedData.startsWith('http://') || scannedData.startsWith('https://')) {
                await Linking.openURL(scannedData);
            } else {
                // Try to open as URL anyway
                await Linking.openURL(`https://${scannedData}`);
            }
        } catch (error) {
            showToast('Cannot open this content', 'error');
        }
    };

    const scanAgain = () => {
        setScannedData(null);
        setScannedType(null);
        setIsScanning(true);
    };

    const clearHistory = () => {
        setHistory([]);
        showToast('History cleared', 'success');
    };

    const getBarcodeTypeName = (type: string): string => {
        const typeMap: Record<string, string> = {
            'qr': 'QR Code',
            'ean13': 'EAN-13',
            'ean8': 'EAN-8',
            'upc_a': 'UPC-A',
            'upc_e': 'UPC-E',
            'code39': 'Code 39',
            'code93': 'Code 93',
            'code128': 'Code 128',
            'codabar': 'Codabar',
            'itf': 'ITF',
            'pdf417': 'PDF417',
            'aztec': 'Aztec',
            'datamatrix': 'Data Matrix',
        };
        return typeMap[type.toLowerCase()] || type;
    };

    // Permission handling
    if (!permission) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor }]}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor }]}>
                <MaterialIcons name="camera-alt" size={64} color={textSecondaryColor} style={{ opacity: 0.5 }} />
                <Text style={[styles.permissionText, { color: textColor }]}>
                    Camera permission is required to scan barcodes
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    style={[styles.permissionBtn, { backgroundColor: primaryColor }]}
                >
                    <Text style={styles.permissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Camera View */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr', 'ean13', 'ean8', 'code39', 'code128', 'pdf417', 'aztec', 'datamatrix'],
                    }}
                    onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                />

                {/* Scan Overlay */}
                <View style={styles.overlay}>
                    <View style={styles.scanFrame}>
                        {isScanning && (
                            <Text style={styles.scanText}>Point camera at barcode</Text>
                        )}
                    </View>
                </View>

                {!isScanning && (
                    <TouchableOpacity style={styles.scanAgainOverlay} onPress={scanAgain}>
                        <MaterialIcons name="refresh" size={32} color="white" />
                        <Text style={styles.scanAgainText}>Tap to scan again</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Result Section */}
            <View style={[styles.resultSection, { backgroundColor: cardColor }]}>
                {scannedData ? (
                    <View style={styles.resultContent}>
                        <View style={styles.resultHeader}>
                            <View style={[styles.typeBadge, { backgroundColor: primaryColor }]}>
                                <Text style={styles.typeBadgeText}>{getBarcodeTypeName(scannedType || '')}</Text>
                            </View>
                        </View>

                        <Text style={[styles.scannedData, { color: textColor }]} selectable numberOfLines={3}>
                            {scannedData}
                        </Text>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor }]}
                                onPress={() => copyToClipboard(scannedData)}
                            >
                                <MaterialIcons name="content-copy" size={20} color={textColor} />
                                <Text style={[styles.actionBtnText, { color: textColor }]}>Copy</Text>
                            </TouchableOpacity>

                            {(scannedData.includes('http') || scannedData.includes('.')) && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: primaryColor }]}
                                    onPress={openLink}
                                >
                                    <MaterialIcons name="open-in-new" size={20} color="white" />
                                    <Text style={[styles.actionBtnText, { color: 'white' }]}>Open</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyResult}>
                        <MaterialIcons name="qr-code-scanner" size={32} color={textSecondaryColor} />
                        <Text style={{ color: textSecondaryColor }}>No barcode scanned yet</Text>
                    </View>
                )}
            </View>

            {/* History */}
            {history.length > 0 && (
                <View style={[styles.historySection, { backgroundColor }]}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.historyTitle, { color: textColor }]}>Recent Scans</Text>
                        <TouchableOpacity onPress={clearHistory}>
                            <Text style={{ color: primaryColor, fontSize: 13 }}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {history.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.historyItem, { backgroundColor: cardColor }]}
                                onPress={() => copyToClipboard(item.data)}
                            >
                                <Text style={[styles.historyType, { color: primaryColor }]}>
                                    {getBarcodeTypeName(item.type)}
                                </Text>
                                <Text style={[styles.historyData, { color: textColor }]} numberOfLines={1}>
                                    {item.data.length > 25 ? item.data.substring(0, 25) + '...' : item.data}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 20 },
    permissionText: { fontSize: 16, textAlign: 'center', marginTop: 16 },
    permissionBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
    permissionBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
    cameraContainer: { flex: 1, maxHeight: 350, position: 'relative' },
    camera: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.8)',
        borderRadius: 16,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 20,
    },
    scanText: { color: 'white', fontSize: 14, textShadowColor: 'black', textShadowRadius: 4 },
    scanAgainOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    scanAgainText: { color: 'white', fontSize: 16 },
    resultSection: { padding: 16, minHeight: 120 },
    resultContent: { gap: 12 },
    resultHeader: { flexDirection: 'row' },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    typeBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
    scannedData: { fontSize: 16, lineHeight: 22 },
    actionButtons: { flexDirection: 'row', gap: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    actionBtnText: { fontWeight: '500' },
    emptyResult: { alignItems: 'center', gap: 8, paddingVertical: 20 },
    historySection: { padding: 16, paddingTop: 8 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    historyTitle: { fontSize: 14, fontWeight: '600' },
    historyItem: { padding: 12, borderRadius: 10, marginRight: 10, minWidth: 150 },
    historyType: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
    historyData: { fontSize: 13 },
});
