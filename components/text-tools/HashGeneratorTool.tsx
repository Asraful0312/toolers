import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface HashResult {
    algorithm: string;
    hash: string;
}

export default function HashGeneratorTool() {
    const [inputText, setInputText] = useState('');
    const [hashes, setHashes] = useState<HashResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const algorithms: { id: Crypto.CryptoDigestAlgorithm; name: string; bits: number }[] = [
        { id: Crypto.CryptoDigestAlgorithm.MD5, name: 'MD5', bits: 128 },
        { id: Crypto.CryptoDigestAlgorithm.SHA1, name: 'SHA-1', bits: 160 },
        { id: Crypto.CryptoDigestAlgorithm.SHA256, name: 'SHA-256', bits: 256 },
        { id: Crypto.CryptoDigestAlgorithm.SHA384, name: 'SHA-384', bits: 384 },
        { id: Crypto.CryptoDigestAlgorithm.SHA512, name: 'SHA-512', bits: 512 },
    ];

    const generateHashes = async () => {
        if (!inputText.trim()) {
            showToast('Enter text to hash', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const results: HashResult[] = [];
            for (const algo of algorithms) {
                const hash = await Crypto.digestStringAsync(algo.id, inputText);
                results.push({ algorithm: algo.name, hash });
            }
            setHashes(results);
            showToast('Hashes generated!', 'success');
            onToolComplete();
        } catch (e: any) {
            showToast('Failed to generate hashes', 'error');
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const copyHash = async (hash: string, name: string) => {
        await Clipboard.setStringAsync(hash);
        showToast(`${name} hash copied!`, 'success');
    };

    const copyAll = async () => {
        const text = hashes.map((h) => `${h.algorithm}: ${h.hash}`).join('\n');
        await Clipboard.setStringAsync(text);
        showToast('All hashes copied!', 'success');
        onToolComplete();
    };

    const clear = () => {
        setInputText('');
        setHashes([]);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.inputHeader}>
                    <Text style={[styles.label, { color: textColor }]}>Input Text</Text>
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
                    placeholder="Enter text to hash..."
                    placeholderTextColor={textSecondaryColor}
                    textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: textSecondaryColor }]}>
                    {inputText.length} characters
                </Text>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
                onPress={generateHashes}
                disabled={isProcessing}
                style={[styles.generateBtn, { backgroundColor: primaryColor, opacity: isProcessing ? 0.7 : 1 }]}
            >
                {isProcessing ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <MaterialIcons name="enhanced-encryption" size={22} color="white" />
                )}
                <Text style={styles.generateBtnText}>
                    {isProcessing ? 'Generating...' : 'Generate All Hashes'}
                </Text>
            </TouchableOpacity>

            {/* Results */}
            {hashes.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.resultsHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Hash Results</Text>
                        <TouchableOpacity onPress={copyAll} style={[styles.copyAllBtn, { backgroundColor: primaryColor + '15' }]}>
                            <MaterialIcons name="content-copy" size={16} color={primaryColor} />
                            <Text style={{ color: primaryColor, fontWeight: '600', fontSize: 13 }}>Copy All</Text>
                        </TouchableOpacity>
                    </View>

                    {hashes.map((result, index) => {
                        const algo = algorithms.find((a) => a.name === result.algorithm);
                        return (
                            <View key={result.algorithm} style={[styles.hashItem, index > 0 && styles.hashItemBorder]}>
                                <View style={styles.hashHeader}>
                                    <View style={styles.hashTitleRow}>
                                        <Text style={[styles.hashName, { color: textColor }]}>{result.algorithm}</Text>
                                        <Text style={[styles.hashBits, { color: textSecondaryColor }]}>{algo?.bits} bits</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => copyHash(result.hash, result.algorithm)}>
                                        <MaterialIcons name="content-copy" size={18} color={primaryColor} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.hashValue, { color: textSecondaryColor }]} selectable numberOfLines={2}>
                                    {result.hash}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Algorithm Info */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>About Hash Algorithms</Text>
                {algorithms.map((algo) => (
                    <View key={algo.id} style={styles.algoInfo}>
                        <View style={[styles.algoBadge, { backgroundColor: primaryColor + '20' }]}>
                            <Text style={[styles.algoBadgeText, { color: primaryColor }]}>{algo.bits}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.algoName, { color: textColor }]}>{algo.name}</Text>
                            <Text style={[styles.algoDesc, { color: textSecondaryColor }]}>
                                {algo.name === 'MD5' && 'Fast but not collision-resistant'}
                                {algo.name === 'SHA-1' && 'Deprecated for security use'}
                                {algo.name === 'SHA-256' && 'Secure, widely used in bitcoin'}
                                {algo.name === 'SHA-384' && 'Higher security variant'}
                                {algo.name === 'SHA-512' && 'Maximum security, longer output'}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 100 },
    charCount: { fontSize: 12, marginTop: 8, textAlign: 'right' },
    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
    generateBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    copyAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    hashItem: { paddingVertical: 12 },
    hashItemBorder: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    hashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    hashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hashName: { fontSize: 14, fontWeight: '600' },
    hashBits: { fontSize: 11 },
    hashValue: { fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
    algoInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
    algoBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    algoBadgeText: { fontSize: 11, fontWeight: 'bold' },
    algoName: { fontSize: 14, fontWeight: '600' },
    algoDesc: { fontSize: 12, marginTop: 2 },
});
