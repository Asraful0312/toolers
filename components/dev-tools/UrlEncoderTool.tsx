import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function UrlEncoderTool() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const [encodeType, setEncodeType] = useState<'component' | 'full'>('component');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const encode = () => {
        try {
            const encoded = encodeType === 'component'
                ? encodeURIComponent(inputText)
                : encodeURI(inputText);
            setOutputText(encoded);
            showToast('Encoded successfully!', 'success');
        } catch (e: any) {
            showToast('Encoding failed: ' + e.message, 'error');
        }
    };

    const decode = () => {
        try {
            const decoded = encodeType === 'component'
                ? decodeURIComponent(inputText)
                : decodeURI(inputText);
            setOutputText(decoded);
            showToast('Decoded successfully!', 'success');
        } catch (e: any) {
            showToast('Invalid encoded string', 'error');
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

    const examples = [
        { input: 'Hello World!', encoded: 'Hello%20World!' },
        { input: 'key=value&foo=bar', encoded: 'key%3Dvalue%26foo%3Dbar' },
        { input: 'https://example.com?q=test', encoded: 'https%3A%2F%2Fexample.com%3Fq%3Dtest' },
    ];

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
                        <Text style={[styles.modeBtnText, { color: mode === m ? 'white' : textSecondaryColor }]}>
                            {m === 'encode' ? 'Encode' : 'Decode'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Encode Type */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Encoding Type</Text>
                <View style={styles.typeRow}>
                    {([
                        { id: 'component', label: 'Component', desc: 'Encodes all special chars' },
                        { id: 'full', label: 'URI', desc: 'Preserves URL structure' },
                    ] as const).map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            onPress={() => setEncodeType(type.id)}
                            style={[styles.typeBtn, encodeType === type.id && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                        >
                            <Text style={[styles.typeLabel, { color: encodeType === type.id ? 'white' : textColor }]}>{type.label}</Text>
                            <Text style={[styles.typeDesc, { color: encodeType === type.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>{type.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>
                    {mode === 'encode' ? 'Text to Encode' : 'URL-Encoded String'}
                </Text>
                <TextInput
                    style={[styles.textArea, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                    multiline
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={mode === 'encode' ? 'Enter text or URL...' : 'Enter encoded string...'}
                    placeholderTextColor={textSecondaryColor}
                    textAlignVertical="top"
                />
            </View>

            {/* Process Button */}
            <TouchableOpacity onPress={process} style={[styles.processBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name={mode === 'encode' ? 'arrow-downward' : 'arrow-upward'} size={22} color="white" />
                <Text style={styles.processBtnText}>{mode === 'encode' ? 'Encode' : 'Decode'}</Text>
            </TouchableOpacity>

            {/* Output */}
            {outputText.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Result</Text>
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

            {/* Examples */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Examples (tap to use)</Text>
                {examples.map((ex, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[styles.exampleRow, { backgroundColor: primaryColor + '10' }]}
                        onPress={() => {
                            setMode('encode');
                            setInputText(ex.input);
                        }}
                    >
                        <Text style={[styles.exampleInput, { color: textColor }]}>{ex.input}</Text>
                        <MaterialIcons name="arrow-forward" size={16} color={textSecondaryColor} />
                        <Text style={[styles.exampleOutput, { color: primaryColor }]} numberOfLines={1}>{ex.encoded}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    modeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    modeBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
    modeBtnText: { fontSize: 14, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' },
    typeLabel: { fontSize: 14, fontWeight: '600' },
    typeDesc: { fontSize: 11, marginTop: 4, textAlign: 'center' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, fontFamily: 'monospace' },
    processBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
    processBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    outputActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8 },
    outputBox: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 80 },
    outputText: { fontSize: 14, fontFamily: 'monospace', lineHeight: 20 },
    exampleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginTop: 8 },
    exampleInput: { fontSize: 12 },
    exampleOutput: { flex: 1, fontSize: 11, fontFamily: 'monospace' },
});
