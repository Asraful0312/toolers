import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RandomPickerTool() {
    const [items, setItems] = useState<string[]>([]);
    const [inputText, setInputText] = useState('');
    const [pickCount, setPickCount] = useState(1);
    const [pickedItems, setPickedItems] = useState<string[]>([]);
    const [isPicking, setIsPicking] = useState(false);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const scaleAnim = useRef(new Animated.Value(1)).current;

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#14b8a6';

    const addItem = () => {
        const trimmed = inputText.trim();
        if (!trimmed) {
            showToast('Enter an item', 'error');
            return;
        }
        if (items.includes(trimmed)) {
            showToast('Item already exists', 'error');
            return;
        }
        setItems([...items, trimmed]);
        setInputText('');
    };

    const addMultipleItems = () => {
        const newItems = inputText
            .split(/[,\n]/)
            .map(i => i.trim())
            .filter(i => i && !items.includes(i));

        if (newItems.length === 0) {
            showToast('No new items to add', 'error');
            return;
        }

        setItems([...items, ...newItems]);
        setInputText('');
        showToast(`Added ${newItems.length} items`, 'success');
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const clearAll = () => {
        setItems([]);
        setPickedItems([]);
    };

    const pickRandom = () => {
        if (items.length === 0) {
            showToast('Add items first', 'error');
            return;
        }
        if (pickCount > items.length) {
            showToast(`Can't pick ${pickCount} from ${items.length} items`, 'error');
            return;
        }

        setIsPicking(true);

        // Animation
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            // Shuffle and pick
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            const picked = shuffled.slice(0, pickCount);
            setPickedItems(picked);
            setIsPicking(false);
            onToolComplete();
        });
    };

    const sampleItems = ['Apple', 'Banana', 'Cherry', 'Mango', 'Orange', 'Grape', 'Peach', 'Kiwi'];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Add Items */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Add Items</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Enter item or items (comma separated)"
                        placeholderTextColor={textSecondaryColor}
                        onSubmitEditing={addItem}
                    />
                    <TouchableOpacity onPress={addItem} style={[styles.addBtn, { backgroundColor: primaryColor }]}>
                        <MaterialIcons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>
                <View style={styles.quickActions}>
                    <TouchableOpacity onPress={addMultipleItems} style={styles.quickBtn}>
                        <Text style={{ color: primaryColor, fontWeight: '600' }}>Add Multiple</Text>
                    </TouchableOpacity>
                    {items.length === 0 && (
                        <TouchableOpacity onPress={() => setItems(sampleItems)} style={styles.quickBtn}>
                            <Text style={{ color: primaryColor, fontWeight: '600' }}>Load Samples</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Items List */}
            {items.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.listHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Items ({items.length})</Text>
                        <TouchableOpacity onPress={clearAll}>
                            <Text style={{ color: '#ef4444', fontWeight: '600' }}>Clear All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.itemsGrid}>
                        {items.map((item, index) => (
                            <View key={index} style={[styles.itemChip, { backgroundColor: primaryColor + '15' }]}>
                                <Text style={[styles.itemText, { color: textColor }]} numberOfLines={1}>{item}</Text>
                                <TouchableOpacity onPress={() => removeItem(index)}>
                                    <MaterialIcons name="close" size={18} color={textSecondaryColor} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Pick Count */}
            {items.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Pick Count</Text>
                    <View style={styles.countRow}>
                        <TouchableOpacity
                            onPress={() => setPickCount(Math.max(1, pickCount - 1))}
                            style={[styles.countBtn, { backgroundColor: primaryColor + '20' }]}
                        >
                            <MaterialIcons name="remove" size={24} color={primaryColor} />
                        </TouchableOpacity>
                        <Text style={[styles.countValue, { color: textColor }]}>{pickCount}</Text>
                        <TouchableOpacity
                            onPress={() => setPickCount(Math.min(items.length, pickCount + 1))}
                            style={[styles.countBtn, { backgroundColor: primaryColor + '20' }]}
                        >
                            <MaterialIcons name="add" size={24} color={primaryColor} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Pick Button */}
            <TouchableOpacity
                onPress={pickRandom}
                disabled={isPicking || items.length === 0}
                style={[styles.pickBtn, { backgroundColor: primaryColor, opacity: items.length === 0 ? 0.5 : 1 }]}
            >
                <MaterialIcons name="shuffle" size={24} color="white" />
                <Text style={styles.pickBtnText}>{isPicking ? 'Picking...' : 'Pick Random'}</Text>
            </TouchableOpacity>

            {/* Results */}
            {pickedItems.length > 0 && (
                <Animated.View style={[styles.resultsCard, { backgroundColor: primaryColor, transform: [{ scale: scaleAnim }] }]}>
                    <MaterialIcons name="emoji-events" size={32} color="white" />
                    <Text style={styles.resultsLabel}>
                        {pickedItems.length === 1 ? 'Winner!' : `${pickedItems.length} Winners!`}
                    </Text>
                    {pickedItems.map((item, index) => (
                        <Text key={index} style={styles.resultItem}>{item}</Text>
                    ))}
                </Animated.View>
            )}

            {/* Empty State */}
            {items.length === 0 && (
                <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                    <MaterialIcons name="list-alt" size={64} color={textSecondaryColor + '50'} />
                    <Text style={[styles.emptyTitle, { color: textColor }]}>No Items Yet</Text>
                    <Text style={[styles.emptyDesc, { color: textSecondaryColor }]}>
                        Add items to pick from, or load sample items
                    </Text>
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
    inputRow: { flexDirection: 'row', gap: 10 },
    input: { flex: 1, height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
    addBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    quickActions: { flexDirection: 'row', gap: 16, marginTop: 12 },
    quickBtn: { paddingVertical: 6 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    itemChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, borderRadius: 20 },
    itemText: { fontSize: 14, flexShrink: 1 },
    countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
    countBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    countValue: { fontSize: 32, fontWeight: 'bold', width: 50, textAlign: 'center' },
    pickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 16 },
    pickBtnText: { color: 'white', fontSize: 18, fontWeight: '600' },
    resultsCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
    resultsLabel: { color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 },
    resultItem: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    emptyState: { borderRadius: 20, padding: 40, alignItems: 'center', gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600' },
    emptyDesc: { fontSize: 14, textAlign: 'center' },
});
