// app/(settings)/about.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

const APP_VERSION = '1.0.0'

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* App branding */}
      <View style={styles.brandCard}>
        <View style={styles.brandLogo}>
          <Text style={styles.brandLogoText}>J</Text>
        </View>
        <Text style={styles.brandName}>JPM</Text>
        <Text style={styles.brandVersion}>Version {APP_VERSION}</Text>
      </View>

      {/* Info rows */}
      <View style={styles.card}>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={[styles.iconWrap, { backgroundColor: '#000' }]}>
            <Text style={styles.iconLetter}>D</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Builders</Text>
            <Text style={styles.rowSubtitle}>dapazcm 2026</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: '#eff6ff' }]}>
            <Text style={[styles.iconLetter, { color: '#2563eb' }]}>@</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Help & Support System</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:meshackurassa2@gmail.com')}>
              <Text style={styles.linkText}>meshackurassa2@gmail.com</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Legal */}
      <View style={styles.card}>
        {[
          { label: 'Terms of Service', icon: 'document-text-outline', onPress: () => router.push('/(settings)/terms') },
          { label: 'Privacy Policy',   icon: 'lock-closed-outline',   onPress: () => router.push('/(settings)/privacy') },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.legalRow, i > 0 && styles.legalRowBorder]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon as any} size={18} color="#71717a" />
            <Text style={styles.legalText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.copyright}>© 2026 dapazcm. All rights reserved.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  content: { padding: 20, paddingBottom: 60 },
  brandCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 20 },
  brandLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  brandLogoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  brandName: { fontSize: 22, fontWeight: '900', color: '#000', marginBottom: 4 },
  brandVersion: { fontSize: 14, color: '#71717a', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e4e4e7' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconLetter: { fontSize: 18, fontWeight: '900', color: '#fff' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 2 },
  rowSubtitle: { fontSize: 13, color: '#71717a' },
  linkText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  legalRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e4e4e7' },
  legalText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#18181b' },
  techCard: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', padding: 16, marginBottom: 8 },
  techText: { fontSize: 13, color: '#71717a', fontWeight: '500' },
  copyright: { fontSize: 12, color: '#a1a1aa', textAlign: 'center' },
})
