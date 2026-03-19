import Constants, { ExecutionEnvironment } from "expo-constants";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

// ─────────────────────────────────────────────────────────────────────────────
// REPLACE THESE WITH YOUR REAL AdMob IDs FROM admob.google.com
// Android: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
// iOS:     ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
// ─────────────────────────────────────────────────────────────────────────────
const ANDROID_AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111"; // test ID
const IOS_AD_UNIT_ID = "ca-app-pub-3940256099942544/2934735716";    // test ID

import { Platform } from "react-native";
const adUnitId = Platform.OS === "ios" ? IOS_AD_UNIT_ID : ANDROID_AD_UNIT_ID;

// In Expo Go the native AdMob module is not available — show placeholder instead
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let BannerAd: React.ComponentType<{
  unitId: string;
  size: string;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
}> | null = null;
let BannerAdSize: { BANNER: string } = { BANNER: "BANNER" };

if (!isExpoGo) {
  try {
    const admob = require("react-native-google-mobile-ads");
    BannerAd = admob.BannerAd;
    BannerAdSize = admob.BannerAdSize;
  } catch {
    // Native module not available
  }
}

export default function AdBanner() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  if (isExpoGo || !BannerAd) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Ad Banner — visible in release build
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!adLoaded && !adFailed && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Loading ad…</Text>
        </View>
      )}
      {adFailed && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Ad unavailable</Text>
        </View>
      )}
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        onAdLoaded={() => setAdLoaded(true)}
        onAdFailedToLoad={() => setAdFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  placeholder: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
});
