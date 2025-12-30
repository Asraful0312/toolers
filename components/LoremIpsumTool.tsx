import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
];

export default function LoremIpsumTool() {
  const [paragraphs, setParagraphs] = useState(3);
  const [result, setResult] = useState('');
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const generateParagraph = () => {
    const sentenceCount = Math.floor(Math.random() * 4) + 4;
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      const wordCount = Math.floor(Math.random() * 10) + 8;
      const words = [];
      for (let j = 0; j < wordCount; j++) {
        words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
      }
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      sentences.push(words.join(' ') + '.');
    }
    return sentences.join(' ');
  };

  const generate = () => {
    const paras = [];
    for (let i = 0; i < paragraphs; i++) {
      paras.push(generateParagraph());
    }
    setResult(paras.join('\n\n'));
  };

  const copyResult = async () => {
    await Clipboard.setStringAsync(result);
    showToast('Copied to clipboard!');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>Number of Paragraphs</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity onPress={() => setParagraphs(Math.max(1, paragraphs - 1))} style={[styles.counterBtn, { backgroundColor: primaryColor + '1A' }]}>
            <MaterialIcons name="remove" size={24} color={primaryColor} />
          </TouchableOpacity>
          <Text style={[styles.counterValue, { color: textColor }]}>{paragraphs}</Text>
          <TouchableOpacity onPress={() => setParagraphs(Math.min(10, paragraphs + 1))} style={[styles.counterBtn, { backgroundColor: primaryColor + '1A' }]}>
            <MaterialIcons name="add" size={24} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={generate} style={[styles.generateBtn, { backgroundColor: primaryColor }]}>
          <MaterialIcons name="auto-awesome" size={20} color="white" />
          <Text style={styles.generateBtnText}>Generate Lorem Ipsum</Text>
        </TouchableOpacity>
      </View>

      {result ? (
        <>
          <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>GENERATED TEXT</Text>
          <View style={[styles.resultContainer, { backgroundColor: cardColor }]}>
            <Text style={[styles.resultText, { color: textColor }]}>{result}</Text>
            <TouchableOpacity onPress={copyResult} style={[styles.copyButton, { backgroundColor: primaryColor }]}>
              <MaterialIcons name="content-copy" size={18} color="white" />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  card: { borderRadius: 16, padding: 20, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 },
  counterBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 28, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  generateBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  resultContainer: { borderRadius: 16, padding: 16 },
  resultText: { fontSize: 14, lineHeight: 22 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  copyButtonText: { color: 'white', fontWeight: '600' },
});
