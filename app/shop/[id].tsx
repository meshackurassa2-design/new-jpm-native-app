import { useTheme } from '../../lib/theme';
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, Image, FlatList,
  TouchableOpacity, Dimensions
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'
import { Skeleton } from '../../components/Skeleton'
import { BackButton } from '../../components/BackButton'

const { width } = Dimensions.get('window')

interface Shop {
  id: string
  name: string
  description?: string
  location_city?: string
  cover_image?: string
  avatar_image?: string
  owner_id: string
  products: any[]
}

export default function ShopDetailScreen() {
  const { colors, isDark } = useTheme();
  // We force a dark/black theme palette for this premium shop design
  const premiumColors = {
    background: '#000000',
    card: '#111111',
    border: '#222222',
    text: '#ffffff',
    textDim: '#a1a1aa',
    accent: '#10b981' // Keep a sleek green accent
  }
  const styles = React.useMemo(() => getStyles(premiumColors), [])
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const numColumns = Math.max(2, Math.floor((width - 32) / 180))
  const cardWidth = (width - 32 - (16 * (numColumns - 1))) / numColumns

  const supabase = createClient()
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('shops')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) setShop(data)
        setLoading(false)
      })
  }, [id])

  const shopRating = React.useMemo(() => {
    const productsWithRatings = (shop?.products || []).filter((p:any) => p.rating && p.rating > 0)
    if(productsWithRatings.length === 0) return 0
    const sum = productsWithRatings.reduce((acc: number, p: any) => acc + p.rating, 0)
    return sum / productsWithRatings.length
  }, [shop])

  const renderProduct = ({ item }: { item: any }) => {
    const hasImage = item.image_urls && item.image_urls.length > 0
    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }]}
        onPress={() => router.push(`/product/${item.id}?shopId=${id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardImageWrap}>
          {hasImage ? (
            <Image source={{ uri: item.image_urls[0] }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder]}>
              <Ionicons name="cart-outline" size={32} color="#444" />
            </View>
          )}
          {item.rating > 0 && (
            <View style={styles.ratingTag}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.ratingTagText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
          <View style={[styles.priceTag, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 10, paddingBottom: 10, backgroundColor: premiumColors.background }]}>
          <BackButton />
          <Skeleton width={140} height={20} />
          <View style={{ width: 40 }} />
        </View>
        <Skeleton width="100%" height={320} borderRadius={0} />
        <View style={{ padding: 24, gap: 12 }}>
          <Skeleton width={160} height={28} />
          <Skeleton width={100} height={16} />
          <Skeleton width="90%" height={16} />
        </View>
      </View>
    )
  }

  if (!shop) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 10, paddingBottom: 10, backgroundColor: premiumColors.background }]}>
          <BackButton />
          <Text style={styles.headerTitle}>Shop</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="storefront-outline" size={52} color="#444" />
          <Text style={styles.errorText}>Shop not found.</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 10 }]}>
        <BackButton />
        <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => shop.owner_id && router.push(`/chat?id=${shop.owner_id}`)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        key={`shop-grid-${numColumns}`}
        data={shop.products || []}
        keyExtractor={(item, i) => item.id ?? String(i)}
        numColumns={numColumns}
        renderItem={renderProduct}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View style={{ paddingBottom: 16 }}>
            {/* Edge to Edge Cover Image */}
            <View style={styles.coverContainer}>
              {shop.cover_image ? (
                <Image source={{ uri: shop.cover_image }} style={styles.coverImage} resizeMode="cover" />
              ) : (
                <Image source={{ uri: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?q=80&w=1000&auto=format&fit=crop' }} style={styles.coverImage} resizeMode="cover" />
              )}
              {/* Dark Overlay for text readability */}
              <View style={[styles.coverGradient, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
              
              {/* Overlapping Avatar */}
              <View style={styles.avatarWrap}>
                {shop.avatar_image ? (
                  <Image source={{ uri: shop.avatar_image }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=400&auto=format&fit=crop' }} style={styles.avatarImage} resizeMode="cover" />
                )}
              </View>
            </View>

            {/* Shop Info Block */}
            <View style={styles.shopInfoBlock}>
              <Text style={styles.shopName}>{shop.name}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.statText}>{shopRating > 0 ? shopRating.toFixed(1) : 'New'}</Text>
                </View>
                <View style={styles.statBadge}>
                  <Ionicons name="cube-outline" size={14} color={premiumColors.textDim} />
                  <Text style={styles.statText}>{shop.products?.length || 0} items</Text>
                </View>
                {shop.location_city && (
                  <View style={styles.statBadge}>
                    <Ionicons name="location-outline" size={14} color={premiumColors.textDim} />
                    <Text style={styles.statText}>{shop.location_city}</Text>
                  </View>
                )}
              </View>

              {shop.description ? (
                <Text style={styles.shopDesc}>{shop.description}</Text>
              ) : null}
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>All Products</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="bag-outline" size={48} color="#333" />
            <Text style={styles.errorText}>No products yet.</Text>
          </View>
        }
      />
    </View>
  )
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  errorText: { fontSize: 16, color: colors.textDim },

  floatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  messageBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },

  coverContainer: { position: 'relative', width: '100%', height: 320, marginBottom: 50 },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  coverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  
  avatarWrap: {
    position: 'absolute', bottom: -40, left: 24,
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 4, borderColor: colors.background,
    backgroundColor: colors.card,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 10,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 48 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#18181b' },
  avatarInitial: { fontSize: 36, fontWeight: '900', color: colors.text },

  shopInfoBlock: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12 },
  shopName: { fontSize: 32, fontWeight: '900', color: colors.text, marginBottom: 16, letterSpacing: -0.5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBadge: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#111111', 
    borderWidth: 1, borderColor: '#222222',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 
  },
  statText: { fontSize: 14, fontWeight: '700', color: colors.text },
  shopDesc: { fontSize: 16, color: colors.textDim, lineHeight: 24, fontWeight: '400', marginBottom: 8 },

  divider: { height: 1, backgroundColor: '#222222', marginHorizontal: 24, marginBottom: 20, marginTop: 10 },
  sectionLabel: { fontSize: 22, fontWeight: '800', color: colors.text, paddingHorizontal: 24, marginBottom: 16 },

  listContent: { paddingBottom: 60 },
  columnWrapper: { justifyContent: 'flex-start', paddingHorizontal: 16, marginBottom: 16, gap: 16 },

  card: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  cardImageWrap: {
    width: '100%', aspectRatio: 1,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  cardPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  ratingTag: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    overflow: 'hidden',
  },
  ratingTagText: { color: '#fbbf24', fontSize: 12, fontWeight: '800' },
  priceTag: {
    position: 'absolute', bottom: 8, left: 8,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    overflow: 'hidden',
  },
  priceText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  cardInfo: { padding: 12 },
  cardName: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 20 },
})
