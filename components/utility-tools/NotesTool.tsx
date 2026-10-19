import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    color: string;
}

const STORAGE_KEY = '@toolers_notes';

const NOTE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export default function NotesTool() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editColor, setEditColor] = useState(NOTE_COLORS[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useToast();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = '#6366f1';


    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                setNotes(JSON.parse(data));
            }
        } catch (e) {
            console.error('Failed to load notes', e);
        }
    };

    const saveNotes = async (newNotes: Note[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
            setNotes(newNotes);
        } catch (e) {
            console.error('Failed to save notes', e);
        }
    };

    const createNote = () => {
        setEditTitle('');
        setEditContent('');
        setEditColor(NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]);
        setSelectedNote(null);
        setIsEditing(true);
    };

    const editNote = (note: Note) => {
        setEditTitle(note.title);
        setEditContent(note.content);
        setEditColor(note.color);
        setSelectedNote(note);
        setIsEditing(true);
    };

    const saveNote = () => {
        if (!editTitle.trim() && !editContent.trim()) {
            showToast('Note is empty', 'error');
            return;
        }

        const now = Date.now();
        if (selectedNote) {
            // Update existing note
            const updated = notes.map(n =>
                n.id === selectedNote.id
                    ? { ...n, title: editTitle.trim(), content: editContent.trim(), color: editColor, updatedAt: now }
                    : n
            );
            saveNotes(updated);
            showToast('Note updated!', 'success');
        } else {
            // Create new note
            const newNote: Note = {
                id: now.toString(),
                title: editTitle.trim() || 'Untitled',
                content: editContent.trim(),
                createdAt: now,
                updatedAt: now,
                color: editColor,
            };
            saveNotes([newNote, ...notes]);
            showToast('Note created!', 'success');
        }
        setIsEditing(false);
    };

    const deleteNote = (id: string) => {
        Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    saveNotes(notes.filter(n => n.id !== id));
                    showToast('Note deleted', 'success');
                }
            },
        ]);
    };

    const copyNote = async (note: Note) => {
        await Clipboard.setStringAsync(`${note.title}\n\n${note.content}`);
        showToast('Copied!', 'success');
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    if (isEditing) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                <View style={styles.editorHeader}>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.editorTitle, { color: textColor }]}>
                        {selectedNote ? 'Edit Note' : 'New Note'}
                    </Text>
                    <TouchableOpacity onPress={saveNote} style={[styles.saveBtn, { backgroundColor: primaryColor }]}>
                        <MaterialIcons name="check" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.editorContent}>
                    <TextInput
                        style={[styles.titleInput, { color: textColor }]}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        placeholder="Title"
                        placeholderTextColor={textSecondaryColor}
                    />
                    <TextInput
                        style={[styles.contentInput, { color: textColor }]}
                        value={editContent}
                        onChangeText={setEditContent}
                        placeholder="Start typing..."
                        placeholderTextColor={textSecondaryColor}
                        multiline
                        textAlignVertical="top"
                    />
                </ScrollView>

                <View style={[styles.colorPicker, { backgroundColor: cardColor }]}>
                    {NOTE_COLORS.map((color) => (
                        <TouchableOpacity
                            key={color}
                            onPress={() => setEditColor(color)}
                            style={[styles.colorBtn, { backgroundColor: color }]}
                        >
                            {editColor === color && <MaterialIcons name="check" size={18} color="white" />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.searchBar, { backgroundColor: cardColor }]}>
                    <MaterialIcons name="search" size={20} color={textSecondaryColor} />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search notes..."
                        placeholderTextColor={textSecondaryColor}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close" size={20} color={textSecondaryColor} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Notes Grid */}
            <ScrollView style={styles.notesContainer} contentContainerStyle={styles.notesContent}>
                {filteredNotes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="note-add" size={64} color={textSecondaryColor + '50'} />
                        <Text style={[styles.emptyTitle, { color: textColor }]}>
                            {searchQuery ? 'No notes found' : 'No notes yet'}
                        </Text>
                        <Text style={[styles.emptyDesc, { color: textSecondaryColor }]}>
                            {searchQuery ? 'Try a different search' : 'Tap + to create your first note'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.notesGrid}>
                        {filteredNotes.map((note) => (
                            <TouchableOpacity
                                key={note.id}
                                onPress={() => editNote(note)}
                                onLongPress={() => deleteNote(note.id)}
                                style={[styles.noteCard, { backgroundColor: cardColor }]}
                            >
                                <View style={[styles.noteAccent, { backgroundColor: note.color }]} />
                                <Text style={[styles.noteTitle, { color: textColor }]} numberOfLines={1}>
                                    {note.title}
                                </Text>
                                <Text style={[styles.notePreview, { color: textSecondaryColor }]} numberOfLines={3}>
                                    {note.content}
                                </Text>
                                <View style={styles.noteFooter}>
                                    <Text style={[styles.noteDate, { color: textSecondaryColor }]}>
                                        {formatDate(note.updatedAt)}
                                    </Text>
                                    <TouchableOpacity onPress={() => copyNote(note)}>
                                        <MaterialIcons name="content-copy" size={16} color={textSecondaryColor} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity onPress={createNote} style={[styles.fab, { backgroundColor: primaryColor }]}>
                <MaterialIcons name="add" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, paddingBottom: 8 },
    searchBar: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, paddingHorizontal: 14, gap: 10 },
    searchInput: { flex: 1, fontSize: 15 },
    notesContainer: { flex: 1 },
    notesContent: { padding: 16, paddingTop: 8 },
    notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    noteCard: { width: '48%', borderRadius: 14, padding: 14, minHeight: 140, position: 'relative', overflow: 'hidden' },
    noteAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
    noteTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
    notePreview: { fontSize: 13, lineHeight: 18, flex: 1 },
    noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    noteDate: { fontSize: 11 },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600' },
    emptyDesc: { fontSize: 14 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
    backBtn: { padding: 8 },
    editorTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
    saveBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    editorContent: { flex: 1, padding: 16 },
    titleInput: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
    contentInput: { fontSize: 16, lineHeight: 24, flex: 1, minHeight: 200 },
    colorPicker: { flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 16 },
    colorBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
