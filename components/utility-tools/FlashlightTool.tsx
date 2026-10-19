import { useAds } from '@/context/AdContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FlashMode = 'off' | 'on' | 'strobe' | 'sos';

export default function FlashlightTool() {
    const [permission, requestPermission] = useCameraPermissions();
    const [flashMode, setFlashMode] = useState<FlashMode>('off');
    const [torchOn, setTorchOn] = useState(false);
    const strobeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const sosTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (strobeInterval.current) clearInterval(strobeInterval.current);
            if (sosTimeout.current) clearTimeout(sosTimeout.current);
        };
    }, []);

    // Pulse animation for the light button when on
    useEffect(() => {
        if (flashMode !== 'off') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, easing: Easing.ease, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.ease, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [flashMode]);

    const stopAllModes = useCallback(() => {
        if (strobeInterval.current) {
            clearInterval(strobeInterval.current);
            strobeInterval.current = null;
        }
        if (sosTimeout.current) {
            clearTimeout(sosTimeout.current);
            sosTimeout.current = null;
        }
        setTorchOn(false);
    }, []);

    const startStrobe = useCallback(() => {
        stopAllModes();
        setFlashMode('strobe');
        let isOn = false;
        strobeInterval.current = setInterval(() => {
            isOn = !isOn;
            setTorchOn(isOn);
        }, 100);
        onToolComplete();
    }, [stopAllModes]);

    const startSOS = useCallback(() => {
        stopAllModes();
        setFlashMode('sos');
        onToolComplete();

        // SOS pattern: ... --- ...
        // Short = 200ms, Long = 600ms, Gap = 200ms, Letter gap = 600ms
        const pattern = [
            200, 200, 200, 200, 200, 600, // S: ...
            600, 200, 600, 200, 600, 600, // O: ---
            200, 200, 200, 200, 200, 1000, // S: ...
        ];

        let index = 0;
        let isOn = true;

        const runPattern = () => {
            setTorchOn(isOn);
            sosTimeout.current = setTimeout(() => {
                isOn = !isOn;
                index = (index + 1) % pattern.length;
                if (index === 0) isOn = true; // Reset for new cycle
                runPattern();
            }, pattern[index]);
        };

        runPattern();
    }, [stopAllModes]);

    const toggleFlash = useCallback(() => {
        if (flashMode === 'off') {
            stopAllModes();
            setFlashMode('on');
            setTorchOn(true);
        } else {
            stopAllModes();
            setFlashMode('off');
            onToolComplete();
        }
    }, [flashMode, stopAllModes]);

    const selectMode = (mode: FlashMode) => {
        if (mode === flashMode) {
            stopAllModes();
            setFlashMode('off');
            return;
        }

        switch (mode) {
            case 'on':
                stopAllModes();
                setFlashMode('on');
                setTorchOn(true);
                break;
            case 'strobe':
                startStrobe();
                break;
            case 'sos':
                startSOS();
                break;
            default:
                stopAllModes();
                setFlashMode('off');
        }
    };

    // Request permission if not granted
    if (!permission?.granted) {
        return (
            <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.center}>
                <View style={[styles.permissionCard, { backgroundColor: cardColor }]}>
                    <MaterialIcons name="flashlight-on" size={64} color="#f59e0b" />
                    <Text style={[styles.permissionTitle, { color: textColor }]}>Camera Permission Required</Text>
                    <Text style={[styles.permissionDesc, { color: textSecondaryColor }]}>
                        The flashlight uses your camera's flash. Please grant camera permission to use this feature.
                    </Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                        <Text style={styles.permissionBtnText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Hidden camera view to control torch */}
            <CameraView
                style={styles.hiddenCamera}
                enableTorch={torchOn}
                facing="back"
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Main Flash Button */}
                <View style={styles.mainSection}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            onPress={toggleFlash}
                            style={[
                                styles.flashBtn,
                                { backgroundColor: flashMode !== 'off' ? '#f59e0b' : cardColor }
                            ]}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons
                                name={flashMode !== 'off' ? 'flashlight-on' : 'flashlight-off'}
                                size={80}
                                color={flashMode !== 'off' ? 'white' : textSecondaryColor}
                            />
                        </TouchableOpacity>
                    </Animated.View>

                    <Text style={[styles.statusText, { color: flashMode !== 'off' ? '#f59e0b' : textSecondaryColor }]}>
                        {flashMode === 'off' ? 'Tap to turn on' : flashMode === 'on' ? 'ON' : flashMode.toUpperCase()}
                    </Text>
                </View>

                {/* Mode Selector */}
                <View style={[styles.modesCard, { backgroundColor: cardColor }]}>
                    <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>FLASH MODES</Text>
                    <View style={styles.modesRow}>
                        <TouchableOpacity
                            onPress={() => selectMode('on')}
                            style={[styles.modeBtn, flashMode === 'on' && styles.modeBtnActive]}
                        >
                            <MaterialIcons name="lightbulb" size={28} color={flashMode === 'on' ? 'white' : textColor} />
                            <Text style={[styles.modeBtnText, { color: flashMode === 'on' ? 'white' : textColor }]}>Steady</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => selectMode('strobe')}
                            style={[styles.modeBtn, flashMode === 'strobe' && styles.modeBtnActive]}
                        >
                            <MaterialIcons name="bolt" size={28} color={flashMode === 'strobe' ? 'white' : textColor} />
                            <Text style={[styles.modeBtnText, { color: flashMode === 'strobe' ? 'white' : textColor }]}>Strobe</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => selectMode('sos')}
                            style={[styles.modeBtn, flashMode === 'sos' && styles.modeBtnActive]}
                        >
                            <MaterialIcons name="warning" size={28} color={flashMode === 'sos' ? 'white' : textColor} />
                            <Text style={[styles.modeBtnText, { color: flashMode === 'sos' ? 'white' : textColor }]}>SOS</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info */}
                <View style={[styles.infoCard, { backgroundColor: '#f59e0b15' }]}>
                    <MaterialIcons name="info-outline" size={18} color="#f59e0b" />
                    <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                        <Text style={{ fontWeight: 'bold' }}>Strobe:</Text> Rapid flashing for signaling.{'\n'}
                        <Text style={{ fontWeight: 'bold' }}>SOS:</Text> Emergency morse code pattern (... --- ...).
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    hiddenCamera: { position: 'absolute', width: 1, height: 1, opacity: 0 },
    content: { padding: 20, paddingBottom: 40, alignItems: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    permissionCard: { borderRadius: 20, padding: 30, alignItems: 'center', gap: 16, maxWidth: 320 },
    permissionTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    permissionDesc: { textAlign: 'center', lineHeight: 22 },
    permissionBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
    permissionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    mainSection: { alignItems: 'center', marginVertical: 40, gap: 20 },
    flashBtn: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
    statusText: { fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
    modesCard: { borderRadius: 20, padding: 20, width: '100%', marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
    modesRow: { flexDirection: 'row', gap: 12 },
    modeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(128,128,128,0.1)', gap: 6 },
    modeBtnActive: { backgroundColor: '#f59e0b' },
    modeBtnText: { fontSize: 13, fontWeight: '600' },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, width: '100%' },
    infoText: { flex: 1, fontSize: 12, lineHeight: 20 },
});
