import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, PermissionsAndroid, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImageToPdf from '../../modules/image-to-pdf';

export default function WebPageToPdfTool() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const isValidUrl = (str: string) => {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    };

    const handleConvert = async () => {
        Keyboard.dismiss();

        let targetUrl = url.trim();
        if (!targetUrl) {
            showToast('Please enter a URL', 'error');
            return;
        }

        // Add https if missing
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }

        if (!isValidUrl(targetUrl)) {
            showToast('Invalid URL format', 'error');
            return;
        }

        setIsLoading(true);
        setPdfUri(null);
        try {
            // Fetch webpage content
            const response = await fetch(targetUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            const html = await response.text();

            // Generate PDF from HTML
            const { uri } = await Print.printToFileAsync({
                html: html,
                base64: false,
            });

            setPdfUri(uri);
            showToast('PDF created! Choose Save or Share.', 'success');
            onToolComplete();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to convert webpage', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!pdfUri) return;

        // Request permission for older Android versions
        if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version < 29) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Storage Permission Required',
                    message: 'App needs access to save the PDF to Downloads.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                showToast('Storage permission needed', 'error');
                return;
            }
        }

        setIsSaving(true);
        try {
            const fileName = `WebPage_${Date.now()}`;
            // Convert file:// URI to raw path for native module
            const filePath = pdfUri.startsWith('file://') ? pdfUri.replace('file://', '') : pdfUri;
            const result = await ImageToPdf.savePdfToDownloads(filePath, fileName);
            if (result.success) {
                showToast('Saved to Downloads!', 'success');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to save', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (!pdfUri) return;
        try {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(pdfUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share PDF',
                    UTI: 'com.adobe.pdf',
                });
            }
        } catch (error: any) {
            showToast('Failed to share', 'error');
        }
    };

    const handleReset = () => {
        setPdfUri(null);
        setUrl('');
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.content}>
                {/* URL Input Card */}
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Website URL</Text>
                    <Text style={[styles.hint, { color: textSecondaryColor }]}>
                        Enter the full URL of the webpage you want to convert
                    </Text>

                    <View style={[styles.inputContainer, { borderColor: textSecondaryColor + '40' }]}>
                        <MaterialIcons name="link" size={20} color={textSecondaryColor} />
                        <TextInput
                            style={[styles.input, { color: textColor }]}
                            placeholder="example.com or https://..."
                            placeholderTextColor={textSecondaryColor + '80'}
                            value={url}
                            onChangeText={setUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            returnKeyType="go"
                            onSubmitEditing={handleConvert}
                            editable={!pdfUri}
                        />
                        {url.length > 0 && !pdfUri && (
                            <TouchableOpacity onPress={() => setUrl('')}>
                                <MaterialIcons name="close" size={20} color={textSecondaryColor} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Convert or Result Actions */}
                {!pdfUri ? (
                    <TouchableOpacity
                        onPress={handleConvert}
                        disabled={isLoading}
                        style={[styles.convertBtn, { backgroundColor: "#ef4444", opacity: isLoading ? 0.7 : 1 }]}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <MaterialIcons name="picture-as-pdf" size={24} color="white" />
                        )}
                        <Text style={styles.convertBtnText}>
                            {isLoading ? 'Converting...' : 'Convert to PDF'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.resultActions}>
                        <TouchableOpacity onPress={handleReset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                            <MaterialIcons name="refresh" size={22} color={textColor} />
                            <Text style={[styles.actionText, { color: textColor }]}>New</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                            <MaterialIcons name="share" size={22} color={"#ef4444"} />
                            <Text style={[styles.actionText, { color: "#ef4444" }]}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving}
                            style={[styles.actionBtn, { backgroundColor: "#ef4444", opacity: isSaving ? 0.7 : 1 }]}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <MaterialIcons name="save-alt" size={22} color="white" />
                            )}
                            <Text style={[styles.actionText, { color: 'white' }]}>Save</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info */}
                <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                    <MaterialIcons name="info-outline" size={20} color={textSecondaryColor} />
                    <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                        The webpage will be fetched and converted to a PDF document.
                        Some complex pages may not render perfectly.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, gap: 20 },
    card: { padding: 20, borderRadius: 16 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    hint: { fontSize: 12, marginBottom: 16 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
    },
    convertBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 14,
    },
    convertBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    resultActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 12,
    },
    actionText: {
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
