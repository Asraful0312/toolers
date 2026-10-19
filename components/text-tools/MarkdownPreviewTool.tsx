import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';

// Simple markdown to styled text converter
const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
        // Headers
        if (line.startsWith('### ')) return { type: 'h3', content: line.slice(4), key: index };
        if (line.startsWith('## ')) return { type: 'h2', content: line.slice(3), key: index };
        if (line.startsWith('# ')) return { type: 'h1', content: line.slice(2), key: index };
        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) return { type: 'li', content: line.slice(2), key: index };
        if (/^\d+\.\s/.test(line)) return { type: 'ol', content: line.replace(/^\d+\.\s/, ''), key: index };
        // Blockquote
        if (line.startsWith('> ')) return { type: 'quote', content: line.slice(2), key: index };
        // Code block marker
        if (line.startsWith('```')) return { type: 'code-marker', content: '', key: index };
        // Horizontal rule
        if (line === '---' || line === '***') return { type: 'hr', content: '', key: index };
        // Empty line
        if (line.trim() === '') return { type: 'empty', content: '', key: index };
        // Regular paragraph
        return { type: 'p', content: line, key: index };
    });
};

// Parse inline markdown (bold, italic, code, links)
const parseInline = (text: string): { text: string; bold?: boolean; italic?: boolean; code?: boolean }[] => {
    const parts: { text: string; bold?: boolean; italic?: boolean; code?: boolean }[] = [];
    let remaining = text;

    // Simple regex-based parsing
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.slice(lastIndex, match.index) });
        }
        if (match[2]) parts.push({ text: match[2], bold: true });
        else if (match[4]) parts.push({ text: match[4], italic: true });
        else if (match[6]) parts.push({ text: match[6], code: true });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ text }];
};

export default function MarkdownPreviewTool() {
    const [markdown, setMarkdown] = useState(`# Welcome to Markdown Preview

## Features
- **Bold text** with asterisks
- *Italic text* with single asterisks
- \`Inline code\` with backticks

### Lists
1. Numbered lists
2. Work too

> This is a blockquote

---

Regular paragraph text goes here.`);
    const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>('split');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();
    const { width } = useWindowDimensions();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);

    const copyMarkdown = async () => {
        await Clipboard.setStringAsync(markdown);
        showToast('Markdown copied!', 'success');
        onToolComplete();
    };

    const renderParsedLine = (item: ReturnType<typeof parseMarkdown>[0]) => {
        const inlineParts = parseInline(item.content);

        const renderInline = () => (
            <Text>
                {inlineParts.map((part, i) => (
                    <Text
                        key={i}
                        style={[
                            part.bold && { fontWeight: 'bold' },
                            part.italic && { fontStyle: 'italic' },
                            part.code && { fontFamily: 'monospace', backgroundColor: cardColor, paddingHorizontal: 4 },
                        ]}
                    >
                        {part.text}
                    </Text>
                ))}
            </Text>
        );

        switch (item.type) {
            case 'h1':
                return <Text style={[styles.h1, { color: textColor }]}>{renderInline()}</Text>;
            case 'h2':
                return <Text style={[styles.h2, { color: textColor }]}>{renderInline()}</Text>;
            case 'h3':
                return <Text style={[styles.h3, { color: textColor }]}>{renderInline()}</Text>;
            case 'li':
                return (
                    <View style={styles.listItem}>
                        <Text style={[styles.bullet, { color: primaryColor }]}>•</Text>
                        <Text style={[styles.listText, { color: textColor }]}>{renderInline()}</Text>
                    </View>
                );
            case 'ol':
                return (
                    <View style={styles.listItem}>
                        <Text style={[styles.listText, { color: textColor }]}>{renderInline()}</Text>
                    </View>
                );
            case 'quote':
                return (
                    <View style={[styles.blockquote, { borderLeftColor: primaryColor, backgroundColor: primaryColor + '10' }]}>
                        <Text style={[styles.quoteText, { color: textSecondaryColor }]}>{renderInline()}</Text>
                    </View>
                );
            case 'hr':
                return <View style={[styles.hr, { backgroundColor: textSecondaryColor + '40' }]} />;
            case 'empty':
                return <View style={{ height: 8 }} />;
            default:
                return <Text style={[styles.paragraph, { color: textColor }]}>{renderInline()}</Text>;
        }
    };

    const isSplit = activeTab === 'split';

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: cardColor }]}>
                {(['edit', 'split', 'preview'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && { backgroundColor: primaryColor }]}
                    >
                        <MaterialIcons
                            name={tab === 'edit' ? 'edit' : tab === 'preview' ? 'visibility' : 'vertical-split'}
                            size={18}
                            color={activeTab === tab ? 'white' : textSecondaryColor}
                        />
                        <Text style={[styles.tabText, { color: activeTab === tab ? 'white' : textSecondaryColor }]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <View style={[styles.content, isSplit && styles.splitContent]}>
                {/* Editor */}
                {(activeTab === 'edit' || activeTab === 'split') && (
                    <View style={[styles.pane, isSplit && { flex: 1 }]}>
                        <View style={styles.paneHeader}>
                            <Text style={[styles.paneTitle, { color: textSecondaryColor }]}>MARKDOWN</Text>
                            <TouchableOpacity onPress={copyMarkdown}>
                                <MaterialIcons name="content-copy" size={18} color={textSecondaryColor} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.editor, { backgroundColor: cardColor, color: textColor }]}
                            multiline
                            value={markdown}
                            onChangeText={setMarkdown}
                            placeholder="Write markdown here..."
                            placeholderTextColor={textSecondaryColor}
                            textAlignVertical="top"
                        />
                    </View>
                )}

                {/* Preview */}
                {(activeTab === 'preview' || activeTab === 'split') && (
                    <View style={[styles.pane, isSplit && { flex: 1 }]}>
                        <View style={styles.paneHeader}>
                            <Text style={[styles.paneTitle, { color: textSecondaryColor }]}>PREVIEW</Text>
                        </View>
                        <ScrollView style={[styles.preview, { backgroundColor: cardColor }]} contentContainerStyle={styles.previewContent}>
                            {parsed.map((item) => (
                                <View key={item.key}>{renderParsedLine(item)}</View>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: { flexDirection: 'row', margin: 16, borderRadius: 12, padding: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
    tabText: { fontSize: 13, fontWeight: '600' },
    content: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
    splitContent: { flexDirection: 'column', gap: 12 },
    pane: { flex: 1 },
    paneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    paneTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    editor: { flex: 1, borderRadius: 12, padding: 16, fontSize: 14, fontFamily: 'monospace' },
    preview: { flex: 1, borderRadius: 12, padding: 16 },
    previewContent: { gap: 4 },
    h1: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
    h2: { fontSize: 22, fontWeight: 'bold', marginBottom: 6, marginTop: 10 },
    h3: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, marginTop: 8 },
    paragraph: { fontSize: 15, lineHeight: 22 },
    listItem: { flexDirection: 'row', marginVertical: 2 },
    bullet: { fontSize: 16, marginRight: 8, fontWeight: 'bold' },
    listText: { flex: 1, fontSize: 15, lineHeight: 22 },
    blockquote: { borderLeftWidth: 4, paddingLeft: 12, paddingVertical: 8, marginVertical: 8, borderRadius: 4 },
    quoteText: { fontSize: 15, fontStyle: 'italic' },
    hr: { height: 1, marginVertical: 16 },
});
