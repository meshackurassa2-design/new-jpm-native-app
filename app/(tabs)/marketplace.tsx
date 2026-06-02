// app/(tabs)/marketplace.tsx
import { useTheme } from '../../lib/theme';
import React, { useEffect, useState, useMemo } from 'react'
import {
  View, Text, TextInput, StyleSheet, FlatList, Image,
  TouchableOpacity, ScrollView, Modal, useWindowDimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '../../lib/supabase'
import { useCart } from '../../lib/cart'
import { useAuth } from '../../lib/auth'
import { Skeleton } from '../../components/Skeleton'

interface Product {
  id: string
  name: string
  price: string
  image_urls?: string[]
  shopId: string
  shopName: string
  shopCity: string
}

export default function () {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const supabase = createClient()
  const { user } = useAuth()
  const { items } = useCart()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [userShopId, setUserShopId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [showRules, setShowRules] = useState(false)

  const { width } = useWindowDimensions()
  const numColumns = Math.max(2, Math.floor((width - 32) / 180))
  const cardWidth = (width - 32 - (12 * (numColumns - 1))) / numColumns

  const CATEGORIES = ['Clothing', 'Electronics', 'Food & Restaurants', 'Beauty', 'Books', 'Home', 'Sports', 'Toys', 'Other']
  const hasActiveFilter = !!selectedCity || !!selectedCategory

  useEffect(() => {
    const checkRules = async () => {
      const accepted = await AsyncStorage.getItem('has_accepted_market_rules')
      if (!accepted) {
        setShowRules(true)
      }
    }
    checkRules()

    const fetchShops = async () => {
      const { data: shops, error } = await supabase
        .from('shops')
        .select('*')
        .eq('status', 'active')
        .eq('is_paid', true)
        .order('created_at', { ascending: false })

      if (shops && !error) {
        // Flatten products
        const allProds: Product[] = shops.flatMap((shop: any) => 
          (shop.products || []).map((p: any) => ({
            ...p,
            shopId: shop.id,
            shopName: shop.name,
            shopCity: shop.location_city,
          }))
        )
        setProducts(allProds)
      }

      if (user) {
        const { data: userShop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()
        
        setUserShopId(userShop?.id || null)
      } else {
        setUserShopId(null)
      }

      setLoading(false)
    }
    fetchShops()
  }, [user])

  const cities = useMemo(() => {
    return Array.from(new Set(products.map(p => p.shopCity).filter(Boolean)))
  }, [products])

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const searchLower = search.toLowerCase()
      const matchesSearch = !search || 
        (p.name && p.name.toLowerCase().includes(searchLower)) ||
        (p.shopName && p.shopName.toLowerCase().includes(searchLower))
      const matchesCity = !selectedCity || p.shopCity === selectedCity
      const matchesCategory = !selectedCategory || (p as any).category === selectedCategory
      return matchesSearch && matchesCity && matchesCategory
    })

    return filtered.sort((a: any, b: any) => {
      const ratingA = a.rating || 0
      const ratingB = b.rating || 0
      if (ratingA !== ratingB) return ratingB - ratingA
      const countA = a.review_count || 0
      const countB = b.review_count || 0
      return countB - countA
    })
  }, [products, search, selectedCity, selectedCategory])

  const renderProduct = ({ item }: { item: Product }) => {
    const hasImage = item.image_urls && item.image_urls.length > 0;
    
    return (
      <TouchableOpacity 
        style={[styles.productCard, { width: cardWidth }]}
        onPress={() => router.push(`/product/${item.id}?shopId=${item.shopId}`)}
      >
        <View style={styles.imageContainer}>
          {hasImage ? (
            <Image source={{ uri: item.image_urls![0] }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholderImg]}>
              <Ionicons name="cart-outline" size={32} color="#a1a1aa" />
            </View>
          )}
          {(item as any).rating > 0 && (
            <View style={styles.ratingTag}>
              <Ionicons name="star" size={10} color="#fbbf24" />
              <Text style={styles.ratingTagText}>{(item as any).rating.toFixed(1)}</Text>
            </View>
          )}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
          {item.shopCity ? (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color="#71717a" />
              <Text style={styles.locationText}>{item.shopCity}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    )
  }

  const acceptRules = async () => {
    await AsyncStorage.setItem('has_accepted_market_rules', 'true')
    setShowRules(false)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={styles.headerRight}>
          {!loading && userShopId === null && (
            <TouchableOpacity 
              style={styles.openShopBtn}
              onPress={() => router.push('/register-shop')}
            >
              <Text style={styles.openShopText}>Open a Shop</Text>
            </TouchableOpacity>
          )}
          {userShopId !== null && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/shop/${userShopId}`)}>
              <Ionicons name="storefront-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          {/* Purchases shortcut */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(settings)/purchases')}>
            <Ionicons name="receipt-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search + Filter icon */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#a1a1aa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, shops..."
            placeholderTextColor="#a1a1aa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {/* Filter hamburger icon */}
        <TouchableOpacity
          style={[styles.filterIconBtn, hasActiveFilter && styles.filterIconBtnActive]}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="options-outline" size={20} color={hasActiveFilter ? colors.background : colors.text} />
          {hasActiveFilter && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilter(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter</Text>
            <TouchableOpacity onPress={() => { setSelectedCategory(null); setSelectedCity(null) }}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterSectionLabel}>Category</Text>
          <View style={styles.chipWrap}>
            {['All', ...CATEGORIES].map(cat => {
              const active = cat === 'All' ? !selectedCategory : selectedCategory === cat
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedCategory(cat === 'All' ? null : cat)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {cities.length > 0 && (
            <>
              <Text style={styles.filterSectionLabel}>City</Text>
              <View style={styles.chipWrap}>
                {['All', ...cities].map(city => {
                  const active = city === 'All' ? !selectedCity : selectedCity === city
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedCity(city === 'All' ? null : city)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{city}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilter(false)}>
            <Text style={styles.applyBtnText}>Show Results</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Rules & Anti-Fraud Modal */}
      <Modal visible={showRules} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kanuni na Masharti</Text>
            </View>
            <ScrollView style={{ maxHeight: 400, marginVertical: 16 }}>
              <Text style={[styles.modalText, { fontWeight: '700', marginBottom: 8 }]}>Karibu kwenye Soko!</Text>
              <Text style={styles.modalText}>Kwa kuingia hapa, unakubaliana na sera zetu kali dhidi ya utapeli na miongozo ya jamii:</Text>
              
              <View style={{ marginTop: 12, gap: 10 }}>
                <Text style={styles.modalText}>1. <Text style={{ fontWeight: '700' }}>Malipo Ndani ya App Tu:</Text> Miamala na malipo yote LAZIMA yafanyike kwa usalama ndani ya app. Usitume pesa nje ya app.</Text>
                <Text style={styles.modalText}>2. <Text style={{ fontWeight: '700' }}>Hakuna Utapeli au Wizi:</Text> Watumiaji watakaokamatwa wakitapeli wanunuzi au wauzaji watafungiwa moja kwa moja.</Text>
                <Text style={styles.modalText}>3. <Text style={{ fontWeight: '700' }}>Ulinzi wa Pesa Zako:</Text> Tunalinda pesa zako hadi uthibitishe kupokea bidhaa, lakini tu ikiwa umelipia ndani ya app.</Text>
                <Text style={styles.modalText}>4. <Text style={{ fontWeight: '700' }}>Heshima kwa Wote:</Text> Heshimu wanajamii wote kwenye jumbe na miamala.</Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity style={styles.acceptBtn} onPress={acceptRules}>
              <Text style={styles.acceptBtnText}>Nakubaliana na Kanuni</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 8 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={{ width: '50%', padding: 6 }}>
              <Skeleton width="100%" style={{ aspectRatio: 1, marginBottom: 8 }} borderRadius={16} />
              <View style={{ paddingHorizontal: 4, gap: 4 }}>
                <Skeleton width="80%" height={14} />
                <Skeleton width="50%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          key={`market-grid-${numColumns}`}
          data={filteredProducts}
          keyExtractor={(item, index) => item.id + index}
          renderItem={renderProduct}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color="#d4d4d8" />
              <Text style={styles.emptyText}>No products found.</Text>
            </View>
          }
        />
      )}

      {/* Floating Cart Button */}
      {items.length > 0 && (
        <TouchableOpacity
          style={styles.cartFab}
          activeOpacity={0.8}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="bag-handle" size={24} color={colors.background} />
          <View style={styles.cartFabBadge}>
            <Text style={styles.cartFabBadgeText}>{items.length}</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  openShopBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.text, borderRadius: 20,
  },
  openShopText: { color: colors.background, fontSize: 13, fontWeight: '700' },
  cartBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative'
  },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#ef4444',
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background
  },
  cartBadgeText: { color: colors.background, fontSize: 10, fontWeight: '800' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 10, gap: 8,
  },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 12, paddingHorizontal: 12, height: 42,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  filterIconBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  filterIconBtnActive: { backgroundColor: colors.text },
  filterDot: {
    position: 'absolute', top: 7, right: 7,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#3b82f6',
    borderWidth: 1.5, borderColor: colors.text,
  },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20
  },
  modalContent: {
    backgroundColor: colors.background, borderRadius: 24, padding: 20
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  filterScroll: { padding: 16 },
  filterSection: { marginBottom: 24 },
  filterLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  
  acceptBtn: {
    backgroundColor: '#2563eb', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 12
  },
  acceptBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  clearText: { fontSize: 14, color: '#3b82f6', fontWeight: '600' },
  filterSectionLabel: {
    fontSize: 13, fontWeight: '700', color: colors.textDim,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  chipWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: colors.border,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textDim },
  chipTextActive: { color: colors.background },
  applyBtn: {
    backgroundColor: colors.text, borderRadius: 14,
    height: 50, justifyContent: 'center', alignItems: 'center',
    marginTop: 4,
  },
  applyBtnText: { color: colors.background, fontSize: 16, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  columnWrapper: { justifyContent: 'flex-start', gap: 12 },
  productCard: { marginBottom: 20 },
  imageContainer: {
    width: '100%', aspectRatio: 1,
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.border, marginBottom: 8,
  },
  productImage: { width: '100%', height: '100%' },
  placeholderImg: { justifyContent: 'center', alignItems: 'center' },
  priceTag: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  ratingTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingTagText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  productInfo: { paddingHorizontal: 4 },
  productName: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 18, marginBottom: 4 },
  shopName: { fontSize: 12, color: colors.textDim, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 11, color: colors.textDim, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 64 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textDim, marginTop: 12 },
  cartFab: {
    position: 'absolute', bottom: 100, right: 24,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.text,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.text, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  cartFabBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#ef4444', minWidth: 20, height: 20,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.text,
    paddingHorizontal: 4,
  },
  cartFabBadgeText: {
    color: colors.background, fontSize: 10, fontWeight: '800',
  }
})
