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

const COLORS = ['#ffffff', '#000000', '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];

const IMAGE_HEIGHT = 300;
const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - 40; // padding 20 * 2

export default function AddTextTool() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('Your Text Here');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(28);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef<View>(null);
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  // Reanimated Shared Values
  const translateX = useSharedValue(IMAGE_WIDTH / 2 - 80);
  const translateY = useSharedValue(IMAGE_HEIGHT / 2 - 20);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const themeTextColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = '#a855f7';

  // Gesture handling
  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newX = contextX.value + event.translationX;
      const newY = contextY.value + event.translationY;

      // Boundary checks
      translateX.value = Math.max(0, Math.min(newX, IMAGE_WIDTH - 50));
      translateY.value = Math.max(0, Math.min(newY, IMAGE_HEIGHT - 30));
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  /* Font Options */
  const FONTS = [
    { label: 'System', value: 'System' },
    { label: 'Monospace', value: 'monospace' },
    { label: 'Serif', value: 'serif' },
    { label: 'Sans-Serif', value: 'sans-serif' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Notoserif', value: 'notoserif' },
  ];

  const [fontFamily, setFontFamily] = useState('System');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // Reset position
      translateX.value = IMAGE_WIDTH / 2 - 80;
      translateY.value = IMAGE_HEIGHT / 2 - 20;
    }
  };

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
        showToast('Saved to gallery!', 'success');
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
    setText('Your Text Here');
    setTextColor('#ffffff');
    setFontSize(28);
    setFontFamily('System');
    translateX.value = IMAGE_WIDTH / 2 - 80;
    translateY.value = IMAGE_HEIGHT / 2 - 20;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {!image ? (
        <View style={styles.contentContainer}>
          <TouchableOpacity
            onPress={pickImage}
            style={[styles.uploadArea, { backgroundColor: cardColor, borderColor: primaryColor }]}
          >
            <MaterialIcons name="text-fields" size={64} color={primaryColor} />
            <Text style={[styles.uploadTitle, { color: themeTextColor }]}>Select Image</Text>
            <Text style={[styles.uploadDesc, { color: textSecondaryColor }]}>
              Choose an image to add text overlay
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Main content scrollable, but we need gesture handler root for drag */}
          <View style={[styles.contentContainer, { paddingBottom: 100 }]}>
            {/* Image Preview with Draggable Text */}
            <View style={[styles.previewCard, { backgroundColor: cardColor }]}>
              <View style={styles.previewHeader}>
                <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PREVIEW</Text>
                <Text style={[styles.hint, { color: primaryColor }]}>Drag text to move</Text>
              </View>

              <View
                ref={imageRef}
                style={styles.imageWrapper}
                collapsable={false}
              >
                <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />

                <GestureDetector gesture={panGesture}>
                  <Animated.View
                    style={[
                      styles.textOverlay,
                      animatedStyle
                    ]}
                  >
                    <Text
                      style={[
                        styles.overlayText,
                        {
                          color: textColor,
                          fontSize,
                          fontFamily: fontFamily === 'System' ? undefined : fontFamily,
                          textShadowColor: textColor === '#000000' ? '#fff' : '#000',
                        }
                      ]}
                    >
                      {text}
                    </Text>
                  </Animated.View>
                </GestureDetector>
              </View>
            </View>

            {/* Text Input */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>TEXT</Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Enter your text"
                placeholderTextColor={textSecondaryColor}
                style={[styles.textInput, { color: themeTextColor, backgroundColor }]}
              />
            </View>

            {/* Font Style Selection - NEW */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>FONT STYLE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontList}>
                {FONTS.map((font) => (
                  <TouchableOpacity
                    key={font.value}
                    onPress={() => setFontFamily(font.value)}
                    style={[
                      styles.fontBtn,
                      {
                        backgroundColor: fontFamily === font.value ? primaryColor : backgroundColor,
                        borderColor: fontFamily === font.value ? primaryColor : 'transparent'
                      }
                    ]}
                  >
                    <Text style={[
                      styles.fontBtnText,
                      {
                        color: fontFamily === font.value ? 'white' : themeTextColor,
                        fontFamily: font.value === 'System' ? undefined : font.value
                      }
                    ]}>
                      {font.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Color Selection */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>TEXT COLOR</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setTextColor(color)}
                    style={[
                      styles.colorBtn,
                      { backgroundColor: color, borderColor: textColor === color ? primaryColor : 'transparent' }
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Font Size */}
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>FONT SIZE: {fontSize}px</Text>
              <View style={styles.sizeControls}>
                <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 4))} style={[styles.sizeBtn, { backgroundColor }]}>
                  <MaterialIcons name="remove" size={24} color={themeTextColor} />
                </TouchableOpacity>
                <View style={[styles.sizeValue, { backgroundColor }]}>
                  <Text style={[styles.sizeValueText, { color: themeTextColor }]}>{fontSize}</Text>
                </View>
                <TouchableOpacity onPress={() => setFontSize(Math.min(72, fontSize + 4))} style={[styles.sizeBtn, { backgroundColor }]}>
                  <MaterialIcons name="add" size={24} color={themeTextColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity onPress={reset} style={[styles.actionBtn, { backgroundColor: cardColor }]}>
                <MaterialIcons name="refresh" size={20} color={themeTextColor} />
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
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Image'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  uploadArea: { borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 12 },
  uploadTitle: { fontSize: 18, fontWeight: 'bold' },
  uploadDesc: { textAlign: 'center', lineHeight: 22 },
  previewCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  hint: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  imageWrapper: { borderRadius: 12, overflow: 'hidden', position: 'relative', height: IMAGE_HEIGHT },
  imagePreview: { width: '100%', height: '100%' },
  textOverlay: { position: 'absolute', padding: 8, zIndex: 10 },
  overlayText: { fontWeight: 'bold', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  textInput: { borderRadius: 12, padding: 14, fontSize: 16 },
  fontList: { gap: 10, paddingRight: 20 },
  fontBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, minWidth: 80, alignItems: 'center' },
  fontBtnText: { fontWeight: '600', fontSize: 14 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
  sizeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sizeBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sizeValue: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sizeValueText: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 14 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
