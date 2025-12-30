import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FONT_SIZES = [
  { id: 'small', label: 'Small', size: 12 },
  { id: 'medium', label: 'Medium', size: 14 },
  { id: 'large', label: 'Large', size: 16 },
  { id: 'xlarge', label: 'X-Large', size: 18 },
];

export default function TextToPdfTool() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fontSize, setFontSize] = useState(FONT_SIZES[1]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const generatePdf = async () => {
    if (!content.trim()) {
      showToast('Please enter some text', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      // Convert line breaks to HTML paragraphs
      const paragraphs = content.split('\n').map(line => 
        line.trim() ? `<p style="margin: 0 0 10px 0;">${line}</p>` : '<br/>'
      ).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Helvetica', 'Arial', sans-serif; 
                padding: 40px;
                font-size: ${fontSize.size}pt;
                line-height: 1.6;
                color: #333;
              }
              h1 {
                font-size: ${fontSize.size + 8}pt;
                margin-bottom: 20px;
                color: #111;
                border-bottom: 2px solid #ef4444;
                padding-bottom: 10px;
              }
              .content {
                text-align: justify;
              }
              @page { margin: 20mm; }
            </style>
          </head>
          <body>
            ${title.trim() ? `<h1>${title}</h1>` : ''}
            <div class="content">
              ${paragraphs}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      setPdfUri(uri);
      showToast('PDF created!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to create PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const savePdf = async () => {
    if (!pdfUri) return;
    
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save PDF',
        });
      }
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const clearAll = () => {
    setTitle('');
    setContent('');
    setPdfUri(null);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {/* Title Input */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>TITLE (Optional)</Text>
        <TextInput
          value={title}
          onChangeText={(text) => { setTitle(text); setPdfUri(null); }}
          placeholder="Enter document title..."
          placeholderTextColor={textSecondaryColor}
          style={[styles.titleInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Content Input */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.contentHeader}>
          <Text style={[styles.label, { color: textSecondaryColor }]}>CONTENT</Text>
          <Text style={[styles.stats, { color: textSecondaryColor }]}>
            {wordCount} words • {charCount} chars
          </Text>
        </View>
        <TextInput
          value={content}
          onChangeText={(text) => { setContent(text); setPdfUri(null); }}
          placeholder="Type or paste your text here..."
          placeholderTextColor={textSecondaryColor}
          multiline
          textAlignVertical="top"
          style={[styles.contentInput, { color: textColor, borderColor: textSecondaryColor + '30' }]}
        />
      </View>

      {/* Font Size */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.label, { color: textSecondaryColor }]}>FONT SIZE</Text>
        <View style={styles.fontSizeRow}>
          {FONT_SIZES.map((size) => {
            const isSelected = size.id === fontSize.id;
            return (
              <TouchableOpacity
                key={size.id}
                onPress={() => { setFontSize(size); setPdfUri(null); }}
                style={[
                  styles.fontSizeBtn,
                  { backgroundColor: isSelected ? '#ef4444' : backgroundColor }
                ]}
              >
                <Text style={[styles.fontSizeBtnText, { color: isSelected ? 'white' : textColor }]}>
                  {size.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Generate / Result */}
      {!pdfUri ? (
        <TouchableOpacity
          onPress={generatePdf}
          disabled={isGenerating || !content.trim()}
          style={[styles.generateBtn, { backgroundColor: '#ef4444', opacity: (isGenerating || !content.trim()) ? 0.5 : 1 }]}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" />
          ) : (
            <MaterialIcons name="picture-as-pdf" size={24} color="white" />
          )}
          <Text style={styles.generateBtnText}>
            {isGenerating ? 'Creating PDF...' : 'Create PDF'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.successCard, { backgroundColor: '#10b98120' }]}>
          <MaterialIcons name="check-circle" size={40} color="#10b981" />
          <Text style={[styles.successText, { color: textColor }]}>PDF Created!</Text>
          
          <View style={styles.successActions}>
            <TouchableOpacity onPress={savePdf} style={[styles.saveBtn, { backgroundColor: '#10b981' }]}>
              <MaterialIcons name="save-alt" size={20} color="white" />
              <Text style={styles.saveBtnText}>Save / Share</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll} style={[styles.newBtn, { borderColor: primaryColor }]}>
              <MaterialIcons name="add" size={20} color={primaryColor} />
              <Text style={{ color: primaryColor, fontWeight: '600' }}>New</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tips */}
      <View style={[styles.tipsCard, { backgroundColor: '#ef444410' }]}>
        <MaterialIcons name="lightbulb-outline" size={18} color="#ef4444" />
        <Text style={[styles.tipsText, { color: textSecondaryColor }]}>
          Tip: Use line breaks to create paragraphs. The title will appear at the top with a red underline.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 10 },
  titleInput: { fontSize: 16, padding: 14, borderRadius: 10, borderWidth: 1 },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stats: { fontSize: 12 },
  contentInput: { fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, minHeight: 180, lineHeight: 22 },
  fontSizeRow: { flexDirection: 'row', gap: 8 },
  fontSizeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  fontSizeBtnText: { fontWeight: '600', fontSize: 13 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 14, marginBottom: 16 },
  generateBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  successCard: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, marginBottom: 16 },
  successText: { fontSize: 18, fontWeight: 'bold' },
  successActions: { flexDirection: 'row', gap: 10, marginTop: 12, width: '100%' },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 10 },
  saveBtnText: { color: 'white', fontWeight: '600' },
  newBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 44, borderRadius: 10, borderWidth: 2 },
  tipsCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12 },
  tipsText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
