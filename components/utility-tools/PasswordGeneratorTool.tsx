import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = '#6366f1';


  const generatePassword = () => {
    let chars = '';
    if (useLowercase) chars += CHAR_SETS.lowercase;
    if (useUppercase) chars += CHAR_SETS.uppercase;
    if (useNumbers) chars += CHAR_SETS.numbers;
    if (useSymbols) chars += CHAR_SETS.symbols;

    if (chars.length === 0) chars = CHAR_SETS.lowercase;

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setHistory((prev) => [newPassword, ...prev.slice(0, 9)]);
  };

  const copyPassword = async () => {
    if (password) {
      await Clipboard.setStringAsync(password);
      showToast('Password copied!');
    }
  };

  const copyHistoryItem = async (p: string) => {
    await Clipboard.setStringAsync(p);
    showToast('Copied!');
  };

  const getStrength = () => {
    let score = 0;
    if (useLowercase) score++;
    if (useUppercase) score++;
    if (useNumbers) score++;
    if (useSymbols) score++;
    if (length >= 12) score++;
    if (length >= 16) score++;
    if (length >= 20) score++;

    if (score <= 2) return { label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { label: 'Medium', color: '#f97316' };
    if (score <= 5) return { label: 'Strong', color: '#22c55e' };
    return { label: 'Very Strong', color: '#14b8a6' };
  };

  const strength = getStrength();

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.passwordCard, { backgroundColor: cardColor }]}>
        <Text style={[styles.password, { color: textColor }]} numberOfLines={2}>{password || 'Tap Generate'}</Text>
        {password ? (
          <View style={styles.passwordActions}>
            <TouchableOpacity onPress={copyPassword} style={[styles.actionBtn, { backgroundColor: primaryColor }]}>
              <MaterialIcons name="content-copy" size={18} color="white" />
              <Text style={styles.actionBtnText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={generatePassword} style={[styles.actionBtn, { backgroundColor: primaryColor + '1A' }]}>
              <MaterialIcons name="refresh" size={18} color={primaryColor} />
            </TouchableOpacity>
          </View>
        ) : null}
        {password ? (
          <View style={styles.strengthRow}>
            <Text style={[styles.strengthLabel, { color: textSecondaryColor }]}>Strength:</Text>
            <Text style={[styles.strengthValue, { color: strength.color }]}>{strength.label}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.optionsCard, { backgroundColor: cardColor }]}>
        <Text style={[styles.optionsTitle, { color: textColor }]}>Password Length: {length}</Text>
        <View style={styles.lengthRow}>
          <TouchableOpacity onPress={() => setLength(Math.max(4, length - 1))} style={[styles.lengthBtn, { backgroundColor: primaryColor + '1A' }]}>
            <MaterialIcons name="remove" size={20} color={primaryColor} />
          </TouchableOpacity>
          <View style={[styles.lengthBar, { backgroundColor: backgroundColor }]}>
            <View style={[styles.lengthFill, { backgroundColor: primaryColor, width: `${(length / 32) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => setLength(Math.min(32, length + 1))} style={[styles.lengthBtn, { backgroundColor: primaryColor + '1A' }]}>
            <MaterialIcons name="add" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.optionRow}><Text style={[styles.optionLabel, { color: textColor }]}>Lowercase (a-z)</Text><Switch value={useLowercase} onValueChange={setUseLowercase} trackColor={{ true: primaryColor }} /></View>
        <View style={styles.optionRow}><Text style={[styles.optionLabel, { color: textColor }]}>Uppercase (A-Z)</Text><Switch value={useUppercase} onValueChange={setUseUppercase} trackColor={{ true: primaryColor }} /></View>
        <View style={styles.optionRow}><Text style={[styles.optionLabel, { color: textColor }]}>Numbers (0-9)</Text><Switch value={useNumbers} onValueChange={setUseNumbers} trackColor={{ true: primaryColor }} /></View>
        <View style={styles.optionRow}><Text style={[styles.optionLabel, { color: textColor }]}>Symbols (!@#$%)</Text><Switch value={useSymbols} onValueChange={setUseSymbols} trackColor={{ true: primaryColor }} /></View>
      </View>

      <TouchableOpacity onPress={generatePassword} style={[styles.generateBtn, { backgroundColor: primaryColor }]}>
        <MaterialIcons name="vpn-key" size={20} color="white" />
        <Text style={styles.generateBtnText}>Generate Password</Text>
      </TouchableOpacity>

      {history.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>HISTORY</Text>
          <View style={[styles.historyCard, { backgroundColor: cardColor }]}>
            {history.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => copyHistoryItem(p)} style={styles.historyRow}>
                <Text style={[styles.historyText, { color: textColor }]} numberOfLines={1}>{p}</Text>
                <MaterialIcons name="content-copy" size={16} color={textSecondaryColor} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  passwordCard: { borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
  password: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', fontFamily: 'monospace' },
  passwordActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: 'white', fontWeight: '600' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  strengthLabel: { fontSize: 14 },
  strengthValue: { fontSize: 14, fontWeight: 'bold' },
  optionsCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  optionsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  lengthRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  lengthBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lengthBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  lengthFill: { height: '100%', borderRadius: 4 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  optionLabel: { fontSize: 16 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, marginBottom: 24 },
  generateBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  historyCard: { borderRadius: 16, padding: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  historyText: { flex: 1, fontFamily: 'monospace', fontSize: 12, marginRight: 12 },
});
