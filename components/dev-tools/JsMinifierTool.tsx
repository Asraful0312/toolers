import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const minifyJs = (code: string): string => {
    let result = code;

    // Remove single-line comments (but not URLs like http://)
    result = result.replace(/(?<!:)\/\/.*$/gm, '');

    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove leading/trailing whitespace from lines
    result = result.replace(/^\s+|\s+$/gm, '');

    // Replace multiple spaces with single space
    result = result.replace(/\s{2,}/g, ' ');

    // Remove spaces around operators (be careful with regex and strings)
    result = result.replace(/\s*([+\-*/%=<>!&|,;:{}()[\]])\s*/g, '$1');

    // Add space after keywords that need it
    result = result.replace(/(return|var|let|const|if|else|for|while|function|new|typeof|instanceof)([^\s])/g, '$1 $2');

    // Remove newlines
    result = result.replace(/\n/g, '');

    // Fix specific patterns
    result = result.replace(/;\}/g, '}');
    result = result.replace(/\{;/g, '{');

    return result.trim();
};

const beautifyJs = (code: string, indentSize = 2): string => {
    const indent = ' '.repeat(indentSize);
    let result = '';
    let indentLevel = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const prevChar = code[i - 1] || '';

        // Handle strings
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
            result += char;
            continue;
        }

        if (inString) {
            result += char;
            continue;
        }

        // Handle braces
        if (char === '{') {
            result += ' {\n' + indent.repeat(++indentLevel);
        } else if (char === '}') {
            result = result.trimEnd();
            result += '\n' + indent.repeat(--indentLevel) + '}';
            if (code[i + 1] !== ';' && code[i + 1] !== ',' && code[i + 1] !== ')') {
                result += '\n' + indent.repeat(indentLevel);
            }
        } else if (char === ';') {
            result += ';\n' + indent.repeat(indentLevel);
        } else if (char === ',') {
            result += ', ';
        } else {
            result += char;
        }
    }

    // Clean up extra whitespace
    result = result.replace(/\n\s*\n/g, '\n');
    result = result.replace(/^\s+$/gm, '');

    return result.trim();
};

export default function JsMinifierTool() {
    const [inputCode, setInputCode] = useState('');
    const [outputCode, setOutputCode] = useState('');
    const [mode, setMode] = useState<'minify' | 'beautify'>('minify');
    const [indentSize, setIndentSize] = useState(2);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const process = () => {
        if (!inputCode.trim()) {
            showToast('Enter JavaScript code to process', 'error');
            return;
        }

        try {
            const result = mode === 'minify' ? minifyJs(inputCode) : beautifyJs(inputCode, indentSize);
            setOutputCode(result);

            if (mode === 'minify') {
                const savings = ((inputCode.length - result.length) / inputCode.length * 100).toFixed(1);
                showToast(`Minified! ${savings}% smaller`, 'success');
            } else {
                showToast('Beautified!', 'success');
            }
        } catch (e: any) {
            showToast('Processing failed', 'error');
        }
    };

    const copyOutput = async () => {
        if (!outputCode) return;
        await Clipboard.setStringAsync(outputCode);
        showToast('Copied!', 'success');
        onToolComplete();
    };

    const sampleCode = `function greeting(name) {
  // This is a comment
  const message = "Hello, " + name + "!";
  return message;
}

/* Multi-line comment
   for testing */
const result = greeting("World");`;

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Mode Toggle */}
            <View style={[styles.modeToggle, { backgroundColor: cardColor }]}>
                {(['minify', 'beautify'] as const).map((m) => (
                    <TouchableOpacity
                        key={m}
                        onPress={() => setMode(m)}
                        style={[styles.modeBtn, mode === m && { backgroundColor: primaryColor }]}
                    >
                        <MaterialIcons name={m === 'minify' ? 'compress' : 'format-indent-increase'} size={18} color={mode === m ? 'white' : textSecondaryColor} />
                        <Text style={[styles.modeBtnText, { color: mode === m ? 'white' : textSecondaryColor }]}>
                            {m === 'minify' ? 'Minify' : 'Beautify'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Indent Size (for beautify) */}
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
                    <Text style={[styles.label, { color: textColor }]}>JavaScript Code</Text>
                    <TouchableOpacity onPress={() => setInputCode(sampleCode)}>
                        <Text style={{ color: primaryColor, fontWeight: '600', fontSize: 13 }}>Sample</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={[styles.textArea, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                    multiline
                    value={inputCode}
                    onChangeText={setInputCode}
                    placeholder="function example() { ... }"
                    placeholderTextColor={textSecondaryColor}
                    textAlignVertical="top"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <Text style={[styles.charCount, { color: textSecondaryColor }]}>
                    {inputCode.length} characters
                </Text>
            </View>

            {/* Process Button */}
            <TouchableOpacity onPress={process} style={[styles.processBtn, { backgroundColor: '#f59e0b' }]}>
                <MaterialIcons name={mode === 'minify' ? 'compress' : 'format-indent-increase'} size={22} color="white" />
                <Text style={styles.processBtnText}>{mode === 'minify' ? 'Minify JavaScript' : 'Beautify JavaScript'}</Text>
            </TouchableOpacity>

            {/* Output */}
            {outputCode.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Output</Text>
                        <TouchableOpacity onPress={copyOutput}>
                            <MaterialIcons name="content-copy" size={20} color={primaryColor} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={[styles.outputBox, { backgroundColor }]} nestedScrollEnabled>
                        <Text style={[styles.outputText, { color: textColor }]} selectable>{outputCode}</Text>
                    </ScrollView>
                    <View style={styles.statsRow}>
                        <Text style={[styles.charCount, { color: textSecondaryColor }]}>
                            {outputCode.length} characters
                        </Text>
                        {mode === 'minify' && inputCode.length > 0 && (
                            <Text style={[styles.savings, { color: '#22c55e' }]}>
                                {((1 - outputCode.length / inputCode.length) * 100).toFixed(1)}% reduction
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    This is a basic minifier that removes comments and whitespace. For production use, consider tools like Terser or UglifyJS.
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
    indentRow: { flexDirection: 'row', gap: 10 },
    indentBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    indentText: { fontSize: 14, fontWeight: '600' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 12, minHeight: 160, fontFamily: 'monospace' },
    charCount: { fontSize: 12, marginTop: 8 },
    processBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
    processBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    outputBox: { borderRadius: 12, padding: 14, maxHeight: 400 },
    outputText: { fontSize: 11, fontFamily: 'monospace', lineHeight: 18 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    savings: { fontSize: 12, fontWeight: '600' },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
