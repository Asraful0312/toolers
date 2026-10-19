import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type TempUnit = 'celsius' | 'fahrenheit' | 'kelvin';

interface Conversion {
    celsius: number;
    fahrenheit: number;
    kelvin: number;
}

export default function TemperatureConverterTool() {
    const [inputValue, setInputValue] = useState('25');
    const [inputUnit, setInputUnit] = useState<TempUnit>('celsius');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const copyResult = async (value: string, unit: string) => {
        await Clipboard.setStringAsync(`${value} ${unit}`);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#f97316';

    const units: { id: TempUnit; name: string; symbol: string; color: string }[] = [
        { id: 'celsius', name: 'Celsius', symbol: '°C', color: '#3b82f6' },
        { id: 'fahrenheit', name: 'Fahrenheit', symbol: '°F', color: '#ef4444' },
        { id: 'kelvin', name: 'Kelvin', symbol: 'K', color: '#8b5cf6' },
    ];

    const conversions = useMemo((): Conversion | null => {
        const value = parseFloat(inputValue);
        if (isNaN(value)) return null;

        let celsius: number;

        switch (inputUnit) {
            case 'celsius':
                celsius = value;
                break;
            case 'fahrenheit':
                celsius = (value - 32) * 5 / 9;
                break;
            case 'kelvin':
                celsius = value - 273.15;
                break;
        }

        return {
            celsius,
            fahrenheit: celsius * 9 / 5 + 32,
            kelvin: celsius + 273.15,
        };
    }, [inputValue, inputUnit]);

    const formatValue = (value: number) => {
        return value.toFixed(2).replace(/\.?0+$/, '');
    };

    const getTemperatureStatus = (celsius: number) => {
        if (celsius <= 0) return { label: 'Freezing 🥶', color: '#3b82f6' };
        if (celsius <= 10) return { label: 'Cold 🌨️', color: '#06b6d4' };
        if (celsius <= 20) return { label: 'Cool 🌤️', color: '#22c55e' };
        if (celsius <= 30) return { label: 'Warm ☀️', color: '#f59e0b' };
        if (celsius <= 40) return { label: 'Hot 🔥', color: '#ef4444' };
        return { label: 'Extreme! 🌡️', color: '#dc2626' };
    };

    const commonTemps = [
        { label: 'Water Freezes', celsius: 0 },
        { label: 'Room Temp', celsius: 22 },
        { label: 'Body Temp', celsius: 37 },
        { label: 'Water Boils', celsius: 100 },
        { label: 'Absolute Zero', celsius: -273.15 },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Unit Selection */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Input Unit</Text>
                <View style={styles.unitRow}>
                    {units.map((unit) => (
                        <TouchableOpacity
                            key={unit.id}
                            onPress={() => setInputUnit(unit.id)}
                            style={[
                                styles.unitBtn,
                                inputUnit === unit.id && { backgroundColor: unit.color, borderColor: unit.color },
                            ]}
                        >
                            <Text style={[styles.unitSymbol, { color: inputUnit === unit.id ? 'white' : unit.color }]}>
                                {unit.symbol}
                            </Text>
                            <Text style={[styles.unitName, { color: inputUnit === unit.id ? 'rgba(255,255,255,0.8)' : textSecondaryColor }]}>
                                {unit.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Input Value */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Temperature</Text>
                <View style={[styles.inputContainer, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder="0"
                        placeholderTextColor={textSecondaryColor}
                        keyboardType="numbers-and-punctuation"
                    />
                    <Text style={[styles.inputUnit, { color: primaryColor }]}>
                        {units.find((u) => u.id === inputUnit)?.symbol}
                    </Text>
                </View>
            </View>

            {/* Results */}
            {conversions && (
                <>
                    {/* Status */}
                    <View style={[styles.statusCard, { backgroundColor: getTemperatureStatus(conversions.celsius).color + '20' }]}>
                        <Text style={[styles.statusText, { color: getTemperatureStatus(conversions.celsius).color }]}>
                            {getTemperatureStatus(conversions.celsius).label}
                        </Text>
                    </View>

                    {/* Conversion Results */}
                    <View style={styles.resultsGrid}>
                        {units.map((unit) => (
                            <TouchableOpacity
                                key={unit.id}
                                style={[styles.resultCard, { backgroundColor: unit.color }]}
                                onPress={() => copyResult(formatValue(conversions[unit.id]), unit.symbol)}
                            >
                                <Text style={styles.resultValue}>
                                    {formatValue(conversions[unit.id])}
                                </Text>
                                <Text style={styles.resultSymbol}>{unit.symbol}</Text>
                                <Text style={styles.resultName}>{unit.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            {/* Common Temperatures */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Common Temperatures</Text>
                {commonTemps.map((temp, index) => (
                    <TouchableOpacity
                        key={temp.label}
                        style={[styles.commonRow, index > 0 && { borderTopWidth: 1, borderTopColor: textSecondaryColor + '10' }]}
                        onPress={() => {
                            setInputUnit('celsius');
                            setInputValue(temp.celsius.toString());
                        }}
                    >
                        <Text style={[styles.commonLabel, { color: textColor }]}>{temp.label}</Text>
                        <View style={styles.commonValues}>
                            <Text style={[styles.commonValue, { color: '#3b82f6' }]}>{temp.celsius}°C</Text>
                            <Text style={[styles.commonValue, { color: '#ef4444' }]}>{formatValue(temp.celsius * 9 / 5 + 32)}°F</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Formula Reference */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Formulas</Text>
                <View style={styles.formulas}>
                    <Text style={[styles.formula, { color: textSecondaryColor }]}>°F = °C × 9/5 + 32</Text>
                    <Text style={[styles.formula, { color: textSecondaryColor }]}>°C = (°F − 32) × 5/9</Text>
                    <Text style={[styles.formula, { color: textSecondaryColor }]}>K = °C + 273.15</Text>
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
    unitRow: { flexDirection: 'row', gap: 10 },
    unitBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' },
    unitSymbol: { fontSize: 24, fontWeight: 'bold' },
    unitName: { fontSize: 12, marginTop: 4 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
    input: { flex: 1, fontSize: 32, fontWeight: 'bold', paddingVertical: 16 },
    inputUnit: { fontSize: 24, fontWeight: '600' },
    statusCard: { borderRadius: 12, padding: 14, alignItems: 'center' },
    statusText: { fontSize: 18, fontWeight: '600' },
    resultsGrid: { flexDirection: 'row', gap: 10 },
    resultCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
    resultValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    resultSymbol: { color: 'white', fontSize: 18, fontWeight: '600', marginTop: 4 },
    resultName: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 },
    commonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    commonLabel: { fontSize: 14, fontWeight: '500' },
    commonValues: { flexDirection: 'row', gap: 16 },
    commonValue: { fontSize: 14, fontWeight: '600' },
    formulas: { gap: 8 },
    formula: { fontSize: 14, fontFamily: 'monospace' },
});
