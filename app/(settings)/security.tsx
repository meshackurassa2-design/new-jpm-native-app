// app/(settings)/security.tsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'

export default function SecurityScreen() {
  const supabase = createClient()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async () => {
    if (!newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill in all required fields.')
      return
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.')
      return
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setSuccess(false)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setSuccess(true)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionDesc}>Manage your password and account protection.</Text>

        {success && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.successText}>Password changed successfully!</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>
          <Text style={styles.cardDesc}>Update your account password.</Text>

          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showCurrent}
              placeholder="Current password"
              placeholderTextColor="#a1a1aa"
              value={currentPw}
              onChangeText={setCurrentPw}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showNew}
              placeholder="New password"
              placeholderTextColor="#a1a1aa"
              value={newPw}
              onChangeText={setNewPw}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showConfirm}
              placeholder="Confirm new password"
              placeholderTextColor="#a1a1aa"
              value={confirmPw}
              onChangeText={setConfirmPw}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleChangePassword} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Update Password</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#2563eb" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoTitle}>Two-Factor Authentication</Text>
              <Text style={styles.infoDesc}>Add an extra layer of security to your account. (Coming soon)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  content: { padding: 20 },
  sectionDesc: { fontSize: 15, color: '#71717a', marginBottom: 20, lineHeight: 22 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { color: '#16a34a', fontWeight: '600', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#000', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#71717a', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#3f3f46', marginBottom: 8, marginTop: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f4f5', borderRadius: 12, borderWidth: 1, borderColor: '#e4e4e7' },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#000' },
  eyeBtn: { paddingHorizontal: 14 },
  btn: { backgroundColor: '#000', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  infoDesc: { fontSize: 14, color: '#71717a', lineHeight: 20 },
})
