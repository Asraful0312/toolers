import { useAds } from '@/context/AdContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TransitionPanel } from '../TransitionPanel';

export default function QRCodeTool() {
  const [inputText, setInputText] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
  const [scannedData, setScannedData] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [index, setIndex] = React.useState(0);
  const { showToast } = useToast();
  const { onToolComplete } = useAds();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = '#6366f1';


  const generateQR = () => {
    const text = inputText.trim();
    if (!text) {
      showToast('Please enter text or URL', 'error');
      return;
    }
    setIsLoading(true);
    setQrUrl('');
    const encodedText = encodeURIComponent(text);
    const timestamp = Date.now();
    const newUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}&t=${timestamp}`;
    // Use setTimeout to ensure state updates properly
    setTimeout(() => {
      setQrUrl(newUrl);
    }, 100);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    showToast('QR Code generated!', 'success');
    onToolComplete();
  };

  const handleImageError = () => {
    setIsLoading(false);
    showToast('Failed to generate QR code', 'error');
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(inputText);
    showToast('Text copied!');
  };

  const copyScannedData = async () => {
    await Clipboard.setStringAsync(scannedData);
    showToast('Scanned text copied!');
  };

  const shareQR = async () => {
    if (qrUrl) {
      await Share.share({ message: `QR Code for: ${inputText}\n${qrUrl}` });
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setScannedData(data);
    setIsCameraActive(false);
    showToast('QR Code scanned!', 'success');
    onToolComplete();
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showToast('Camera permission required', 'error');
        return;
      }
    }
    setScannedData('');
    setIsCameraActive(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.tabs, { backgroundColor: cardColor }]}>
        <TouchableOpacity style={[styles.tab, index === 0 && { backgroundColor: primaryColor }]} onPress={() => setIndex(0)}>
          <MaterialIcons name="qr-code" size={20} color={index === 0 ? 'white' : textSecondaryColor} />
          <Text style={[styles.tabText, { color: index === 0 ? 'white' : textSecondaryColor }]}>Generate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, index === 1 && { backgroundColor: primaryColor }]} onPress={() => setIndex(1)}>
          <MaterialIcons name="qr-code-scanner" size={20} color={index === 1 ? 'white' : textSecondaryColor} />
          <Text style={[styles.tabText, { color: index === 1 ? 'white' : textSecondaryColor }]}>Scan</Text>
        </TouchableOpacity>
      </View>

      <TransitionPanel
        activeIndex={index}
        variants={{
          enter: { opacity: 0, y: 50 },
          center: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -50 }
        }}
      >
        <View>
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>Enter text or URL</Text>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor }]}
              placeholder="https://example.com"
              placeholderTextColor={textSecondaryColor}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity onPress={generateQR} style={[styles.generateBtn, { backgroundColor: primaryColor, opacity: isLoading ? 0.7 : 1 }]} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" size="small" /> : <MaterialIcons name="qr-code" size={20} color="white" />}
              <Text style={styles.generateBtnText}>{isLoading ? 'Generating...' : 'Generate QR Code'}</Text>
            </TouchableOpacity>
          </View>

          {(isLoading || qrUrl) ? (
            <View style={[styles.qrCard, { backgroundColor: cardColor }]}>
              <View style={styles.qrContainer}>
                {isLoading && !qrUrl && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={primaryColor} size="large" />
                    <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Generating...</Text>
                  </View>
                )}
                {qrUrl ? (
                  <Image
                    source={{ uri: qrUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                ) : null}
              </View>
              {!isLoading && qrUrl && (
                <View style={styles.qrActions}>
                  <TouchableOpacity onPress={shareQR} style={[styles.qrBtn, { backgroundColor: primaryColor }]}>
                    <MaterialIcons name="share" size={18} color="white" />
                    <Text style={styles.qrBtnText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={copyToClipboard} style={[styles.qrBtn, { backgroundColor: primaryColor + '1A' }]}>
                    <MaterialIcons name="content-copy" size={18} color={primaryColor} />
                    <Text style={[styles.qrBtnText, { color: primaryColor }]}>Copy Text</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}
        </View>
        <View style={[styles.scanCard, { backgroundColor: cardColor }]}>
          {scannedData ? (
            <>
              <MaterialIcons name="check-circle" size={48} color="#22c55e" />
              <Text style={[styles.scanTitle, { color: textColor }]}>Scanned Result</Text>
              <View style={[styles.scannedResult, { backgroundColor }]}>
                <Text style={[styles.scannedText, { color: textColor }]} selectable>{scannedData}</Text>
              </View>
              <View style={styles.scanActions}>
                <TouchableOpacity onPress={copyScannedData} style={[styles.scanBtn, { backgroundColor: primaryColor }]}>
                  <MaterialIcons name="content-copy" size={18} color="white" />
                  <Text style={styles.scanBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={startScanning} style={[styles.scanBtn, { backgroundColor: primaryColor + '1A' }]}>
                  <MaterialIcons name="qr-code-scanner" size={18} color={primaryColor} />
                  <Text style={[styles.scanBtnText, { color: primaryColor }]}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <MaterialIcons name="qr-code-scanner" size={64} color={primaryColor} />
              <Text style={[styles.scanTitle, { color: textColor }]}>Scan QR Code</Text>
              <Text style={[styles.scanDesc, { color: textSecondaryColor }]}>Point your camera at a QR code to scan it.</Text>
              <TouchableOpacity onPress={startScanning} style={[styles.scanStartBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name="camera-alt" size={20} color="white" />
                <Text style={styles.scanStartBtnText}>Open Camera</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

      </TransitionPanel>

      {/* {activeTab === 'generate' ? (
        <>
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <Text style={[styles.label, { color: textSecondaryColor }]}>Enter text or URL</Text>
            <TextInput
              style={[styles.input, { color: textColor, backgroundColor }]}
              placeholder="https://example.com"
              placeholderTextColor={textSecondaryColor}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity onPress={generateQR} style={[styles.generateBtn, { backgroundColor: primaryColor, opacity: isLoading ? 0.7 : 1 }]} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" size="small" /> : <MaterialIcons name="qr-code" size={20} color="white" />}
              <Text style={styles.generateBtnText}>{isLoading ? 'Generating...' : 'Generate QR Code'}</Text>
            </TouchableOpacity>
          </View>

          {(isLoading || qrUrl) ? (
            <View style={[styles.qrCard, { backgroundColor: cardColor }]}>
              <View style={styles.qrContainer}>
                {isLoading && !qrUrl && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={primaryColor} size="large" />
                    <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Generating...</Text>
                  </View>
                )}
                {qrUrl ? (
                  <Image
                    source={{ uri: qrUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                ) : null}
              </View>
              {!isLoading && qrUrl && (
                <View style={styles.qrActions}>
                  <TouchableOpacity onPress={shareQR} style={[styles.qrBtn, { backgroundColor: primaryColor }]}>
                    <MaterialIcons name="share" size={18} color="white" />
                    <Text style={styles.qrBtnText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={copyToClipboard} style={[styles.qrBtn, { backgroundColor: primaryColor + '1A' }]}>
                    <MaterialIcons name="content-copy" size={18} color={primaryColor} />
                    <Text style={[styles.qrBtnText, { color: primaryColor }]}>Copy Text</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}
        </>
      ) : (
        <View style={[styles.scanCard, { backgroundColor: cardColor }]}>
          {scannedData ? (
            <>
              <MaterialIcons name="check-circle" size={48} color="#22c55e" />
              <Text style={[styles.scanTitle, { color: textColor }]}>Scanned Result</Text>
              <View style={[styles.scannedResult, { backgroundColor }]}>
                <Text style={[styles.scannedText, { color: textColor }]} selectable>{scannedData}</Text>
              </View>
              <View style={styles.scanActions}>
                <TouchableOpacity onPress={copyScannedData} style={[styles.scanBtn, { backgroundColor: primaryColor }]}>
                  <MaterialIcons name="content-copy" size={18} color="white" />
                  <Text style={styles.scanBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={startScanning} style={[styles.scanBtn, { backgroundColor: primaryColor + '1A' }]}>
                  <MaterialIcons name="qr-code-scanner" size={18} color={primaryColor} />
                  <Text style={[styles.scanBtnText, { color: primaryColor }]}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <MaterialIcons name="qr-code-scanner" size={64} color={primaryColor} />
              <Text style={[styles.scanTitle, { color: textColor }]}>Scan QR Code</Text>
              <Text style={[styles.scanDesc, { color: textSecondaryColor }]}>Point your camera at a QR code to scan it.</Text>
              <TouchableOpacity onPress={startScanning} style={[styles.scanStartBtn, { backgroundColor: primaryColor }]}>
                <MaterialIcons name="camera-alt" size={20} color="white" />
                <Text style={styles.scanStartBtnText}>Open Camera</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )} */}

      <Modal visible={isCameraActive} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
          </View>
          <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.closeBtn}>
            <MaterialIcons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.cameraHint}>Align QR code within the frame</Text>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  tabText: { fontWeight: '600' },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  generateBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  qrCard: { borderRadius: 16, padding: 20, alignItems: 'center' },
  qrContainer: { backgroundColor: 'white', padding: 16, borderRadius: 16, minWidth: 232, minHeight: 232, alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  qrImage: { width: 200, height: 200 },
  qrActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  qrBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  qrBtnText: { color: 'white', fontWeight: '600' },
  scanCard: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 16 },
  scanTitle: { fontSize: 20, fontWeight: 'bold' },
  scanDesc: { textAlign: 'center', lineHeight: 22 },
  scanStartBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  scanStartBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  scannedResult: { width: '100%', padding: 16, borderRadius: 12, marginVertical: 12 },
  scannedText: { fontSize: 14, lineHeight: 20 },
  scanActions: { flexDirection: 'row', gap: 12 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  scanBtnText: { color: 'white', fontWeight: '600' },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 3, borderColor: 'white', borderRadius: 20 },
  closeBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 25 },
  cameraHint: { position: 'absolute', bottom: 100, alignSelf: 'center', color: 'white', fontSize: 16, fontWeight: '500' },
});
