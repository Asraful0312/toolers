import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TextDiffTool() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const diff = useMemo(() => {
    if (!text1 && !text2) return null;

    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);

    const differences: { line: number; type: 'same' | 'added' | 'removed' | 'changed'; text1?: string; text2?: string }[] = [];

    for (let i = 0; i < maxLines; i++) {
      const l1 = lines1[i];
      const l2 = lines2[i];

      if (l1 === l2) {
        differences.push({ line: i + 1, type: 'same', text1: l1 });
      } else if (l1 === undefined) {
        differences.push({ line: i + 1, type: 'added', text2: l2 });
      } else if (l2 === undefined) {
        differences.push({ line: i + 1, type: 'removed', text1: l1 });
      } else {
        differences.push({ line: i + 1, type: 'changed', text1: l1, text2: l2 });
      }
    }

    const stats = {
      same: differences.filter(d => d.type === 'same').length,
      added: differences.filter(d => d.type === 'added').length,
      removed: differences.filter(d => d.type === 'removed').length,
      changed: differences.filter(d => d.type === 'changed').length,
    };

    return { differences, stats };
  }, [text1, text2]);

  const pasteText = async (setter: (t: string) => void) => {
    const clipboard = await Clipboard.getStringAsync();
    if (clipboard) {
      setter(clipboard);
      showToast('Pasted!', 'success');
    }
  };

  const swapTexts = () => {
    const temp = text1;
    setText1(text2);
    setText2(temp);
    onToolComplete();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'added': return '#22c55e';
      case 'removed': return '#ef4444';
      case 'changed': return '#f59e0b';
      default: return textSecondaryColor;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Text 1 */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.label, { color: textSecondaryColor }]}>ORIGINAL TEXT</Text>
          <TouchableOpacity onPress={() => pasteText(setText1)}>
            <MaterialIcons name="content-paste" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <TextInput
          value={text1}
          onChangeText={setText1}
          placeholder="Enter original text..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Swap Button */}
      <TouchableOpacity onPress={swapTexts} style={[styles.swapBtn, { backgroundColor: cardColor }]}>
        <MaterialIcons name="swap-vert" size={24} color={primaryColor} />
      </TouchableOpacity>

      {/* Text 2 */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.label, { color: textSecondaryColor }]}>MODIFIED TEXT</Text>
          <TouchableOpacity onPress={() => pasteText(setText2)}>
            <MaterialIcons name="content-paste" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <TextInput
          value={text2}
          onChangeText={setText2}
          placeholder="Enter modified text..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.textInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Stats */}
      {diff && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.label, { color: textSecondaryColor }]}>COMPARISON STATS</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statItem, { backgroundColor: textSecondaryColor + '15' }]}>
              <Text style={[styles.statValue, { color: textSecondaryColor }]}>{diff.stats.same}</Text>
              <Text style={[styles.statLabel, { color: textSecondaryColor }]}>Same</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#22c55e20' }]}>
              <Text style={[styles.statValue, { color: '#22c55e' }]}>{diff.stats.added}</Text>
              <Text style={[styles.statLabel, { color: '#22c55e' }]}>Added</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#ef444420' }]}>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{diff.stats.removed}</Text>
              <Text style={[styles.statLabel, { color: '#ef4444' }]}>Removed</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#f59e0b20' }]}>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>{diff.stats.changed}</Text>
              <Text style={[styles.statLabel, { color: '#f59e0b' }]}>Changed</Text>
            </View>
          </View>
        </View>
      )}

      {/* Diff Lines */}
      {diff && diff.differences.filter(d => d.type !== 'same').length > 0 && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.label, { color: textSecondaryColor }]}>DIFFERENCES</Text>
          {diff.differences.filter(d => d.type !== 'same').map((d, i) => (
            <View key={i} style={[styles.diffLine, { borderLeftColor: getTypeColor(d.type) }]}>
              <Text style={[styles.lineNum, { color: textSecondaryColor }]}>L{d.line}</Text>
              <View style={styles.diffContent}>
                {d.text1 !== undefined && (
                  <Text style={[styles.diffText, { color: d.type === 'removed' ? '#ef4444' : textSecondaryColor }]}>
                    - {d.text1}
                  </Text>
                )}
                {d.text2 !== undefined && (
                  <Text style={[styles.diffText, { color: '#22c55e' }]}>
                    + {d.text2}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  textInput: { fontSize: 14, padding: 14, borderRadius: 10, borderWidth: 1, minHeight: 80, lineHeight: 20 },
  swapBtn: { alignSelf: 'center', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginVertical: -8, zIndex: 1 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  diffLine: { flexDirection: 'row', borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10 },
  lineNum: { width: 30, fontSize: 11, fontWeight: '600' },
  diffContent: { flex: 1 },
  diffText: { fontSize: 13, lineHeight: 20 },
});
