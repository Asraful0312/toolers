import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BmiCalculatorTool() {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = "#22c55e";

    const bmiResult = useMemo(() => {
        const w = parseFloat(weight) || 0;
        const h = parseFloat(height) || 0;
        if (w <= 0 || h <= 0) return null;

        let bmi: number;
        if (unit === 'metric') {
            // Weight in kg, height in cm
            const heightM = h / 100;
            bmi = w / (heightM * heightM);
        } else {
            // Weight in lbs, height in inches
            bmi = (w / (h * h)) * 703;
        }

        let category: string;
        let color: string;
        if (bmi < 18.5) {
            category = 'Underweight';
            color = '#3b82f6';
        } else if (bmi < 25) {
            category = 'Normal';
            color = '#22c55e';
        } else if (bmi < 30) {
            category = 'Overweight';
            color = '#f59e0b';
        } else {
            category = 'Obese';
            color = '#ef4444';
        }

        // Calculate ideal weight range (BMI 18.5-24.9)
        let idealMin: number, idealMax: number;
        if (unit === 'metric') {
            const heightM = h / 100;
            idealMin = 18.5 * heightM * heightM;
            idealMax = 24.9 * heightM * heightM;
        } else {
            idealMin = (18.5 * h * h) / 703;
            idealMax = (24.9 * h * h) / 703;
        }

        return { bmi, category, color, idealMin, idealMax };
    }, [weight, height, unit]);

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const copyBmiResult = async () => {
        if (!bmiResult) return;
        const text = `BMI: ${bmiResult.bmi.toFixed(1)} (${bmiResult.category})\nIdeal Weight: ${bmiResult.idealMin.toFixed(1)} - ${bmiResult.idealMax.toFixed(1)} ${unit === 'metric' ? 'kg' : 'lb'}`;
        await Clipboard.setStringAsync(text);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };

    const getBmiPosition = () => {
        if (!bmiResult) return 0;
        // Map BMI 15-40 to 0-100%
        const pos = ((bmiResult.bmi - 15) / 25) * 100;
        return Math.min(100, Math.max(0, pos));
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Unit Toggle */}
            <View style={[styles.unitToggle, { backgroundColor: cardColor }]}>
                {(['metric', 'imperial'] as const).map((u) => (
                    <TouchableOpacity
                        key={u}
                        onPress={() => setUnit(u)}
                        style={[styles.unitBtn, unit === u && { backgroundColor: primaryColor }]}
                    >
                        <Text style={[styles.unitBtnText, { color: unit === u ? 'white' : textSecondaryColor }]}>
                            {u === 'metric' ? 'Metric (kg/cm)' : 'Imperial (lb/in)'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Weight Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Weight</Text>
                <View style={[styles.inputRow, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    <MaterialIcons name="fitness-center" size={22} color={primaryColor} />
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="0"
                        placeholderTextColor={textSecondaryColor}
                        keyboardType="decimal-pad"
                    />
                    <Text style={[styles.unit, { color: textSecondaryColor }]}>{unit === 'metric' ? 'kg' : 'lb'}</Text>
                </View>
            </View>

            {/* Height Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Height</Text>
                <View style={[styles.inputRow, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    <MaterialIcons name="straighten" size={22} color={primaryColor} />
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={height}
                        onChangeText={setHeight}
                        placeholder="0"
                        placeholderTextColor={textSecondaryColor}
                        keyboardType="decimal-pad"
                    />
                    <Text style={[styles.unit, { color: textSecondaryColor }]}>{unit === 'metric' ? 'cm' : 'in'}</Text>
                </View>
            </View>

            {/* BMI Result */}
            {bmiResult && (
                <>
                    <View style={[styles.resultCard, { backgroundColor: bmiResult.color + '20' }]}>
                        <Text style={[styles.resultLabel, { color: textSecondaryColor }]}>Your BMI</Text>
                        <Text style={[styles.bmiValue, { color: bmiResult.color }]}>{bmiResult.bmi.toFixed(1)}</Text>
                        <Text style={[styles.category, { color: bmiResult.color }]}>{bmiResult.category}</Text>

                        {/* BMI Scale */}
                        <View style={styles.scaleContainer}>
                            <View style={styles.scale}>
                                <View style={[styles.scaleSection, { backgroundColor: '#3b82f6', flex: 3.5 }]} />
                                <View style={[styles.scaleSection, { backgroundColor: '#22c55e', flex: 6.5 }]} />
                                <View style={[styles.scaleSection, { backgroundColor: '#f59e0b', flex: 5 }]} />
                                <View style={[styles.scaleSection, { backgroundColor: '#ef4444', flex: 10 }]} />
                            </View>
                            <View style={[styles.indicator, { left: `${getBmiPosition()}%` }]}>
                                <View style={[styles.indicatorDot, { backgroundColor: bmiResult.color }]} />
                            </View>
                        </View>
                        <View style={styles.scaleLabels}>
                            <Text style={[styles.scaleLabel, { color: textSecondaryColor }]}>15</Text>
                            <Text style={[styles.scaleLabel, { color: textSecondaryColor }]}>18.5</Text>
                            <Text style={[styles.scaleLabel, { color: textSecondaryColor }]}>25</Text>
                            <Text style={[styles.scaleLabel, { color: textSecondaryColor }]}>30</Text>
                            <Text style={[styles.scaleLabel, { color: textSecondaryColor }]}>40</Text>
                        </View>

                        <TouchableOpacity
                            onPress={copyBmiResult}
                            style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
                        >
                            <MaterialIcons name="content-copy" size={20} color={bmiResult.color} />
                            <Text style={{ color: bmiResult.color, fontWeight: '600' }}>Copy Result</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Ideal Weight */}
                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        <Text style={[styles.label, { color: textColor }]}>Healthy Weight Range</Text>
                        <View style={styles.idealRow}>
                            <View style={[styles.idealBadge, { backgroundColor: '#22c55e20' }]}>
                                <Text style={[styles.idealValue, { color: '#22c55e' }]}>
                                    {bmiResult.idealMin.toFixed(1)} - {bmiResult.idealMax.toFixed(1)}
                                </Text>
                                <Text style={[styles.idealUnit, { color: '#22c55e' }]}>{unit === 'metric' ? 'kg' : 'lb'}</Text>
                            </View>
                        </View>
                        <Text style={[styles.idealNote, { color: textSecondaryColor }]}>
                            For a BMI between 18.5 and 24.9
                        </Text>
                    </View>
                </>
            )}

            {/* BMI Categories Info */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>BMI Categories</Text>
                {[
                    { range: '< 18.5', label: 'Underweight', color: '#3b82f6' },
                    { range: '18.5 - 24.9', label: 'Normal weight', color: '#22c55e' },
                    { range: '25 - 29.9', label: 'Overweight', color: '#f59e0b' },
                    { range: '≥ 30', label: 'Obesity', color: '#ef4444' },
                ].map((cat) => (
                    <View key={cat.label} style={styles.categoryRow}>
                        <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                        <Text style={[styles.categoryRange, { color: textSecondaryColor }]}>{cat.range}</Text>
                        <Text style={[styles.categoryName, { color: textColor }]}>{cat.label}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    unitToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    unitBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    unitBtnText: { fontSize: 13, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
    input: { flex: 1, fontSize: 24, fontWeight: 'bold', paddingVertical: 16 },
    unit: { fontSize: 16, fontWeight: '500' },
    resultCard: { borderRadius: 20, padding: 24, alignItems: 'center' },
    resultLabel: { fontSize: 14 },
    bmiValue: { fontSize: 56, fontWeight: 'bold', marginVertical: 8 },
    category: { fontSize: 18, fontWeight: '600' },
    scaleContainer: { width: '100%', marginTop: 24, position: 'relative' },
    scale: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
    scaleSection: { height: '100%' },
    indicator: { position: 'absolute', top: -4, marginLeft: -8 },
    indicatorDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: 'white' },
    scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    scaleLabel: { fontSize: 10 },
    idealRow: { alignItems: 'flex-start' },
    idealBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 6, padding: 12, borderRadius: 10 },
    idealValue: { fontSize: 20, fontWeight: 'bold' },
    idealUnit: { fontSize: 14 },
    idealNote: { fontSize: 12, marginTop: 8 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    categoryRange: { width: 80, fontSize: 13 },
    categoryName: { flex: 1, fontSize: 14, fontWeight: '500' },
});
