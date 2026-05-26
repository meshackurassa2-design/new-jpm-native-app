// app/(settings)/help.tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, LayoutAnimation } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

const FAQ = [
  {
    q: 'How do I change my username?',
    a: 'Go to Settings → Edit Profile and tap on your username to change it.'
  },
  {
    q: 'How do I report a post?',
    a: 'Tap the three-dot menu on any post and select "Report". Our team reviews all reports.'
  },
  {
    q: 'How do I enable monetization?',
    a: 'Go to Settings → Monetization and check your eligibility status. Keep posting quality content to unlock it.'
  },
  {
    q: 'How do I open a store?',
    a: 'Go to Settings → Store Dashboard and tap "Create Shop". Your shop will be reviewed by our team.'
  },
  {
    q: 'How do I delete my account?',
    a: 'Please contact us at meshackurassa2@gmail.com and we will process your request within 48 hours.'
  },
]

function FAQItem({ q, a }: { q: string, a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setOpen(!open)
      }}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#71717a" />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  )
}

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Contact card */}
      <View style={styles.contactCard}>
        <View style={styles.contactIcon}>
          <Ionicons name="mail-outline" size={24} color="#2563eb" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactTitle}>Support Email</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:meshackurassa2@gmail.com')}>
            <Text style={styles.contactLink}>meshackurassa2@gmail.com</Text>
          </TouchableOpacity>
          <Text style={styles.contactNote}>We respond within 24–48 hours</Text>
        </View>
      </View>

      {/* FAQ */}
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      <View style={styles.card}>
        {FAQ.map((item, i) => (
          <View key={i}>
            <FAQItem q={item.q} a={item.a} />
            {i < FAQ.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Extra links */}
      <View style={styles.linksCard}>
        {[
          { label: 'Terms of Service', icon: 'document-text-outline', onPress: () => router.push('/(settings)/terms') },
          { label: 'Privacy Policy',   icon: 'lock-closed-outline',   onPress: () => router.push('/(settings)/privacy') },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.linkRow, i > 0 && styles.rowBorder]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon as any} size={18} color="#71717a" />
            <Text style={styles.linkText}>{item.label}</Text>
            <Ionicons name="open-outline" size={16} color="#a1a1aa" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  content: { padding: 20, paddingBottom: 60 },
  contactCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  contactTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  contactLink: { fontSize: 14, color: '#2563eb', fontWeight: '600', marginBottom: 2 },
  contactNote: { fontSize: 12, color: '#a1a1aa' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  faqItem: { padding: 16 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  faqQ: { fontSize: 15, fontWeight: '600', color: '#000', flex: 1 },
  faqA: { fontSize: 14, color: '#71717a', marginTop: 10, lineHeight: 21 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#e4e4e7', marginHorizontal: 16 },
  linksCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e4e4e7' },
  linkText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#18181b' },
})
