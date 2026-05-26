// components/BackButton.tsx
// Reusable, professional back button used across all screens
import React from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface Props {
  color?: string
  onPress?: () => void
  style?: object
}

export function BackButton({ color = '#18181b', onPress, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={onPress || (() => router.back())}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="chevron-back" size={20} color={color} style={{ paddingRight: 2 }} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(244,244,245,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
