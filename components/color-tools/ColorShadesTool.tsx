import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    s /= 100;
    l /= 100;

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

export default function ColorShadesTool() {
    const [baseColor, setBaseColor] = useState('#3b82f6');
    const [shadeCount, setShadeCount] = useState(10);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#ec4899';

    const shades = useMemo(() => {
        const hsl = hexToHsl(baseColor);
        if (!hsl) return [];

        const result: { hex: string; name: string; lightness: number }[] = [];

        // Generate shades from lightest to darkest
        for (let i = 0; i < shadeCount; i++) {
            const lightness = 95 - (i * (90 / (shadeCount - 1)));
            const hex = hslToHex(hsl.h, hsl.s, lightness);
            const shade = (i + 1) * 100;
            result.push({ hex, name: `${shade}`, lightness: Math.round(lightness) });
        }

        return result;
    }, [baseColor, shadeCount]);

    const copyColor = async (hex: string) => {
        await Clipboard.setStringAsync(hex);
        showToast(`${hex} copied!`, 'success');
        onToolComplete();
    };

    const copyAll = async () => {
        const text = shades.map(s => `${s.name}: ${s.hex}`).join('\n');
        await Clipboard.setStringAsync(text);
        showToast('All shades copied!', 'success');
        onToolComplete();
    };

    const copyCssVariables = async () => {
        const css = shades.map(s => `--color-${s.name}: ${s.hex};`).join('\n');
        await Clipboard.setStringAsync(css);
        showToast('CSS variables copied!', 'success');
        onToolComplete();
    };

    const presetColors = [
        { name: 'Blue', color: '#3b82f6' },
        { name: 'Red', color: '#ef4444' },
        { name: 'Green', color: '#22c55e' },
        { name: 'Purple', color: '#a855f7' },
        { name: 'Orange', color: '#f97316' },
        { name: 'Teal', color: '#14b8a6' },
    ];

    const getContrastColor = (hex: string): string => {
        const hsl = hexToHsl(hex);
        return hsl && hsl.l > 50 ? '#000000' : '#ffffff';
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Base Color Input */}
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
                </View>
                <View style={styles.presets}>
                    {presetColors.map((preset) => (
                        <TouchableOpacity
                            key={preset.name}
                            style={[styles.presetBtn, { backgroundColor: preset.color }]}
                            onPress={() => setBaseColor(preset.color)}
                        >
                            <Text style={[styles.presetText, { color: getContrastColor(preset.color) }]}>{preset.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Shade Count */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Number of Shades</Text>
                <View style={styles.countRow}>
                    {[5, 10, 15].map((count) => (
                        <TouchableOpacity
                            key={count}
                            onPress={() => setShadeCount(count)}
                            style={[styles.countBtn, shadeCount === count && { backgroundColor: primaryColor }]}
                        >
                            <Text style={[styles.countText, { color: shadeCount === count ? 'white' : textSecondaryColor }]}>{count}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity onPress={copyAll} style={[styles.actionBtn, { backgroundColor: primaryColor }]}>
                    <MaterialIcons name="content-copy" size={18} color="white" />
                    <Text style={styles.actionBtnText}>Copy All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={copyCssVariables} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                    <MaterialIcons name="code" size={18} color={primaryColor} />
                    <Text style={[styles.actionBtnText, { color: primaryColor }]}>CSS Variables</Text>
                </TouchableOpacity>
            </View>

            {/* Shades */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Generated Shades</Text>
                <View style={styles.shadesGrid}>
                    {shades.map((shade) => (
                        <TouchableOpacity
                            key={shade.name}
                            style={[styles.shadeItem, { backgroundColor: shade.hex }]}
                            onPress={() => copyColor(shade.hex)}
                        >
                            <Text style={[styles.shadeName, { color: getContrastColor(shade.hex) }]}>{shade.name}</Text>
                            <Text style={[styles.shadeHex, { color: getContrastColor(shade.hex) }]}>{shade.hex}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    colorPreview: { width: 50, height: 50, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' },
    hexInput: { flex: 1, height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: 'monospace' },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    presetText: { fontSize: 12, fontWeight: '600' },
    countRow: { flexDirection: 'row', gap: 10 },
    countBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    countText: { fontSize: 16, fontWeight: '600' },
    actionsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12 },
    actionBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
    shadesGrid: { gap: 8 },
    shadeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12 },
    shadeName: { fontSize: 16, fontWeight: 'bold' },
    shadeHex: { fontSize: 13, fontFamily: 'monospace' },
});
