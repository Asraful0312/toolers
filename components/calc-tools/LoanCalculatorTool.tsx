import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoanCalculatorTool() {
    const [principal, setPrincipal] = useState('100000');
    const [interestRate, setInterestRate] = useState('8.5');
    const [tenure, setTenure] = useState('12');

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = "#22c55e";

    const result = useMemo(() => {
        const p = parseFloat(principal) || 0;
        const r = (parseFloat(interestRate) || 0) / 12 / 100; // Monthly interest rate
        const n = parseFloat(tenure) || 0; // Months

        if (p <= 0 || r <= 0 || n <= 0) return null;

        // EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - p;

        // Amortization schedule (first 6 months)
        const schedule = [];
        let balance = p;
        for (let i = 1; i <= Math.min(6, n); i++) {
            const interestPayment = balance * r;
            const principalPayment = emi - interestPayment;
            balance -= principalPayment;
            schedule.push({
                month: i,
                emi,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
            });
        }

        return { emi, totalPayment, totalInterest, schedule };
    }, [principal, interestRate, tenure]);

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const copyLoanDetails = async () => {
        if (!result) return;
        const text = `Loan: $${principal} @ ${interestRate}%\nTenure: ${tenure} months\nEMI: $${result.emi.toFixed(2)}\nTotal Interest: $${result.totalInterest.toFixed(2)}\nTotal Payment: $${result.totalPayment.toFixed(2)}`;
        await Clipboard.setStringAsync(text);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
        if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K';
        return '$' + value.toFixed(2);
    };

    const interestPercent = result ? (result.totalInterest / result.totalPayment) * 100 : 0;
    const principalPercent = result ? 100 - interestPercent : 0;

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Loan Amount */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Loan Amount</Text>
                <View style={[styles.inputRow, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    <Text style={[styles.symbol, { color: primaryColor }]}>$</Text>
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={principal}
                        onChangeText={setPrincipal}
                        placeholder="0"
                        placeholderTextColor={textSecondaryColor}
                        keyboardType="decimal-pad"
                    />
                </View>
            </View>

            {/* Interest Rate */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Annual Interest Rate</Text>
                <View style={[styles.inputRow, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    <MaterialIcons name="percent" size={22} color={primaryColor} />
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={interestRate}
                        onChangeText={setInterestRate}
                        placeholder="0"
                        placeholderTextColor={textSecondaryColor}
                        keyboardType="decimal-pad"
                    />
                    <Text style={[styles.suffix, { color: textSecondaryColor }]}>% / year</Text>
                </View>
            </View>

            {/* Tenure */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Loan Tenure</Text>
                <View style={[styles.inputRow, { backgroundColor, borderColor: textSecondaryColor + '40' }]}>
                    <MaterialIcons name="calendar-today" size={22} color={primaryColor} />
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={tenure}
                        onChangeText={setTenure}
                        placeholder="0"
                        placeholderTextColor={textSecondaryColor}
                        keyboardType="number-pad"
                    />
                    <Text style={[styles.suffix, { color: textSecondaryColor }]}>months</Text>
                </View>
            </View>

            {/* EMI Result */}
            {result && (
                <>
                    <View style={[styles.emiCard, { backgroundColor: primaryColor }]}>
                        <Text style={styles.emiLabel}>Monthly EMI</Text>
                        <Text style={styles.emiValue}>${result.emi.toFixed(2)}</Text>
                    </View>

                    {/* Payment Breakdown */}
                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        <Text style={[styles.label, { color: textColor }]}>Payment Breakdown</Text>

                        {/* Visual bar */}
                        <View style={styles.breakdownBar}>
                            <View style={[styles.barPrincipal, { flex: principalPercent, backgroundColor: '#22c55e' }]} />
                            <View style={[styles.barInterest, { flex: interestPercent, backgroundColor: '#ef4444' }]} />
                        </View>

                        <View style={styles.breakdownRow}>
                            <View style={styles.breakdownItem}>
                                <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                                <Text style={[styles.breakdownLabel, { color: textSecondaryColor }]}>Principal</Text>
                                <Text style={[styles.breakdownValue, { color: textColor }]}>{formatCurrency(parseFloat(principal))}</Text>
                            </View>
                            <View style={styles.breakdownItem}>
                                <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                                <Text style={[styles.breakdownLabel, { color: textSecondaryColor }]}>Interest</Text>
                                <Text style={[styles.breakdownValue, { color: textColor }]}>{formatCurrency(result.totalInterest)}</Text>
                            </View>
                        </View>

                        <View style={[styles.totalRow, { borderTopColor: textSecondaryColor + '20' }]}>
                            <Text style={[styles.totalLabel, { color: textColor }]}>Total Payment</Text>
                            <Text style={[styles.totalValue, { color: primaryColor }]}>{formatCurrency(result.totalPayment)}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={copyLoanDetails}
                            style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
                        >
                            <MaterialIcons name="content-copy" size={20} color={textColor} />
                            <Text style={{ color: textColor, fontWeight: '600' }}>Copy Details</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amortization Preview */}
                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        <Text style={[styles.label, { color: textColor }]}>First {result.schedule.length} Months</Text>
                        <View style={styles.scheduleHeader}>
                            <Text style={[styles.scheduleCell, styles.cellMonth, { color: textSecondaryColor }]}>Month</Text>
                            <Text style={[styles.scheduleCell, { color: textSecondaryColor }]}>Principal</Text>
                            <Text style={[styles.scheduleCell, { color: textSecondaryColor }]}>Interest</Text>
                            <Text style={[styles.scheduleCell, { color: textSecondaryColor }]}>Balance</Text>
                        </View>
                        {result.schedule.map((row) => (
                            <View key={row.month} style={[styles.scheduleRow, { borderTopColor: textSecondaryColor + '10' }]}>
                                <Text style={[styles.scheduleCell, styles.cellMonth, { color: textColor }]}>{row.month}</Text>
                                <Text style={[styles.scheduleCell, { color: '#22c55e' }]}>${row.principal.toFixed(0)}</Text>
                                <Text style={[styles.scheduleCell, { color: '#ef4444' }]}>${row.interest.toFixed(0)}</Text>
                                <Text style={[styles.scheduleCell, { color: textSecondaryColor }]}>${row.balance.toFixed(0)}</Text>
                            </View>
                        ))}
                    </View>
                </>
            )
            }
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16 },
    symbol: { fontSize: 22, fontWeight: 'bold' },
    input: { flex: 1, fontSize: 24, fontWeight: 'bold', paddingVertical: 14 },
    suffix: { fontSize: 14 },
    emiCard: { borderRadius: 20, padding: 28, alignItems: 'center' },
    emiLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    emiValue: { color: 'white', fontSize: 42, fontWeight: 'bold', marginTop: 8 },
    breakdownBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
    barPrincipal: { height: '100%' },
    barInterest: { height: '100%' },
    breakdownRow: { flexDirection: 'row', gap: 16 },
    breakdownItem: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    breakdownLabel: { fontSize: 13 },
    breakdownValue: { fontSize: 16, fontWeight: '600', width: '100%', marginLeft: 18 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
    totalLabel: { fontSize: 15, fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: 'bold' },
    scheduleHeader: { flexDirection: 'row', paddingBottom: 8 },
    scheduleRow: { flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1 },
    scheduleCell: { flex: 1, fontSize: 12, textAlign: 'center' },
    cellMonth: { flex: 0.5 },
});
