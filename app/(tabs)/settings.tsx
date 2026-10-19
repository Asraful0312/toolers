import { useAds } from '@/context/AdContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

interface SettingItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isAdFree, adFreeEndTime, showRewardedAd } = useAds();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const { showToast } = useToast();

  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '4';

  const handleRemoveAds = async () => {
    if (isAdFree) {
      showToast('Ads already removed!', 'success');
      return;
    }

    showToast('Loading ad...', 'info');
    const shown = await showRewardedAd();
    if (!shown) {
      showToast('Ad not ready yet. Try again in a moment.', 'error');
    }
  };

  const SettingItem = ({ icon, iconColor, title, subtitle, onPress, rightElement }: SettingItemProps) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={[styles.settingItem, { backgroundColor: cardColor }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: (iconColor || primaryColor) + '15' }]}>
        <MaterialIcons name={icon} size={22} color={iconColor || primaryColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: textSecondaryColor }]}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <MaterialIcons name="chevron-right" size={24} color={textSecondaryColor} />)}
    </TouchableOpacity>
  );

  const PolicyModal = ({ visible, onClose, title, content }: { visible: boolean; onClose: () => void; title: string; content: string }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: textSecondaryColor + '20' }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.policyText, { color: textColor }]}>{content}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const privacyContent = `Privacy Policy for Toolers

Last updated: January 1, 2026

1. Information We Collect
Toolers is designed with your privacy in mind. We collect minimal data necessary for the app to function:
• Usage analytics (optional, anonymized)
• Crash reports to improve stability

2. Data Storage
All your data (notes, settings, preferences) is stored locally on your device. We do not upload or share your personal data to any servers.

3. Third-Party Services
The app may use third-party services for:
• Analytics (anonymized)
• Crash reporting

4. Your Rights
You have the right to:
• Access your data (stored locally)
• Delete your data by uninstalling the app
• Opt out of analytics in settings

5. Security
We implement industry-standard security practices to protect the app and your data.

6. Changes to This Policy
We may update this policy periodically. Continued use of the app constitutes acceptance of any changes.

7. Contact Us
For privacy concerns, please contact us through the app store listing.`;

  const termsContent = `Terms of Service for Toolers

Last updated: January 1, 2026

1. Acceptance of Terms
By downloading, installing, or using Toolers, you agree to these Terms of Service.

2. Use of the App
• The app is provided "as is" without warranties
• You may use the app for personal, non-commercial purposes
• You agree not to reverse engineer or modify the app

3. Intellectual Property
All content, design, and code within Toolers are protected by intellectual property laws.

4. User Content
• You retain ownership of content you create using the app
• Content is stored locally on your device
• We are not responsible for data loss

5. Limitations of Liability
To the maximum extent permitted by law:
• We are not liable for any indirect, incidental, or consequential damages
• Our liability is limited to the amount you paid for the app

6. Updates and Changes
• We may update the app and these terms at any time
• Continued use after updates constitutes acceptance

7. Termination
We reserve the right to terminate access to the app for violations of these terms.

8. Governing Law
These terms are governed by applicable laws in your jurisdiction.

9. Contact
For questions about these terms, contact us through the app store listing.`;

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.appIcon, { backgroundColor: primaryColor }]}>
          <MaterialIcons name="build" size={40} color="white" />
        </View>
        <Text style={[styles.appName, { color: textColor }]}>Toolers</Text>
        <Text style={[styles.appVersion, { color: textSecondaryColor }]}>Version {appVersion} ({buildNumber})</Text>
      </View>

      {/* Premium Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>PREMIUM</Text>
        <SettingItem
          icon="star"
          iconColor="#f59e0b"
          title="Remove Ads"
          subtitle={isAdFree ? `Ad-free until ${adFreeEndTime ? new Date(adFreeEndTime).toLocaleTimeString() : '...'}` : 'Watch video for 30m ad-free'}
          onPress={handleRemoveAds}
          rightElement={
            isAdFree ? (
              <View style={[styles.badge, { backgroundColor: '#22c55e' }]}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            ) : (
              <MaterialIcons name="play-circle-outline" size={24} color={primaryColor} />
            )
          }
        />
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>APPEARANCE</Text>
        <SettingItem
          icon="dark-mode"
          title="Dark Mode"
          subtitle={theme === 'dark' ? 'Currently enabled' : 'Currently disabled'}
          rightElement={
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: textSecondaryColor + '40', true: primaryColor + '80' }}
              thumbColor={theme === 'dark' ? primaryColor : '#f4f3f4'}
            />
          }
        />
      </View>

      {/* About Section */}
      {/* <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>ABOUT</Text>
        <SettingItem
          icon="info"
          iconColor="#3b82f6"
          title="About Toolers"
          subtitle="Your all-in-one toolkit"
        />
        <SettingItem
          icon="new-releases"
          iconColor="#22c55e"
          title="What's New"
          subtitle="See latest features"
          onPress={() => { }}
        />
      </View> */}

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>LEGAL</Text>
        <SettingItem
          icon="privacy-tip"
          iconColor="#8b5cf6"
          title="Privacy Policy"
          subtitle="How we handle your data"
          onPress={() => setShowPrivacy(true)}
        />
        <SettingItem
          icon="description"
          iconColor="#f59e0b"
          title="Terms of Service"
          subtitle="Rules and guidelines"
          onPress={() => setShowTerms(true)}
        />
        {/* <SettingItem
          icon="security"
          iconColor="#14b8a6"
          title="Licenses"
          subtitle="Open source licenses"
          onPress={() => { }}
        /> */}
      </View>

      {/* Support Section */}
      {/* <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>SUPPORT</Text>
        <SettingItem
          icon="star"
          iconColor="#f59e0b"
          title="Rate Us"
          subtitle="Love the app? Rate us!"
          onPress={() => Linking.openURL('market://details?id=com.toolers.app')}
        />
        <SettingItem
          icon="share"
          iconColor="#3b82f6"
          title="Share App"
          subtitle="Tell your friends"
          onPress={() => { }}
        />
        <SettingItem
          icon="bug-report"
          iconColor="#ef4444"
          title="Report a Bug"
          subtitle="Help us improve"
          onPress={() => { }}
        />
      </View> */}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerCopyright, { color: textSecondaryColor }]}>
          © 2026 Toolers. All rights reserved.
        </Text>
      </View>

      {/* Modals */}
      <PolicyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
        content={privacyContent}
      />
      <PolicyModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
        content={termsContent}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  appIcon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appName: { fontSize: 24, fontWeight: 'bold' },
  appVersion: { fontSize: 14, marginTop: 4 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500' },
  settingSubtitle: { fontSize: 13, marginTop: 2 },
  footer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16, marginTop: 16 },
  footerText: { fontSize: 14 },
  footerCopyright: { fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '87%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalBody: { padding: 20 },
  policyText: { fontSize: 14, lineHeight: 22 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});
