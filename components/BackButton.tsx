// components/BackButton.tsx
// Reusable, professional back button used across all screens
import { useTheme } from '../lib/theme';
import React from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface Props {
  color?: string
  onPress?: () => void
  style?: object
}

export function BackButton({ color, onPress, style }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={onPress || (() => router.back())}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="chevron-back" size={20} color={color || '#000'} style={{ paddingRight: 2 }} />
    </TouchableOpacity>
  )
}

const getStyles = (colors: any) => StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(244,244,245,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
