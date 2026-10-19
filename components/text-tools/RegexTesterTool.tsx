import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Match {
    text: string;
    index: number;
    groups?: string[];
}

export default function RegexTesterTool() {
    const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
    const [testText, setTestText] = useState(`Contact us at:
hello@example.com
support@company.org
invalid-email
test@domain.net`);
    const [flags, setFlags] = useState({ global: true, caseInsensitive: false, multiline: true });
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const { matches, error, regex } = useMemo(() => {
        if (!pattern.trim()) return { matches: [], error: null, regex: null };

        try {
            let flagStr = '';
            if (flags.global) flagStr += 'g';
            if (flags.caseInsensitive) flagStr += 'i';
            if (flags.multiline) flagStr += 'm';

            const regex = new RegExp(pattern, flagStr);
            const matchResults: Match[] = [];
            let match;

            if (flags.global) {
                while ((match = regex.exec(testText)) !== null) {
                    matchResults.push({
                        text: match[0],
                        index: match.index,
                        groups: match.slice(1).length > 0 ? match.slice(1) : undefined,
                    });
                    // Prevent infinite loop on zero-length matches
                    if (match[0].length === 0) regex.lastIndex++;
                }
            } else {
                match = regex.exec(testText);
                if (match) {
                    matchResults.push({
                        text: match[0],
                        index: match.index,
                        groups: match.slice(1).length > 0 ? match.slice(1) : undefined,
                    });
                }
            }

            return { matches: matchResults, error: null, regex };
        } catch (e: any) {
            return { matches: [], error: e.message, regex: null };
        }
    }, [pattern, testText, flags]);

    const commonPatterns = [
        { name: 'Email', pattern: '\\b[\\w.-]+@[\\w.-]+\\.\\w+\\b' },
        { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w.-]*)*' },
        { name: 'Phone', pattern: '\\+?\\d{1,3}[-.\\s]?\\d{3}[-.\\s]?\\d{3}[-.\\s]?\\d{4}' },
        { name: 'IP Address', pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b' },
        { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}' },
        { name: 'Hex Color', pattern: '#[0-9A-Fa-f]{6}\\b' },
    ];

    const copyPattern = async () => {
        await Clipboard.setStringAsync(pattern);
        showToast('Pattern copied!', 'success');
    };

    const copyMatches = async () => {
        const text = matches.map((m) => m.text).join('\n');
        await Clipboard.setStringAsync(text);
        showToast(`${matches.length} matches copied!`, 'success');
        onToolComplete();
    };

    const applyCommonPattern = (p: string) => {
        setPattern(p);
    };

    const highlightMatches = () => {
        if (matches.length === 0) return testText;

        let result = [];
        let lastEnd = 0;

        // Sort matches by index
        const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

        for (const match of sortedMatches) {
            // Text before match
            if (match.index > lastEnd) {
                result.push({ text: testText.slice(lastEnd, match.index), isMatch: false });
            }
            // The match itself
            result.push({ text: match.text, isMatch: true });
            lastEnd = match.index + match.text.length;
        }

        // Text after last match
        if (lastEnd < testText.length) {
            result.push({ text: testText.slice(lastEnd), isMatch: false });
        }

        return result;
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Pattern Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.label, { color: textColor }]}>Regular Expression</Text>
                    <TouchableOpacity onPress={copyPattern}>
                        <MaterialIcons name="content-copy" size={18} color={primaryColor} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.patternContainer, { backgroundColor, borderColor: error ? '#ef4444' : textSecondaryColor + '40' }]}>
                    <Text style={[styles.patternSlash, { color: textSecondaryColor }]}>/</Text>
                    <TextInput
                        style={[styles.patternInput, { color: textColor }]}
                        value={pattern}
                        onChangeText={setPattern}
                        placeholder="Enter regex pattern..."
                        placeholderTextColor={textSecondaryColor}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <Text style={[styles.patternSlash, { color: textSecondaryColor }]}>/</Text>
                    <Text style={[styles.flagsDisplay, { color: primaryColor }]}>
                        {flags.global ? 'g' : ''}{flags.caseInsensitive ? 'i' : ''}{flags.multiline ? 'm' : ''}
                    </Text>
                </View>
                {error && (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>

            {/* Flags */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor, marginBottom: 12 }]}>Flags</Text>
                {[
                    { key: 'global', label: 'Global (g)', desc: 'Find all matches' },
                    { key: 'caseInsensitive', label: 'Case Insensitive (i)', desc: 'Ignore case' },
                    { key: 'multiline', label: 'Multiline (m)', desc: '^ and $ match line boundaries' },
                ].map((flag) => (
                    <View key={flag.key} style={styles.flagRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.flagLabel, { color: textColor }]}>{flag.label}</Text>
                            <Text style={[styles.flagDesc, { color: textSecondaryColor }]}>{flag.desc}</Text>
                        </View>
                        <Switch
                            value={flags[flag.key as keyof typeof flags]}
                            onValueChange={(value) => setFlags({ ...flags, [flag.key]: value })}
                            trackColor={{ true: primaryColor }}
                            thumbColor="white"
                        />
                    </View>
                ))}
            </View>

            {/* Common Patterns */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor, marginBottom: 12 }]}>Common Patterns</Text>
                <View style={styles.patternsGrid}>
                    {commonPatterns.map((p) => (
                        <TouchableOpacity
                            key={p.name}
                            onPress={() => applyCommonPattern(p.pattern)}
                            style={[styles.patternBtn, { borderColor: textSecondaryColor + '40' }]}
                        >
                            <Text style={[styles.patternBtnText, { color: textColor }]}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Test Text */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <Text style={[styles.label, { color: textColor }]}>Test String</Text>
                <TextInput
                    style={[styles.textArea, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                    multiline
                    value={testText}
                    onChangeText={setTestText}
                    placeholder="Enter text to test..."
                    placeholderTextColor={textSecondaryColor}
                    textAlignVertical="top"
                />
            </View>

            {/* Matches */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.label, { color: textColor }]}>
                        Matches ({matches.length})
                    </Text>
                    {matches.length > 0 && (
                        <TouchableOpacity onPress={copyMatches} style={[styles.copyBtn, { backgroundColor: primaryColor + '15' }]}>
                            <MaterialIcons name="content-copy" size={14} color={primaryColor} />
                            <Text style={{ color: primaryColor, fontWeight: '600', fontSize: 12 }}>Copy All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {matches.length > 0 ? (
                    <View style={styles.matchesList}>
                        {matches.slice(0, 20).map((match, index) => (
                            <View key={index} style={[styles.matchItem, { backgroundColor: primaryColor + '10' }]}>
                                <View style={styles.matchHeader}>
                                    <Text style={[styles.matchIndex, { color: textSecondaryColor }]}>#{index + 1}</Text>
                                    <Text style={[styles.matchPosition, { color: textSecondaryColor }]}>@{match.index}</Text>
                                </View>
                                <Text style={[styles.matchText, { color: textColor }]} selectable>{match.text}</Text>
                                {match.groups && (
                                    <Text style={[styles.matchGroups, { color: textSecondaryColor }]}>
                                        Groups: {match.groups.join(', ')}
                                    </Text>
                                )}
                            </View>
                        ))}
                        {matches.length > 20 && (
                            <Text style={[styles.moreMatches, { color: textSecondaryColor }]}>
                                + {matches.length - 20} more matches
                            </Text>
                        )}
                    </View>
                ) : (
                    <Text style={[styles.noMatches, { color: textSecondaryColor }]}>
                        {error ? 'Invalid regex pattern' : 'No matches found'}
                    </Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600' },
    patternContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
    patternSlash: { fontSize: 18, fontWeight: '300' },
    patternInput: { flex: 1, fontSize: 15, fontFamily: 'monospace', paddingVertical: 12 },
    flagsDisplay: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
    errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    errorText: { color: '#ef4444', fontSize: 12 },
    flagRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    flagLabel: { fontSize: 14, fontWeight: '500' },
    flagDesc: { fontSize: 12, marginTop: 2 },
    patternsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    patternBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    patternBtnText: { fontSize: 13, fontWeight: '500' },
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 120, fontFamily: 'monospace', marginTop: 8 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    matchesList: { gap: 8 },
    matchItem: { padding: 12, borderRadius: 10 },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    matchIndex: { fontSize: 11, fontWeight: '600' },
    matchPosition: { fontSize: 11 },
    matchText: { fontSize: 14, fontFamily: 'monospace' },
    matchGroups: { fontSize: 11, marginTop: 4 },
    noMatches: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
    moreMatches: { textAlign: 'center', fontSize: 12, paddingTop: 8 },
});
