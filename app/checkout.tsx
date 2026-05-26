// app/checkout.tsx
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
import { useCart } from '../lib/cart'
import uuid from 'react-native-uuid'
import { BackButton } from '../components/BackButton'

const PROVIDERS = [
  { id: 'MPESA', label: 'M-Pesa' },
  { id: 'TIGOPESA', label: 'Tigo Pesa' },
  { id: 'AIRTEL', label: 'Airtel Money' },
  { id: 'HALOPESA', label: 'HaloPesa' },
]

export default function CheckoutScreen() {
  const { user } = useAuth()
  const supabase = createClient()
  const { items, cartTotal, clearCart } = useCart()

  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [provider, setProvider] = useState('MPESA')

  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState<{ orderId: string, message: string } | null>(null)

  const handleCheckout = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter your full name.')
    if (!email || !email.includes('@')) return Alert.alert('Error', 'Please enter a valid email address.')
    if (!phone || phone.replace(/\D/g, '').length < 9) return Alert.alert('Error', 'Please enter a valid phone number.')
    if (!address.trim()) return Alert.alert('Error', 'Please enter your delivery address.')
    if (!city.trim()) return Alert.alert('Error', 'Please enter your city.')

    setIsProcessing(true)
    try {
      const res = await fetch('http://192.168.1.12:3000/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone,
          address,
          city,
          amount: cartTotal,
          items,
          provider,
          buyerId: user?.id
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment.')
      }

      setSuccess({ 
        orderId: data.orderId, 
        message: data.message || 'A payment prompt has been sent to your phone.' 
      })
      clearCart()
      
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
        <Text style={styles.successTitle}>Check Your Phone!</Text>
        <Text style={styles.successText}>
          A payment prompt has been sent to your phone. Enter your PIN to complete the purchase.
        </Text>
        
        <View style={styles.orderCard}>
          <Text style={styles.orderCardLabel}>Order ID</Text>
          <Text style={styles.orderCardValue}>{success.orderId}</Text>
        </View>

        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => {
            router.back() // close checkout modal
            router.back() // close cart modal
            router.push('/(tabs)/marketplace')
          }}
        >
          <Text style={styles.primaryBtnText}>Back to Marketplace</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Meshack Urassa"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.helperText}>Your receipt will be sent to this address.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Payment Provider</Text>
          <View style={styles.providersGrid}>
            {PROVIDERS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.providerBtn, provider === p.id && styles.providerBtnActive]}
                onPress={() => setProvider(p.id)}
              >
                <Text style={[styles.providerText, provider === p.id && styles.providerTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.phonePrefix}>+255</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="712 345 678"
              keyboardType="numeric"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <Text style={styles.helperText}>You'll receive a payment prompt on this number.</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Delivery Address (Tanzania)</Text>
          <View style={styles.addressGrid}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Street / Area"
              value={address}
              onChangeText={setAddress}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="City"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({items.length})</Text>
            <Text style={styles.summaryValue}>TZS {cartTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>Free</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>TZS {cartTotal.toLocaleString()}</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.checkoutBtn} 
          onPress={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutBtnText}>Pay TZS {cartTotal.toLocaleString()}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f4f4f5',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#000', marginBottom: 20 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#52525b', marginBottom: 8 },
  input: {
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontWeight: '600', color: '#000',
  },
  helperText: { fontSize: 12, color: '#71717a', fontWeight: '500', marginTop: 6 },
  
  providersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  providerBtn: {
    flex: 1, minWidth: '45%',
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 2, borderColor: 'transparent',
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
  },
  providerBtnActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  providerText: { fontSize: 14, fontWeight: '700', color: '#52525b' },
  providerTextActive: { color: '#2563eb' },
  
  phoneInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f4f4f5', borderRadius: 12,
  },
  phonePrefix: { paddingLeft: 16, fontSize: 16, fontWeight: '700', color: '#71717a' },
  phoneInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#000' },
  
  addressGrid: { flexDirection: 'row', gap: 12 },
  
  summaryCard: {
    backgroundColor: '#fafafa', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#f4f4f5',
    marginTop: 12, marginBottom: 40,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 15, color: '#71717a', fontWeight: '500' },
  summaryValue: { fontSize: 15, color: '#000', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#e4e4e7', marginVertical: 8 },
  totalLabel: { fontSize: 18, color: '#000', fontWeight: '800' },
  totalValue: { fontSize: 18, color: '#000', fontWeight: '900' },

  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#f4f4f5', backgroundColor: '#fff' },
  checkoutBtn: {
    backgroundColor: '#000', borderRadius: 28, height: 56,
    justifyContent: 'center', alignItems: 'center',
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  successTitle: { fontSize: 24, fontWeight: '900', color: '#000', marginTop: 20, marginBottom: 12 },
  successText: { fontSize: 15, color: '#52525b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  orderCard: {
    backgroundColor: '#fafafa', borderRadius: 16, padding: 16,
    width: '100%', alignItems: 'center', marginBottom: 32,
  },
  orderCardLabel: { fontSize: 12, color: '#71717a', fontWeight: '600', marginBottom: 4 },
  orderCardValue: { fontSize: 16, fontWeight: '900', color: '#000' },
  primaryBtn: {
    backgroundColor: '#000', borderRadius: 20, width: '100%',
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
