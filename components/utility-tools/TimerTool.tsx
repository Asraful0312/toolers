import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export default function TimerTool() {
    const [hours, setHours] = useState('0');
    const [minutes, setMinutes] = useState('5');
    const [seconds, setSeconds] = useState('0');
    const [remainingMs, setRemainingMs] = useState(0);
    const [state, setState] = useState<TimerState>('idle');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { showToast } = useToast();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#6366f1';


    const presets = [
        { label: '1 min', h: 0, m: 1, s: 0 },
        { label: '5 min', h: 0, m: 5, s: 0 },
        { label: '10 min', h: 0, m: 10, s: 0 },
        { label: '15 min', h: 0, m: 15, s: 0 },
        { label: '30 min', h: 0, m: 30, s: 0 },
        { label: '1 hour', h: 1, m: 0, s: 0 },
    ];

    const getTotalMs = useCallback(() => {
        const h = parseInt(hours) || 0;
        const m = parseInt(minutes) || 0;
        const s = parseInt(seconds) || 0;
        return (h * 3600 + m * 60 + s) * 1000;
    }, [hours, minutes, seconds]);

    useEffect(() => {
        if (state === 'running' && remainingMs > 0) {
            intervalRef.current = setInterval(() => {
                setRemainingMs((prev) => {
                    if (prev <= 100) {
                        setState('finished');
                        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
                        showToast('Timer finished!', 'success');
                        return 0;
                    }
                    return prev - 100;
                });
            }, 100);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state, remainingMs, showToast]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.ceil(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        if (state === 'idle' || state === 'finished') {
            const total = getTotalMs();
            if (total <= 0) {
                showToast('Set a time first', 'error');
                return;
            }
            setRemainingMs(total);
            setState('running');
        } else if (state === 'paused') {
            setState('running');
        }
    };

    const handlePause = () => {
        setState('paused');
    };

    const handleReset = () => {
        setState('idle');
        setRemainingMs(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const applyPreset = (preset: typeof presets[0]) => {
        setHours(preset.h.toString());
        setMinutes(preset.m.toString());
        setSeconds(preset.s.toString());
        setState('idle');
        setRemainingMs(0);
    };

    const getProgress = () => {
        const total = getTotalMs();
        if (total === 0) return 0;
        return ((total - remainingMs) / total) * 100;
    };

    const isActive = state === 'running' || state === 'paused';

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Timer Display */}
            <View style={[styles.displayCard, { backgroundColor: cardColor }]}>
                {/* Progress Ring */}
                <View style={styles.progressRing}>
                    <View style={[styles.progressBg, { borderColor: textSecondaryColor + '20' }]} />
                    <View
                        style={[
                            styles.progressFill,
                            {
                                borderColor: state === 'finished' ? '#ef4444' : primaryColor,
                                transform: [{ rotate: `${getProgress() * 3.6}deg` }]
                            }
                        ]}
                    />
                    <View style={styles.timerCenter}>
                        {isActive || state === 'finished' ? (
                            <Text style={[styles.timeDisplay, { color: state === 'finished' ? '#ef4444' : textColor }]}>
                                {formatTime(remainingMs)}
                            </Text>
                        ) : (
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={[styles.timeInput, { color: textColor }]}
                                        value={hours}
                                        onChangeText={setHours}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                    />
                                    <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>h</Text>
                                </View>
                                <Text style={[styles.timeSep, { color: textSecondaryColor }]}>:</Text>
                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={[styles.timeInput, { color: textColor }]}
                                        value={minutes}
                                        onChangeText={setMinutes}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                    />
                                    <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>m</Text>
                                </View>
                                <Text style={[styles.timeSep, { color: textSecondaryColor }]}>:</Text>
                                <View style={styles.inputGroup}>
                                    <TextInput
                                        style={[styles.timeInput, { color: textColor }]}
                                        value={seconds}
                                        onChangeText={setSeconds}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                    />
                                    <Text style={[styles.inputLabel, { color: textSecondaryColor }]}>s</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    onPress={handleReset}
                    style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: cardColor }]}
                >
                    <MaterialIcons name="refresh" size={28} color={textSecondaryColor} />
                </TouchableOpacity>

                {state === 'running' ? (
                    <TouchableOpacity
                        onPress={handlePause}
                        style={[styles.controlBtn, styles.mainBtn, { backgroundColor: '#f59e0b' }]}
                    >
                        <MaterialIcons name="pause" size={48} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={handleStart}
                        style={[styles.controlBtn, styles.mainBtn, { backgroundColor: '#22c55e' }]}
                    >
                        <MaterialIcons name="play-arrow" size={48} color="white" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => {
                        setRemainingMs((prev) => prev + 60000);
                    }}
                    disabled={!isActive}
                    style={[styles.controlBtn, styles.secondaryBtn, { backgroundColor: cardColor, opacity: isActive ? 1 : 0.5 }]}
                >
                    <MaterialIcons name="add" size={28} color={textSecondaryColor} />
                    <Text style={[styles.addLabel, { color: textSecondaryColor }]}>+1m</Text>
                </TouchableOpacity>
            </View>

            {/* Presets */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Quick Presets</Text>
                <View style={styles.presetsGrid}>
                    {presets.map((preset) => (
                        <TouchableOpacity
                            key={preset.label}
                            onPress={() => applyPreset(preset)}
                            style={[styles.presetBtn, { backgroundColor: primaryColor + '15' }]}
                        >
                            <Text style={[styles.presetText, { color: primaryColor }]}>{preset.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 24, paddingBottom: 40 },
    displayCard: { borderRadius: 20, padding: 24, alignItems: 'center' },
    progressRing: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
    progressBg: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 8 },
    progressFill: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 8, borderLeftColor: 'transparent', borderBottomColor: 'transparent' },
    timerCenter: { alignItems: 'center', justifyContent: 'center' },
    timeDisplay: { fontSize: 48, fontWeight: '200', fontFamily: 'monospace' },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    inputGroup: { alignItems: 'center' },
    timeInput: { fontSize: 36, fontWeight: '300', width: 50, textAlign: 'center', fontFamily: 'monospace' },
    inputLabel: { fontSize: 12, marginTop: -4 },
    timeSep: { fontSize: 36, fontWeight: '300', marginHorizontal: 4 },
    controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
    controlBtn: { alignItems: 'center', justifyContent: 'center' },
    secondaryBtn: { width: 70, height: 70, borderRadius: 35 },
    mainBtn: { width: 90, height: 90, borderRadius: 45 },
    addLabel: { fontSize: 10, marginTop: 2 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    presetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    presetText: { fontWeight: '600' },
});
