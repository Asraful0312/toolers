import { TOOLS } from '@/constants/ToolsData';
import { useStorage } from '@/context/StorageContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Text Tools
import AddNumbersTool from '@/components/text-tools/AddNumbersTool';
import CaseConverterTool from '@/components/text-tools/CaseConverterTool';
import CharacterCounterTool from '@/components/text-tools/CharacterCounterTool';
import EntityExtractorTool from '@/components/text-tools/EntityExtractorTool';
import FindReplaceTool from '@/components/text-tools/FindReplaceTool';
import HashGeneratorTool from '@/components/text-tools/HashGeneratorTool';
import LoremIpsumTool from '@/components/text-tools/LoremIpsumTool';
import MarkdownPreviewTool from '@/components/text-tools/MarkdownPreviewTool';
import NumberFormatterTool from '@/components/text-tools/NumberFormatterTool';
import PrefixSuffixTool from '@/components/text-tools/PrefixSuffixTool';
import RegexTesterTool from '@/components/text-tools/RegexTesterTool';
import RepeatTextTool from '@/components/text-tools/RepeatTextTool';
import ReverseTextTool from '@/components/text-tools/ReverseTextTool';
import SortLinesTool from '@/components/text-tools/SortLinesTool';
import StylishTextTool from '@/components/text-tools/StylishTextTool';
import TenseConverterTool from '@/components/text-tools/TenseConverterTool';
import TextCleanerTool from '@/components/text-tools/TextCleanerTool';
import TextDiffTool from '@/components/text-tools/TextDiffTool';
import TextEncoderTool from '@/components/text-tools/TextEncoderTool';
import TextEncryptionTool from '@/components/text-tools/TextEncryptionTool';

// Image Tools
import AddTextTool from '@/components/image-tools/AddTextTool';
import CollageMakerTool from '@/components/image-tools/CollageMakerTool';
import CropImageTool from '@/components/image-tools/CropImageTool';
import ImageCompressTool from '@/components/image-tools/ImageCompressTool';
import ImageFilterTool from '@/components/image-tools/ImageFilterTool';
import ImageFormatTool from '@/components/image-tools/ImageFormatTool';
import ImageInfoTool from '@/components/image-tools/ImageInfoTool';
import ImageOcrTool from '@/components/image-tools/ImageOcrTool';
import ImageRotateTool from '@/components/image-tools/ImageRotateTool';
import ImageShapeTool from '@/components/image-tools/ImageShapeTool';
import MemeGeneratorTool from '@/components/image-tools/MemeGeneratorTool';
import ResizeImageTool from '@/components/image-tools/ResizeImageTool';
import SocialResizerTool from '@/components/image-tools/SocialResizerTool';

// PDF Tools
import ImageToPdfTool from '@/components/pdf-tools/ImageToPdfTool';
import PdfCompressTool from '@/components/pdf-tools/PdfCompressTool';
import PdfEditorTool from '@/components/pdf-tools/PdfEditorTool';
import PdfMergeTool from '@/components/pdf-tools/PdfMergeTool';
import PdfOcrTool from '@/components/pdf-tools/PdfOcrTool';
import PdfToImageTool from '@/components/pdf-tools/PdfToImageTool';
import PdfViewerTool from '@/components/pdf-tools/PdfViewerTool';
import PdfWatermarkTool from '@/components/pdf-tools/PdfWatermarkTool';
import TextToPdfTool from '@/components/pdf-tools/TextToPdfTool';
import WebPageToPdfTool from '@/components/pdf-tools/WebPageToPdfTool';

// Calc Tools
import AgeCalculatorTool from '@/components/calc-tools/AgeCalculatorTool';
import BmiCalculatorTool from '@/components/calc-tools/BmiCalculatorTool';
import CalculatorTool from '@/components/calc-tools/CalculatorTool';
import DateCalculatorTool from '@/components/calc-tools/DateCalculatorTool';
import LoanCalculatorTool from '@/components/calc-tools/LoanCalculatorTool';
import PercentageTool from '@/components/calc-tools/PercentageTool';
import TipCalculatorTool from '@/components/calc-tools/TipCalculatorTool';

