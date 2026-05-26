// app/_layout.tsx
// Root layout — wraps the entire app with providers
import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider, useAuth } from '../lib/auth'
import { CartProvider } from '../lib/cart'
import { createClient } from '../lib/supabase'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { registerForPushNotificationsAsync } from '../lib/push'
import { SplashScreen } from '../components/SplashScreen'
import { UIProvider } from '../lib/ui'

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

function PushNotificationSetup() {
  const { user } = useAuth()
  const supabase = createClient()
  const notificationListenerRef = useRef<any>(null)
  const responseListenerRef = useRef<any>(null)

  useEffect(() => {
    if (!user) return

    // Register for push and save token to DB
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        await supabase
          .from('profiles')
          .update({ push_token: token } as any)
          .eq('id', user.id)
      }
    }).catch(e => console.log('Push setup error:', e))

    // Listen for foreground notifications
    notificationListenerRef.current = Notifications.addNotificationReceivedListener(() => {})

    // Handle tap on notification — route user to the right screen
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any
      if (data?.type === 'message' && data?.sender_id) {
        router.push(`/chat?id=${data.sender_id}`)
      } else if (data?.type === 'follow' && data?.actor_id) {
        router.push(`/user-profile?id=${data.actor_id}`)
      } else if (data?.type === 'like' || data?.type === 'comment') {
        router.push('/notifications')
      }
    })

    return () => {
      notificationListenerRef.current?.remove()
      responseListenerRef.current?.remove()
    }
  }, [user])

  return null
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <UIProvider>
            <PushNotificationSetup />
            <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="user-profile" options={{ headerShown: false }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
            <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="cart" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="register-shop" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="shop/[id]" options={{ headerShown: false }} />
          </Stack>
          <SplashScreen />
          </UIProvider>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
