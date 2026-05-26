// app/(auth)/forgot-password.tsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'
import { BackButton } from '../../components/BackButton'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleReset = async () => {
    if (!email) { Alert.alert('Error', 'Please enter your email'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'jpm://reset-password',
    })
    setLoading(false)
    if (error) { Alert.alert('Error', error.message); return }
    setSent(true)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <BackButton style={styles.backBtn} />

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'Check your email for a reset link.'
            : "Enter your email and we'll send you a reset link."}
        </Text>

        {!sent && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send reset link</Text>}
            </TouchableOpacity>
          </>
        )}

        {sent && (
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.btnText}>Back to login</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 60 },
  backBtn: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 32, lineHeight: 22 },
  input: {
    height: 52, borderWidth: 1.5, borderColor: '#e5e5e5', borderRadius: 14,
    paddingHorizontal: 16, fontSize: 16, color: '#000', backgroundColor: '#fafafa', marginBottom: 12,
  },
  btn: {
    height: 52, backgroundColor: '#000', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
