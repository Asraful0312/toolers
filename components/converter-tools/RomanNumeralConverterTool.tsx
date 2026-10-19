import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ROMAN_NUMERALS: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
];

const toRoman = (num: number): string => {
    if (num < 1 || num > 3999) return '';
    let result = '';
    for (const [value, symbol] of ROMAN_NUMERALS) {
        while (num >= value) {
            result += symbol;
            num -= value;
        }
    }
    return result;
};

const fromRoman = (roman: string): number => {
    const values: Record<string, number> = {
        I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
    };
    let result = 0;
    const s = roman.toUpperCase();
    for (let i = 0; i < s.length; i++) {
        const current = values[s[i]];
        const next = values[s[i + 1]];
        if (current === undefined) return -1;
        if (next && current < next) {
            result -= current;
        } else {
            result += current;
        }
    }
    return result;
};

const isValidRoman = (roman: string): boolean => {
    if (!roman) return false;
    const pattern = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i;
    return pattern.test(roman);
};

export default function RomanNumeralConverterTool() {
    const [mode, setMode] = useState<'toRoman' | 'fromRoman'>('toRoman');
    const [arabicInput, setArabicInput] = useState('2024');
    const [romanInput, setRomanInput] = useState('MMXXIV');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#f97316';

    const result = useMemo(() => {
        if (mode === 'toRoman') {
            const num = parseInt(arabicInput, 10);
            if (isNaN(num) || num < 1 || num > 3999) {
                return { valid: false, value: '', error: 'Enter a number between 1 and 3999' };
            }
            return { valid: true, value: toRoman(num), error: '' };
        } else {
            const input = romanInput.toUpperCase().trim();
            if (!input) {
                return { valid: false, value: '', error: 'Enter a Roman numeral' };
            }
            if (!isValidRoman(input)) {
                return { valid: false, value: '', error: 'Invalid Roman numeral format' };
            }
            const num = fromRoman(input);
            if (num < 1 || num > 3999) {
                return { valid: false, value: '', error: 'Invalid Roman numeral' };
            }
            return { valid: true, value: num.toString(), error: '' };
        }
    }, [mode, arabicInput, romanInput]);

    const copyResult = async () => {
        if (result.valid) {
            await Clipboard.setStringAsync(result.value);
            showToast('Copied!', 'success');
            onToolComplete();
        }
    };

    const commonNumbers = [1, 5, 10, 50, 100, 500, 1000, 2024, 1999];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Mode Toggle */}
            <View style={[styles.modeToggle, { backgroundColor: cardColor }]}>
                <TouchableOpacity
                    onPress={() => setMode('toRoman')}
                    style={[styles.modeBtn, mode === 'toRoman' && { backgroundColor: primaryColor }]}
                >
                    <Text style={[styles.modeBtnText, { color: mode === 'toRoman' ? 'white' : textSecondaryColor }]}>
                        123 → Roman
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setMode('fromRoman')}
                    style={[styles.modeBtn, mode === 'fromRoman' && { backgroundColor: primaryColor }]}
                >
                    <Text style={[styles.modeBtnText, { color: mode === 'fromRoman' ? 'white' : textSecondaryColor }]}>
                        Roman → 123
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>
                    {mode === 'toRoman' ? 'Enter Arabic Number (1-3999)' : 'Enter Roman Numeral'}
                </Text>
                <TextInput
                    style={[styles.input, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                    value={mode === 'toRoman' ? arabicInput : romanInput}
                    onChangeText={mode === 'toRoman' ? setArabicInput : setRomanInput}
                    placeholder={mode === 'toRoman' ? 'e.g., 2024' : 'e.g., MMXXIV'}
                    placeholderTextColor={textSecondaryColor}
                    keyboardType={mode === 'toRoman' ? 'number-pad' : 'default'}
                    autoCapitalize="characters"
                />
            </View>

            {/* Result */}
            <View style={[styles.resultCard, { backgroundColor: result.valid ? primaryColor : '#ef444420' }]}>
                {result.valid ? (
                    <>
                        <Text style={styles.resultLabel}>
                            {mode === 'toRoman' ? 'Roman Numeral' : 'Arabic Number'}
                        </Text>
                        <Text style={styles.resultValue}>{result.value}</Text>
                        <TouchableOpacity onPress={copyResult} style={styles.copyBtn}>
                            <MaterialIcons name="content-copy" size={20} color="white" />
                            <Text style={styles.copyBtnText}>Copy</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <MaterialIcons name="error-outline" size={32} color="#ef4444" />
                        <Text style={[styles.errorText, { color: '#ef4444' }]}>{result.error}</Text>
                    </>
                )}
            </View>

            {/* Quick Numbers */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Quick Convert</Text>
                <View style={styles.quickGrid}>
                    {commonNumbers.map((num) => (
                        <TouchableOpacity
                            key={num}
                            style={[styles.quickBtn, { backgroundColor: primaryColor + '10' }]}
                            onPress={() => {
                                setMode('toRoman');
                                setArabicInput(num.toString());
                            }}
                        >
                            <Text style={[styles.quickNum, { color: textColor }]}>{num}</Text>
                            <Text style={[styles.quickRoman, { color: primaryColor }]}>{toRoman(num)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Reference */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Roman Numeral Reference</Text>
                <View style={styles.refGrid}>
                    {([
                        ['I', 1], ['V', 5], ['X', 10], ['L', 50], ['C', 100], ['D', 500], ['M', 1000]
                    ] as [string, number][]).map(([roman, arabic]) => (
                        <View key={roman} style={[styles.refItem, { backgroundColor: primaryColor + '10' }]}>
                            <Text style={[styles.refRoman, { color: primaryColor }]}>{roman}</Text>
                            <Text style={[styles.refArabic, { color: textSecondaryColor }]}>{arabic}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Rules */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Rules</Text>
                <View style={styles.rules}>
                    {[
                        'Symbols are added when larger comes before smaller: VI = 6',
                        'Symbols are subtracted when smaller comes before larger: IV = 4',
                        'Only I, X, C can be subtracted (one at a time)',
                        'Maximum value: 3999 (MMMCMXCIX)',
                    ].map((rule, i) => (
                        <View key={i} style={styles.ruleRow}>
                            <View style={[styles.ruleBullet, { backgroundColor: primaryColor }]} />
                            <Text style={[styles.ruleText, { color: textSecondaryColor }]}>{rule}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    modeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    modeBtnText: { fontSize: 14, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    input: { fontSize: 24, fontWeight: 'bold', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, textAlign: 'center' },
    resultCard: { borderRadius: 20, padding: 28, alignItems: 'center' },
    resultLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    resultValue: { color: 'white', fontSize: 42, fontWeight: 'bold', marginTop: 8, letterSpacing: 2 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    copyBtnText: { color: 'white', fontWeight: '600' },
    errorText: { fontSize: 16, fontWeight: '500', marginTop: 8 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickBtn: { width: '31%', padding: 12, borderRadius: 10, alignItems: 'center' },
    quickNum: { fontSize: 16, fontWeight: 'bold' },
    quickRoman: { fontSize: 12, marginTop: 4, fontWeight: '600' },
    refGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    refItem: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    refRoman: { fontSize: 20, fontWeight: 'bold' },
    refArabic: { fontSize: 12, marginTop: 2 },
    rules: { gap: 10 },
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    ruleBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
    ruleText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
