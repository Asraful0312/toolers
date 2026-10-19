import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TIMEZONES = [
    { id: 'UTC', name: 'UTC', offset: 0 },
    { id: 'EST', name: 'New York (EST)', offset: -5 },
    { id: 'CST', name: 'Chicago (CST)', offset: -6 },
    { id: 'MST', name: 'Denver (MST)', offset: -7 },
    { id: 'PST', name: 'Los Angeles (PST)', offset: -8 },
    { id: 'GMT', name: 'London (GMT)', offset: 0 },
    { id: 'CET', name: 'Paris (CET)', offset: 1 },
    { id: 'IST', name: 'India (IST)', offset: 5.5 },
    { id: 'CST_CN', name: 'China (CST)', offset: 8 },
    { id: 'JST', name: 'Tokyo (JST)', offset: 9 },
    { id: 'AEST', name: 'Sydney (AEST)', offset: 10 },
    { id: 'BST', name: 'Bangladesh (BST)', offset: 6 },
    { id: 'GST', name: 'Dubai (GST)', offset: 4 },
    { id: 'SGT', name: 'Singapore (SGT)', offset: 8 },
];

export default function TimeZoneConverterTool() {
    const [fromZone, setFromZone] = useState('UTC');
    const [toZone, setToZone] = useState('EST');
    const [hours, setHours] = useState('12');
    const [minutes, setMinutes] = useState('00');
    const [is24Hour, setIs24Hour] = useState(true);
    const [isPM, setIsPM] = useState(false);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#f97316';

    const result = useMemo(() => {
        let hour = parseInt(hours) || 0;
        const min = parseInt(minutes) || 0;

        if (!is24Hour) {
            if (isPM && hour !== 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
        }

        const fromTz = TIMEZONES.find((tz) => tz.id === fromZone);
        const toTz = TIMEZONES.find((tz) => tz.id === toZone);

        if (!fromTz || !toTz) return { hours: 0, minutes: 0, dayDiff: 0 };

        const diff = toTz.offset - fromTz.offset;
        let newHour = hour + diff;
        let dayDiff = 0;

        if (newHour >= 24) {
            newHour -= 24;
            dayDiff = 1;
        } else if (newHour < 0) {
            newHour += 24;
            dayDiff = -1;
        }

        return { hours: Math.floor(newHour), minutes: min, dayDiff };
    }, [hours, minutes, fromZone, toZone, is24Hour, isPM]);

    const formatTime = (h: number, m: number) => {
        if (is24Hour) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const swapZones = () => {
        setFromZone(toZone);
        setToZone(fromZone);
    };

    const copyResult = async () => {
        const timeStr = formatTime(result.hours, result.minutes);
        const dayStr = result.dayDiff !== 0 ? (result.dayDiff > 0 ? ' (+1 day)' : ' (-1 day)') : '';
        const zoneName = TIMEZONES.find((tz) => tz.id === toZone)?.name || toZone;

        await Clipboard.setStringAsync(`Converted Time: ${timeStr}${dayStr}\nZone: ${zoneName}`);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Time Format Toggle */}
            <View style={[styles.formatToggle, { backgroundColor: cardColor }]}>
                {(['24-hour', '12-hour'] as const).map((format) => (
                    <TouchableOpacity
                        key={format}
                        onPress={() => setIs24Hour(format === '24-hour')}
                        style={[styles.formatBtn, (is24Hour ? format === '24-hour' : format === '12-hour') && { backgroundColor: primaryColor }]}
                    >
                        <Text style={[styles.formatBtnText, { color: (is24Hour ? format === '24-hour' : format === '12-hour') ? 'white' : textSecondaryColor }]}>
                            {format}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Time Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Enter Time</Text>
                <View style={styles.timeInputRow}>
                    <TextInput
                        style={[styles.timeInput, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                        value={hours}
                        onChangeText={setHours}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="HH"
                        placeholderTextColor={textSecondaryColor}
                    />
                    <Text style={[styles.timeSeparator, { color: textColor }]}>:</Text>
                    <TextInput
                        style={[styles.timeInput, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                        value={minutes}
                        onChangeText={setMinutes}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="MM"
                        placeholderTextColor={textSecondaryColor}
                    />
                    {!is24Hour && (
                        <View style={styles.ampmRow}>
                            {(['AM', 'PM'] as const).map((period) => (
                                <TouchableOpacity
                                    key={period}
                                    onPress={() => setIsPM(period === 'PM')}
                                    style={[styles.ampmBtn, (isPM ? period === 'PM' : period === 'AM') && { backgroundColor: primaryColor }]}
                                >
                                    <Text style={[styles.ampmText, { color: (isPM ? period === 'PM' : period === 'AM') ? 'white' : textSecondaryColor }]}>
                                        {period}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* From Timezone */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>From</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tzList}>
                    {TIMEZONES.map((tz) => (
                        <TouchableOpacity
                            key={tz.id}
                            onPress={() => setFromZone(tz.id)}
                            style={[styles.tzBtn, fromZone === tz.id && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                        >
                            <Text style={[styles.tzName, { color: fromZone === tz.id ? 'white' : textColor }]}>{tz.id}</Text>
                            <Text style={[styles.tzOffset, { color: fromZone === tz.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>
                                UTC{tz.offset >= 0 ? '+' : ''}{tz.offset}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Swap Button */}
            <TouchableOpacity onPress={swapZones} style={[styles.swapBtn, { backgroundColor: primaryColor + '20' }]}>
                <MaterialIcons name="swap-vert" size={24} color={primaryColor} />
            </TouchableOpacity>

            {/* To Timezone */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>To</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tzList}>
                    {TIMEZONES.map((tz) => (
                        <TouchableOpacity
                            key={tz.id}
                            onPress={() => setToZone(tz.id)}
                            style={[styles.tzBtn, toZone === tz.id && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                        >
                            <Text style={[styles.tzName, { color: toZone === tz.id ? 'white' : textColor }]}>{tz.id}</Text>
                            <Text style={[styles.tzOffset, { color: toZone === tz.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>
                                UTC{tz.offset >= 0 ? '+' : ''}{tz.offset}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Result */}
            <View style={[styles.resultCard, { backgroundColor: primaryColor }]}>
                <Text style={styles.resultLabel}>Converted Time</Text>
                <Text style={styles.resultTime}>{formatTime(result.hours, result.minutes)}</Text>
                {result.dayDiff !== 0 && (
                    <Text style={styles.dayDiff}>
                        {result.dayDiff > 0 ? '+1 day (next day)' : '-1 day (previous day)'}
                    </Text>
                )}
                <View style={styles.resultZones}>
                    <Text style={styles.resultZone}>{TIMEZONES.find((tz) => tz.id === toZone)?.name}</Text>
                </View>
                <TouchableOpacity
                    onPress={copyResult}
                    style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
                >
                    <MaterialIcons name="content-copy" size={20} color="white" />
                    <Text style={{ color: "white", fontWeight: '600' }}>Copy Result</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    formatToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    formatBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    formatBtnText: { fontSize: 14, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timeInput: { width: 70, height: 56, borderWidth: 1, borderRadius: 12, fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
    timeSeparator: { fontSize: 28, fontWeight: 'bold' },
    ampmRow: { flexDirection: 'row', marginLeft: 12, gap: 4 },
    ampmBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    ampmText: { fontSize: 14, fontWeight: '600' },
    tzList: { gap: 8 },
    tzBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' },
    tzName: { fontSize: 14, fontWeight: '600' },
    tzOffset: { fontSize: 11, marginTop: 2 },
    swapBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
    resultCard: { borderRadius: 20, padding: 28, alignItems: 'center' },
    resultLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    resultTime: { color: 'white', fontSize: 48, fontWeight: 'bold', marginTop: 8 },
    dayDiff: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8 },
    resultZones: { marginTop: 12 },
    resultZone: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
});
