import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Simple encryption using XOR cipher (for demonstration - not secure for real use)
const xorCipher = (text: string, key: string): string => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
};

// Base64 encode/decode
const base64Encode = (str: string): string => {
    try {
        // Convert to UTF-8 bytes then base64
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        return btoa(binary);
    } catch {
        return btoa(str);
    }
};

const base64Decode = (str: string): string => {
    try {
        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch {
        return atob(str);
    }
};

// Caesar cipher
const caesarCipher = (text: string, shift: number, decrypt = false): string => {
    const actualShift = decrypt ? 26 - (shift % 26) : shift % 26;
    return text.replace(/[a-zA-Z]/g, (char) => {
        const base = char.charCodeAt(0) < 91 ? 65 : 97;
        return String.fromCharCode(((char.charCodeAt(0) - base + actualShift) % 26) + base);
    });
};

export default function TextEncryptionTool() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [key, setKey] = useState('secret');
    const [method, setMethod] = useState<'xor' | 'base64' | 'caesar' | 'rot13'>('base64');
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const methods = [
        { id: 'base64', name: 'Base64', desc: 'Standard encoding' },
        { id: 'caesar', name: 'Caesar', desc: 'Shift cipher' },
        { id: 'rot13', name: 'ROT13', desc: 'Letter rotation' },
        { id: 'xor', name: 'XOR', desc: 'Key-based' },
    ];

    const process = () => {
        if (!inputText.trim()) {
            showToast('Enter text to process', 'error');
            return;
        }

        try {
            let result = '';
            const isEncrypt = mode === 'encrypt';

            switch (method) {
                case 'base64':
                    result = isEncrypt ? base64Encode(inputText) : base64Decode(inputText);
                    break;
                case 'caesar':
                    const shift = parseInt(key) || 3;
                    result = caesarCipher(inputText, shift, !isEncrypt);
                    break;
                case 'rot13':
                    result = caesarCipher(inputText, 13); // ROT13 is its own inverse
                    break;
                case 'xor':
                    if (!key.trim()) {
                        showToast('Enter a key for XOR', 'error');
                        return;
                    }
                    const encrypted = xorCipher(inputText, key);
                    result = isEncrypt ? base64Encode(encrypted) : xorCipher(base64Decode(inputText), key);
                    break;
            }

            setOutputText(result);
            showToast(`${isEncrypt ? 'Encrypted' : 'Decrypted'} successfully!`, 'success');
            onToolComplete();
        } catch (e: any) {
            showToast('Processing failed: ' + e.message, 'error');
        }
    };

    const copyOutput = async () => {
        if (!outputText) return;
        await Clipboard.setStringAsync(outputText);
        showToast('Copied to clipboard!', 'success');
        onToolComplete();
    };

    const swapTexts = () => {
        setInputText(outputText);
        setOutputText('');
        setMode(mode === 'encrypt' ? 'decrypt' : 'encrypt');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Method Selection */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Encryption Method</Text>
                <View style={styles.methodGrid}>
                    {methods.map((m) => (
                        <TouchableOpacity
                            key={m.id}
                            onPress={() => setMethod(m.id as any)}
                            style={[styles.methodBtn, method === m.id && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                        >
                            <Text style={[styles.methodName, { color: method === m.id ? 'white' : textColor }]}>{m.name}</Text>
                            <Text style={[styles.methodDesc, { color: method === m.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>{m.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Key Input (for XOR and Caesar) */}
            {(method === 'xor' || method === 'caesar') && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>
                        {method === 'caesar' ? 'Shift Amount (1-25)' : 'Encryption Key'}
                    </Text>
                    <TextInput
                        style={[styles.keyInput, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                        value={key}
                        onChangeText={setKey}
                        placeholder={method === 'caesar' ? '3' : 'Enter secret key...'}
                        placeholderTextColor={textSecondaryColor}
                        keyboardType={method === 'caesar' ? 'number-pad' : 'default'}
                    />
                </View>
            )}

            {/* Mode Toggle */}
            <View style={[styles.modeToggle, { backgroundColor: cardColor }]}>
                {(['encrypt', 'decrypt'] as const).map((m) => (
                    <TouchableOpacity
                        key={m}
                        onPress={() => setMode(m)}
                        style={[styles.modeBtn, mode === m && { backgroundColor: primaryColor }]}
                    >
                        <MaterialIcons name={m === 'encrypt' ? 'lock' : 'lock-open'} size={18} color={mode === m ? 'white' : textSecondaryColor} />
                        <Text style={[styles.modeBtnText, { color: mode === m ? 'white' : textSecondaryColor }]}>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Input Text</Text>
                <TextInput
                    style={[styles.textArea, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                    multiline
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Enter text to process..."
                    placeholderTextColor={textSecondaryColor}
                    textAlignVertical="top"
                />
            </View>

            {/* Process Button */}
            <TouchableOpacity onPress={process} style={[styles.processBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name={mode === 'encrypt' ? 'lock' : 'lock-open'} size={22} color="white" />
                <Text style={styles.processBtnText}>{mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}</Text>
            </TouchableOpacity>

            {/* Output */}
            {outputText.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.outputHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Output</Text>
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
                </View>
            )}

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    Note: These are basic encoding methods for educational purposes. For secure encryption, use industry-standard libraries.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    methodBtn: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    methodName: { fontSize: 14, fontWeight: '600' },
    methodDesc: { fontSize: 11, marginTop: 2 },
    keyInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
    modeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8 },
    modeBtnText: { fontSize: 14, fontWeight: '600' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 100 },
    processBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
    processBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    outputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    outputActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8 },
    outputBox: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 80 },
    outputText: { fontSize: 14, fontFamily: 'monospace', lineHeight: 20 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
