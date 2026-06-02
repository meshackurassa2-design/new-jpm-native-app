import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/theme';

export function InFeedAd() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Ad Placeholder</Text>
      <Text style={{ color: colors.textDim }}>Ads will appear here in the mobile app.</Text>
    </View>
  );
}

export function TextWalletAd() {
  const { colors } = useTheme();
  return (
    <View style={[styles.walletAdContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={{ color: colors.textDim }}>Banner Ad Placeholder (Mobile only)</Text>
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
  walletAdContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 8,
  }
});
