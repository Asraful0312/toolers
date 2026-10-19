import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Mode = 'beautify' | 'minify';

const beautifyHtml = (html: string, indentSize = 2): string => {
    const indent = ' '.repeat(indentSize);
    let formatted = '';
    let indentLevel = 0;

    // Split by tags while keeping the tags
    const tokens = html.replace(/>\s+</g, '><').split(/(<[^>]+>)/g).filter(Boolean);

    for (const token of tokens) {
        const isSelfClosing = /<[^>]+\/\s*>/.test(token) || /^<(br|hr|img|input|meta|link|area|base|col|embed|param|source|track|wbr)[^>]*>$/i.test(token);
        const isClosingTag = /^<\//.test(token);
        const isOpeningTag = /^<[^\/!]/.test(token) && !isSelfClosing;

        if (isClosingTag) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        if (token.startsWith('<')) {
            formatted += '\n' + indent.repeat(indentLevel) + token;
        } else if (token.trim()) {
            formatted += token.trim();
        }

        if (isOpeningTag) {
            indentLevel++;
        }
    }

    return formatted.trim();
};

const minifyHtml = (html: string): string => {
    return html
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/\s+>/g, '>')
        .replace(/<\s+/g, '<')
        .trim();
};

export default function HtmlBeautifierTool() {
    const [inputHtml, setInputHtml] = useState('');
    const [outputHtml, setOutputHtml] = useState('');
    const [mode, setMode] = useState<Mode>('beautify');
    const [indentSize, setIndentSize] = useState(2);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const process = () => {
        if (!inputHtml.trim()) {
            showToast('Enter HTML to process', 'error');
            return;
        }

        try {
            const result = mode === 'beautify' ? beautifyHtml(inputHtml, indentSize) : minifyHtml(inputHtml);
            setOutputHtml(result);

            const savings = ((inputHtml.length - result.length) / inputHtml.length * 100).toFixed(1);
            showToast(`${mode === 'beautify' ? 'Beautified' : `Minified (${savings}% smaller)`}!`, 'success');
        } catch (e: any) {
            showToast('Processing failed', 'error');
        }
    };

    const copyOutput = async () => {
        if (!outputHtml) return;
        await Clipboard.setStringAsync(outputHtml);
        showToast('Copied!', 'success');
        onToolComplete();
    };

    const sampleHtml = '<div class="container"><header><h1>Hello World</h1><nav><a href="/">Home</a><a href="/about">About</a></nav></header><main><p>Welcome to my website!</p></main></div>';

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Mode Toggle */}
            <View style={[styles.modeToggle, { backgroundColor: cardColor }]}>
                {(['beautify', 'minify'] as const).map((m) => (
                    <TouchableOpacity
                        key={m}
                        onPress={() => setMode(m)}
                        style={[styles.modeBtn, mode === m && { backgroundColor: primaryColor }]}
                    >
                        <MaterialIcons name={m === 'beautify' ? 'format-indent-increase' : 'compress'} size={18} color={mode === m ? 'white' : textSecondaryColor} />
                        <Text style={[styles.modeBtnText, { color: mode === m ? 'white' : textSecondaryColor }]}>
                            {m === 'beautify' ? 'Beautify' : 'Minify'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Indent Size (for beautify mode) */}
            {mode === 'beautify' && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Indent Size</Text>
                    <View style={styles.indentRow}>
                        {[2, 4].map((size) => (
                            <TouchableOpacity
                                key={size}
                                onPress={() => setIndentSize(size)}
                                style={[styles.indentBtn, indentSize === size && { backgroundColor: primaryColor }]}
                            >
                                <Text style={[styles.indentText, { color: indentSize === size ? 'white' : textSecondaryColor }]}>
                                    {size} spaces
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.label, { color: textColor }]}>Input HTML</Text>
                    <TouchableOpacity onPress={() => setInputHtml(sampleHtml)}>
                        <Text style={{ color: primaryColor, fontWeight: '600', fontSize: 13 }}>Sample</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={[styles.textArea, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                    multiline
                    value={inputHtml}
                    onChangeText={setInputHtml}
                    placeholder="<div>Enter your HTML here...</div>"
                    placeholderTextColor={textSecondaryColor}
                    textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: textSecondaryColor }]}>
                    {inputHtml.length} characters
                </Text>
            </View>

            {/* Process Button */}
            <TouchableOpacity onPress={process} style={[styles.processBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name={mode === 'beautify' ? 'format-indent-increase' : 'compress'} size={22} color="white" />
                <Text style={styles.processBtnText}>{mode === 'beautify' ? 'Beautify HTML' : 'Minify HTML'}</Text>
            </TouchableOpacity>

            {/* Output */}
            {outputHtml.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Output</Text>
                        <TouchableOpacity onPress={copyOutput}>
                            <MaterialIcons name="content-copy" size={20} color={primaryColor} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.outputBox, { backgroundColor }]}>
                        <Text style={[styles.outputText, { color: textColor }]} selectable>{outputHtml}</Text>
                    </View>
                    <Text style={[styles.charCount, { color: textSecondaryColor }]}>
                        {outputHtml.length} characters
                        {mode === 'minify' && inputHtml.length > 0 && (
                            <Text> ({((1 - outputHtml.length / inputHtml.length) * 100).toFixed(1)}% reduction)</Text>
                        )}
                    </Text>
                </View>
            )}
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
    indentRow: { flexDirection: 'row', gap: 10 },
    indentBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    indentText: { fontSize: 14, fontWeight: '600' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 12, minHeight: 140, fontFamily: 'monospace' },
    charCount: { fontSize: 12, marginTop: 8, textAlign: 'right' },
    processBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
    processBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    outputBox: { borderRadius: 12, padding: 14, maxHeight: 300 },
    outputText: { fontSize: 11, fontFamily: 'monospace', lineHeight: 18 },
});
