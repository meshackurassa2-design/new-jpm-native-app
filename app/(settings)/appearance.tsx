// app/(settings)/appearance.tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const OPTIONS = [
  { id: 'system', label: 'System setting', icon: 'phone-portrait-outline', desc: 'Follows your device setting' },
  { id: 'light',  label: 'Light',          icon: 'sunny-outline',          desc: 'Always use light mode' },
  { id: 'dark',   label: 'Dark',           icon: 'moon-outline',           desc: 'Always use dark mode'  },
]

export default function AppearanceScreen() {
  const scheme = useColorScheme()
  const [selected, setSelected] = useState<'system' | 'light' | 'dark'>('system')

  React.useEffect(() => {
    AsyncStorage.getItem('theme').then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') {
        setSelected(v)
      }
    })
  }, [])

  const handleSelect = (id: 'system' | 'light' | 'dark') => {
    setSelected(id)
    AsyncStorage.setItem('theme', id)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionDesc}>Choose how the app looks for you.</Text>

      <View style={styles.card}>
        {OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.row, i < OPTIONS.length - 1 && styles.rowBorder]}
            onPress={() => handleSelect(opt.id as any)}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, selected === opt.id && styles.iconWrapActive]}>
                <Ionicons name={opt.icon as any} size={18} color={selected === opt.id ? '#fff' : '#71717a'} />
              </View>
              <View>
                <Text style={styles.rowLabel}>{opt.label}</Text>
                <Text style={styles.rowDesc}>{opt.desc}</Text>
              </View>
            </View>
            <View style={[styles.radio, selected === opt.id && styles.radioSelected]}>
              {selected === opt.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.note}>
        Appearance changes apply to this device only. Sign in on another device to set it there.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  content: { padding: 20 },
  sectionDesc: { fontSize: 15, color: '#71717a', marginBottom: 20, lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e4e4e7' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f4f4f5', justifyContent: 'center', alignItems: 'center' },
  iconWrapActive: { backgroundColor: '#000' },
  rowLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  rowDesc: { fontSize: 13, color: '#71717a', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d4d4d8', justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#000' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#000' },
  note: { fontSize: 13, color: '#a1a1aa', lineHeight: 20, textAlign: 'center', marginTop: 8 },
})
