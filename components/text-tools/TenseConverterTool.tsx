import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import nlp from 'compromise';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TOOL_COLOR = '#8b5cf6';

type TenseType = 'past' | 'present' | 'future';

export default function TenseConverterTool() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [selectedTense, setSelectedTense] = useState<TenseType | null>(null);

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    const convertTense = (tense: TenseType) => {
        if (!inputText.trim()) {
            showToast('Please enter some text first', 'error');
            return;
        }

        try {
            const doc = nlp(inputText);

            switch (tense) {
                case 'past':
                    doc.sentences().toPastTense();
                    break;
                case 'present':
                    doc.sentences().toPresentTense();
                    break;
                case 'future':
                    doc.sentences().toFutureTense();
                    break;
            }

            setOutputText(doc.text());
            setSelectedTense(tense);
            showToast(`Converted to ${tense} tense!`, 'success');
            onToolComplete();
        } catch (error) {
            console.error('Conversion error:', error);
            showToast('Failed to convert text', 'error');
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
        setSelectedTense(null);
    };

    const handleClear = () => {
        setInputText('');
        setOutputText('');
        setSelectedTense(null);
    };

    const handleSwap = () => {
        if (outputText) {
            setInputText(outputText);
            setOutputText('');
            setSelectedTense(null);
        }
    };

    const tenseButtons: { id: TenseType; label: string; icon: keyof typeof MaterialIcons.glyphMap; example: string }[] = [
        { id: 'past', label: 'Past Tense', icon: 'history', example: '"I walked"' },
        { id: 'present', label: 'Present Tense', icon: 'today', example: '"I walk"' },
        { id: 'future', label: 'Future Tense', icon: 'update', example: '"I will walk"' },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: TOOL_COLOR + '15' }]}>
                <MaterialIcons name="swap-vert" size={32} color={TOOL_COLOR} />
                <Text style={[styles.headerTitle, { color: TOOL_COLOR }]}>Tense Converter</Text>
                <Text style={[styles.headerDesc, { color: textSecondaryColor }]}>
                    Change sentences between past, present & future tense
                </Text>
            </View>

            {/* Input */}
            <View style={[styles.inputCard, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textSecondaryColor }]}>Input Text</Text>
                <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Enter a sentence like 'I walk to the store'"
                    placeholderTextColor={textSecondaryColor}
                    multiline
                    value={inputText}
                    onChangeText={(t) => {
                        setInputText(t);
                        setOutputText('');
                        setSelectedTense(null);
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

            {/* Tense Buttons */}
            <View style={styles.tenseContainer}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Convert To:</Text>
                <View style={styles.tenseButtons}>
                    {tenseButtons.map((btn) => (
                        <TouchableOpacity
                            key={btn.id}
                            style={[
                                styles.tenseBtn,
                                { backgroundColor: cardColor, borderColor },
                                selectedTense === btn.id && { backgroundColor: TOOL_COLOR, borderColor: TOOL_COLOR }
                            ]}
                            onPress={() => convertTense(btn.id)}
                        >
                            <MaterialIcons
                                name={btn.icon}
                                size={24}
                                color={selectedTense === btn.id ? 'white' : TOOL_COLOR}
                            />
                            <Text style={[
                                styles.tenseBtnLabel,
                                { color: selectedTense === btn.id ? 'white' : textColor }
                            ]}>
                                {btn.label}
                            </Text>
                            <Text style={[
                                styles.tenseBtnExample,
                                { color: selectedTense === btn.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }
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
                        <View style={styles.outputActions}>
                            <TouchableOpacity style={styles.iconBtn} onPress={handleSwap}>
                                <MaterialIcons name="swap-vert" size={20} color={TOOL_COLOR} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={handleCopy}>
                                <MaterialIcons name="content-copy" size={20} color={TOOL_COLOR} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={[styles.outputText, { color: textColor }]}>{outputText}</Text>
                </View>
            ) : null}

            {/* Examples */}
            <View style={styles.examplesContainer}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Try These Examples:</Text>
                {[
                    'I am eating breakfast.',
                    'She walks to school every day.',
                    'They played soccer yesterday.',
                ].map((example, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.exampleBtn, { backgroundColor: cardColor, borderColor }]}
                        onPress={() => {
                            setInputText(example);
                            setOutputText('');
                            setSelectedTense(null);
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
    tenseContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    tenseButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    tenseBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    tenseBtnLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
    },
    tenseBtnExample: {
        fontSize: 11,
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
    outputActions: {
        flexDirection: 'row',
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
