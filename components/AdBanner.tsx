import { AD_UNIT_IDS } from '@/constants/AdConfig';
import { useAds } from '@/context/AdContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

interface AdBannerProps {
    size?: BannerAdSize;
}

export default function AdBanner({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: AdBannerProps) {
    const { showBanner, isAdFree } = useAds();

    if (!showBanner || isAdFree) {
        return null;
    }

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={AD_UNIT_IDS.BANNER}
                size={size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdFailedToLoad={(error) => {
                    console.error('Banner ad failed to load:', error);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
