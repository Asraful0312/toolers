import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AgeCalculatorTool() {
    const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
    const [targetDate, setTargetDate] = useState(new Date());
    const [showBirthPicker, setShowBirthPicker] = useState(false);
    const [showTargetPicker, setShowTargetPicker] = useState(false);

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = "#22c55e";

    const age = useMemo(() => {
        let years = targetDate.getFullYear() - birthDate.getFullYear();
        let months = targetDate.getMonth() - birthDate.getMonth();
        let days = targetDate.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        // Calculate total values
        const diffTime = Math.abs(targetDate.getTime() - birthDate.getTime());
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = years * 12 + months;
        const totalHours = totalDays * 24;

        // Next birthday
        const nextBirthday = new Date(targetDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (nextBirthday <= targetDate) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }
        const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

        return { years, months, days, totalDays, totalWeeks, totalMonths, totalHours, daysToNextBirthday };
    }, [birthDate, targetDate]);

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const copyAgeStats = async () => {
        const text = `Age: ${age.years} years, ${age.months} months, ${age.days} days\nTotal Days: ${age.totalDays}\nNext Birthday: ${age.daysToNextBirthday} days`;
        await Clipboard.setStringAsync(text);
        showToast('Copied to clipboard', 'success');
        onToolComplete();
    };



    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const onBirthChange = (event: any, selectedDate?: Date) => {
        setShowBirthPicker(Platform.OS === 'ios');
        if (selectedDate) setBirthDate(selectedDate);
    };

    const onTargetChange = (event: any, selectedDate?: Date) => {
        setShowTargetPicker(Platform.OS === 'ios');
        if (selectedDate) setTargetDate(selectedDate);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Birth Date */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Date of Birth</Text>
                <TouchableOpacity
                    onPress={() => setShowBirthPicker(true)}
                    style={[styles.dateBtn, { backgroundColor, borderColor: textSecondaryColor + '40' }]}
                >
                    <MaterialIcons name="cake" size={22} color={primaryColor} />
                    <Text style={[styles.dateText, { color: textColor }]}>{formatDate(birthDate)}</Text>
                    <MaterialIcons name="edit-calendar" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                {showBirthPicker && (
                    <DateTimePicker
                        value={birthDate}
                        mode="date"
                        display="default"
                        onChange={onBirthChange}
                        maximumDate={new Date()}
                    />
                )}
            </View>

            {/* Target Date */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Calculate Age On</Text>
                <TouchableOpacity
                    onPress={() => setShowTargetPicker(true)}
                    style={[styles.dateBtn, { backgroundColor, borderColor: textSecondaryColor + '40' }]}
                >
                    <MaterialIcons name="event" size={22} color={primaryColor} />
                    <Text style={[styles.dateText, { color: textColor }]}>{formatDate(targetDate)}</Text>
                    <MaterialIcons name="edit-calendar" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTargetDate(new Date())} style={styles.todayBtn}>
                    <Text style={{ color: primaryColor, fontWeight: '600' }}>Set to Today</Text>
                </TouchableOpacity>
                {showTargetPicker && (
                    <DateTimePicker
                        value={targetDate}
                        mode="date"
                        display="default"
                        onChange={onTargetChange}
                    />
                )}
            </View>

            {/* Main Age Result */}
            <View style={[styles.ageCard, { backgroundColor: primaryColor }]}>
                <Text style={styles.ageTitle}>Your Age</Text>
                <View style={styles.ageRow}>
                    <View style={styles.ageItem}>
                        <Text style={styles.ageNumber}>{age.years}</Text>
                        <Text style={styles.ageLabel}>Years</Text>
                    </View>
                    <View style={styles.ageItem}>
                        <Text style={styles.ageNumber}>{age.months}</Text>
                        <Text style={styles.ageLabel}>Months</Text>
                    </View>
                    <View style={styles.ageItem}>
                        <Text style={styles.ageNumber}>{age.days}</Text>
                        <Text style={styles.ageLabel}>Days</Text>
                    </View>
                </View>
            </View>

            {/* Next Birthday */}
            <View style={[styles.birthdayCard, { backgroundColor: '#f59e0b20' }]}>
                <MaterialIcons name="celebration" size={24} color="#f59e0b" />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.birthdayTitle, { color: textColor }]}>Next Birthday</Text>
                    <Text style={[styles.birthdayDays, { color: '#f59e0b' }]}>
                        {age.daysToNextBirthday} days away! 🎂
                    </Text>
                </View>
            </View>

            {/* Detailed Stats */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>You've Lived</Text>
                <View style={styles.statsGrid}>
                    {[
                        { value: age.totalMonths.toLocaleString(), label: 'Months' },
                        { value: age.totalWeeks.toLocaleString(), label: 'Weeks' },
                        { value: age.totalDays.toLocaleString(), label: 'Days' },
                        { value: age.totalHours.toLocaleString(), label: 'Hours' },
                    ].map((stat) => (
                        <View key={stat.label} style={[styles.statItem, { backgroundColor: primaryColor + '10' }]}>
                            <Text style={[styles.statValue, { color: primaryColor }]}>{stat.value}</Text>
                            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <TouchableOpacity
                onPress={copyAgeStats}
                style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: primaryColor + '20', borderRadius: 12 }}
            >
                <MaterialIcons name="content-copy" size={20} color={primaryColor} />
                <Text style={{ color: primaryColor, fontWeight: '600' }}>Copy Stats</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 16 },
    dateText: { flex: 1, fontSize: 16, fontWeight: '600' },
    todayBtn: { marginTop: 12, alignSelf: 'flex-end' },
    ageCard: { borderRadius: 20, padding: 24, alignItems: 'center' },
    ageTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 12 },
    ageRow: { flexDirection: 'row', gap: 32 },
    ageItem: { alignItems: 'center' },
    ageNumber: { color: 'white', fontSize: 36, fontWeight: 'bold' },
    ageLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
    birthdayCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 16, padding: 16 },
    birthdayTitle: { fontSize: 14, fontWeight: '600' },
    birthdayDays: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statItem: { width: '48%', padding: 16, borderRadius: 12, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 4 },
});
