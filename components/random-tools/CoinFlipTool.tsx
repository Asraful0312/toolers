import { useAds } from '@/context/AdContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CoinResult = 'heads' | 'tails' | null;

export default function CoinFlipTool() {
    const [result, setResult] = useState<CoinResult>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [stats, setStats] = useState({ heads: 0, tails: 0 });
    const [history, setHistory] = useState<CoinResult[]>([]);
    const { onToolComplete } = useAds();

    const flipAnim = useRef(new Animated.Value(0)).current;

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#14b8a6';

    const flipCoin = () => {
        if (isFlipping) return;

        setIsFlipping(true);
        flipAnim.setValue(0);

        // Random result
        const newResult: CoinResult = Math.random() < 0.5 ? 'heads' : 'tails';

        // Animate flip
        Animated.timing(flipAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => {
            setResult(newResult);
            setIsFlipping(false);
            setStats(prev => ({
                ...prev,
                [newResult]: prev[newResult] + 1,
            }));
            setHistory(prev => [newResult, ...prev.slice(0, 19)]);
            onToolComplete();
        });
    };

    const resetStats = () => {
        setStats({ heads: 0, tails: 0 });
        setHistory([]);
        setResult(null);
    };

    const spin = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '1800deg'],
    });

    const totalFlips = stats.heads + stats.tails;
    const headsPercent = totalFlips > 0 ? ((stats.heads / totalFlips) * 100).toFixed(1) : '0';
    const tailsPercent = totalFlips > 0 ? ((stats.tails / totalFlips) * 100).toFixed(1) : '0';

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Coin Display */}
            <View style={[styles.coinCard, { backgroundColor: cardColor }]}>
                <TouchableOpacity onPress={flipCoin} disabled={isFlipping} activeOpacity={0.9}>
                    <Animated.View
                        style={[
                            styles.coin,
                            {
                                backgroundColor: result === 'heads' ? '#f59e0b' : result === 'tails' ? '#6b7280' : primaryColor,
                                transform: [{ rotateY: spin }],
                            },
                        ]}
                    >
                        {isFlipping ? (
                            <MaterialIcons name="autorenew" size={64} color="white" />
                        ) : result ? (
                            <>
                                <MaterialIcons
                                    name={result === 'heads' ? 'face' : 'toll'}
                                    size={64}
                                    color="white"
                                />
                                <Text style={styles.coinText}>{result.toUpperCase()}</Text>
                            </>
                        ) : (
                            <>
                                <MaterialIcons name="touch-app" size={48} color="white" />
                                <Text style={styles.coinHint}>Tap to Flip</Text>
                            </>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {/* Flip Button */}
            <TouchableOpacity
                onPress={flipCoin}
                disabled={isFlipping}
                style={[styles.flipBtn, { backgroundColor: primaryColor, opacity: isFlipping ? 0.6 : 1 }]}
            >
                <MaterialIcons name="refresh" size={24} color="white" />
                <Text style={styles.flipBtnText}>{isFlipping ? 'Flipping...' : 'Flip Coin'}</Text>
            </TouchableOpacity>

            {/* Statistics */}
            {totalFlips > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.statsHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Statistics ({totalFlips} flips)</Text>
                        <TouchableOpacity onPress={resetStats}>
                            <Text style={{ color: primaryColor, fontWeight: '600' }}>Reset</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
                                <MaterialIcons name="face" size={24} color="#f59e0b" />
                            </View>
                            <Text style={[styles.statValue, { color: textColor }]}>{stats.heads}</Text>
                            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Heads ({headsPercent}%)</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#6b728020' }]}>
                                <MaterialIcons name="toll" size={24} color="#6b7280" />
                            </View>
                            <Text style={[styles.statValue, { color: textColor }]}>{stats.tails}</Text>
                            <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Tails ({tailsPercent}%)</Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressHeads, { width: `${headsPercent}%` }]} />
                        <View style={[styles.progressTails, { width: `${tailsPercent}%` }]} />
                    </View>
                </View>
            )}

            {/* History */}
            {history.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Recent Flips</Text>
                    <View style={styles.historyGrid}>
                        {history.map((flip, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.historyItem,
                                    { backgroundColor: flip === 'heads' ? '#f59e0b' : '#6b7280' },
                                ]}
                            >
                                <MaterialIcons name={flip === 'heads' ? 'face' : 'toll'} size={16} color="white" />
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 20, paddingBottom: 40 },
    coinCard: { borderRadius: 20, padding: 40, alignItems: 'center' },
    coin: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    coinText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
    coinHint: { color: 'white', fontSize: 14, marginTop: 8, opacity: 0.8 },
    flipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 16 },
    flipBtnText: { color: 'white', fontSize: 18, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16 },
    statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600' },
    statsRow: { flexDirection: 'row', alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center' },
    statIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontSize: 32, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 4 },
    statDivider: { width: 1, height: 60, backgroundColor: 'rgba(0,0,0,0.1)' },
    progressBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 16 },
    progressHeads: { backgroundColor: '#f59e0b' },
    progressTails: { backgroundColor: '#6b7280' },
    historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    historyItem: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
