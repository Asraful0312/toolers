import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

const IMAGE_SIZE = Dimensions.get('window').width - 72; // Padding 16*2 + inner padding 20*2 approx? No, contentContainer padding 20. 
// Let's rely on onLayout to be precise or just use the approximate logic. 
// Existing logic used IMAGE_SIZE.

export default function MemeGeneratorTool() {
  const [image, setImage] = useState<string | null>(null);
  const [topText, setTopText] = useState('TOP TEXT');
  const [bottomText, setBottomText] = useState('BOTTOM TEXT');
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<View>(null);
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = '#a855f7';

  // Shared Values for Dragging
  // Initial positions will be set when image is picked or reset
  const topX = useSharedValue(0);
  const topY = useSharedValue(0);
  const bottomX = useSharedValue(0);
  const bottomY = useSharedValue(0);

  // Contexts for gesture handling
  const topContext = useSharedValue({ x: 0, y: 0 });
  const bottomContext = useSharedValue({ x: 0, y: 0 });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);

      // Reset positions to default
      // Assuming image is centered, let's put text somewhat centered
      // We'll rely on Flexbox centering for initial look if we can, but draggable needs absolute.
      // Let's set initial values:
      topX.value = IMAGE_SIZE / 2 - 100; // Approx center
      topY.value = 20;
      bottomX.value = IMAGE_SIZE / 2 - 100;
      bottomY.value = IMAGE_SIZE - 60;
    }
  };

  const topGesture = Gesture.Pan()
    .onStart(() => {
      topContext.value = { x: topX.value, y: topY.value };
    })
    .onUpdate((e) => {
      topX.value = topContext.value.x + e.translationX;
      topY.value = topContext.value.y + e.translationY;
    });

  const bottomGesture = Gesture.Pan()
    .onStart(() => {
      bottomContext.value = { x: bottomX.value, y: bottomY.value };
    })
    .onUpdate((e) => {
      bottomX.value = bottomContext.value.x + e.translationX;
      bottomY.value = bottomContext.value.y + e.translationY;
    });

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: topX.value }, { translateY: topY.value }],
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bottomX.value }, { translateY: bottomY.value }],
  }));

  const saveImage = async () => {
    if (!imageRef.current) return;

    setIsSaving(true);
    try {
      // Small delay to ensure render sync
      await new Promise(resolve => setTimeout(resolve, 100));

      const uri = await captureRef(imageRef, {
        format: 'png',
        quality: 1,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        showToast('Meme saved!', 'success');
        onToolComplete();
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
    topX.value = 0;
    topY.value = 0;
    bottomX.value = 0;
    bottomY.value = 0;
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
            <View style={styles.previewHeader}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PREVIEW</Text>
              <Text style={[styles.hint, { color: primaryColor }]}>Drag text to move</Text>
            </View>

            <View
              ref={imageRef}
              style={styles.memeWrapper}
              collapsable={false}
            >
              <Image source={{ uri: image }} style={styles.memeImage} resizeMode="contain" />

              {/* Top Text Draggable */}
              <GestureDetector gesture={topGesture}>
                <Animated.View style={[styles.draggableText, topStyle]}>
                  <Text style={styles.memeText}>{topText.toUpperCase()}</Text>
                </Animated.View>
              </GestureDetector>

              {/* Bottom Text Draggable */}
              <GestureDetector gesture={bottomGesture}>
                <Animated.View style={[styles.draggableText, bottomStyle]}>
                  <Text style={styles.memeText}>{bottomText.toUpperCase()}</Text>
                </Animated.View>
              </GestureDetector>
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
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  hint: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  memeWrapper: { borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: 1, backgroundColor: '#000' }, // Black bg for contain
  memeImage: { width: '100%', height: '100%' },
  draggableText: { position: 'absolute', padding: 10, zIndex: 10 },
  memeText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  textInput: { borderRadius: 12, padding: 14, fontSize: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
