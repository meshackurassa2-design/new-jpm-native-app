import React, { useState } from 'react'
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'

// Test ID for dev. You'll swap this in production with your real Ad unit ID.
const adUnitId = __DEV__ ? TestIds.BANNER : (Platform.OS === 'ios' ? 'ca-app-pub-xxxxxxxxxxx/xxxxxxxx' : 'ca-app-pub-xxxxxxxxxxx/xxxxxxxx')

export function InFeedAd() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  if (hasError) return null // Hide ad space if it fails to load

  return (
    <View style={styles.container}>
      <View style={styles.adHeader}>
        <Text style={styles.sponsoredText}>Sponsored</Text>
      </View>
      <View style={styles.adContainer}>
        {!isLoaded && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#a1a1aa" />
          </View>
        )}
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => setIsLoaded(true)}
          onAdFailedToLoad={(error) => {
            console.error('Ad failed to load: ', error)
            setHasError(true)
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f4f4f5',
    paddingVertical: 12,
  },
  adHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sponsoredText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adContainer: {
    width: '100%',
    minHeight: 250, // Height of MEDIUM_RECTANGLE
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  }
})
