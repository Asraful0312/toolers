import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Base64Tool() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const encode = () => {
        try {
            const encoded = btoa(unescape(encodeURIComponent(inputText)));
            setOutputText(encoded);
            showToast('Encoded successfully!', 'success');
        } catch (e: any) {
            showToast('Encoding failed: ' + e.message, 'error');
        }
    };

    const decode = () => {
        try {
            const decoded = decodeURIComponent(escape(atob(inputText)));
            setOutputText(decoded);
            showToast('Decoded successfully!', 'success');
        } catch (e: any) {
            showToast('Invalid Base64 string', 'error');
        }
    };

    const process = () => {
        if (!inputText.trim()) {
            showToast('Enter text to process', 'error');
            return;
        }
        mode === 'encode' ? encode() : decode();
    };

    const copyOutput = async () => {
        if (!outputText) return;
        await Clipboard.setStringAsync(outputText);
        showToast('Copied!', 'success');
        onToolComplete();
    };

    const swapTexts = () => {
        setInputText(outputText);
        setOutputText('');
        setMode(mode === 'encode' ? 'decode' : 'encode');
    };

    const clear = () => {
        setInputText('');
        setOutputText('');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Mode Toggle */}
            <View style={[styles.modeToggle, { backgroundColor: cardColor }]}>
                {(['encode', 'decode'] as const).map((m) => (
                    <TouchableOpacity
                        key={m}
                        onPress={() => setMode(m)}
                        style={[styles.modeBtn, mode === m && { backgroundColor: primaryColor }]}
                    >
                        <MaterialIcons name={m === 'encode' ? 'lock' : 'lock-open'} size={18} color={mode === m ? 'white' : textSecondaryColor} />
                        <Text style={[styles.modeBtnText, { color: mode === m ? 'white' : textSecondaryColor }]}>
                            {m === 'encode' ? 'Encode' : 'Decode'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.label, { color: textColor }]}>
                        {mode === 'encode' ? 'Plain Text' : 'Base64 String'}
                    </Text>
                    {inputText.length > 0 && (
                        <TouchableOpacity onPress={clear}>
                            <Text style={{ color: primaryColor, fontWeight: '600' }}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TextInput
                    style={[styles.textArea, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                    multiline
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 string to decode...'}
                    placeholderTextColor={textSecondaryColor}
                    textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: textSecondaryColor }]}>
                    {inputText.length} characters
                </Text>
            </View>

            {/* Process Button */}
            <TouchableOpacity onPress={process} style={[styles.processBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name={mode === 'encode' ? 'arrow-downward' : 'arrow-upward'} size={22} color="white" />
                <Text style={styles.processBtnText}>{mode === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}</Text>
            </TouchableOpacity>

            {/* Output */}
            {outputText.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.label, { color: textColor }]}>
                            {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
                        </Text>
                        <View style={styles.outputActions}>
                            <TouchableOpacity onPress={swapTexts} style={styles.actionBtn}>
                                <MaterialIcons name="swap-vert" size={20} color={primaryColor} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={copyOutput} style={styles.actionBtn}>
                                <MaterialIcons name="content-copy" size={20} color={primaryColor} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={[styles.outputBox, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                        <Text style={[styles.outputText, { color: textColor }]} selectable>{outputText}</Text>
                    </View>
                    <Text style={[styles.charCount, { color: textSecondaryColor }]}>
                        {outputText.length} characters
                    </Text>
                </View>
            )}

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    Base64 encoding represents binary data in ASCII text format. It's commonly used for embedding data in HTML, CSS, JSON, and email attachments.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    modeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8 },
    modeBtnText: { fontSize: 14, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120, fontFamily: 'monospace' },
    charCount: { fontSize: 12, marginTop: 8, textAlign: 'right' },
    processBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
    processBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    outputActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8 },
    outputBox: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 80 },
    outputText: { fontSize: 14, fontFamily: 'monospace', lineHeight: 20 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
