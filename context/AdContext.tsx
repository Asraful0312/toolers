import { AD_CONFIG, AD_UNIT_IDS } from '@/constants/AdConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AdEventType, InterstitialAd, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

interface AdContextType {
    // State
    isAdFree: boolean;
    adFreeEndTime: number | null;
    toolUseCount: number;

    // Actions
    onToolComplete: () => void;
    showRewardedAd: () => Promise<boolean>;

    // Banner visibility
    showBanner: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

const STORAGE_KEYS = {
    AD_FREE_END_TIME: '@toolers_ad_free_end',
    TOOL_USE_COUNT: '@toolers_tool_count',
};

export function AdProvider({ children }: { children: React.ReactNode }) {
    const [isAdFree, setIsAdFree] = useState(false);
    const [adFreeEndTime, setAdFreeEndTime] = useState<number | null>(null);
    const [toolUseCount, setToolUseCount] = useState(0);
    const [showBanner, setShowBanner] = useState(true);

    const lastInterstitialTime = useRef<number>(0);
    const nextInterstitialAt = useRef<number>(getRandomToolCount());
    const interstitialAd = useRef<InterstitialAd | null>(null);
    const rewardedAd = useRef<RewardedAd | null>(null);

    // Get random tool count between min and max
    function getRandomToolCount(): number {
        const { INTERSTITIAL_MIN_TOOLS, INTERSTITIAL_MAX_TOOLS } = AD_CONFIG;
        return Math.floor(Math.random() * (INTERSTITIAL_MAX_TOOLS - INTERSTITIAL_MIN_TOOLS + 1)) + INTERSTITIAL_MIN_TOOLS;
    }

    // Load saved state
    useEffect(() => {
        loadSavedState();
        loadInterstitialAd();
        loadRewardedAd();
    }, []);

    // Check ad-free status periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (adFreeEndTime && Date.now() > adFreeEndTime) {
                setIsAdFree(false);
                setAdFreeEndTime(null);
                setShowBanner(true);
                AsyncStorage.removeItem(STORAGE_KEYS.AD_FREE_END_TIME);
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [adFreeEndTime]);

    const loadSavedState = async () => {
        try {
            const savedEndTime = await AsyncStorage.getItem(STORAGE_KEYS.AD_FREE_END_TIME);
            const savedCount = await AsyncStorage.getItem(STORAGE_KEYS.TOOL_USE_COUNT);

            if (savedEndTime) {
                const endTime = parseInt(savedEndTime, 10);
                if (Date.now() < endTime) {
                    setIsAdFree(true);
                    setAdFreeEndTime(endTime);
                    setShowBanner(false);
                } else {
                    AsyncStorage.removeItem(STORAGE_KEYS.AD_FREE_END_TIME);
                }
            }

            if (savedCount) {
                setToolUseCount(parseInt(savedCount, 10));
            }
        } catch (e) {
            console.error('Failed to load ad state:', e);
        }
    };

    const loadInterstitialAd = () => {
        const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);

        ad.addAdEventListener(AdEventType.LOADED, () => {
        });

        ad.addAdEventListener(AdEventType.CLOSED, () => {
            // Reload for next time
            loadInterstitialAd();
        });

        ad.addAdEventListener(AdEventType.ERROR, (error) => {
            console.error('Interstitial ad error:', error);
        });

        ad.load();
        interstitialAd.current = ad;
    };

    const loadRewardedAd = () => {
        const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);

        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        });

        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            // Grant ad-free period
            const endTime = Date.now() + (AD_CONFIG.REWARDED_AD_FREE_MINUTES * 60 * 1000);
            setIsAdFree(true);
            setAdFreeEndTime(endTime);
            setShowBanner(false);
            AsyncStorage.setItem(STORAGE_KEYS.AD_FREE_END_TIME, endTime.toString());
        });

        ad.addAdEventListener(AdEventType.CLOSED, () => {
            // Reload for next time
            loadRewardedAd();
        });

        ad.addAdEventListener(AdEventType.ERROR, (error) => {
            console.error('Rewarded ad error:', error);
        });

        ad.load();
        rewardedAd.current = ad;
    };

    const onToolComplete = useCallback(() => {
        if (isAdFree) return;

        const newCount = toolUseCount + 1;
        setToolUseCount(newCount);
        AsyncStorage.setItem(STORAGE_KEYS.TOOL_USE_COUNT, newCount.toString());

        // Check if we should show interstitial
        if (newCount >= nextInterstitialAt.current) {
            const now = Date.now();
            const timeSinceLastAd = (now - lastInterstitialTime.current) / 1000;

            // Check cooldown
            if (timeSinceLastAd >= AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS) {
                if (interstitialAd.current?.loaded) {
                    interstitialAd.current.show();
                    lastInterstitialTime.current = now;
                }
            }

            // Reset counter and set next threshold
            setToolUseCount(0);
            AsyncStorage.setItem(STORAGE_KEYS.TOOL_USE_COUNT, '0');
            nextInterstitialAt.current = getRandomToolCount();
        }
    }, [isAdFree, toolUseCount]);

    const showRewardedAd = useCallback(async (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (rewardedAd.current?.loaded) {
                rewardedAd.current.show();
                resolve(true);
            } else {
                loadRewardedAd();
                resolve(false);
            }
        });
    }, []);

    return (
        <AdContext.Provider
            value={{
                isAdFree,
                adFreeEndTime,
                toolUseCount,
                onToolComplete,
                showRewardedAd,
                showBanner,
            }}
        >
            {children}
        </AdContext.Provider>
    );
}

export function useAds() {
    const context = useContext(AdContext);
    if (!context) {
        throw new Error('useAds must be used within an AdProvider');
    }
    return context;
}
