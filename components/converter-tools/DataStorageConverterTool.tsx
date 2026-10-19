import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type DataUnit = 'bit' | 'byte' | 'kb' | 'mb' | 'gb' | 'tb' | 'pb';

interface UnitInfo {
    id: DataUnit;
    name: string;
    shortName: string;
    multiplier: number; // relative to bytes
}

const UNITS: UnitInfo[] = [
    { id: 'bit', name: 'Bits', shortName: 'b', multiplier: 0.125 },
    { id: 'byte', name: 'Bytes', shortName: 'B', multiplier: 1 },
    { id: 'kb', name: 'Kilobytes', shortName: 'KB', multiplier: 1024 },
    { id: 'mb', name: 'Megabytes', shortName: 'MB', multiplier: 1024 * 1024 },
    { id: 'gb', name: 'Gigabytes', shortName: 'GB', multiplier: 1024 * 1024 * 1024 },
    { id: 'tb', name: 'Terabytes', shortName: 'TB', multiplier: 1024 * 1024 * 1024 * 1024 },
    { id: 'pb', name: 'Petabytes', shortName: 'PB', multiplier: 1024 * 1024 * 1024 * 1024 * 1024 },
];

export default function DataStorageConverterTool() {
    const [inputValue, setInputValue] = useState('1');
    const [inputUnit, setInputUnit] = useState<DataUnit>('gb');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#f97316';

    const conversions = useMemo(() => {
        const numValue = parseFloat(inputValue) || 0;
        const sourceUnit = UNITS.find((u) => u.id === inputUnit);
        if (!sourceUnit) return null;

        const bytes = numValue * sourceUnit.multiplier;

        return UNITS.map((unit) => ({
            ...unit,
            value: bytes / unit.multiplier,
        }));
    }, [inputValue, inputUnit]);

    const formatValue = (value: number): string => {
        if (value === 0) return '0';
        if (value < 0.001) return value.toExponential(4);
        if (value >= 1e15) return value.toExponential(4);
        if (Number.isInteger(value)) return value.toLocaleString();
        return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    const copyValue = async (value: number, unit: string) => {
        await Clipboard.setStringAsync(`${formatValue(value)} ${unit}`);
        showToast('Copied!', 'success');
        onToolComplete();
    };

    const commonSizes = [
        { label: 'Floppy Disk', value: 1.44, unit: 'mb' as DataUnit },
        { label: 'CD', value: 700, unit: 'mb' as DataUnit },
        { label: 'DVD', value: 4.7, unit: 'gb' as DataUnit },
        { label: 'Blu-ray', value: 25, unit: 'gb' as DataUnit },
        { label: 'USB Drive', value: 32, unit: 'gb' as DataUnit },
        { label: 'SSD Drive', value: 1, unit: 'tb' as DataUnit },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Input Value and Unit */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Enter Value</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder="0"
                        placeholderTextColor={textSecondaryColor}
                        keyboardType="decimal-pad"
                    />
                    <View style={[styles.unitPicker, { backgroundColor }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitList}>
                            {UNITS.filter((u) => ['byte', 'kb', 'mb', 'gb', 'tb'].includes(u.id)).map((unit) => (
                                <TouchableOpacity
                                    key={unit.id}
                                    onPress={() => setInputUnit(unit.id)}
                                    style={[styles.unitBtn, inputUnit === unit.id && { backgroundColor: primaryColor }]}
                                >
                                    <Text style={[styles.unitBtnText, { color: inputUnit === unit.id ? 'white' : textSecondaryColor }]}>
                                        {unit.shortName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>

            {/* Results */}
            {conversions && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Conversions</Text>
                    {conversions.map((result, index) => (
                        <TouchableOpacity
                            key={result.id}
                            style={[
                                styles.resultRow,
                                index > 0 && { borderTopWidth: 1, borderTopColor: textSecondaryColor + '10' },
                                result.id === inputUnit && { backgroundColor: primaryColor + '10' },
                            ]}
                            onPress={() => copyValue(result.value, result.shortName)}
                        >
                            <View style={styles.resultLeft}>
                                <Text style={[styles.resultName, { color: textSecondaryColor }]}>{result.name}</Text>
                                <Text style={[styles.resultValue, { color: textColor }]} numberOfLines={1}>
                                    {formatValue(result.value)}
                                    <Text style={{ color: primaryColor }}> {result.shortName}</Text>
                                </Text>
                            </View>
                            <MaterialIcons name="content-copy" size={18} color={textSecondaryColor} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Common Sizes */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Common Storage Sizes</Text>
                <View style={styles.commonGrid}>
                    {commonSizes.map((item) => (
                        <TouchableOpacity
                            key={item.label}
                            style={[styles.commonItem, { backgroundColor: primaryColor + '10' }]}
                            onPress={() => {
                                setInputValue(item.value.toString());
                                setInputUnit(item.unit);
                            }}
                        >
                            <MaterialIcons name="storage" size={20} color={primaryColor} />
                            <Text style={[styles.commonLabel, { color: textColor }]}>{item.label}</Text>
                            <Text style={[styles.commonValue, { color: primaryColor }]}>
                                {item.value} {UNITS.find((u) => u.id === item.unit)?.shortName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    Uses binary units (1 KB = 1024 bytes). For decimal units (1 KB = 1000 bytes), multiply by 1.024.
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
    inputRow: { gap: 12 },
    input: { fontSize: 28, fontWeight: 'bold', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    unitPicker: { borderRadius: 10, padding: 4 },
    unitList: { gap: 6 },
    unitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    unitBtnText: { fontSize: 14, fontWeight: '600' },
    resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },
    resultLeft: { flex: 1, marginRight: 16 },
    resultName: { fontSize: 12, marginBottom: 4 },
    resultValue: { fontSize: 16, fontWeight: '600' },
    commonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    commonItem: { width: '48%', padding: 14, borderRadius: 12, alignItems: 'center', gap: 6 },
    commonLabel: { fontSize: 13, fontWeight: '500' },
    commonValue: { fontSize: 12, fontWeight: '600' },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
