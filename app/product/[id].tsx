// app/product/[id].tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Alert
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCart } from '../../lib/cart'
import { createClient } from '../../lib/supabase'
import { BackButton } from '../../components/BackButton'

const { width } = Dimensions.get('window')

interface Product {
  id: string
  name: string
  price: string
  description?: string
  image_urls?: string[]
  category?: string
  size?: string
  condition?: string
  shopId: string
  shopName: string
  shopCity: string
  owner_id: string
}

export default function ProductDetailScreen() {
  const { id, shopId } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const supabase = createClient()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      // Find the shop
      const { data: shop, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single()

      if (shop && !error) {
        // Find product in shop products array
        const p = (shop.products || []).find((prod: any) => prod.id === id)
        if (p) {
          setProduct({
            ...p,
            shopId: shop.id,
            shopName: shop.name,
            shopCity: shop.location_city,
            owner_id: shop.owner_id
          })
        }
      }
      setLoading(false)
    }

    if (id && shopId) fetchProduct()
  }, [id, shopId])

  const handleMessageSeller = () => {
    if (!product) return
    Alert.alert('Message Seller', `This will open a DM with the owner of ${product.shopName}. (Chat coming soon!)`)
  }

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_urls?.[0],
      shopId: product.shopId,
      shopName: product.shopName,
      sellerId: product.owner_id
    })
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#d4d4d8" />
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    )
  }

  const hasImages = product.image_urls && product.image_urls.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          {hasImages ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width)
                setActiveImageIndex(idx)
              }}
            >
              {product.image_urls!.map((url, idx) => (
                <Image key={idx} source={{ uri: url }} style={styles.carouselImage} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.carouselImage, styles.placeholderImg]}>
              <Ionicons name="cart-outline" size={64} color="#a1a1aa" />
            </View>
          )}

          {/* Dots Indicator */}
          {hasImages && product.image_urls!.length > 1 && (
            <View style={styles.dotsContainer}>
              {product.image_urls!.map((_, idx) => (
                <View 
                  key={idx} 
                  style={[styles.dot, activeImageIndex === idx && styles.activeDot]} 
                />
              ))}
            </View>
          )}

          {/* Close Button overlay */}
          <BackButton style={[styles.closeBtnOverlay, { top: insets.top + 10 }]} />
        </View>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.price}>{product.price}</Text>
          <Text style={styles.name}>{product.name}</Text>
          
          <View style={styles.tagsRow}>
            {product.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.category}</Text>
              </View>
            )}
            {product.size && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>Size: {product.size}</Text>
              </View>
            )}
            {product.condition && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.condition}</Text>
              </View>
            )}
          </View>

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}

          {/* Shop Card */}
          <TouchableOpacity
            style={styles.shopCard}
            onPress={() => router.push(`/shop/${product.shopId}`)}
            activeOpacity={0.8}
          >
            <View style={styles.shopIcon}>
              <Ionicons name="storefront-outline" size={24} color="#2563eb" />
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{product.shopName}</Text>
              <Text style={styles.shopCity}>{product.shopCity}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageBtn} onPress={handleMessageSeller}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#18181b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#71717a', marginTop: 12 },
  
  imageCarousel: {
    width,
    height: width * 1.2,
    backgroundColor: '#f4f4f5',
    position: 'relative',
  },
  carouselImage: {
    width,
    height: width * 1.2,
  },
  placeholderImg: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnOverlay: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 24,
  },

  detailsContainer: {
    padding: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#27272a',
    lineHeight: 28,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3f3f46',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#52525b',
    marginBottom: 32,
  },
  
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 16,
  },
  shopIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  shopCity: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    gap: 12,
  },
  messageBtn: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center', alignItems: 'center',
  },
  addCartBtn: {
    flex: 1, height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center',
  },
  addCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  }
})
