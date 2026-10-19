import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const generateUUID = (): string => {
    // Generate UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const generateShortUUID = (): string => {
    return 'xxxxxxxxxxxx'.replace(/x/g, () => {
        return ((Math.random() * 16) | 0).toString(16);
    });
};

const generateNanoID = (size = 21): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let id = '';
    for (let i = 0; i < size; i++) {
        id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return id;
};

type IdType = 'uuid' | 'short' | 'nanoid';

export default function UuidGeneratorTool() {
    const [generatedIds, setGeneratedIds] = useState<string[]>([]);
    const [idType, setIdType] = useState<IdType>('uuid');
    const [count, setCount] = useState(1);
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const idTypes: { id: IdType; name: string; desc: string; example: string }[] = [
        { id: 'uuid', name: 'UUID v4', desc: '36 characters', example: '550e8400-e29b-41d4-a716-446655440000' },
        { id: 'short', name: 'Short ID', desc: '12 characters', example: 'a1b2c3d4e5f6' },
        { id: 'nanoid', name: 'Nano ID', desc: '21 characters', example: 'V1StGXR8_Z5jdHi6B-myT' },
    ];

    const generate = () => {
        const ids: string[] = [];
        for (let i = 0; i < count; i++) {
            switch (idType) {
                case 'uuid':
                    ids.push(generateUUID());
                    break;
                case 'short':
                    ids.push(generateShortUUID());
                    break;
                case 'nanoid':
                    ids.push(generateNanoID());
                    break;
            }
        }
        setGeneratedIds(ids);
        showToast(`Generated ${count} ID${count > 1 ? 's' : ''}!`, 'success');
    };

    const copyId = async (id: string) => {
        await Clipboard.setStringAsync(id);
        showToast('Copied!', 'success');
        onToolComplete();
    };

    const copyAll = async () => {
        await Clipboard.setStringAsync(generatedIds.join('\n'));
        showToast('All IDs copied!', 'success');
        onToolComplete();
    };

    const countOptions = [1, 5, 10, 25, 50];

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* ID Type Selection */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>ID Type</Text>
                <View style={styles.typeGrid}>
                    {idTypes.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            onPress={() => setIdType(type.id)}
                            style={[styles.typeBtn, idType === type.id && { backgroundColor: primaryColor, borderColor: primaryColor }]}
                        >
                            <Text style={[styles.typeName, { color: idType === type.id ? 'white' : textColor }]}>{type.name}</Text>
                            <Text style={[styles.typeDesc, { color: idType === type.id ? 'rgba(255,255,255,0.7)' : textSecondaryColor }]}>{type.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Count Selection */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>How many?</Text>
                <View style={styles.countRow}>
                    {countOptions.map((c) => (
                        <TouchableOpacity
                            key={c}
                            onPress={() => setCount(c)}
                            style={[styles.countBtn, count === c && { backgroundColor: primaryColor }]}
                        >
                            <Text style={[styles.countText, { color: count === c ? 'white' : textSecondaryColor }]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity onPress={generate} style={[styles.generateBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name="refresh" size={22} color="white" />
                <Text style={styles.generateBtnText}>Generate {count} {idTypes.find((t) => t.id === idType)?.name}</Text>
            </TouchableOpacity>

            {/* Results */}
            {generatedIds.length > 0 && (
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.resultsHeader}>
                        <Text style={[styles.label, { color: textColor }]}>Generated IDs</Text>
                        {generatedIds.length > 1 && (
                            <TouchableOpacity onPress={copyAll} style={[styles.copyAllBtn, { backgroundColor: primaryColor + '15' }]}>
                                <MaterialIcons name="content-copy" size={14} color={primaryColor} />
                                <Text style={{ color: primaryColor, fontWeight: '600', fontSize: 12 }}>Copy All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.idList}>
                        {generatedIds.map((id, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => copyId(id)}
                                style={[styles.idRow, { backgroundColor }]}
                            >
                                <Text style={[styles.idText, { color: textColor }]} selectable>{id}</Text>
                                <MaterialIcons name="content-copy" size={18} color={textSecondaryColor} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Info */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>About IDs</Text>
                {idTypes.map((type) => (
                    <View key={type.id} style={styles.infoRow}>
                        <View style={[styles.infoBadge, { backgroundColor: primaryColor + '20' }]}>
                            <Text style={[styles.infoBadgeText, { color: primaryColor }]}>{type.name}</Text>
                        </View>
                        <Text style={[styles.infoDesc, { color: textSecondaryColor }]}>
                            {type.id === 'uuid' && 'Standard 128-bit unique identifier. Very low collision probability.'}
                            {type.id === 'short' && 'Shorter alternative for URLs and human-readable IDs.'}
                            {type.id === 'nanoid' && 'Smaller, URL-safe, secure random ID generator.'}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    typeGrid: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center' },
    typeName: { fontSize: 14, fontWeight: '600' },
    typeDesc: { fontSize: 11, marginTop: 4 },
    countRow: { flexDirection: 'row', gap: 8 },
    countBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
    countText: { fontSize: 16, fontWeight: '600' },
    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 14 },
    generateBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    copyAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    idList: { gap: 8 },
    idRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10 },
    idText: { flex: 1, fontSize: 12, fontFamily: 'monospace', marginRight: 8 },
    infoRow: { marginTop: 12 },
    infoBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 6 },
    infoBadgeText: { fontSize: 11, fontWeight: '600' },
    infoDesc: { fontSize: 12, lineHeight: 18 },
});
