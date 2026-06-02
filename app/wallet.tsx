// app/wallet.tsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Animated
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { createClient } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { TextWalletAd } from '../components/InFeedAd'

const WITHDRAW_THRESHOLD = 65000;
const REWARD_AMOUNT = 10;

export default function WalletScreen() {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = useMemo(() => getStyles(colors), [colors])
  const supabase = createClient()
  
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [watchingAd, setWatchingAd] = useState(false)
  
  const [withdrawEmail, setWithdrawEmail] = useState('')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    if (user) fetchWallet()
  }, [user])

  const fetchWallet = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('wallet_balance').eq('id', user?.id).single()
    if (data) {
      setBalance(data.wallet_balance || 0)
    }
    
    const { data: wData } = await supabase.from('withdrawals').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
    if (wData) setWithdrawals(wData)
    
    const { data: leadData } = await supabase.from('profiles').select('id, full_name, wallet_balance, avatar_url').order('wallet_balance', { ascending: false }).limit(5)
    if (leadData) setLeaderboard(leadData)
    
    setLoading(false)
  }

  const handleWatchAd = () => {
    if (watchingAd) return
    setWatchingAd(true)
    
    // Simulate 3-second ad watch
    setTimeout(async () => {
      // Grant reward securely via RPC which returns the randomized amount
      const { data: reward, error } = await supabase.rpc('grant_ad_reward', { p_user_id: user?.id })
      
      setWatchingAd(false)
      
      if (!error && reward) {
        if (reward === 1000) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          Alert.alert('💥 JACKPOT! 💥', `You just won ${reward} coins!!`)
        } else if (reward === 100) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          Alert.alert('Amazing! 🎉', `You found a rare drop of ${reward} coins!`)
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          Alert.alert('Reward Granted!', `You earned ${reward} coins!`)
        }
        fetchWallet()
      } else {
        console.error('RPC Error:', error, 'Reward:', reward)
        Alert.alert('Error', error?.message || 'Failed to claim reward.')
      }
    }, 3000)
  }

  const handleWithdraw = async () => {
    if (!withdrawEmail || !withdrawEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid PayPal email address.')
      return
    }
    
    setWithdrawing(true)
    const { error } = await supabase.rpc('request_withdrawal', {
      p_user_id: user?.id,
      p_amount: balance,
      p_email: withdrawEmail
    })
    setWithdrawing(false)
    
    if (!error) {
      Alert.alert('Success! 🎉', 'Your withdrawal request has been submitted and is pending review.')
      setShowWithdraw(false)
      fetchWallet()
    } else {
      Alert.alert('Error', error.message || 'Failed to submit withdrawal request.')
    }
  }

  const handlePurchase = async (pkg: any) => {
    Haptics.selectionAsync()
    Alert.alert(
      'Confirm Purchase',
      `Buy ${pkg.title} for ${pkg.price}? (This is a mock purchase for testing)`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Now', 
          style: 'default',
          onPress: async () => {
            setLoading(true)
            
            if (pkg.id === 'unlimited') {
              const { error } = await supabase.from('profiles').update({ is_premium: true }).eq('id', user?.id)
              if (!error) {
                Alert.alert('Success!', 'You are now a Premium member with unlimited AI access!')
              }
            } else {
              const { data, error } = await supabase.from('profiles').select('wallet_balance').eq('id', user?.id).single()
              if (data) {
                const newBalance = (data.wallet_balance || 0) + pkg.coins
                await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user?.id)
                Alert.alert('Success!', `${pkg.coins} coins added to your wallet!`)
              }
            }
            
            fetchWallet()
          }
        }
      ]
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString();
  }

  const progress = Math.min(balance / WITHDRAW_THRESHOLD, 1)

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Balance Card */}
        <LinearGradient
          colors={['#18181b', '#09090b', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.balanceCard, { borderWidth: 1, borderColor: '#27272a' }]}
        >
          <Text style={styles.balanceLabelPremium}>Total Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.balanceAmountPremium} numberOfLines={1} adjustsFontSizeToFit>{formatNumber(balance)}</Text>
          </View>
        </LinearGradient>

        {/* Quick Actions Grid */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
          {/* Watch Ad Button */}
          <TouchableOpacity 
            style={[styles.gridActionBtn, watchingAd && { opacity: 0.7 }]} 
            onPress={handleWatchAd}
            disabled={watchingAd}
            activeOpacity={0.8}
          >
            {watchingAd ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="play-circle" size={32} color="#fff" style={{ marginBottom: 8 }} />
            )}
            <Text style={styles.gridActionText}>Watch Ad</Text>
            <Text style={styles.gridActionSubText}>Free Coins</Text>
          </TouchableOpacity>

          {/* AI Mentor Button */}
          <TouchableOpacity 
            style={styles.gridActionBtn} 
            onPress={() => router.push('/(tabs)/ai')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🧠</Text>
            <Text style={styles.gridActionText}>Dapaz AI</Text>
            <Text style={styles.gridActionSubText}>Business Chat</Text>
          </TouchableOpacity>
        </View>

        {/* AdMob Banner Ad */}
        <TextWalletAd />

        {/* Coin Store Section */}
        <View style={{ marginBottom: 10, marginTop: 10 }}>
          <Text style={styles.sectionTitle}>🛒 Coin Store</Text>
          <Text style={styles.withdrawSub}>Buy coins to use Dapaz AI features</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {/* Starter Pack */}
            <TouchableOpacity onPress={() => handlePurchase({ id: 'starter', title: 'Starter Pack', price: '$1.99', coins: 500 })} activeOpacity={0.8} style={styles.gridPackageWrapper}>
              <LinearGradient colors={['#27272a', '#18181b']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.gridPackageCard}>
                <Text style={styles.gridPackageTitle}>Starter</Text>
                <Text style={styles.gridPackageCoins}>500 🪙</Text>
                <Text style={styles.gridPackageDesc}>~10 images</Text>
                <View style={styles.gridPackagePriceBtn}>
                  <Text style={styles.packagePriceText}>$1.99</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Pro Pack */}
            <TouchableOpacity onPress={() => handlePurchase({ id: 'pro', title: 'Pro Pack', price: '$4.99', coins: 2500 })} activeOpacity={0.8} style={styles.gridPackageWrapper}>
              <LinearGradient colors={['#27272a', '#18181b']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.gridPackageCard}>
                <Text style={styles.gridPackageTitle}>Pro Pack</Text>
                <Text style={styles.gridPackageCoins}>2,500 🪙</Text>
                <Text style={styles.gridPackageDesc}>~50 images</Text>
                <View style={styles.gridPackagePriceBtn}>
                  <Text style={styles.packagePriceText}>$4.99</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Business Pack */}
            <TouchableOpacity onPress={() => handlePurchase({ id: 'biz', title: 'Business Pack', price: '$14.99', coins: 10000 })} activeOpacity={0.8} style={styles.gridPackageWrapper}>
              <LinearGradient colors={['#27272a', '#18181b']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.gridPackageCard}>
                <Text style={styles.gridPackageTitle}>Business</Text>
                <Text style={styles.gridPackageCoins}>10,000 🪙</Text>
                <Text style={styles.gridPackageDesc}>~200 images</Text>
                <View style={styles.gridPackagePriceBtn}>
                  <Text style={styles.packagePriceText}>$14.99</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Unlimited VIP */}
            <TouchableOpacity onPress={() => handlePurchase({ id: 'unlimited', title: 'Unlimited VIP', price: '$29.99/mo', coins: 0 })} activeOpacity={0.8} style={styles.gridPackageWrapper}>
              <LinearGradient colors={['#27272a', '#18181b']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.gridPackageCard}>
                <Text style={styles.gridPackageTitle}>👑 VIP</Text>
                <Text style={[styles.gridPackageCoins, { color: '#f59e0b' }]}>Unlimited</Text>
                <Text style={styles.gridPackageDesc}>All features</Text>
                <View style={[styles.gridPackagePriceBtn, { backgroundColor: '#fff' }]}>
                  <Text style={[styles.packagePriceText, { color: '#000' }]}>$29.99 / mo</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* How to Earn Info Card */}
        <View style={{ marginTop: 10, marginBottom: 16, backgroundColor: '#18181b', borderRadius: 16, borderWidth: 1, borderColor: '#27272a', padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 }}>💡 How to Earn Free Coins</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="play-circle-outline" size={20} color="#a1a1aa" />
            <Text style={{ color: '#a1a1aa', fontSize: 14, marginLeft: 10, flex: 1 }}>Watch <Text style={{ color: '#fff', fontWeight: '700' }}>5 short sponsor videos</Text> to earn enough for <Text style={{ color: '#fff', fontWeight: '700' }}>1 AI image</Text> (50 🪙).</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#a1a1aa" />
            <Text style={{ color: '#a1a1aa', fontSize: 14, marginLeft: 10, flex: 1 }}>Each ad gives <Text style={{ color: '#fff', fontWeight: '700' }}>10–50 coins</Text>. Lucky drops can give enough for <Text style={{ color: '#fff', fontWeight: '700' }}>a full image in one go!</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="storefront-outline" size={20} color="#a1a1aa" />
            <Text style={{ color: '#a1a1aa', fontSize: 14, marginLeft: 10, flex: 1 }}>Or buy coins from the store to skip the ads entirely.</Text>
          </View>
        </View>

        {/* Leaderboard */}
        <View style={{ marginTop: 30, marginBottom: 40 }}>
          <Text style={styles.sectionTitle}>🏆 Top Earners</Text>
          {leaderboard.map((l, index) => (
            <View key={l.id} style={styles.historyItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', marginRight: 12, color: colors.textDim }}>#{index + 1}</Text>
                {l.avatar_url ? (
                  <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.border, marginRight: 12 }}>
                    <Animated.Image source={{ uri: l.avatar_url }} style={{ width: '100%', height: '100%' }} />
                  </View>
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: colors.text, fontSize: 14 }}>{l.full_name?.[0] || '?'}</Text>
                  </View>
                )}
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{l.full_name}</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{formatNumber(l.wallet_balance || 0)} 🪙</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  
  balanceCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8
  },
  balanceLabelPremium: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinIcon: { fontSize: 48 },
  balanceAmountPremium: { fontSize: 56, fontWeight: '900', color: '#ffffff' },

  statusTextApproved: { color: '#10b981' },

  withdrawSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  withdrawSub: { fontSize: 14, color: colors.textDim, marginBottom: 20, lineHeight: 20 },
  
  progressTrack: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6
  },
  progressText: { fontSize: 13, color: colors.textDim, fontWeight: '600', textAlign: 'right', marginBottom: 16 },

  withdrawUnlockBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  withdrawUnlockText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  withdrawForm: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  formLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16
  },
  submitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  historyAmount: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  historyEmail: { color: colors.textDim, fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPending: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  statusApproved: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextPending: { color: '#f59e0b' },
  statusTextApproved: { color: '#10b981' },
  
  gridActionBtn: {
    flex: 1,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  gridActionText: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  gridActionSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },

  gridPackageWrapper: { width: '48%', marginBottom: 15 },
  gridPackageCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'space-between'
  },
  gridPackageTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  gridPackageCoins: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  gridPackageDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  gridPackagePriceBtn: { backgroundColor: '#3f3f46', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, width: '100%', alignItems: 'center' },
  packagePriceText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800'
  }
})
