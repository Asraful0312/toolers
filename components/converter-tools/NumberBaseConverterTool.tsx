import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Base = 'binary' | 'octal' | 'decimal' | 'hex';

const BASES: { id: Base; name: string; prefix: string; radix: number }[] = [
    { id: 'binary', name: 'Binary', prefix: '0b', radix: 2 },
    { id: 'octal', name: 'Octal', prefix: '0o', radix: 8 },
    { id: 'decimal', name: 'Decimal', prefix: '', radix: 10 },
    { id: 'hex', name: 'Hexadecimal', prefix: '0x', radix: 16 },
];

export default function NumberBaseConverterTool() {
    const [inputValue, setInputValue] = useState('255');
    const [inputBase, setInputBase] = useState<Base>('decimal');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#f97316';

    const conversions = useMemo(() => {
        const baseInfo = BASES.find((b) => b.id === inputBase);
        if (!baseInfo) return null;

        try {
            const cleanInput = inputValue.trim().toLowerCase()
                .replace(/^0b/, '')
                .replace(/^0o/, '')
                .replace(/^0x/, '');

            const decimal = parseInt(cleanInput, baseInfo.radix);
            if (isNaN(decimal)) return null;

            return {
                decimal,
                binary: decimal.toString(2),
                octal: decimal.toString(8),
                hex: decimal.toString(16).toUpperCase(),
            };
        } catch {
            return null;
        }
    }, [inputValue, inputBase]);

    const copyValue = async (value: string, label: string) => {
        await Clipboard.setStringAsync(value);
        showToast(`${label} copied!`, 'success');
        onToolComplete();
    };

    const getKeyboardType = () => {
        switch (inputBase) {
            case 'decimal':
                return 'number-pad';
            default:
                return 'default';
        }
    };

    const getPlaceholder = () => {
        switch (inputBase) {
            case 'binary':
                return 'e.g., 11111111';
            case 'octal':
                return 'e.g., 377';
            case 'hex':
                return 'e.g., FF';
            default:
                return 'e.g., 255';
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Input Base Selection */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Input Base</Text>
                <View style={styles.baseGrid}>
                    {BASES.map((base) => (
                        <TouchableOpacity
                            key={base.id}
                            onPress={() => setInputBase(base.id)}
                            style={[
                                styles.baseBtn,
                                inputBase === base.id && { backgroundColor: primaryColor, borderColor: primaryColor },
                            ]}
                        >
                            <Text style={[styles.baseName, { color: inputBase === base.id ? 'white' : textColor }]}>
                                {base.name}
                            </Text>
                            <Text style={[styles.baseRadix, { color: inputBase === base.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>
                                Base {base.radix}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Input Value */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Enter Number</Text>
                <View style={[styles.inputContainer, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    {BASES.find((b) => b.id === inputBase)?.prefix && (
                        <Text style={[styles.prefix, { color: primaryColor }]}>
                            {BASES.find((b) => b.id === inputBase)?.prefix}
                        </Text>
                    )}
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder={getPlaceholder()}
                        placeholderTextColor={textSecondaryColor}
                        keyboardType={getKeyboardType()}
                        autoCapitalize="characters"
                    />
                </View>
            </View>

            {/* Results */}
            {conversions ? (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Conversions</Text>

                    {[
                        { id: 'decimal', name: 'Decimal', value: conversions.decimal.toString(), prefix: '' },
                        { id: 'binary', name: 'Binary', value: conversions.binary, prefix: '0b' },
                        { id: 'octal', name: 'Octal', value: conversions.octal, prefix: '0o' },
                        { id: 'hex', name: 'Hexadecimal', value: conversions.hex, prefix: '0x' },
                    ].map((result, index) => (
                        <View
                            key={result.id}
                            style={[
                                styles.resultRow,
                                index > 0 && { borderTopWidth: 1, borderTopColor: textSecondaryColor + '10' },
                                result.id === inputBase && { backgroundColor: primaryColor + '10' },
                            ]}
                        >
                            <View style={styles.resultLeft}>
                                <Text style={[styles.resultName, { color: textSecondaryColor }]}>{result.name}</Text>
                                <Text style={[styles.resultValue, { color: textColor }]} selectable numberOfLines={1}>
                                    <Text style={{ color: primaryColor }}>{result.prefix}</Text>
                                    {result.value}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => copyValue(result.prefix + result.value, result.name)}>
                                <MaterialIcons name="content-copy" size={20} color={primaryColor} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={[styles.errorCard, { backgroundColor: '#ef444420' }]}>
                    <MaterialIcons name="error-outline" size={24} color="#ef4444" />
                    <Text style={[styles.errorText, { color: '#ef4444' }]}>Invalid number for selected base</Text>
                </View>
            )}

            {/* Quick Reference */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Quick Reference</Text>
                <View style={styles.refGrid}>
                    {[
                        { dec: '0', bin: '0000', hex: '0' },
                        { dec: '1', bin: '0001', hex: '1' },
                        { dec: '8', bin: '1000', hex: '8' },
                        { dec: '10', bin: '1010', hex: 'A' },
                        { dec: '15', bin: '1111', hex: 'F' },
                        { dec: '16', bin: '10000', hex: '10' },
                        { dec: '255', bin: '11111111', hex: 'FF' },
                        { dec: '256', bin: '100000000', hex: '100' },
                    ].map((row) => (
                        <TouchableOpacity
                            key={row.dec}
                            style={[styles.refRow, { backgroundColor: backgroundColor }]}
                            onPress={() => {
                                setInputBase('decimal');
                                setInputValue(row.dec);
                            }}
                        >
                            <Text style={[styles.refValue, { color: textColor }]}>{row.dec}</Text>
                            <Text style={[styles.refLabel, { color: textSecondaryColor }]}>dec</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    baseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    baseBtn: { width: '48%', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' },
    baseName: { fontSize: 14, fontWeight: '600' },
    baseRadix: { fontSize: 11, marginTop: 2 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
    prefix: { fontSize: 18, fontWeight: '600', marginRight: 4 },
    input: { flex: 1, fontSize: 20, fontWeight: 'bold', paddingVertical: 16 },
    resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 8 },
    resultLeft: { flex: 1, marginRight: 16 },
    resultName: { fontSize: 12, marginBottom: 4 },
    resultValue: { fontSize: 16, fontWeight: '600', fontFamily: 'monospace' },
    errorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 20 },
    errorText: { fontSize: 14, fontWeight: '500' },
    refGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    refRow: { width: '23%', padding: 10, borderRadius: 8, alignItems: 'center' },
    refValue: { fontSize: 14, fontWeight: '600' },
    refLabel: { fontSize: 10, marginTop: 2 },
});
