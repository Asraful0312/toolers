import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StopwatchTool() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const { showToast } = useToast();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#6366f1';


    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning) {
            interval = setInterval(() => {
                setTime((prev) => prev + 10);
            }, 10);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning]);

    const formatTime = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    };

    const handleStartStop = () => {
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        setLaps([]);
    };

    const handleLap = () => {
        if (isRunning) {
            setLaps([time, ...laps]);
        }
    };

    const copyTime = async () => {
        await Clipboard.setStringAsync(formatTime(time));
        showToast('Time copied!', 'success');
    };

    const getLapDiff = (index: number): number => {
        if (index === laps.length - 1) return laps[index];
        return laps[index] - laps[index + 1];
    };

    const getBestWorst = () => {
        if (laps.length < 2) return { best: -1, worst: -1 };
        const diffs = laps.map((_, i) => getLapDiff(i));
        return {
            best: diffs.indexOf(Math.min(...diffs)),
            worst: diffs.indexOf(Math.max(...diffs)),
        };
    };

    const { best, worst } = getBestWorst();

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Main Display */}
            <View style={[styles.displayCard, { backgroundColor: cardColor }]}>
                <Text style={[styles.timeDisplay, { color: textColor }]}>{formatTime(time)}</Text>
                <TouchableOpacity onPress={copyTime} style={styles.copyBtn}>
                    <MaterialIcons name="content-copy" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    onPress={time === 0 ? undefined : handleReset}
                    style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: cardColor, opacity: time === 0 ? 0.5 : 1 }]}
                    disabled={time === 0}
                >
                    <MaterialIcons name="refresh" size={28} color={textSecondaryColor} />
                    <Text style={[styles.controlLabel, { color: textSecondaryColor }]}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleStartStop}
                    style={[styles.controlBtn, styles.mainBtn, { backgroundColor: isRunning ? '#ef4444' : '#22c55e' }]}
                >
                    <MaterialIcons name={isRunning ? 'pause' : 'play-arrow'} size={48} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleLap}
                    style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: cardColor, opacity: !isRunning ? 0.5 : 1 }]}
                    disabled={!isRunning}
                >
                    <MaterialIcons name="flag" size={28} color={textSecondaryColor} />
                    <Text style={[styles.controlLabel, { color: textSecondaryColor }]}>Lap</Text>
                </TouchableOpacity>
            </View>

            {/* Laps */}
            {laps.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.lapHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Laps ({laps.length})</Text>
                        <TouchableOpacity onPress={() => setLaps([])}>
                            <Text style={{ color: primaryColor, fontWeight: '600' }}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                    {laps.map((lap, index) => (
                        <View
                            key={index}
                            style={[
                                styles.lapRow,
                                index === best && { backgroundColor: '#22c55e15' },
                                index === worst && { backgroundColor: '#ef444415' },
                            ]}
                        >
                            <View style={styles.lapInfo}>
                                <Text style={[styles.lapNumber, { color: textSecondaryColor }]}>Lap {laps.length - index}</Text>
                                {index === best && <MaterialIcons name="emoji-events" size={16} color="#22c55e" />}
                                {index === worst && <MaterialIcons name="trending-down" size={16} color="#ef4444" />}
                            </View>
                            <View style={styles.lapTimes}>
                                <Text style={[styles.lapDiff, { color: textSecondaryColor }]}>+{formatTime(getLapDiff(index))}</Text>
                                <Text style={[styles.lapTotal, { color: textColor }]}>{formatTime(lap)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 24, paddingBottom: 40 },
    displayCard: { borderRadius: 20, padding: 32, alignItems: 'center', position: 'relative' },
    timeDisplay: { fontSize: 48, fontWeight: '200', fontFamily: 'monospace', letterSpacing: 2 },
    copyBtn: { position: 'absolute', top: 16, right: 16 },
    controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
    controlBtn: { alignItems: 'center', justifyContent: 'center' },
    secondaryBtn: { width: 80, height: 80, borderRadius: 40 },
    mainBtn: { width: 100, height: 100, borderRadius: 50 },
    controlLabel: { fontSize: 12, marginTop: 4 },
    card: { borderRadius: 16, padding: 16 },
    lapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600' },
    lapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4 },
    lapInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    lapNumber: { fontSize: 14 },
    lapTimes: { alignItems: 'flex-end' },
    lapDiff: { fontSize: 12 },
    lapTotal: { fontSize: 16, fontWeight: '600', fontFamily: 'monospace' },
});
