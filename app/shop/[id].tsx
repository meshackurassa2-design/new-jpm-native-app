// app/shop/[id].tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, Image, FlatList,
  TouchableOpacity, Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'
import { Skeleton } from '../../components/Skeleton'
import { BackButton } from '../../components/BackButton'

const { width } = Dimensions.get('window')
const CARD = (width - 48) / 2

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

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
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

  const renderProduct = ({ item }: { item: any }) => {
    const hasImage = item.image_urls && item.image_urls.length > 0
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/product/${item.id}?shopId=${id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardImageWrap}>
          {hasImage ? (
            <Image source={{ uri: item.image_urls[0] }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder]}>
              <Ionicons name="cart-outline" size={28} color="#a1a1aa" />
            </View>
          )}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
        </View>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerBar}>
          <BackButton />
          <Skeleton width={140} height={20} />
          <View style={{ width: 40 }} />
        </View>
        {/* Cover skeleton */}
        <Skeleton width="100%" height={180} borderRadius={0} />
        <View style={{ padding: 16, gap: 8 }}>
          <Skeleton width={160} height={22} />
          <Skeleton width={100} height={14} />
          <Skeleton width="80%" height={14} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ width: '50%', padding: 6 }}>
              <Skeleton width="100%" style={{ aspectRatio: 1, marginBottom: 8 }} borderRadius={12} />
              <Skeleton width="70%" height={14} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    )
  }

  if (!shop) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerBar}>
          <BackButton />
          <Text style={styles.headerTitle}>Shop</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="storefront-outline" size={52} color="#d4d4d8" />
          <Text style={styles.errorText}>Shop not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.headerBar}>
        <BackButton />
        <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => shop.owner_id && router.push(`/chat?id=${shop.owner_id}`)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={shop.products || []}
        keyExtractor={(item, i) => item.id ?? String(i)}
        numColumns={2}
        renderItem={renderProduct}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View>
            {/* Cover Image */}
            {shop.cover_image ? (
              <Image source={{ uri: shop.cover_image }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <View style={[styles.coverImage, styles.coverPlaceholder]}>
                <Ionicons name="storefront-outline" size={48} color="#d4d4d8" />
              </View>
            )}

            {/* Shop Info */}
            <View style={styles.shopInfoBlock}>
              <Text style={styles.shopName}>{shop.name}</Text>
              {shop.location_city && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#71717a" />
                  <Text style={styles.locationText}>{shop.location_city}</Text>
                </View>
              )}
              {shop.description ? (
                <Text style={styles.shopDesc}>{shop.description}</Text>
              ) : null}
              <Text style={styles.productsCount}>{shop.products?.length || 0} products</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>All Products</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="bag-outline" size={48} color="#d4d4d8" />
            <Text style={styles.errorText}>No products yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  errorText: { fontSize: 16, color: '#71717a' },

  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f4f4f5',
    justifyContent: 'space-between',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#18181b', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  messageBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },

  coverImage: { width: '100%', height: 180 },
  coverPlaceholder: { backgroundColor: '#f4f4f5', justifyContent: 'center', alignItems: 'center' },

  shopInfoBlock: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  shopName: { fontSize: 24, fontWeight: '800', color: '#18181b', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locationText: { fontSize: 14, color: '#71717a' },
  shopDesc: { fontSize: 15, color: '#52525b', lineHeight: 22, marginBottom: 8 },
  productsCount: { fontSize: 13, color: '#a1a1aa', fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#f4f4f5', marginHorizontal: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 18, fontWeight: '700', color: '#18181b', paddingHorizontal: 16, marginBottom: 8 },

  listContent: { paddingHorizontal: 12, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },

  card: { width: CARD },
  cardImageWrap: {
    width: CARD, height: CARD,
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#f4f4f5', marginBottom: 8,
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  cardPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  priceTag: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  priceText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardName: { fontSize: 13, fontWeight: '600', color: '#27272a', lineHeight: 18 },
})
