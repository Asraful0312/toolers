import { useAds } from '@/context/AdContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DiceType = 4 | 6 | 8 | 10 | 12 | 20;

interface DiceRoll {
    type: DiceType;
    value: number;
}

const DICE_TYPES: { type: DiceType; label: string; color: string }[] = [
    { type: 4, label: 'D4', color: '#ef4444' },
    { type: 6, label: 'D6', color: '#f59e0b' },
    { type: 8, label: 'D8', color: '#22c55e' },
    { type: 10, label: 'D10', color: '#3b82f6' },
    { type: 12, label: 'D12', color: '#8b5cf6' },
    { type: 20, label: 'D20', color: '#ec4899' },
];

export default function DiceRollerTool() {
    const [selectedDice, setSelectedDice] = useState<DiceType>(6);
    const [diceCount, setDiceCount] = useState(1);
    const [results, setResults] = useState<DiceRoll[]>([]);
    const [isRolling, setIsRolling] = useState(false);
    const [history, setHistory] = useState<{ rolls: DiceRoll[]; total: number }[]>([]);
    const { onToolComplete } = useAds();

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#14b8a6';

    const rollDice = () => {
        if (isRolling) return;

        setIsRolling(true);
        shakeAnim.setValue(0);

        // Shake animation
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start(() => {
            const newRolls: DiceRoll[] = [];
            for (let i = 0; i < diceCount; i++) {
                newRolls.push({
                    type: selectedDice,
                    value: Math.floor(Math.random() * selectedDice) + 1,
                });
            }
            setResults(newRolls);
            setHistory(prev => [{ rolls: newRolls, total: newRolls.reduce((sum, r) => sum + r.value, 0) }, ...prev.slice(0, 9)]);
            setIsRolling(false);
            onToolComplete();
        });
    };

    const total = results.reduce((sum, r) => sum + r.value, 0);
    const diceInfo = DICE_TYPES.find(d => d.type === selectedDice)!;

    const shakeTransform = shakeAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-10deg', '0deg', '10deg'],
    });

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Dice Type Selection */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Select Dice Type</Text>
                <View style={styles.diceTypeGrid}>
                    {DICE_TYPES.map((dice) => (
                        <TouchableOpacity
                            key={dice.type}
                            onPress={() => setSelectedDice(dice.type)}
                            style={[
                                styles.diceTypeBtn,
                                { backgroundColor: dice.color + '20' },
                                selectedDice === dice.type && { backgroundColor: dice.color, borderColor: dice.color },
                            ]}
                        >
                            <Text style={[styles.diceTypeText, { color: selectedDice === dice.type ? 'white' : dice.color }]}>
                                {dice.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Dice Count */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Number of Dice</Text>
                <View style={styles.countRow}>
                    <TouchableOpacity
                        onPress={() => setDiceCount(Math.max(1, diceCount - 1))}
                        style={[styles.countBtn, { backgroundColor: primaryColor + '20' }]}
                    >
                        <MaterialIcons name="remove" size={24} color={primaryColor} />
                    </TouchableOpacity>
                    <Text style={[styles.countValue, { color: textColor }]}>{diceCount}</Text>
                    <TouchableOpacity
                        onPress={() => setDiceCount(Math.min(10, diceCount + 1))}
                        style={[styles.countBtn, { backgroundColor: primaryColor + '20' }]}
                    >
                        <MaterialIcons name="add" size={24} color={primaryColor} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Results Display */}
            <View style={[styles.resultsCard, { backgroundColor: cardColor }]}>
                <Animated.View style={[styles.resultsContent, { transform: [{ rotate: shakeTransform }] }]}>
                    {results.length > 0 ? (
                        <>
                            <View style={styles.diceResults}>
                                {results.map((roll, index) => (
                                    <View key={index} style={[styles.diceResult, { backgroundColor: diceInfo.color }]}>
                                        <Text style={styles.diceValue}>{roll.value}</Text>
                                    </View>
                                ))}
                            </View>
                            {results.length > 1 && (
                                <View style={styles.totalRow}>
                                    <Text style={[styles.totalLabel, { color: textSecondaryColor }]}>Total:</Text>
                                    <Text style={[styles.totalValue, { color: textColor }]}>{total}</Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.placeholder}>
                            <MaterialIcons name="casino" size={64} color={textSecondaryColor + '50'} />
                            <Text style={[styles.placeholderText, { color: textSecondaryColor }]}>Roll the dice!</Text>
                        </View>
                    )}
                </Animated.View>
            </View>

            {/* Roll Button */}
            <TouchableOpacity
                onPress={rollDice}
                disabled={isRolling}
                style={[styles.rollBtn, { backgroundColor: diceInfo.color, opacity: isRolling ? 0.7 : 1 }]}
            >
                <MaterialIcons name="casino" size={28} color="white" />
                <Text style={styles.rollBtnText}>
                    {isRolling ? 'Rolling...' : `Roll ${diceCount} ${diceInfo.label}`}
                </Text>
            </TouchableOpacity>

            {/* History */}
            {history.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.label, { color: textColor }]}>History</Text>
                        <TouchableOpacity onPress={() => setHistory([])}>
                            <Text style={{ color: primaryColor, fontWeight: '600' }}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                    {history.map((entry, index) => (
                        <View key={index} style={styles.historyRow}>
                            <View style={styles.historyDice}>
                                {entry.rolls.map((roll, i) => (
                                    <View key={i} style={[styles.historyDieSmall, { backgroundColor: DICE_TYPES.find(d => d.type === roll.type)?.color }]}>
                                        <Text style={styles.historyDieText}>{roll.value}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={[styles.historyTotal, { color: textColor }]}>= {entry.total}</Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    diceTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    diceTypeBtn: { flex: 1, minWidth: '30%', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    diceTypeText: { fontSize: 18, fontWeight: 'bold' },
    countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
    countBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    countValue: { fontSize: 36, fontWeight: 'bold', width: 60, textAlign: 'center' },
    resultsCard: { borderRadius: 20, padding: 24, minHeight: 180 },
    resultsContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    diceResults: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
    diceResult: { width: 64, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    diceValue: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    totalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
    totalLabel: { fontSize: 18 },
    totalValue: { fontSize: 36, fontWeight: 'bold' },
    placeholder: { alignItems: 'center', gap: 12 },
    placeholderText: { fontSize: 16 },
    rollBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 60, borderRadius: 16 },
    rollBtnText: { color: 'white', fontSize: 20, fontWeight: '600' },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    historyDice: { flexDirection: 'row', gap: 6 },
    historyDieSmall: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    historyDieText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    historyTotal: { fontSize: 16, fontWeight: '600' },
});
