import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

const IMAGE_SIZE = Dimensions.get('window').width - 72;

export default function MemeGeneratorTool() {
  const [image, setImage] = useState<string | null>(null);
  const [topText, setTopText] = useState('TOP TEXT');
  const [bottomText, setBottomText] = useState('BOTTOM TEXT');
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<View>(null);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveImage = async () => {
    if (!imageRef.current) return;
    
    setIsSaving(true);
    try {
      const uri = await captureRef(imageRef, {
        format: 'png',
        quality: 1,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        showToast('Meme saved!', 'success');
      } else {
        showToast('Permission denied', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setImage(null);
    setTopText('TOP TEXT');
    setBottomText('BOTTOM TEXT');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      {!image ? (
        <TouchableOpacity
          onPress={pickImage}
          style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
        >
          <MaterialIcons name="mood" size={64} color={primaryColor} />
          <Text style={[styles.uploadTitle, { color: textColor }]}>Select Image</Text>
          <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
            Choose an image to create your meme
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Meme Preview */}
          <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PREVIEW</Text>
            <View
              ref={imageRef}
              style={styles.memeWrapper}
              collapsable={false}
            >
              <Image source={{ uri: image }} style={styles.memeImage} resizeMode="cover" />
              <View style={styles.topTextContainer}>
                <Text style={styles.memeText}>{topText.toUpperCase()}</Text>
              </View>
              <View style={styles.bottomTextContainer}>
                <Text style={styles.memeText}>{bottomText.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Top Text Input */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>TOP TEXT</Text>
            <TextInput
              value={topText}
              onChangeText={setTopText}
              placeholder="Enter top text"
              placeholderTextColor={textSecondaryColor}
              style={[styles.textInput, { color: textColor, backgroundColor }]}
            />
          </View>

          {/* Bottom Text Input */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>BOTTOM TEXT</Text>
            <TextInput
              value={bottomText}
              onChangeText={setBottomText}
              placeholder="Enter bottom text"
              placeholderTextColor={textSecondaryColor}
              style={[styles.textInput, { color: textColor, backgroundColor }]}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="refresh" size={20} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
              <MaterialIcons name="photo-library" size={20} color={primaryColor} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={saveImage} 
              disabled={isSaving}
              style={[styles.saveBtn, { backgroundColor: primaryColor, opacity: isSaving ? 0.7 : 1 }]}
            >
              <MaterialIcons name="save-alt" size={20} color="white" />
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Meme'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  uploadArea: { borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 12 },
  uploadTitle: { fontSize: 18, fontWeight: 'bold' },
  uploadDesc: { textAlign: 'center', lineHeight: 22 },
  previewCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  memeWrapper: { borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: 1 },
  memeImage: { width: '100%', height: '100%' },
  topTextContainer: { position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center' },
  bottomTextContainer: { position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' },
  memeText: { 
    color: 'white', 
    fontSize: 28, 
    fontWeight: '900', 
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    paddingHorizontal: 10,
  },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  textInput: { borderRadius: 12, padding: 14, fontSize: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
