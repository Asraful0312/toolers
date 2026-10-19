import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type GradientType = 'linear' | 'radial';
type Direction = 'to right' | 'to left' | 'to bottom' | 'to top' | 'to bottom right' | 'to bottom left' | 'to top right' | 'to top left';

export default function GradientGeneratorTool() {
    const [color1, setColor1] = useState('#667eea');
    const [color2, setColor2] = useState('#764ba2');
    const [color3, setColor3] = useState('');
    const [gradientType, setGradientType] = useState<GradientType>('linear');
    const [direction, setDirection] = useState<Direction>('to right');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#ec4899';

    const directions: { id: Direction; icon: string; label: string; start: { x: number; y: number }; end: { x: number; y: number } }[] = [
        { id: 'to right', icon: 'arrow-forward', label: '→', start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
        { id: 'to left', icon: 'arrow-back', label: '←', start: { x: 1, y: 0.5 }, end: { x: 0, y: 0.5 } },
        { id: 'to bottom', icon: 'arrow-downward', label: '↓', start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
        { id: 'to top', icon: 'arrow-upward', label: '↑', start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } },
        { id: 'to bottom right', icon: 'south-east', label: '↘', start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
        { id: 'to bottom left', icon: 'south-west', label: '↙', start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
        { id: 'to top right', icon: 'north-east', label: '↗', start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
        { id: 'to top left', icon: 'north-west', label: '↖', start: { x: 1, y: 1 }, end: { x: 0, y: 0 } },
    ];

    const gradientColors = useMemo(() => {
        const colors = [color1, color2, color3].filter(c => c && /^#[0-9A-Fa-f]{6}$/.test(c));
        return colors.length >= 2 ? colors : [color1 || '#667eea', color2 || '#764ba2'];
    }, [color1, color2, color3]);

    const currentDirection = directions.find(d => d.id === direction) || directions[0];

    const cssCode = useMemo(() => {
        const colors = [color1, color2, color3].filter(c => c && /^#[0-9A-Fa-f]{6}$/.test(c));
        if (colors.length < 2) return '';

        const colorString = colors.join(', ');

        if (gradientType === 'linear') {
            return `background: linear-gradient(${direction}, ${colorString});`;
        } else {
            return `background: radial-gradient(circle, ${colorString});`;
        }
    }, [color1, color2, color3, gradientType, direction]);

    const copyCss = async () => {
        if (!cssCode) return;
        await Clipboard.setStringAsync(cssCode);
        showToast('CSS copied!', 'success');
        onToolComplete();
    };

    const presets = [
        { name: 'Sunset', colors: ['#f093fb', '#f5576c'] },
        { name: 'Ocean', colors: ['#667eea', '#764ba2'] },
        { name: 'Forest', colors: ['#11998e', '#38ef7d'] },
        { name: 'Fire', colors: ['#f12711', '#f5af19'] },
        { name: 'Night', colors: ['#0f0c29', '#302b63', '#24243e'] },
        { name: 'Sky', colors: ['#2980B9', '#6DD5FA', '#FFFFFF'] },
    ];

    const applyPreset = (preset: typeof presets[0]) => {
        setColor1(preset.colors[0]);
        setColor2(preset.colors[1]);
        setColor3(preset.colors[2] || '');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Preview */}
            <View style={styles.previewContainer}>
                <LinearGradient
                    colors={gradientColors as [string, string, ...string[]]}
                    start={currentDirection.start}
                    end={currentDirection.end}
                    style={styles.preview}
                >
                    <Text style={styles.previewText}>Gradient Preview</Text>
                </LinearGradient>
            </View>

            {/* Gradient Type */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Type</Text>
                <View style={styles.typeRow}>
                    {(['linear', 'radial'] as const).map((type) => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setGradientType(type)}
                            style={[styles.typeBtn, gradientType === type && { backgroundColor: primaryColor }]}
                        >
                            <MaterialIcons name={type === 'linear' ? 'gradient' : 'radio-button-checked'} size={20} color={gradientType === type ? 'white' : textSecondaryColor} />
                            <Text style={[styles.typeBtnText, { color: gradientType === type ? 'white' : textSecondaryColor }]}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Direction (for linear) */}
            {gradientType === 'linear' && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Direction</Text>
                    <View style={styles.directionGrid}>
                        {directions.map((dir) => (
                            <TouchableOpacity
                                key={dir.id}
                                onPress={() => setDirection(dir.id)}
                                style={[styles.dirBtn, direction === dir.id && { backgroundColor: primaryColor }]}
                            >
                                <Text style={[styles.dirLabel, { color: direction === dir.id ? 'white' : textSecondaryColor }]}>{dir.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Colors */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Colors</Text>
                {[
                    { label: 'Color 1', value: color1, setter: setColor1 },
                    { label: 'Color 2', value: color2, setter: setColor2 },
                    { label: 'Color 3 (optional)', value: color3, setter: setColor3 },
                ].map((item) => (
                    <View key={item.label} style={styles.colorRow}>
                        <View style={[styles.colorPreview, { backgroundColor: item.value || '#ccc' }]} />
                        <TextInput
                            style={[styles.colorInput, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                            value={item.value}
                            onChangeText={item.setter}
                            placeholder="#000000"
                            placeholderTextColor={textSecondaryColor}
                            autoCapitalize="none"
                            maxLength={7}
                        />
                    </View>
                ))}
            </View>

            {/* Presets */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Presets</Text>
                <View style={styles.presetsGrid}>
                    {presets.map((preset) => (
                        <TouchableOpacity
                            key={preset.name}
                            style={[styles.presetBtn, { backgroundColor: preset.colors[0] }]}
                            onPress={() => applyPreset(preset)}
                        >
                            <Text style={styles.presetName}>{preset.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* CSS Output */}
            {cssCode && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.label, { color: textColor }]}>CSS Code</Text>
                        <TouchableOpacity onPress={copyCss}>
                            <MaterialIcons name="content-copy" size={20} color={primaryColor} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.codeBox, { backgroundColor }]}>
                        <Text style={[styles.codeText, { color: textColor }]} selectable>{cssCode}</Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    previewContainer: { borderRadius: 16, overflow: 'hidden' },
    preview: { height: 150, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    previewText: { color: 'white', fontSize: 16, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
    card: { borderRadius: 16, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)' },
    typeBtnText: { fontSize: 14, fontWeight: '600' },
    directionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    dirBtn: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    dirLabel: { fontSize: 18 },
    colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    colorPreview: { width: 44, height: 44, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' },
    colorInput: { flex: 1, height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, fontSize: 14, fontFamily: 'monospace' },
    presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    presetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    presetName: { color: 'white', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 2 },
    codeBox: { borderRadius: 10, padding: 14 },
    codeText: { fontSize: 12, fontFamily: 'monospace' },
});
