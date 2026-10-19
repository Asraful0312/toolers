import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TipCalculatorTool() {
    const [billAmount, setBillAmount] = useState('');
    const [tipPercent, setTipPercent] = useState(15);
    const [splitCount, setSplitCount] = useState(1);

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = "#22c55e";

    const tipPresets = [10, 15, 18, 20, 25];

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const calculations = useMemo(() => {
        const bill = parseFloat(billAmount) || 0;
        const tipAmount = bill * (tipPercent / 100);
        const total = bill + tipAmount;
        const perPerson = total / splitCount;
        const tipPerPerson = tipAmount / splitCount;

        return { tipAmount, total, perPerson, tipPerPerson };
    }, [billAmount, tipPercent, splitCount]);

    const copyToClipboard = async () => {
        const text = `Bill: $${billAmount}\nTip: ${tipPercent}%\nTotal: $${calculations.total.toFixed(2)}\nPer Person: $${calculations.perPerson.toFixed(2)}`;
        await Clipboard.setStringAsync(text);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };

    const formatCurrency = (value: number) => {
        return '$' + value.toFixed(2);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Bill Amount */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Bill Amount</Text>
                <View style={[styles.inputContainer, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    <Text style={[styles.currencySymbol, { color: primaryColor }]}>$</Text>
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={billAmount}
                        onChangeText={setBillAmount}
                        placeholder="0.00"
                        placeholderTextColor={textSecondaryColor}
                        keyboardType="decimal-pad"
                    />
                </View>
            </View>

            {/* Tip Percentage */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.tipHeader}>
                    <Text style={[styles.label, { color: textColor }]}>Tip Percentage</Text>
                    <Text style={[styles.tipValue, { color: primaryColor }]}>{tipPercent}%</Text>
                </View>
                <View style={styles.presetRow}>
                    {tipPresets.map((preset) => (
                        <TouchableOpacity
                            key={preset}
                            onPress={() => setTipPercent(preset)}
                            style={[
                                styles.presetBtn,
                                tipPercent === preset && { backgroundColor: primaryColor },
                                tipPercent !== preset && { borderColor: textSecondaryColor + '40', borderWidth: 1 },
                            ]}
                        >
                            <Text style={[styles.presetText, { color: tipPercent === preset ? 'white' : textColor }]}>
                                {preset}%
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={[styles.customTipRow, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    <Text style={[styles.customLabel, { color: textSecondaryColor }]}>Custom:</Text>
                    <TextInput
                        style={[styles.customInput, { color: textColor }]}
                        value={tipPercent.toString()}
                        onChangeText={(t) => setTipPercent(parseInt(t) || 0)}
                        keyboardType="number-pad"
                        maxLength={3}
                    />
                    <Text style={[styles.percentSign, { color: textSecondaryColor }]}>%</Text>
                </View>
            </View>

            {/* Split Bill */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Split Between</Text>
                <View style={styles.splitRow}>
                    <TouchableOpacity
                        onPress={() => setSplitCount(Math.max(1, splitCount - 1))}
                        style={[styles.splitBtn, { backgroundColor: primaryColor + '20' }]}
                    >
                        <MaterialIcons name="remove" size={24} color={primaryColor} />
                    </TouchableOpacity>
                    <View style={[styles.splitValue, { backgroundColor }]}>
                        <MaterialIcons name="person" size={20} color={primaryColor} />
                        <Text style={[styles.splitNumber, { color: textColor }]}>{splitCount}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setSplitCount(splitCount + 1)}
                        style={[styles.splitBtn, { backgroundColor: primaryColor + '20' }]}
                    >
                        <MaterialIcons name="add" size={24} color={primaryColor} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Results */}
            <View style={[styles.resultsCard, { backgroundColor: primaryColor + '15' }]}>
                <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: textSecondaryColor }]}>Tip Amount</Text>
                    <Text style={[styles.resultValue, { color: textColor }]}>{formatCurrency(calculations.tipAmount)}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: textSecondaryColor + '20' }]} />
                <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: textSecondaryColor }]}>Total</Text>
                    <Text style={[styles.resultValue, { color: textColor }]}>{formatCurrency(calculations.total)}</Text>
                </View>
                {splitCount > 1 && (
                    <>
                        <View style={[styles.divider, { backgroundColor: textSecondaryColor + '20' }]} />
                        <View style={styles.resultRow}>
                            <Text style={[styles.resultLabel, { color: textSecondaryColor }]}>Per Person</Text>
                            <Text style={[styles.resultValueLarge, { color: primaryColor }]}>{formatCurrency(calculations.perPerson)}</Text>
                        </View>
                        <Text style={[styles.perPersonTip, { color: textSecondaryColor }]}>
                            (includes {formatCurrency(calculations.tipPerPerson)} tip each)
                        </Text>
                    </>
                )}
                <TouchableOpacity
                    onPress={copyToClipboard}
                    style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
                >
                    <MaterialIcons name="content-copy" size={20} color={textColor} />
                    <Text style={{ color: textColor, fontWeight: '600' }}>Copy Details</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
    currencySymbol: { fontSize: 24, fontWeight: 'bold', marginRight: 8 },
    input: { flex: 1, fontSize: 28, fontWeight: 'bold', paddingVertical: 16 },
    tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tipValue: { fontSize: 20, fontWeight: 'bold' },
    presetRow: { flexDirection: 'row', gap: 8 },
    presetBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    presetText: { fontSize: 14, fontWeight: '600' },
    customTipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    customLabel: { fontSize: 13 },
    customInput: { flex: 1, fontSize: 16, fontWeight: '600', textAlign: 'center' },
    percentSign: { fontSize: 16 },
    splitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
    splitBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    splitValue: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    splitNumber: { fontSize: 24, fontWeight: 'bold' },
    resultsCard: { borderRadius: 16, padding: 20 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    resultLabel: { fontSize: 15 },
    resultValue: { fontSize: 18, fontWeight: '600' },
    resultValueLarge: { fontSize: 24, fontWeight: 'bold' },
    divider: { height: 1, marginVertical: 8 },
    perPersonTip: { fontSize: 12, textAlign: 'right', marginTop: 4 },
});
