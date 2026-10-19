import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Flashcard {
    id: string;
    front: string;
    back: string;
}

export default function FlashcardTool() {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFront, setEditFront] = useState('');
    const [editBack, setEditBack] = useState('');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#6366f1';


    const currentCard = cards[currentIndex];

    const addCard = () => {
        if (!editFront.trim() || !editBack.trim()) {
            showToast('Both sides are required', 'error');
            return;
        }
        const newCard: Flashcard = {
            id: Date.now().toString(),
            front: editFront.trim(),
            back: editBack.trim(),
        };
        setCards([...cards, newCard]);
        setEditFront('');
        setEditBack('');
        setIsEditing(false);
        showToast('Card added!', 'success');
        onToolComplete();
    };

    const deleteCard = (id: string) => {
        setCards(cards.filter(c => c.id !== id));
        if (currentIndex >= cards.length - 1) {
            setCurrentIndex(Math.max(0, cards.length - 2));
        }
        setIsFlipped(false);
        showToast('Card deleted', 'success');
    };

    const nextCard = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        }
    };

    const shuffle = () => {
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        showToast('Cards shuffled!', 'success');
        onToolComplete();
    };

    const sampleCards: Flashcard[] = [
        { id: '1', front: 'What is React?', back: 'A JavaScript library for building user interfaces' },
        { id: '2', front: 'What is JSX?', back: 'A syntax extension for JavaScript that allows HTML-like code' },
        { id: '3', front: 'What is a Hook?', back: 'Functions that let you use state and lifecycle features' },
        { id: '4', front: 'What is useState?', back: 'A Hook that adds state to functional components' },
    ];

    const loadSamples = () => {
        setCards(sampleCards);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Add/Edit Card */}
            {isEditing ? (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <Text style={[styles.label, { color: textColor }]}>Add New Card</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                        value={editFront}
                        onChangeText={setEditFront}
                        placeholder="Front side (question)"
                        placeholderTextColor={textSecondaryColor}
                        multiline
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                        value={editBack}
                        onChangeText={setEditBack}
                        placeholder="Back side (answer)"
                        placeholderTextColor={textSecondaryColor}
                        multiline
                    />
                    <View style={styles.editActions}>
                        <TouchableOpacity onPress={() => setIsEditing(false)} style={[styles.editBtn, { backgroundColor: cardColor }]}>
                            <Text style={{ color: textSecondaryColor }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={addCard} style={[styles.editBtn, { backgroundColor: primaryColor }]}>
                            <Text style={{ color: 'white', fontWeight: '600' }}>Add Card</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.headerBtn, { backgroundColor: primaryColor }]}>
                        <MaterialIcons name="add" size={20} color="white" />
                        <Text style={{ color: 'white', fontWeight: '600' }}>Add Card</Text>
                    </TouchableOpacity>
                    {cards.length === 0 && (
                        <TouchableOpacity onPress={loadSamples} style={[styles.headerBtn, { backgroundColor: cardColor }]}>
                            <MaterialIcons name="auto-fix-high" size={20} color={primaryColor} />
                            <Text style={{ color: primaryColor, fontWeight: '600' }}>Load Samples</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Flashcard Display */}
            {cards.length > 0 && (
                <>
                    <TouchableOpacity
                        onPress={() => setIsFlipped(!isFlipped)}
                        style={[styles.flashcard, { backgroundColor: isFlipped ? primaryColor : cardColor }]}
                        activeOpacity={0.9}
                    >
                        <View style={styles.cardBadge}>
                            <Text style={[styles.cardBadgeText, { color: isFlipped ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>
                                {isFlipped ? 'ANSWER' : 'QUESTION'}
                            </Text>
                        </View>
                        <Text style={[styles.flashcardText, { color: isFlipped ? 'white' : textColor }]}>
                            {isFlipped ? currentCard?.back : currentCard?.front}
                        </Text>
                        <Text style={[styles.tapHint, { color: isFlipped ? 'rgba(255,255,255,0.5)' : textSecondaryColor }]}>
                            Tap to flip
                        </Text>
                        <TouchableOpacity
                            onPress={() => deleteCard(currentCard?.id)}
                            style={styles.deleteBtn}
                        >
                            <MaterialIcons name="delete-outline" size={22} color={isFlipped ? 'rgba(255,255,255,0.5)' : textSecondaryColor} />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Navigation */}
                    <View style={styles.navigation}>
                        <TouchableOpacity
                            onPress={prevCard}
                            disabled={currentIndex === 0}
                            style={[styles.navBtn, { backgroundColor: cardColor, opacity: currentIndex === 0 ? 0.5 : 1 }]}
                        >
                            <MaterialIcons name="chevron-left" size={32} color={textSecondaryColor} />
                        </TouchableOpacity>

                        <View style={styles.progress}>
                            <Text style={[styles.progressText, { color: textColor }]}>
                                {currentIndex + 1} / {cards.length}
                            </Text>
                            <View style={[styles.progressBar, { backgroundColor: textSecondaryColor + '30' }]}>
                                <View style={[styles.progressFill, { width: `${((currentIndex + 1) / cards.length) * 100}%`, backgroundColor: primaryColor }]} />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={nextCard}
                            disabled={currentIndex === cards.length - 1}
                            style={[styles.navBtn, { backgroundColor: cardColor, opacity: currentIndex === cards.length - 1 ? 0.5 : 1 }]}
                        >
                            <MaterialIcons name="chevron-right" size={32} color={textSecondaryColor} />
                        </TouchableOpacity>
                    </View>

                    {/* Shuffle Button */}
                    {cards.length > 1 && (
                        <TouchableOpacity onPress={shuffle} style={[styles.shuffleBtn, { backgroundColor: cardColor }]}>
                            <MaterialIcons name="shuffle" size={20} color={primaryColor} />
                            <Text style={{ color: primaryColor, fontWeight: '600' }}>Shuffle Cards</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {/* Empty State */}
            {cards.length === 0 && !isEditing && (
                <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                    <MaterialIcons name="library-books" size={64} color={textSecondaryColor + '50'} />
                    <Text style={[styles.emptyTitle, { color: textColor }]}>No Flashcards Yet</Text>
                    <Text style={[styles.emptyDesc, { color: textSecondaryColor }]}>
                        Add your first card or load sample cards to get started
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
    input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 60, marginBottom: 12, textAlignVertical: 'top' },
    editActions: { flexDirection: 'row', gap: 10 },
    editBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
    headerActions: { flexDirection: 'row', gap: 10 },
    headerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
    flashcard: { height: 280, borderRadius: 20, padding: 24, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    cardBadge: { position: 'absolute', top: 16, left: 16 },
    cardBadgeText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
    flashcardText: { fontSize: 22, fontWeight: '500', textAlign: 'center', lineHeight: 32 },
    tapHint: { position: 'absolute', bottom: 16, fontSize: 12 },
    deleteBtn: { position: 'absolute', top: 12, right: 12, padding: 8 },
    navigation: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    navBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    progress: { flex: 1, alignItems: 'center', gap: 8 },
    progressText: { fontSize: 16, fontWeight: '600' },
    progressBar: { width: '100%', height: 4, borderRadius: 2 },
    progressFill: { height: '100%', borderRadius: 2 },
    shuffleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
    emptyState: { borderRadius: 20, padding: 40, alignItems: 'center', gap: 12 },
    emptyTitle: { fontSize: 20, fontWeight: '600' },
    emptyDesc: { fontSize: 14, textAlign: 'center' },
});
