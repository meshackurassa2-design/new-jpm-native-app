// app/(settings)/_layout.tsx
import { Stack, router } from 'expo-router'
import { Pressable, Platform, View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BackButton } from '../../components/BackButton'

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{
      headerShadowVisible: false,
      headerStyle: { backgroundColor: '#fff' },
      headerTintColor: '#000',
      headerTitleStyle: { fontWeight: '700' },
      headerLeft: ({ canGoBack }) => canGoBack ? (
        <View style={{ paddingLeft: 16, paddingRight: 16 }}>
          <BackButton />
        </View>
      ) : null,
    }}>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="admin" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="ads" options={{ title: 'Ads Management' }} />
      <Stack.Screen name="bookmarks" options={{ title: 'Saved Posts' }} />
      <Stack.Screen name="marketplace-admin" options={{ title: 'Marketplace Admin' }} />
      <Stack.Screen name="monetization" options={{ title: 'Monetization' }} />
      <Stack.Screen name="purchases" options={{ title: 'Purchases' }} />
      <Stack.Screen name="store-dashboard" options={{ title: 'Store Dashboard' }} />
      
      {/* New Screens */}
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="security" options={{ title: 'Security' }} />
      <Stack.Screen name="help" options={{ title: 'Help & Support' }} />
      <Stack.Screen name="about" options={{ title: 'About App' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
    </Stack>
  )
}
