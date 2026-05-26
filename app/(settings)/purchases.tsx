// app/(settings)/purchases.tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

type OrderItem = {
  id: string
  product_name: string
  price: number
  shop_id: string
}

type Order = {
  id: string
  total_amount: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

export default function PurchasesScreen() {
  const { user } = useAuth()
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`*, order_items (*)`)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
          <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'PAID' && styles.statusBadgeSuccess]}>
          <Text style={[styles.statusText, item.status === 'PAID' && styles.statusTextSuccess]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {item.order_items?.map((product, idx) => (
        <View key={idx} style={styles.productRow}>
          <View style={styles.productIcon}>
            <Ionicons name="cube-outline" size={16} color="#71717a" />
          </View>
          <Text style={styles.productName} numberOfLines={1}>{product.product_name}</Text>
          <Text style={styles.productPrice}>TZS {product.price.toLocaleString()}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>TZS {item.total_amount.toLocaleString()}</Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderOrder}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="bag-check-outline" size={64} color="#e4e4e7" />
          <Text style={styles.emptyTitle}>No purchases yet</Text>
          <Text style={styles.emptyDesc}>Items you buy will appear here.</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f4f5' },
  listContent: { padding: 16, paddingBottom: 60 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { height: 1, width: 0 },
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  orderId: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 2 },
  orderDate: { fontSize: 13, color: '#71717a' },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#f4f4f5', borderRadius: 20,
  },
  statusBadgeSuccess: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#71717a' },
  statusTextSuccess: { color: '#166534' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#e4e4e7', marginVertical: 12 },
  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  productIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f4f4f5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  productName: { flex: 1, fontSize: 14, color: '#27272a' },
  productPrice: { fontSize: 14, fontWeight: '600', color: '#000' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#71717a', fontWeight: '500' },
  totalAmount: { fontSize: 17, fontWeight: '800', color: '#000' },
  emptyState: { alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#18181b', marginTop: 16, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#a1a1aa' },
})
