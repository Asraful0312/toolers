// AdMob Configuration
// Replace these TEST IDs with your real Ad Unit IDs from AdMob Console before publishing

// Test App ID (use this during development)
export const ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713'; // Test App ID

// Ad Unit IDs - Replace with your real IDs before publishing
export const AD_UNIT_IDS = {
    // Banner Ad - shown at bottom of screens
    BANNER: __DEV__
        ? 'ca-app-pub-3940256099942544/6300978111' // Test Banner ID
        : 'ca-app-pub-5112178843530951/8809598464',           // Replace with real ID

    // Interstitial Ad - shown after completing tools
    INTERSTITIAL: __DEV__
        ? 'ca-app-pub-3940256099942544/1033173712' // Test Interstitial ID
        : 'ca-app-pub-5112178843530951/1917010761',     // Replace with real ID

    // Rewarded Ad - user watches for ad-free experience
    REWARDED: __DEV__
        ? 'ca-app-pub-3940256099942544/5224354917' // Test Rewarded ID
        : 'ca-app-pub-5112178843530951/1589707708',         // Replace with real ID
};

// Ad Frequency Settings
export const AD_CONFIG = {
    // Show interstitial every N tool completions (random between min and max)
    INTERSTITIAL_MIN_TOOLS: 2,
    INTERSTITIAL_MAX_TOOLS: 3,

    // Minimum seconds between interstitial ads
    INTERSTITIAL_COOLDOWN_SECONDS: 30,

    // Duration of ad-free period after watching rewarded ad (in minutes)
    REWARDED_AD_FREE_MINUTES: 30,
};
