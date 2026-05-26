// app/(settings)/index.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth'
import { createClient } from '../../lib/supabase'
import { useUI } from '../../lib/ui'

export default function SettingsIndexScreen() {
  const { user, signOut } = useAuth()
  const { showActionSheet } = useUI()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [profile, setProfile] = React.useState<any>(null)

  React.useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        setProfile(data)
        setIsAdmin(!!data?.is_admin)
      })
  }, [user])

  const handleSignOut = () => {
    showActionSheet('Are you sure you want to log out?', [
      { text: 'Log out', style: 'destructive', icon: 'log-out', onPress: async () => {
        await signOut()
        router.replace('/(auth)/login')
      }},
      { text: 'Cancel', style: 'cancel', onPress: () => {} }
    ])
  }

  const SettingsItem = ({ icon, title, color = '#71717a', onPress, danger }: { icon: any, title: string, color?: string, onPress?: () => void, danger?: boolean }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress || (() => {})}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconWrap, { backgroundColor: danger ? '#fef2f2' : color }]}>
          <Ionicons name={icon} size={18} color={danger ? '#ef4444' : '#fff'} />
        </View>
        <Text style={[styles.itemTitle, danger && { color: '#ef4444' }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#d4d4d8" />
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>

      {/* Profile Header */}
      {profile && (
        <TouchableOpacity style={styles.profileCard} onPress={() => router.push('/(settings)/edit-profile')} activeOpacity={0.8}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{profile.full_name?.[0] || '?'}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.full_name}</Text>
            <Text style={styles.profileUsername}>@{profile.username}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
        </TouchableOpacity>
      )}

      {/* Account */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <SettingsItem color="#3b82f6" icon="person" title="Edit Profile" onPress={() => router.push('/(settings)/edit-profile')} />
          <SettingsItem color="#6366f1" icon="lock-closed" title="Privacy Policy" onPress={() => router.push('/(settings)/privacy')} />
          <SettingsItem color="#ec4899" icon="document-text" title="Terms of Service" onPress={() => router.push('/(settings)/terms')} />
          <SettingsItem color="#8b5cf6" icon="bookmark" title="Saved" onPress={() => router.push('/(settings)/bookmarks')} />
          <SettingsItem color="#14b8a6" icon="shield-checkmark" title="Security" onPress={() => router.push('/(settings)/security')} />
        </View>
      </View>

      {/* Marketplace */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Marketplace</Text>
        <View style={styles.sectionCard}>
          <SettingsItem color="#f59e0b" icon="bag-check" title="Purchases" onPress={() => router.push('/(settings)/purchases')} />
          <SettingsItem color="#eab308" icon="storefront" title="Store Dashboard" onPress={() => router.push('/(settings)/store-dashboard')} />
        </View>
      </View>

      {/* Creator */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Creator</Text>
        <View style={styles.sectionCard}>
          <SettingsItem color="#10b981" icon="cash" title="Monetization" onPress={() => router.push('/(settings)/monetization')} />
          <SettingsItem color="#0ea5e9" icon="megaphone" title="Ads Management" onPress={() => router.push('/(settings)/ads')} />
        </View>
      </View>

      {/* Admin (only visible for admins) */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin & Moderation</Text>
          <View style={styles.sectionCard}>
            <SettingsItem color="#ef4444" icon="shield" title="Admin Dashboard" onPress={() => router.push('/(settings)/admin')} />
            <SettingsItem color="#f97316" icon="briefcase" title="Marketplace Shops" onPress={() => router.push('/(settings)/marketplace-admin')} />
          </View>
        </View>
      )}

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionCard}>
          <SettingsItem color="#a855f7" icon="sunny" title="Appearance" onPress={() => router.push('/(settings)/appearance')} />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionCard}>
          <SettingsItem color="#3b82f6" icon="help-circle" title="Help & Support" onPress={() => router.push('/(settings)/help')} />
          <SettingsItem color="#6b7280" icon="information-circle" title="About App" onPress={() => router.push('/(settings)/about')} />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.item} onPress={handleSignOut} activeOpacity={0.6}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconWrap, styles.iconWrapDanger]}>
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              </View>
              <Text style={[styles.itemTitle, { color: '#ef4444' }]}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  list: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f4f4f5',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapDanger: {
    backgroundColor: '#fef2f2',
  },
  itemTitle: {
    fontSize: 16,
    color: '#18181b',
    fontWeight: '500',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  profileAvatar: {
    width: 60, height: 60, borderRadius: 30, marginRight: 16,
  },
  avatarFallback: {
    backgroundColor: '#e4e4e7', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {
    fontSize: 24, fontWeight: '700', color: '#71717a'
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20, fontWeight: '700', color: '#18181b', marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14, color: '#71717a',
  },
})
