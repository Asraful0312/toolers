import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

const WHEEL_SIZE = Dimensions.get('window').width - 64;
const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function SpinWheelTool() {
    const [segments, setSegments] = useState<string[]>(['Prize 1', 'Prize 2', 'Prize 3', 'Prize 4']);
    const [newSegment, setNewSegment] = useState('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const spinAnim = useRef(new Animated.Value(0)).current;
    const currentRotation = useRef(0);

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#14b8a6';

    const spinWheel = () => {
        if (isSpinning || segments.length < 2) {
            if (segments.length < 2) {
                showToast('Add at least 2 segments', 'error');
            }
            return;
        }

        setIsSpinning(true);
        setWinner(null);

        // Random number of full rotations (3-6) plus a random angle
        const fullRotations = 3 + Math.random() * 3;
        const randomAngle = Math.random() * 360;
        const targetRotation = fullRotations * 360 + randomAngle;

        spinAnim.setValue(currentRotation.current);

        Animated.timing(spinAnim, {
            toValue: currentRotation.current + targetRotation,
            duration: 4000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            // Calculate final rotation angle (normalized to 0-360)
            const finalAngle = (currentRotation.current + targetRotation) % 360;
            currentRotation.current = finalAngle;

            // The pointer is at the top (0°/360°)
            // Wheel rotates clockwise, so we need to find which segment is at top
            // Segments are drawn starting from top-right going clockwise
            // So we need to calculate: (360 - finalAngle) to get the angle from pointer's perspective
            const segmentAngle = 360 / segments.length;
            const pointerAngle = (360 - finalAngle + 360) % 360;
            const winningIndex = Math.floor(pointerAngle / segmentAngle) % segments.length;

            setWinner(segments[winningIndex]);
            setIsSpinning(false);
            onToolComplete();
        });
    };

    const addSegment = () => {
        const trimmed = newSegment.trim();
        if (!trimmed) {
            showToast('Enter a segment name', 'error');
            return;
        }
        if (segments.length >= 8) {
            showToast('Maximum 8 segments', 'error');
            return;
        }
        setSegments([...segments, trimmed]);
        setNewSegment('');
    };

    const removeSegment = (index: number) => {
        if (segments.length <= 2) {
            showToast('Minimum 2 segments required', 'error');
            return;
        }
        setSegments(segments.filter((_, i) => i !== index));
    };

    const resetWheel = () => {
        setSegments(['Prize 1', 'Prize 2', 'Prize 3', 'Prize 4']);
        setWinner(null);
        currentRotation.current = 0;
        spinAnim.setValue(0);
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    // Generate wheel segments as SVG paths
    const renderWheel = () => {
        const radius = WHEEL_SIZE / 2;
        const centerX = radius;
        const centerY = radius;
        const segmentAngle = (2 * Math.PI) / segments.length;

        return segments.map((segment, index) => {
            const startAngle = index * segmentAngle - Math.PI / 2;
            const endAngle = startAngle + segmentAngle;

            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const largeArcFlag = segmentAngle > Math.PI ? 1 : 0;

            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z',
            ].join(' ');

            // Text position
            const textAngle = startAngle + segmentAngle / 2;
            const textRadius = radius * 0.65;
            const textX = centerX + textRadius * Math.cos(textAngle);
            const textY = centerY + textRadius * Math.sin(textAngle);
            const textRotation = (textAngle * 180) / Math.PI + 90;

            return (
                <G key={index}>
                    <Path d={pathData} fill={COLORS[index % COLORS.length]} />
                    <SvgText
                        x={textX}
                        y={textY}
                        fill="white"
                        fontSize={segments.length > 6 ? 10 : 12}
                        fontWeight="bold"
                        textAnchor="middle"
                        transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                    >
                        {segment.length > 10 ? segment.substring(0, 10) + '...' : segment}
                    </SvgText>
                </G>
            );
        });
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Wheel Container */}
            <View style={styles.wheelContainer}>
                {/* Pointer */}
                <View style={styles.pointer}>
                    <View style={[styles.pointerTriangle, { borderBottomColor: primaryColor }]} />
                </View>

                {/* Wheel */}
                <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
                    <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                        {renderWheel()}
                    </Svg>
                </Animated.View>

                {/* Center Button */}
                <TouchableOpacity
                    onPress={spinWheel}
                    disabled={isSpinning}
                    style={[styles.spinBtn, { backgroundColor: isSpinning ? textSecondaryColor : primaryColor }]}
                >
                    <Text style={styles.spinBtnText}>{isSpinning ? '...' : 'SPIN'}</Text>
                </TouchableOpacity>
            </View>

            {/* Winner Display */}
            {winner && (
                <View style={[styles.winnerCard, { backgroundColor: '#22c55e' }]}>
                    <MaterialIcons name="emoji-events" size={28} color="white" />
                    <View>
                        <Text style={styles.winnerLabel}>Winner!</Text>
                        <Text style={styles.winnerText}>{winner}</Text>
                    </View>
                </View>
            )}

            {/* Spin Button (external) */}
            <TouchableOpacity
                onPress={spinWheel}
                disabled={isSpinning}
                style={[styles.mainSpinBtn, { backgroundColor: primaryColor, opacity: isSpinning ? 0.6 : 1 }]}
            >
                <MaterialIcons name="refresh" size={24} color="white" />
                <Text style={styles.mainSpinBtnText}>{isSpinning ? 'Spinning...' : 'Spin the Wheel!'}</Text>
            </TouchableOpacity>

            {/* Edit Toggle */}
            <TouchableOpacity
                onPress={() => setShowEdit(!showEdit)}
                style={[styles.editToggle, { backgroundColor: cardColor }]}
            >
                <MaterialIcons name={showEdit ? 'expand-less' : 'edit'} size={20} color={primaryColor} />
                <Text style={{ color: primaryColor, fontWeight: '600' }}>
                    {showEdit ? 'Hide Editor' : 'Edit Segments'}
                </Text>
            </TouchableOpacity>

            {/* Segment Editor */}
            {showEdit && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Segments ({segments.length}/8)</Text>

                    {/* Add New Segment */}
                    <View style={styles.addRow}>
                        <TextInput
                            style={[styles.input, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                            value={newSegment}
                            onChangeText={setNewSegment}
                            placeholder="Add new segment..."
                            placeholderTextColor={textSecondaryColor}
                            onSubmitEditing={addSegment}
                        />
                        <TouchableOpacity onPress={addSegment} style={[styles.addBtn, { backgroundColor: primaryColor }]}>
                            <MaterialIcons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Segment List */}
                    <View style={styles.segmentList}>
                        {segments.map((segment, index) => (
                            <View key={index} style={[styles.segmentItem, { backgroundColor: COLORS[index % COLORS.length] + '20' }]}>
                                <View style={[styles.segmentColor, { backgroundColor: COLORS[index % COLORS.length] }]} />
                                <TextInput
                                    style={[styles.segmentInput, { color: textColor }]}
                                    value={segment}
                                    onChangeText={(text) => {
                                        const updated = [...segments];
                                        updated[index] = text;
                                        setSegments(updated);
                                    }}
                                    placeholder="Segment name"
                                    placeholderTextColor={textSecondaryColor}
                                />
                                <TouchableOpacity onPress={() => removeSegment(index)}>
                                    <MaterialIcons name="close" size={20} color={textSecondaryColor} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Reset Button */}
                    <TouchableOpacity onPress={resetWheel} style={styles.resetBtn}>
                        <MaterialIcons name="refresh" size={18} color={textSecondaryColor} />
                        <Text style={{ color: textSecondaryColor }}>Reset to Default</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40, alignItems: 'center' },
    wheelContainer: { width: WHEEL_SIZE, height: WHEEL_SIZE, alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
    pointer: { position: 'absolute', top: -10, zIndex: 10 },
    pointerTriangle: { width: 0, height: 0, borderLeftWidth: 15, borderRightWidth: 15, borderBottomWidth: 30, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
    wheel: { width: WHEEL_SIZE, height: WHEEL_SIZE },
    spinBtn: { position: 'absolute', width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    spinBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    winnerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, width: '100%' },
    winnerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    winnerText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    mainSpinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 16, width: '100%' },
    mainSpinBtnText: { color: 'white', fontSize: 18, fontWeight: '600' },
    editToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, width: '100%' },
    card: { borderRadius: 16, padding: 16, width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    addRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    input: { flex: 1, height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
    addBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    segmentList: { gap: 8 },
    segmentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10 },
    segmentColor: { width: 20, height: 20, borderRadius: 10 },
    segmentText: { flex: 1, fontSize: 14 },
    segmentInput: { flex: 1, fontSize: 14, padding: 0, margin: 0 },
    resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, padding: 10 },
});
