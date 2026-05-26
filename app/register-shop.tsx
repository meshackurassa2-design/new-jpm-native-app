// app/register-shop.tsx
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { createClient } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { BackButton } from '../components/BackButton'

export default function RegisterShopScreen() {
  const { user } = useAuth()
  const supabase = createClient()

  const [shopName, setShopName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [traTin, setTraTin] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to open a shop.')
      return
    }
    if (!shopName.trim() || !category.trim() || !city.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.')
      return
    }
    const cleanTin = traTin.replace(/\D/g, '')
    if (cleanTin.length !== 9) {
      Alert.alert('Invalid TIN', 'Please enter a valid 9-digit TRA TIN.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('shops').insert({
        owner_id: user.id,
        name: shopName.trim(),
        description: description.trim(),
        category,
        location_city: city,
        tra_tin: cleanTin,
        status: 'pending',
        is_paid: false,
      })

      if (error) {
        if (error.code === '23505') {
          throw new Error('You already have a registered shop.')
        }
        throw error
      }

      setDone(true)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
        <Text style={styles.successTitle}>Application Submitted!</Text>
        <Text style={styles.successText}>
          Your shop "{shopName}" has been submitted for review.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Back to Marketplace</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Open a Shop</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Kariakoo Electronics"
            value={shopName}
            onChangeText={setShopName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Electronics, Fashion"
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Dar es Salaam"
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What do you sell?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>TRA TIN (9 Digits) *</Text>
          <TextInput
            style={styles.input}
            placeholder="123456789"
            keyboardType="numeric"
            value={traTin}
            onChangeText={setTraTin}
            maxLength={9}
          />
        </View>

        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Submit Application</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f4f4f5',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  
  scrollContent: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#18181b', marginBottom: 8 },
  input: {
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  textArea: { height: 100 },
  
  primaryBtn: {
    backgroundColor: '#000',
    borderRadius: 24,
    height: 56,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 12, marginBottom: 40,
    width: '100%',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  successTitle: { fontSize: 24, fontWeight: '800', color: '#000', marginTop: 16, marginBottom: 8 },
  successText: { fontSize: 16, color: '#71717a', textAlign: 'center', marginBottom: 32 },
})