// Converter Tools
import DataStorageConverterTool from '@/components/converter-tools/DataStorageConverterTool';
import NumberBaseConverterTool from '@/components/converter-tools/NumberBaseConverterTool';
import RomanNumeralConverterTool from '@/components/converter-tools/RomanNumeralConverterTool';
import TemperatureConverterTool from '@/components/converter-tools/TemperatureConverterTool';
import TimeZoneConverterTool from '@/components/converter-tools/TimeZoneConverterTool';
import UnitConverterTool from '@/components/converter-tools/UnitConverterTool';

// Dev Tools
import Base64Tool from '@/components/dev-tools/Base64Tool';
import CssMinifierTool from '@/components/dev-tools/CssMinifierTool';
import HtmlBeautifierTool from '@/components/dev-tools/HtmlBeautifierTool';
import JsMinifierTool from '@/components/dev-tools/JsMinifierTool';
import JsonFormatterTool from '@/components/dev-tools/JsonFormatterTool';
import JwtDecoderTool from '@/components/dev-tools/JwtDecoderTool';
import UrlEncoderTool from '@/components/dev-tools/UrlEncoderTool';
import UuidGeneratorTool from '@/components/dev-tools/UuidGeneratorTool';

// Color Tools
import BlendColorsTool from '@/components/color-tools/BlendColorsTool';
import ColorPickerTool from '@/components/color-tools/ColorPickerTool';
import ColorShadesTool from '@/components/color-tools/ColorShadesTool';
import ContrastCheckerTool from '@/components/color-tools/ContrastCheckerTool';
import GradientGeneratorTool from '@/components/color-tools/GradientGeneratorTool';
import ImageColorPickerTool from '@/components/color-tools/ImageColorPickerTool';
import PaletteGeneratorTool from '@/components/color-tools/PaletteGeneratorTool';

// Random Tools
import CoinFlipTool from '@/components/random-tools/CoinFlipTool';
import DiceRollerTool from '@/components/random-tools/DiceRollerTool';
import RandomColorTool from '@/components/random-tools/RandomColorTool';
import RandomNumberTool from '@/components/random-tools/RandomNumberTool';
import RandomPickerTool from '@/components/random-tools/RandomPickerTool';
import SpinWheelTool from '@/components/random-tools/SpinWheelTool';

// Utility Tools
import BarcodeScannerTool from '@/components/utility-tools/BarcodeScannerTool';
import FlashcardTool from '@/components/utility-tools/FlashcardTool';
import FlashlightTool from '@/components/utility-tools/FlashlightTool';
import NotesTool from '@/components/utility-tools/NotesTool';
import PasswordGeneratorTool from '@/components/utility-tools/PasswordGeneratorTool';
import QRCodeTool from '@/components/utility-tools/QRCodeTool';
import StopwatchTool from '@/components/utility-tools/StopwatchTool';
import TimerTool from '@/components/utility-tools/TimerTool';

// Audio Tools
import AdBanner from '@/components/AdBanner';
import FavoriteButton from '@/components/FavoriteButton';


