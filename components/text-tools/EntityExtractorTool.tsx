import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import nlp from 'compromise';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TOOL_COLOR = '#3b82f6';

interface ExtractedData {
    people: string[];
    places: string[];
    organizations: string[];
    emails: string[];
    urls: string[];
    phones: string[];
    hashtags: string[];
}

export default function EntityExtractorTool() {
    const [text, setText] = useState('');
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');

    useEffect(() => {
        if (text.trim()) {
            extractEntities();
        } else {
            setExtractedData(null);
        }
    }, [text]);

    const extractEntities = () => {
        try {
            const doc = nlp(text);
            setExtractedData({
                people: [...new Set(doc.people().out('array') as string[])],
                places: [...new Set(doc.places().out('array') as string[])],
                organizations: [...new Set(doc.organizations().out('array') as string[])],
                emails: [...new Set(doc.emails().out('array') as string[])],
                urls: [...new Set(doc.urls().out('array') as string[])],
                phones: [...new Set(doc.phoneNumbers().out('array') as string[])],
                hashtags: [...new Set(doc.hashTags().out('array') as string[])],
            });
        } catch (error) {
            console.error('Extraction error:', error);
        }
    };

    const handleCopy = async (content: string) => {
        await Clipboard.setStringAsync(content);
        showToast('Copied!', 'success');
    };

    const handleCopyAll = async () => {
        if (!extractedData) return;
        const all = [
            ...extractedData.people,
            ...extractedData.places,
            ...extractedData.organizations,
            ...extractedData.emails,
            ...extractedData.urls,
            ...extractedData.phones,
            ...extractedData.hashtags,
        ].join('\n');
        await Clipboard.setStringAsync(all);
        showToast('All entities copied!', 'success');
        onToolComplete();
    };

    const handlePaste = async () => {
        const content = await Clipboard.getStringAsync();
        setText(content);
    };

    const handleClear = () => {
        setText('');
        setExtractedData(null);
    };

    const renderGroup = (title: string, items: string[], icon: keyof typeof MaterialIcons.glyphMap) => {
        if (!items || items.length === 0) return null;

        return (
            <View style={styles.groupContainer}>
                <View style={styles.groupHeader}>
                    <MaterialIcons name={icon} size={20} color={TOOL_COLOR} />
                    <Text style={[styles.groupTitle, { color: textColor }]}>{title}</Text>
                    <View style={[styles.badge, { backgroundColor: TOOL_COLOR }]}>
                        <Text style={styles.badgeText}>{items.length}</Text>
                    </View>
                </View>
                <View style={styles.chipContainer}>
                    {items.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.chip, { backgroundColor: cardColor, borderColor }]}
                            onPress={() => handleCopy(item)}
                        >
                            <Text style={[styles.chipText, { color: textColor }]}>{item}</Text>
                            <MaterialIcons name="content-copy" size={14} color={textSecondaryColor} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const hasResults = extractedData && (
        extractedData.people.length > 0 ||
        extractedData.places.length > 0 ||
        extractedData.organizations.length > 0 ||
        extractedData.emails.length > 0 ||
        extractedData.urls.length > 0 ||
        extractedData.phones.length > 0 ||
        extractedData.hashtags.length > 0
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: TOOL_COLOR + '15' }]}>
                <MaterialIcons name="person-search" size={32} color={TOOL_COLOR} />
                <Text style={[styles.headerTitle, { color: TOOL_COLOR }]}>Entity Extractor</Text>
                <Text style={[styles.headerDesc, { color: textSecondaryColor }]}>
                    Extract names, places, emails, URLs & more from text
                </Text>
            </View>

            {/* Input */}
            <View style={[styles.inputCard, { backgroundColor: cardColor }]}>
                <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Paste or type text here..."
                    placeholderTextColor={textSecondaryColor}
                    multiline
                    value={text}
                    onChangeText={setText}
                    textAlignVertical="top"
                />
                <View style={[styles.inputActions, { borderTopColor: borderColor }]}>
                    <TouchableOpacity style={styles.iconBtn} onPress={handlePaste}>
                        <MaterialIcons name="content-paste" size={20} color={TOOL_COLOR} />
                    </TouchableOpacity>
                    {text.length > 0 && (
                        <TouchableOpacity style={styles.iconBtn} onPress={handleClear}>
                            <MaterialIcons name="close" size={20} color={textSecondaryColor} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            {hasResults ? (
                <View style={styles.resultsContainer}>
                    {renderGroup('People', extractedData!.people, 'person')}
                    {renderGroup('Places', extractedData!.places, 'place')}
                    {renderGroup('Organizations', extractedData!.organizations, 'business')}
                    {renderGroup('Emails', extractedData!.emails, 'email')}
                    {renderGroup('URLs', extractedData!.urls, 'link')}
                    {renderGroup('Phone Numbers', extractedData!.phones, 'phone')}
                    {renderGroup('Hashtags', extractedData!.hashtags, 'tag')}

                    <TouchableOpacity
                        style={[styles.copyAllBtn, { backgroundColor: TOOL_COLOR }]}
                        onPress={handleCopyAll}
                    >
                        <MaterialIcons name="copy-all" size={20} color="white" />
                        <Text style={styles.copyAllText}>Copy All Entities</Text>
                    </TouchableOpacity>
                </View>
            ) : text.trim() ? (
                <View style={styles.noResults}>
                    <MaterialIcons name="search-off" size={48} color={textSecondaryColor} />
                    <Text style={[styles.noResultsText, { color: textSecondaryColor }]}>
                        No entities found in this text
                    </Text>
                </View>
            ) : null}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    headerDesc: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    inputCard: {
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 12,
        minHeight: 120,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    input: {
        fontSize: 16,
        minHeight: 100,
    },
    inputActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        paddingTop: 8,
        marginTop: 8,
        gap: 8,
    },
    iconBtn: {
        padding: 8,
    },
    resultsContainer: {
        padding: 16,
    },
    groupContainer: {
        marginBottom: 20,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    chipText: {
        fontSize: 14,
    },
    copyAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    copyAllText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    noResults: {
        alignItems: 'center',
        padding: 40,
    },
    noResultsText: {
        marginTop: 12,
        fontSize: 16,
    },
});
