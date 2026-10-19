import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (l1: number, l2: number): number => {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
};

interface WcagLevel {
    level: string;
    passed: boolean;
    requirement: number;
}

export default function ContrastCheckerTool() {
    const [foreground, setForeground] = useState('#000000');
    const [background, setBackground] = useState('#ffffff');

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const bgColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#ec4899';

    const result = useMemo(() => {
        const fgRgb = hexToRgb(foreground);
        const bgRgb = hexToRgb(background);

        if (!fgRgb || !bgRgb) return null;

        const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
        const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
        const ratio = getContrastRatio(fgLum, bgLum);

        const levels: WcagLevel[] = [
            { level: 'AA Large', requirement: 3, passed: ratio >= 3 },
            { level: 'AA Normal', requirement: 4.5, passed: ratio >= 4.5 },
            { level: 'AAA Large', requirement: 4.5, passed: ratio >= 4.5 },
            { level: 'AAA Normal', requirement: 7, passed: ratio >= 7 },
        ];

        return { ratio, levels };
    }, [foreground, background]);

    const swapColors = () => {
        const temp = foreground;
        setForeground(background);
        setBackground(temp);
    };

    const copyRatio = async () => {
        if (!result) return;
        await Clipboard.setStringAsync(`Contrast Ratio: ${result.ratio.toFixed(2)}:1`);
        await Clipboard.setStringAsync(`Contrast Ratio: ${result.ratio.toFixed(2)}:1`);
        showToast('Copied!', 'success');
        onToolComplete();
    };

    const getRatingColor = (ratio: number): string => {
        if (ratio >= 7) return '#22c55e';
        if (ratio >= 4.5) return '#84cc16';
        if (ratio >= 3) return '#f59e0b';
        return '#ef4444';
    };

    const getRatingText = (ratio: number): string => {
        if (ratio >= 7) return 'Excellent';
        if (ratio >= 4.5) return 'Good';
        if (ratio >= 3) return 'Fair';
        return 'Poor';
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentContainerStyle={styles.content}>
            {/* Preview */}
            <View style={[styles.previewCard, { backgroundColor: background }]}>
                <Text style={[styles.previewTitle, { color: foreground }]}>Sample Text</Text>
                <Text style={[styles.previewBody, { color: foreground }]}>
                    The quick brown fox jumps over the lazy dog. This text shows how your color combination looks.
                </Text>
                <View style={[styles.previewButton, { backgroundColor: foreground }]}>
                    <Text style={{ color: background, fontWeight: '600' }}>Button Example</Text>
                </View>
            </View>

            {/* Contrast Ratio */}
            {result && (
                <TouchableOpacity onPress={copyRatio} style={[styles.ratioCard, { backgroundColor: getRatingColor(result.ratio) + '20' }]}>
                    <View style={styles.ratioMain}>
                        <Text style={[styles.ratioValue, { color: getRatingColor(result.ratio) }]}>
                            {result.ratio.toFixed(2)}:1
                        </Text>
                        <Text style={[styles.ratioLabel, { color: getRatingColor(result.ratio) }]}>
                            {getRatingText(result.ratio)}
                        </Text>
                    </View>
                    <MaterialIcons name="content-copy" size={20} color={getRatingColor(result.ratio)} />
                </TouchableOpacity>
            )}

            {/* Color Inputs */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.colorRow}>
                    <View style={styles.colorInput}>
                        <Text style={[styles.colorLabel, { color: textSecondaryColor }]}>Foreground</Text>
                        <View style={styles.inputRow}>
                            <View style={[styles.colorSwatch, { backgroundColor: foreground }]} />
                            <TextInput
                                style={[styles.hexInput, { backgroundColor: bgColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                                value={foreground}
                                onChangeText={setForeground}
                                placeholder="#000000"
                                placeholderTextColor={textSecondaryColor}
                                autoCapitalize="none"
                                maxLength={7}
                            />
                        </View>
                    </View>

                    <TouchableOpacity onPress={swapColors} style={[styles.swapBtn, { backgroundColor: primaryColor + '20' }]}>
                        <MaterialIcons name="swap-horiz" size={24} color={primaryColor} />
                    </TouchableOpacity>

                    <View style={styles.colorInput}>
                        <Text style={[styles.colorLabel, { color: textSecondaryColor }]}>Background</Text>
                        <View style={styles.inputRow}>
                            <View style={[styles.colorSwatch, { backgroundColor: background }]} />
                            <TextInput
                                style={[styles.hexInput, { backgroundColor: bgColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                                value={background}
                                onChangeText={setBackground}
                                placeholder="#ffffff"
                                placeholderTextColor={textSecondaryColor}
                                autoCapitalize="none"
                                maxLength={7}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* WCAG Levels */}
            {result && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>WCAG Accessibility</Text>
                    <View style={styles.levelsGrid}>
                        {result.levels.map((level) => (
                            <View key={level.level} style={[styles.levelItem, { backgroundColor: level.passed ? '#22c55e20' : '#ef444420' }]}>
                                <MaterialIcons
                                    name={level.passed ? 'check-circle' : 'cancel'}
                                    size={24}
                                    color={level.passed ? '#22c55e' : '#ef4444'}
                                />
                                <Text style={[styles.levelName, { color: textColor }]}>{level.level}</Text>
                                <Text style={[styles.levelReq, { color: textSecondaryColor }]}>≥{level.requirement}:1</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Info */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>WCAG Guidelines</Text>
                <View style={styles.infoList}>
                    {[
                        { level: 'AA Normal', desc: '4.5:1 for regular text (under 18pt)' },
                        { level: 'AA Large', desc: '3:1 for large text (18pt+ or 14pt bold)' },
                        { level: 'AAA Normal', desc: '7:1 for enhanced accessibility' },
                        { level: 'AAA Large', desc: '4.5:1 for large text enhanced' },
                    ].map((item) => (
                        <View key={item.level} style={styles.infoRow}>
                            <Text style={[styles.infoLevel, { color: primaryColor }]}>{item.level}</Text>
                            <Text style={[styles.infoDesc, { color: textSecondaryColor }]}>{item.desc}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    previewCard: { borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
    previewTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    previewBody: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
    previewButton: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    ratioCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 20 },
    ratioMain: { alignItems: 'flex-start' },
    ratioValue: { fontSize: 36, fontWeight: 'bold' },
    ratioLabel: { fontSize: 16, fontWeight: '600', marginTop: 4 },
    card: { borderRadius: 16, padding: 16 },
    colorRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
    colorInput: { flex: 1 },
    colorLabel: { fontSize: 12, marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    colorSwatch: { width: 40, height: 40, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' },
    hexInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, fontFamily: 'monospace' },
    swapBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    levelsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    levelItem: { width: '48%', padding: 14, borderRadius: 12, alignItems: 'center', gap: 6 },
    levelName: { fontSize: 13, fontWeight: '600' },
    levelReq: { fontSize: 11 },
    infoList: { gap: 12 },
    infoRow: { gap: 4 },
    infoLevel: { fontSize: 13, fontWeight: '600' },
    infoDesc: { fontSize: 12 },
});
