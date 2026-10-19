import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic' | 'monochromatic';

const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex = (h: number, s: number, l: number): string => {
    h = ((h % 360) + 360) % 360; // Normalize hue
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    const toHex = (n: number) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function PaletteGeneratorTool() {
    const [baseColor, setBaseColor] = useState('#3b82f6');
    const [harmony, setHarmony] = useState<HarmonyType>('complementary');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#ec4899';

    const harmonies: { id: HarmonyType; name: string; desc: string }[] = [
        { id: 'complementary', name: 'Complementary', desc: '2 colors' },
        { id: 'analogous', name: 'Analogous', desc: '3 colors' },
        { id: 'triadic', name: 'Triadic', desc: '3 colors' },
        { id: 'split-complementary', name: 'Split-Comp', desc: '3 colors' },
        { id: 'tetradic', name: 'Tetradic', desc: '4 colors' },
        { id: 'monochromatic', name: 'Monochrome', desc: '5 shades' },
    ];

    const palette = useMemo(() => {
        const hsl = hexToHsl(baseColor);
        if (!hsl) return [baseColor];

        switch (harmony) {
            case 'complementary':
                return [
                    baseColor,
                    hslToHex(hsl.h + 180, hsl.s, hsl.l),
                ];
            case 'analogous':
                return [
                    hslToHex(hsl.h - 30, hsl.s, hsl.l),
                    baseColor,
                    hslToHex(hsl.h + 30, hsl.s, hsl.l),
                ];
            case 'triadic':
                return [
                    baseColor,
                    hslToHex(hsl.h + 120, hsl.s, hsl.l),
                    hslToHex(hsl.h + 240, hsl.s, hsl.l),
                ];
            case 'split-complementary':
                return [
                    baseColor,
                    hslToHex(hsl.h + 150, hsl.s, hsl.l),
                    hslToHex(hsl.h + 210, hsl.s, hsl.l),
                ];
            case 'tetradic':
                return [
                    baseColor,
                    hslToHex(hsl.h + 90, hsl.s, hsl.l),
                    hslToHex(hsl.h + 180, hsl.s, hsl.l),
                    hslToHex(hsl.h + 270, hsl.s, hsl.l),
                ];
            case 'monochromatic':
                return [
                    hslToHex(hsl.h, hsl.s, 90),
                    hslToHex(hsl.h, hsl.s, 70),
                    baseColor,
                    hslToHex(hsl.h, hsl.s, 30),
                    hslToHex(hsl.h, hsl.s, 15),
                ];
            default:
                return [baseColor];
        }
    }, [baseColor, harmony]);

    const copyColor = async (hex: string) => {
        await Clipboard.setStringAsync(hex);
        showToast(`${hex} copied!`, 'success');
        onToolComplete();
    };

    const copyPalette = async () => {
        await Clipboard.setStringAsync(palette.join(', '));
        showToast('Palette copied!', 'success');
        onToolComplete();
    };

    const randomize = () => {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 40) + 50;
        const l = Math.floor(Math.random() * 30) + 40;
        setBaseColor(hslToHex(h, s, l));
    };

    const getContrastColor = (hex: string): string => {
        const hsl = hexToHsl(hex);
        return hsl && hsl.l > 50 ? '#000000' : '#ffffff';
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Palette Preview */}
            <View style={styles.previewContainer}>
                {palette.map((color, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.previewStrip, { backgroundColor: color }]}
                        onPress={() => copyColor(color)}
                    >
                        <Text style={[styles.previewHex, { color: getContrastColor(color) }]}>{color}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Base Color */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Base Color</Text>
                <View style={styles.inputRow}>
                    <View style={[styles.colorPreview, { backgroundColor: baseColor }]} />
                    <TextInput
                        style={[styles.hexInput, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                        value={baseColor}
                        onChangeText={setBaseColor}
                        placeholder="#3b82f6"
                        placeholderTextColor={textSecondaryColor}
                        autoCapitalize="none"
                        maxLength={7}
                    />
                    <TouchableOpacity onPress={randomize} style={[styles.randomBtn, { backgroundColor: primaryColor }]}>
                        <MaterialIcons name="shuffle" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Harmony Type */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Color Harmony</Text>
                <View style={styles.harmonyGrid}>
                    {harmonies.map((h) => (
                        <TouchableOpacity
                            key={h.id}
                            onPress={() => setHarmony(h.id)}
                            style={[styles.harmonyBtn, harmony === h.id && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                        >
                            <Text style={[styles.harmonyName, { color: harmony === h.id ? 'white' : textColor }]}>{h.name}</Text>
                            <Text style={[styles.harmonyDesc, { color: harmony === h.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>{h.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Copy Button */}
            <TouchableOpacity onPress={copyPalette} style={[styles.copyBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name="content-copy" size={20} color="white" />
                <Text style={styles.copyBtnText}>Copy Palette</Text>
            </TouchableOpacity>

            {/* Color List */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Palette Colors</Text>
                {palette.map((color, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.colorRow}
                        onPress={() => copyColor(color)}
                    >
                        <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                        <View style={styles.colorInfo}>
                            <Text style={[styles.colorHex, { color: textColor }]}>{color}</Text>
                            {hexToHsl(color) && (
                                <Text style={[styles.colorHsl, { color: textSecondaryColor }]}>
                                    HSL({hexToHsl(color)!.h}, {hexToHsl(color)!.s}%, {hexToHsl(color)!.l}%)
                                </Text>
                            )}
                        </View>
                        <MaterialIcons name="content-copy" size={18} color={textSecondaryColor} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    previewContainer: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', height: 120 },
    previewStrip: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 },
    previewHex: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    colorPreview: { width: 50, height: 50, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' },
    hexInput: { flex: 1, height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, fontFamily: 'monospace' },
    randomBtn: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    harmonyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    harmonyBtn: { width: '31%', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' },
    harmonyName: { fontSize: 12, fontWeight: '600' },
    harmonyDesc: { fontSize: 10, marginTop: 2 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14 },
    copyBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    colorSwatch: { width: 44, height: 44, borderRadius: 10 },
    colorInfo: { flex: 1 },
    colorHex: { fontSize: 15, fontWeight: '600', fontFamily: 'monospace' },
    colorHsl: { fontSize: 11, marginTop: 2 },
});
