import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface JwtPayload {
    [key: string]: any;
}

interface DecodedJwt {
    header: JwtPayload;
    payload: JwtPayload;
    signature: string;
    isExpired?: boolean;
    expiresIn?: string;
}

const base64UrlDecode = (str: string): string => {
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with = to make it valid base64
    while (str.length % 4) str += '=';
    return atob(str);
};

const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
};

export default function JwtDecoderTool() {
    const [jwtInput, setJwtInput] = useState('');
    const { showToast } = useToast();
    const { onToolComplete } = useAds();

    const textColor = useThemeColor({}, 'text');
    const textSecondaryColor = useThemeColor({}, 'textSecondary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const primaryColor = useThemeColor({}, 'primary');

    const decoded = useMemo((): DecodedJwt | null => {
        if (!jwtInput.trim()) return null;

        try {
            const parts = jwtInput.trim().split('.');
            if (parts.length !== 3) return null;

            const header = JSON.parse(base64UrlDecode(parts[0]));
            const payload = JSON.parse(base64UrlDecode(parts[1]));
            const signature = parts[2];

            let isExpired = false;
            let expiresIn = '';

            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000);
                isExpired = expDate < new Date();
                if (!isExpired) {
                    const diff = expDate.getTime() - Date.now();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    expiresIn = days > 0 ? `${days} days` : `${hours} hours`;
                }
            }

            return { header, payload, signature, isExpired, expiresIn };
        } catch {
            return null;
        }
    }, [jwtInput]);

    const copySection = async (section: string, data: any) => {
        const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        await Clipboard.setStringAsync(text);
        showToast(`${section} copied!`, 'success');
        onToolComplete();
    };

    const pasteFromClipboard = async () => {
        const text = await Clipboard.getStringAsync();
        if (text) {
            setJwtInput(text);
            showToast('Pasted from clipboard', 'success');
        }
    };

    const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.signature';

    return (
        <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
            {/* Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.label, { color: textColor }]}>JWT Token</Text>
                    <TouchableOpacity onPress={pasteFromClipboard}>
                        <MaterialIcons name="content-paste" size={20} color={primaryColor} />
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={[styles.textArea, { backgroundColor, color: textColor, borderColor: textSecondaryColor + '40' }]}
                    multiline
                    value={jwtInput}
                    onChangeText={setJwtInput}
                    placeholder="Paste your JWT token here..."
                    placeholderTextColor={textSecondaryColor}
                    textAlignVertical="top"
                />
                <TouchableOpacity onPress={() => setJwtInput(sampleJwt)} style={styles.sampleBtn}>
                    <Text style={{ color: primaryColor, fontWeight: '600' }}>Load Sample JWT</Text>
                </TouchableOpacity>
            </View>

            {/* Error State */}
            {jwtInput.trim() && !decoded && (
                <View style={[styles.errorCard, { backgroundColor: '#ef444420' }]}>
                    <MaterialIcons name="error-outline" size={24} color="#ef4444" />
                    <Text style={[styles.errorText, { color: '#ef4444' }]}>Invalid JWT format. Must have 3 parts separated by dots.</Text>
                </View>
            )}

            {/* Decoded Results */}
            {decoded && (
                <>
                    {/* Status */}
                    <View style={[styles.statusCard, { backgroundColor: decoded.isExpired ? '#ef444420' : '#22c55e20' }]}>
                        <MaterialIcons
                            name={decoded.isExpired ? 'warning' : 'check-circle'}
                            size={24}
                            color={decoded.isExpired ? '#ef4444' : '#22c55e'}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statusTitle, { color: decoded.isExpired ? '#ef4444' : '#22c55e' }]}>
                                {decoded.isExpired ? 'Token Expired' : 'Token Valid'}
                            </Text>
                            {decoded.expiresIn && (
                                <Text style={[styles.statusSubtitle, { color: textSecondaryColor }]}>
                                    Expires in {decoded.expiresIn}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Header */}
                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionBadge, { backgroundColor: '#3b82f620' }]}>
                                <Text style={[styles.sectionBadgeText, { color: '#3b82f6' }]}>HEADER</Text>
                            </View>
                            <TouchableOpacity onPress={() => copySection('Header', decoded.header)}>
                                <MaterialIcons name="content-copy" size={18} color={primaryColor} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.codeBlock, { backgroundColor }]}>
                            <Text style={[styles.code, { color: textColor }]}>
                                {JSON.stringify(decoded.header, null, 2)}
                            </Text>
                        </View>
                    </View>

                    {/* Payload */}
                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionBadge, { backgroundColor: '#a855f720' }]}>
                                <Text style={[styles.sectionBadgeText, { color: '#a855f7' }]}>PAYLOAD</Text>
                            </View>
                            <TouchableOpacity onPress={() => copySection('Payload', decoded.payload)}>
                                <MaterialIcons name="content-copy" size={18} color={primaryColor} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.codeBlock, { backgroundColor }]}>
                            <Text style={[styles.code, { color: textColor }]}>
                                {JSON.stringify(decoded.payload, null, 2)}
                            </Text>
                        </View>
                        {/* Claim Details */}
                        <View style={styles.claims}>
                            {decoded.payload.iat && (
                                <View style={styles.claimRow}>
                                    <Text style={[styles.claimKey, { color: textSecondaryColor }]}>Issued At</Text>
                                    <Text style={[styles.claimValue, { color: textColor }]}>{formatTime(decoded.payload.iat)}</Text>
                                </View>
                            )}
                            {decoded.payload.exp && (
                                <View style={styles.claimRow}>
                                    <Text style={[styles.claimKey, { color: textSecondaryColor }]}>Expires At</Text>
                                    <Text style={[styles.claimValue, { color: decoded.isExpired ? '#ef4444' : textColor }]}>
                                        {formatTime(decoded.payload.exp)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Signature */}
                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionBadge, { backgroundColor: '#22c55e20' }]}>
                                <Text style={[styles.sectionBadgeText, { color: '#22c55e' }]}>SIGNATURE</Text>
                            </View>
                            <TouchableOpacity onPress={() => copySection('Signature', decoded.signature)}>
                                <MaterialIcons name="content-copy" size={18} color={primaryColor} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.signature, { color: textSecondaryColor }]} numberOfLines={2}>
                            {decoded.signature}
                        </Text>
                    </View>
                </>
            )}

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <MaterialIcons name="info-outline" size={18} color={textSecondaryColor} />
                <Text style={[styles.infoText, { color: textSecondaryColor }]}>
                    JWTs are not encrypted, only signed. Never put sensitive data in the payload. This tool only decodes - it does not verify signatures.
                </Text>
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
    textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 12, minHeight: 100, fontFamily: 'monospace' },
    sampleBtn: { marginTop: 12, alignSelf: 'flex-end' },
    errorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16 },
    errorText: { flex: 1, fontSize: 14 },
    statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16 },
    statusTitle: { fontSize: 16, fontWeight: '600' },
    statusSubtitle: { fontSize: 13, marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    sectionBadgeText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
    codeBlock: { borderRadius: 10, padding: 12 },
    code: { fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
    claims: { marginTop: 12, gap: 8 },
    claimRow: { flexDirection: 'row', justifyContent: 'space-between' },
    claimKey: { fontSize: 12 },
    claimValue: { fontSize: 12, fontWeight: '500' },
    signature: { fontSize: 11, fontFamily: 'monospace' },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
