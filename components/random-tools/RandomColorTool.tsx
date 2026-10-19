import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ColorInfo {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
}

const generateRandomColor = (): ColorInfo => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    // RGB to HSL conversion
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
            case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
            case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
        }
    }

    return {
        hex: hex.toUpperCase(),
        rgb: { r, g, b },
        hsl: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
    };
};

const getContrastColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default function RandomColorTool() {
    const [currentColor, setCurrentColor] = useState<ColorInfo | null>(null);
    const [history, setHistory] = useState<ColorInfo[]>([]);
    const [lockedColors, setLockedColors] = useState<ColorInfo[]>([]);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#14b8a6';

    const generateColor = () => {
        const newColor = generateRandomColor();
        setCurrentColor(newColor);
        setHistory(prev => [newColor, ...prev.slice(0, 19)]);
        onToolComplete();
    };

    const copyColor = async (format: 'hex' | 'rgb' | 'hsl') => {
        if (!currentColor) return;

        let text = '';
        switch (format) {
            case 'hex':
                text = currentColor.hex;
                break;
            case 'rgb':
                text = `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})`;
                break;
            case 'hsl':
                text = `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)`;
                break;
        }

        await Clipboard.setStringAsync(text);
        showToast(`${text} copied!`, 'success');
        onToolComplete();
    };

    const lockColor = () => {
        if (!currentColor) return;
        if (lockedColors.some(c => c.hex === currentColor.hex)) {
            showToast('Color already saved', 'error');
            return;
        }
        setLockedColors(prev => [...prev, currentColor]);
        showToast('Color saved!', 'success');
    };

    const removeLocked = (hex: string) => {
        setLockedColors(prev => prev.filter(c => c.hex !== hex));
    };

    const copyLockedColor = async (color: ColorInfo) => {
        await Clipboard.setStringAsync(color.hex);
        showToast(`${color.hex} copied!`, 'success');
        onToolComplete();
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Color Display */}
            <View style={[styles.colorCard, { backgroundColor: currentColor?.hex || cardColor }]}>
                {currentColor ? (
                    <>
                        <Text style={[styles.hexDisplay, { color: getContrastColor(currentColor.hex) }]}>
                            {currentColor.hex}
                        </Text>
                        <TouchableOpacity onPress={lockColor} style={styles.lockBtn}>
                            <MaterialIcons name="favorite-border" size={28} color={getContrastColor(currentColor.hex)} />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <MaterialIcons name="palette" size={64} color={textSecondaryColor + '50'} />
                        <Text style={[styles.placeholder, { color: textSecondaryColor }]}>Generate a color!</Text>
                    </>
                )}
            </View>

            {/* Generate Button */}
            <TouchableOpacity onPress={generateColor} style={[styles.generateBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name="shuffle" size={24} color="white" />
                <Text style={styles.generateBtnText}>Generate Random Color</Text>
            </TouchableOpacity>

            {/* Color Values */}
            {currentColor && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Color Values</Text>
                    {[
                        { format: 'hex' as const, label: 'HEX', value: currentColor.hex },
                        { format: 'rgb' as const, label: 'RGB', value: `rgb(${currentColor.rgb.r}, ${currentColor.rgb.g}, ${currentColor.rgb.b})` },
                        { format: 'hsl' as const, label: 'HSL', value: `hsl(${currentColor.hsl.h}, ${currentColor.hsl.s}%, ${currentColor.hsl.l}%)` },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.format}
                            onPress={() => copyColor(item.format)}
                            style={styles.valueRow}
                        >
                            <Text style={[styles.valueLabel, { color: textSecondaryColor }]}>{item.label}</Text>
                            <Text style={[styles.valueText, { color: textColor }]}>{item.value}</Text>
                            <MaterialIcons name="content-copy" size={18} color={textSecondaryColor} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Saved Colors */}
            {lockedColors.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Saved Colors ({lockedColors.length})</Text>
                        <TouchableOpacity onPress={() => setLockedColors([])}>
                            <Text style={{ color: '#ef4444', fontWeight: '600' }}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.savedGrid}>
                        {lockedColors.map((color) => (
                            <TouchableOpacity
                                key={color.hex}
                                onPress={() => copyLockedColor(color)}
                                onLongPress={() => removeLocked(color.hex)}
                                style={[styles.savedColor, { backgroundColor: color.hex }]}
                            >
                                <Text style={[styles.savedHex, { color: getContrastColor(color.hex) }]}>{color.hex}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[styles.hint, { color: textSecondaryColor }]}>Tap to copy, long press to remove</Text>
                </View>
            )}

            {/* History */}
            {history.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Recent Colors</Text>
                        <TouchableOpacity onPress={() => setHistory([])}>
                            <Text style={{ color: primaryColor, fontWeight: '600' }}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.historyGrid}>
                        {history.map((color, index) => (
                            <TouchableOpacity
                                key={`${color.hex}-${index}`}
                                onPress={() => {
                                    setCurrentColor(color);
                                    copyLockedColor(color);
                                }}
                                style={[styles.historyColor, { backgroundColor: color.hex }]}
                            />
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    colorCard: { height: 200, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    hexDisplay: { fontSize: 36, fontWeight: 'bold', fontFamily: 'monospace' },
    lockBtn: { position: 'absolute', top: 16, right: 16 },
    placeholder: { fontSize: 16, marginTop: 12 },
    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 16 },
    generateBtnText: { color: 'white', fontSize: 18, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    valueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    valueLabel: { width: 50, fontSize: 12, fontWeight: '600' },
    valueText: { flex: 1, fontSize: 14, fontFamily: 'monospace' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    savedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    savedColor: { width: 80, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    savedHex: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
    hint: { fontSize: 11, marginTop: 12, textAlign: 'center' },
    historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    historyColor: { width: 36, height: 36, borderRadius: 8 },
});
