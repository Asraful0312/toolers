import { TOOLS } from '@/constants/ToolsData';
import { useStorage } from '@/context/StorageContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Import all tools
import AddNumbersTool from '@/components/AddNumbersTool';
import AddTextTool from '@/components/AddTextTool';
import BlendColorsTool from '@/components/BlendColorsTool';
import CalculatorTool from '@/components/CalculatorTool';
import CaseConverterTool from '@/components/CaseConverterTool';
import CharacterCounterTool from '@/components/CharacterCounterTool';
import CollageMakerTool from '@/components/CollageMakerTool';
import ColorPickerTool from '@/components/ColorPickerTool';
import CropImageTool from '@/components/CropImageTool';
import FindReplaceTool from '@/components/FindReplaceTool';
import ImageColorPickerTool from '@/components/ImageColorPickerTool';
import ImageCompressTool from '@/components/ImageCompressTool';
import ImageFilterTool from '@/components/ImageFilterTool';
import ImageFormatTool from '@/components/ImageFormatTool';
import ImageInfoTool from '@/components/ImageInfoTool';
import ImageRotateTool from '@/components/ImageRotateTool';
import ImageShapeTool from '@/components/ImageShapeTool';
import ImageToPdfTool from '@/components/ImageToPdfTool';
import JsonFormatterTool from '@/components/JsonFormatterTool';
import LoremIpsumTool from '@/components/LoremIpsumTool';
import MemeGeneratorTool from '@/components/MemeGeneratorTool';
import PasswordGeneratorTool from '@/components/PasswordGeneratorTool';
import PercentageTool from '@/components/PercentageTool';
import PrefixSuffixTool from '@/components/PrefixSuffixTool';
import QRCodeTool from '@/components/QRCodeTool';
import RandomNumberTool from '@/components/RandomNumberTool';
import RepeatTextTool from '@/components/RepeatTextTool';
import ResizeImageTool from '@/components/ResizeImageTool';
import ReverseTextTool from '@/components/ReverseTextTool';
import SocialResizerTool from '@/components/SocialResizerTool';
import SortLinesTool from '@/components/SortLinesTool';
import StylishTextTool from '@/components/StylishTextTool';
import TextCleanerTool from '@/components/TextCleanerTool';
import TextDiffTool from '@/components/TextDiffTool';
import TextEncoderTool from '@/components/TextEncoderTool';
import TextToPdfTool from '@/components/TextToPdfTool';
import UnitConverterTool from '@/components/UnitConverterTool';

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  'char-counter': CharacterCounterTool,
  'case-converter': CaseConverterTool,
  'lorem-ipsum': LoremIpsumTool,
  'find-replace': FindReplaceTool,
  'sort-lines': SortLinesTool,
  'reverse-text': ReverseTextTool,
  'text-cleaner': TextCleanerTool,
  'add-numbers': AddNumbersTool,
  'repeat-text': RepeatTextTool,
  'prefix-suffix': PrefixSuffixTool,
  'text-encoder': TextEncoderTool,
  'stylish-text': StylishTextTool,
  'text-diff': TextDiffTool,
  'calculator': CalculatorTool,
  'percentage': PercentageTool,
  'unit-converter': UnitConverterTool,
  'json-formatter': JsonFormatterTool,
  'color-picker': ColorPickerTool,
  'image-color-picker': ImageColorPickerTool,
  'blend-colors': BlendColorsTool,
  'random-number': RandomNumberTool,
  'resize': ResizeImageTool,
  'crop': CropImageTool,
  'image-format': ImageFormatTool,
  'image-compress': ImageCompressTool,
  'image-shape': ImageShapeTool,
  'image-rotate': ImageRotateTool,
  'image-filter': ImageFilterTool,
  'add-text': AddTextTool,
  'meme-generator': MemeGeneratorTool,
  'social-resizer': SocialResizerTool,
  'collage-maker': CollageMakerTool,
  'image-info': ImageInfoTool,
  'image-to-pdf': ImageToPdfTool,
  'text-to-pdf': TextToPdfTool,
  'qr-code': QRCodeTool,
  'password-gen': PasswordGeneratorTool,
};

export default function ToolScreen() {
  const { id } = useLocalSearchParams();
  const toolId = typeof id === 'string' ? id : id?.[0] || '';
  const { addToRecent, addToSaved, removeFromSaved, isToolSaved } = useStorage();
  
  // Find tool details
  let toolDetails;
  for (const category in TOOLS) {
    const found = TOOLS[category as keyof typeof TOOLS].find((t) => t.id === toolId);
    if (found) {
      toolDetails = found;
      break;
    }
  }

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');

  // Track tool usage
  useEffect(() => {
    if (toolId) {
      addToRecent(toolId);
    }
  }, [toolId]);

  const isSaved = isToolSaved(toolId);

  const toggleSave = () => {
    if (isSaved) {
      removeFromSaved(toolId);
    } else {
      addToSaved(toolId);
    }
  };

  if (!toolDetails) {
    return (
      <View style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: textColor }}>Tool not found</Text>
      </View>
    );
  }

  const ToolComponent = TOOL_COMPONENTS[toolId];

  return (
    <>
      <Stack.Screen
        options={{
          title: toolDetails.name,
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={toggleSave} style={styles.saveBtn}>
              <MaterialIcons
                name={isSaved ? 'bookmark' : 'bookmark-border'}
                size={24}
                color={isSaved ? primaryColor : textColor}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor }]}>
        {ToolComponent ? (
          <ToolComponent />
        ) : (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: textColor }]}>Coming Soon</Text>
            <Text style={{ color: textColor, opacity: 0.7 }}>{toolDetails.name} is under development.</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveBtn: {
    padding: 8,
    marginRight: 4,
  },
});