const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  // Text Tools
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
  'markdown-preview': MarkdownPreviewTool,
  'text-encryption': TextEncryptionTool,
  'hash-generator': HashGeneratorTool,
  'regex-tester': RegexTesterTool,
  'entity-extractor': EntityExtractorTool,
  'tense-converter': TenseConverterTool,
  'number-formatter': NumberFormatterTool,

  // Image Tools
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
  'image-ocr': ImageOcrTool,

  // PDF Tools
  'image-to-pdf': ImageToPdfTool,
  'text-to-pdf': TextToPdfTool,
  'pdf-viewer': PdfViewerTool,
  'web-to-pdf': WebPageToPdfTool,
  'pdf-ocr': PdfOcrTool,
  'pdf-merge': PdfMergeTool,
  'pdf-to-image': PdfToImageTool,
  'pdf-compress': PdfCompressTool,
  'pdf-watermark': PdfWatermarkTool,
  'pdf-editor': PdfEditorTool,

  'calculator': CalculatorTool,
  'percentage': PercentageTool,
  'tip-calculator': TipCalculatorTool,
  'age-calculator': AgeCalculatorTool,
  'bmi-calculator': BmiCalculatorTool,
  'loan-calculator': LoanCalculatorTool,
  'date-calculator': DateCalculatorTool,

  // Converter Tools
  'unit-converter': UnitConverterTool,
  'timezone-converter': TimeZoneConverterTool,
  'number-base': NumberBaseConverterTool,
  'temperature': TemperatureConverterTool,
  'data-storage': DataStorageConverterTool,
  'roman-numeral': RomanNumeralConverterTool,

  // Dev Tools
  'json-formatter': JsonFormatterTool,
  'base64': Base64Tool,
  'url-encoder': UrlEncoderTool,
  'jwt-decoder': JwtDecoderTool,
  'uuid-generator': UuidGeneratorTool,
  'html-beautifier': HtmlBeautifierTool,
  'js-minifier': JsMinifierTool,
  'css-minifier': CssMinifierTool,

  // Color Tools
  'color-picker': ColorPickerTool,
  'image-color-picker': ImageColorPickerTool,
  'blend-colors': BlendColorsTool,
  'gradient-generator': GradientGeneratorTool,
  'contrast-checker': ContrastCheckerTool,
  'color-shades': ColorShadesTool,
  'palette-generator': PaletteGeneratorTool,

  // Random Tools
  'random-number': RandomNumberTool,
  'coin-flip': CoinFlipTool,
  'dice-roller': DiceRollerTool,
  'random-picker': RandomPickerTool,
  'random-color': RandomColorTool,
  'spin-wheel': SpinWheelTool,

  // Utility Tools
  'qr-code': QRCodeTool,
  'password-gen': PasswordGeneratorTool,
  'barcode-scanner': BarcodeScannerTool,
  'stopwatch': StopwatchTool,
  'timer': TimerTool,
  'flashcards': FlashcardTool,
  'notes': NotesTool,
  'flashlight': FlashlightTool,




};

export default function ToolScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { addToRecent, addToSaved, removeFromSaved, isToolSaved } = useStorage();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const toolId = typeof id === 'string' ? id : '';
  const ToolComponent = TOOL_COMPONENTS[toolId];
  const isSaved = isToolSaved(toolId);

  // Find the tool info from all categories
  const allTools = Object.values(TOOLS).flat();
  const tool = allTools.find((t) => t.id === toolId);

  // Add to recent when tool is opened
  useEffect(() => {
    if (toolId) {
      addToRecent(toolId);
    }
  }, [toolId]);



  const toggleSaved = () => {
    if (isSaved) {
      removeFromSaved(toolId);
    } else {
      addToSaved(toolId);
    }
  };

  if (!ToolComponent || !tool) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Tool Not Found' }} />
        <View style={styles.notFoundContainer}>
          <MaterialIcons name="error-outline" size={64} color={textSecondaryColor} />
          <Text style={[styles.notFoundText, { color: textSecondaryColor }]}>
            Tool not found or not implemented yet
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: cardColor }]}
          >
            <Text style={{ color: textColor }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: tool.name,
          headerTintColor: textColor,
          headerStyle: { backgroundColor: cardColor },
          headerRight: () => (
            <FavoriteButton
              initialChecked={isSaved}
              onToggle={toggleSaved}
            />
            // <TouchableOpacity onPress={toggleSaved} style={{ marginRight: 10 }}>
            //   <MaterialIcons
            //     name={isSaved ? 'favorite' : 'favorite-border'}
            //     size={24}
            //     color={isSaved ? '#ef4444' : textColor}
            //   />
            // </TouchableOpacity>
          ),
        }}
      />
      <ToolComponent />
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  notFoundText: {
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});
