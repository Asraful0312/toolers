import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import nlp from 'compromise';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TOOL_COLOR = '#f59e0b';

type FormatType = 'toDigits' | 'toText' | 'toOrdinal' | 'toLocale';

export default function NumberFormatterTool() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [selectedFormat, setSelectedFormat] = useState<FormatType | null>(null);

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    const formatNumbers = (format: FormatType) => {
        if (!inputText.trim()) {
            showToast('Please enter some text first', 'error');
            return;
        }

        try {
            const doc = nlp(inputText);

            switch (format) {
                case 'toDigits':
                    doc.numbers().toNumber();
                    break;
                case 'toText':
                    doc.numbers().toText();
                    break;
                case 'toOrdinal':
                    doc.numbers().toOrdinal();
                    break;
                case 'toLocale':
                    doc.numbers().toLocaleString();
                    break;
            }

            setOutputText(doc.text());
            setSelectedFormat(format);
            showToast('Numbers formatted!', 'success');
            onToolComplete();
        } catch (error) {
            console.error('Format error:', error);
            showToast('Failed to format numbers', 'error');
        }
    };

    const handleCopy = async () => {
        if (!outputText) return;
        await Clipboard.setStringAsync(outputText);
        showToast('Copied to clipboard!', 'success');
    };

    const handlePaste = async () => {
        const content = await Clipboard.getStringAsync();
        setInputText(content);
        setOutputText('');
        setSelectedFormat(null);
    };

    const handleClear = () => {
        setInputText('');
        setOutputText('');
        setSelectedFormat(null);
    };

    const formatButtons: { id: FormatType; label: string; icon: keyof typeof MaterialIcons.glyphMap; example: string }[] = [
        { id: 'toDigits', label: 'To Digits', icon: 'pin', example: '"five" → "5"' },
        { id: 'toText', label: 'To Words', icon: 'text-fields', example: '"5" → "five"' },
        { id: 'toOrdinal', label: 'To Ordinal', icon: 'format-list-numbered', example: '"5" → "5th"' },
        { id: 'toLocale', label: 'Add Commas', icon: 'more-horiz', example: '"1000" → "1,000"' },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: TOOL_COLOR + '15' }]}>
                <MaterialIcons name="pin" size={32} color={TOOL_COLOR} />
                <Text style={[styles.headerTitle, { color: TOOL_COLOR }]}>Number Formatter</Text>
                <Text style={[styles.headerDesc, { color: textSecondaryColor }]}>
                    Convert numbers between digits, words, ordinals & formats
                </Text>
            </View>

            {/* Input */}
            <View style={[styles.inputCard, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textSecondaryColor }]}>Input Text</Text>
                <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Enter text with numbers like 'I have five apples and 10 oranges'"
                    placeholderTextColor={textSecondaryColor}
                    multiline
                    value={inputText}
                    onChangeText={(t) => {
                        setInputText(t);
                        setOutputText('');
                        setSelectedFormat(null);
                    }}
                    textAlignVertical="top"
                />
                <View style={[styles.inputActions, { borderTopColor: borderColor }]}>
                    <TouchableOpacity style={styles.iconBtn} onPress={handlePaste}>
                        <MaterialIcons name="content-paste" size={20} color={TOOL_COLOR} />
                    </TouchableOpacity>
                    {inputText.length > 0 && (
                        <TouchableOpacity style={styles.iconBtn} onPress={handleClear}>
                            <MaterialIcons name="close" size={20} color={textSecondaryColor} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Format Buttons */}
            <View style={styles.formatContainer}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Convert To:</Text>
                <View style={styles.formatGrid}>
                    {formatButtons.map((btn) => (
                        <TouchableOpacity
                            key={btn.id}
                            style={[
                                styles.formatBtn,
                                { backgroundColor: cardColor, borderColor },
                                selectedFormat === btn.id && { backgroundColor: TOOL_COLOR, borderColor: TOOL_COLOR }
                            ]}
                            onPress={() => formatNumbers(btn.id)}
                        >
                            <MaterialIcons
                                name={btn.icon}
                                size={24}
                                color={selectedFormat === btn.id ? 'white' : TOOL_COLOR}
                            />
                            <Text style={[
                                styles.formatBtnLabel,
                                { color: selectedFormat === btn.id ? 'white' : textColor }
                            ]}>
                                {btn.label}
                            </Text>
                            <Text style={[
                                styles.formatBtnExample,
                                { color: selectedFormat === btn.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }
                            ]}>
                                {btn.example}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Output */}
            {outputText ? (
                <View style={[styles.outputCard, { backgroundColor: cardColor }]}>
                    <View style={styles.outputHeader}>
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Result</Text>
                        <TouchableOpacity style={styles.iconBtn} onPress={handleCopy}>
                            <MaterialIcons name="content-copy" size={20} color={TOOL_COLOR} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.outputText, { color: textColor }]}>{outputText}</Text>
                </View>
            ) : null}

            {/* Examples */}
            <View style={styles.examplesContainer}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Try These Examples:</Text>
                {[
                    'I have five cats and three dogs.',
                    'The price is 1500 dollars.',
                    'She finished in 3 place.',
                ].map((example, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.exampleBtn, { backgroundColor: cardColor, borderColor }]}
                        onPress={() => {
                            setInputText(example);
                            setOutputText('');
                            setSelectedFormat(null);
                        }}
                    >
                        <Text style={[styles.exampleText, { color: textColor }]}>{example}</Text>
                        <MaterialIcons name="arrow-forward" size={16} color={textSecondaryColor} />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    headerDesc: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    inputCard: {
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
        minHeight: 80,
    },
    inputActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        paddingTop: 8,
        marginTop: 8,
        gap: 8,
    },
    iconBtn: {
        padding: 8,
    },
    formatContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    formatGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    formatBtn: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    formatBtnLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    formatBtnExample: {
        fontSize: 12,
        marginTop: 4,
    },
    outputCard: {
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    outputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    outputText: {
        fontSize: 16,
        lineHeight: 24,
    },
    examplesContainer: {
        padding: 16,
    },
    exampleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    exampleText: {
        fontSize: 14,
        flex: 1,
    },
});
