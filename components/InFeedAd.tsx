import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../lib/theme';

let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  try {
    const admob = require('react-native-google-mobile-ads');
    BannerAd = admob.BannerAd;
    BannerAdSize = admob.BannerAdSize;
    TestIds = admob.TestIds;
  } catch (e) {
    console.warn('Google Mobile Ads not loaded', e);
  }
}

export function InFeedAd() {
  const { colors } = useTheme();
  
  if (isExpoGo || !BannerAd) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Ad Placeholder</Text>
        <Text style={{ color: colors.textDim }}>Ads will appear here in the final APK.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.adContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.sponsoredText, { color: colors.textDim }]}>Sponsored</Text>
      <View style={styles.adWrapper}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </View>
  );
}

export function TextWalletAd() {
  const { colors } = useTheme();
  
  if (isExpoGo || !BannerAd) {
    return (
      <View style={[styles.walletAdContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: colors.textDim }}>Banner Ad Placeholder (APK only)</Text>
      </View>
    );
  }

  return (
    <View style={styles.walletAdContainer}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adContainer: {
    marginVertical: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  sponsoredText: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adWrapper: {
    width: 300,
    height: 250,
    overflow: 'hidden',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletAdContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 8,
  }
});
