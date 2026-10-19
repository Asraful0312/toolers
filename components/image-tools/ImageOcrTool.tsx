import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MlkitOcr from 'rn-mlkit-ocr';

export default function ImageOcrTool() {
    const [extractedText, setExtractedText] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#a855f7';

    const pickImage = async (useCamera: boolean) => {
        try {
            let result;

            if (useCamera) {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    showToast('Camera permission required', 'error');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    quality: 1,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 1,
                });
            }

            if (result.canceled) return;

            const uri = result.assets[0].uri;
            setImageUri(uri);
            setExtractedText('');
            await extractText(uri);
        } catch (err) {
            console.error(err);
            showToast('Failed to pick image', 'error');
        }
    };

    const extractText = async (uri: string) => {
        setIsLoading(true);
        try {
            const ocrResult = await MlkitOcr.recognizeText(uri);
            setExtractedText(ocrResult.text || 'No text found in image.');
            if (ocrResult.text) {
                showToast('Text extracted successfully!', 'success');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to extract text', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!extractedText) return;
        await Clipboard.setStringAsync(extractedText);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };

    const saveToFile = async () => {
        if (!extractedText) return;

        try {
            const name = `image_text_${Date.now()}.txt`;
            const fileUri = (FileSystem as any).cacheDirectory + name;
            await FileSystem.writeAsStringAsync(fileUri, extractedText);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, { mimeType: 'text/plain' });
                onToolComplete();
            } else {
                showToast('Saved: ' + fileUri, 'success');
                onToolComplete();
            }
        } catch (error) {
            showToast('Failed to save file', 'error');
        }
    };

    const clear = () => {
        setExtractedText('');
        setImageUri(null);
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Image Picker */}
            <View style={[styles.pickerCard, { backgroundColor: cardColor }]}>
                <TouchableOpacity
                    onPress={() => pickImage(false)}
                    disabled={isLoading}
                    style={[styles.pickBtn, { backgroundColor: primaryColor }]}
                >
                    <MaterialIcons name="photo-library" size={24} color="white" />
                    <Text style={styles.pickBtnText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => pickImage(true)}
                    disabled={isLoading}
                    style={[styles.pickBtn, { backgroundColor: primaryColor }]}
                >
                    <MaterialIcons name="camera-alt" size={24} color="white" />
                    <Text style={styles.pickBtnText}>Camera</Text>
                </TouchableOpacity>
            </View>

            {/* Preview & Loading */}
            {imageUri && (
                <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
                    <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={primaryColor} />
                            <Text style={{ color: textColor, marginTop: 8 }}>Extracting text...</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Content */}
            <View style={styles.content}>
                {extractedText && !isLoading ? (
                    <ScrollView style={styles.textContainer}>
                        <Text style={[styles.extractedText, { color: textColor }]} selectable>
                            {extractedText}
                        </Text>
                    </ScrollView>
                ) : !imageUri && !isLoading ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="image-search" size={64} color={textSecondaryColor} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: textSecondaryColor }]}>
                            Select an image to extract text
                        </Text>
                        <Text style={[styles.emptyHint, { color: textSecondaryColor }]}>
                            Supports photos, screenshots, documents
                        </Text>
                    </View>
                ) : null}
            </View>

            {/* Footer Actions */}
            {extractedText && !isLoading ? (
                <View style={[styles.footer, { backgroundColor: cardColor, borderTopColor: 'rgba(0,0,0,0.05)' }]}>
                    <TouchableOpacity onPress={clear} style={styles.actionBtn}>
                        <MaterialIcons name="delete-outline" size={24} color={textColor} />
                        <Text style={[styles.actionText, { color: textColor }]}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={copyToClipboard} style={styles.actionBtn}>
                        <MaterialIcons name="content-copy" size={24} color={textColor} />
                        <Text style={[styles.actionText, { color: textColor }]}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveToFile} style={styles.actionBtn}>
                        <MaterialIcons name="save-alt" size={24} color={primaryColor} />
                        <Text style={[styles.actionText, { color: primaryColor }]}>Save</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pickerCard: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        justifyContent: 'center'
    },
    pickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        flex: 1,
        justifyContent: 'center',
    },
    pickBtnText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15
    },
    previewCard: {
        margin: 16,
        marginTop: 0,
        borderRadius: 12,
        overflow: 'hidden',
        height: 200,
    },
    previewImage: {
        width: '100%',
        height: '100%'
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { flex: 1 },
    textContainer: { flex: 1, padding: 16 },
    extractedText: { fontSize: 15, lineHeight: 24 },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20
    },
    emptyText: { fontSize: 16, textAlign: 'center' },
    emptyHint: { fontSize: 13, opacity: 0.7 },
    footer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        justifyContent: 'space-around'
    },
    actionBtn: { alignItems: 'center', gap: 4, padding: 8, minWidth: 60 },
    actionText: { fontSize: 12, fontWeight: '500' },
});
