import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Mode = 'difference' | 'add' | 'subtract';

export default function DateCalculatorTool() {
    const [mode, setMode] = useState<Mode>('difference');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
    const [daysToAdd, setDaysToAdd] = useState(30);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
        const primaryColor = "#22c55e";

    const differenceResult = useMemo(() => {
        const diffTime = endDate.getTime() - startDate.getTime();
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = Math.floor(totalDays / 30.44); // Average days per month
        const totalYears = Math.floor(totalDays / 365.25);

        // Breakdown
        const years = Math.floor(totalDays / 365);
        const remainingAfterYears = totalDays - years * 365;
        const months = Math.floor(remainingAfterYears / 30);
        const days = remainingAfterYears - months * 30;

        const isNegative = totalDays < 0;

        return { totalDays: Math.abs(totalDays), totalWeeks, totalMonths, totalYears, years, months, days, isNegative };
    }, [startDate, endDate]);

    const addSubtractResult = useMemo(() => {
        const multiplier = mode === 'subtract' ? -1 : 1;
        const result = new Date(startDate);
        result.setDate(result.getDate() + daysToAdd * multiplier);
        return result;
    }, [startDate, daysToAdd, mode]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const modes: { id: Mode; label: string; icon: string }[] = [
        { id: 'difference', label: 'Duration', icon: 'compare-arrows' },
        { id: 'add', label: 'Add Days', icon: 'add' },
        { id: 'subtract', label: 'Subtract', icon: 'remove' },
    ];

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const copyDateResult = async () => {
        let text = '';
        if (mode === 'difference') {
            text = `Duration: ${differenceResult.totalDays} days (${Math.floor(differenceResult.totalDays / 7)} weeks)\nFrom: ${formatDate(startDate)}\nTo: ${formatDate(endDate)}`;
        } else {
            text = `Date Calculation: ${formatDate(startDate)} ${mode === 'add' ? '+' : '-'} ${daysToAdd} days = ${formatDate(addSubtractResult)}`;
        }
        await Clipboard.setStringAsync(text);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };

    const quickDays = [7, 14, 30, 60, 90, 180, 365];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Mode Toggle */}
            <View style={[styles.modeRow, { backgroundColor: cardColor }]}>
                {modes.map((m) => (
                    <TouchableOpacity
                        key={m.id}
                        onPress={() => setMode(m.id)}
                        style={[styles.modeBtn, mode === m.id && { backgroundColor: primaryColor }]}
                    >
                        <MaterialIcons name={m.icon as any} size={18} color={mode === m.id ? 'white' : textSecondaryColor} />
                        <Text style={[styles.modeBtnText, { color: mode === m.id ? 'white' : textSecondaryColor }]}>{m.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Start Date */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>
                    {mode === 'difference' ? 'Start Date' : 'From Date'}
                </Text>
                <TouchableOpacity
                    onPress={() => setShowStartPicker(true)}
                    style={[styles.dateBtn, { backgroundColor, borderColor: textSecondaryColor + '40' }]}
                >
                    <MaterialIcons name="event" size={22} color={primaryColor} />
                    <Text style={[styles.dateText, { color: textColor }]}>{formatDate(startDate)}</Text>
                    <MaterialIcons name="edit-calendar" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStartDate(new Date())} style={styles.todayBtn}>
                    <Text style={{ color: primaryColor, fontWeight: '600' }}>Today</Text>
                </TouchableOpacity>
                {showStartPicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={(e, date) => {
                            setShowStartPicker(Platform.OS === 'ios');
                            if (date) setStartDate(date);
                        }}
                    />
                )}
            </View>

            {/* End Date (for difference mode) */}
            {mode === 'difference' && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>End Date</Text>
                    <TouchableOpacity
                        onPress={() => setShowEndPicker(true)}
                        style={[styles.dateBtn, { backgroundColor, borderColor: textSecondaryColor + '40' }]}
                    >
                        <MaterialIcons name="event" size={22} color={primaryColor} />
                        <Text style={[styles.dateText, { color: textColor }]}>{formatDate(endDate)}</Text>
                        <MaterialIcons name="edit-calendar" size={20} color={textSecondaryColor} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEndDate(new Date())} style={styles.todayBtn}>
                        <Text style={{ color: primaryColor, fontWeight: '600' }}>Today</Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            display="default"
                            onChange={(e, date) => {
                                setShowEndPicker(Platform.OS === 'ios');
                                if (date) setEndDate(date);
                            }}
                        />
                    )}
                </View>
            )}

            {/* Days Input (for add/subtract mode) */}
            {mode !== 'difference' && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Number of Days</Text>
                    <View style={styles.daysRow}>
                        <TouchableOpacity
                            onPress={() => setDaysToAdd(Math.max(1, daysToAdd - 1))}
                            style={[styles.daysBtn, { backgroundColor: primaryColor + '20' }]}
                        >
                            <MaterialIcons name="remove" size={24} color={primaryColor} />
                        </TouchableOpacity>
                        <View style={[styles.daysValue, { backgroundColor }]}>
                            <Text style={[styles.daysNumber, { color: textColor }]}>{daysToAdd}</Text>
                            <Text style={[styles.daysLabel, { color: textSecondaryColor }]}>days</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setDaysToAdd(daysToAdd + 1)}
                            style={[styles.daysBtn, { backgroundColor: primaryColor + '20' }]}
                        >
                            <MaterialIcons name="add" size={24} color={primaryColor} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.quickDays}>
                        {quickDays.map((d) => (
                            <TouchableOpacity
                                key={d}
                                onPress={() => setDaysToAdd(d)}
                                style={[styles.quickDayBtn, daysToAdd === d && { backgroundColor: primaryColor }]}
                            >
                                <Text style={[styles.quickDayText, { color: daysToAdd === d ? 'white' : textSecondaryColor }]}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Result - Difference Mode */}
            {mode === 'difference' && (
                <>
                    <View style={[styles.resultCard, { backgroundColor: primaryColor }]}>
                        <Text style={styles.resultLabel}>
                            {differenceResult.isNegative ? 'Days Since' : 'Days Between'}
                        </Text>
                        <Text style={styles.resultValue}>{differenceResult.totalDays}</Text>
                        <Text style={styles.resultUnit}>days</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        <Text style={[styles.label, { color: textColor }]}>Also Equal To</Text>
                        <View style={styles.statsGrid}>
                            {[
                                { value: Math.floor(differenceResult.totalDays / 7), label: 'Weeks' },
                                { value: Math.floor(differenceResult.totalDays / 30), label: 'Months' },
                                { value: (differenceResult.totalDays / 365).toFixed(1), label: 'Years' },
                                { value: (differenceResult.totalDays * 24).toLocaleString(), label: 'Hours' },
                            ].map((stat) => (
                                <View key={stat.label} style={[styles.statItem, { backgroundColor: primaryColor + '10' }]}>
                                    <Text style={[styles.statValue, { color: primaryColor }]}>{stat.value}</Text>
                                    <Text style={[styles.statLabel, { color: textSecondaryColor }]}>{stat.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={copyDateResult}
                        style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: primaryColor + '20', borderRadius: 12 }}
                    >
                        <MaterialIcons name="content-copy" size={20} color={primaryColor} />
                        <Text style={{ color: primaryColor, fontWeight: '600' }}>Copy Duration</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Result - Add/Subtract Mode */}
            {mode !== 'difference' && (
                <View style={[styles.resultCard, { backgroundColor: primaryColor }]}>
                    <Text style={styles.resultLabel}>
                        {mode === 'add' ? 'Result Date' : 'Result Date'}
                    </Text>
                    <Text style={styles.resultDate}>{formatDate(addSubtractResult)}</Text>
                    <TouchableOpacity
                        onPress={copyDateResult}
                        style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
                    >
                        <MaterialIcons name="content-copy" size={20} color="white" />
                        <Text style={{ color: "white", fontWeight: '600' }}>Copy Result</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    modeRow: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8 },
    modeBtnText: { fontSize: 13, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 16 },
    dateText: { flex: 1, fontSize: 15, fontWeight: '600' },
    todayBtn: { marginTop: 12, alignSelf: 'flex-end' },
    daysRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
    daysBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    daysValue: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
    daysNumber: { fontSize: 36, fontWeight: 'bold' },
    daysLabel: { fontSize: 14, marginTop: 4 },
    quickDays: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    quickDayBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
    quickDayText: { fontSize: 13, fontWeight: '600' },
    resultCard: { borderRadius: 20, padding: 28, alignItems: 'center' },
    resultLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    resultValue: { color: 'white', fontSize: 56, fontWeight: 'bold', marginTop: 8 },
    resultUnit: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 4 },
    resultDate: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 12, textAlign: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statItem: { width: '48%', padding: 16, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 4 },
});
