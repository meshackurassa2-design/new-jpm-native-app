// app/(settings)/store-dashboard.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

type OrderData = {
  buyer_name: string | null
  buyer_email: string
  buyer_phone: string | null
  buyer_address: string | null
  buyer_city: string | null
  status: string
}

type OrderItem = {
  id: string
  order_id: string
  product_name: string
  price: number
  commission_rate: number
  status: string
  created_at: string
  orders: OrderData
}

export default function StoreDashboardScreen() {
  const { user } = useAuth()
  const supabase = createClient()
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSales() {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            *,
            orders!inner (
              buyer_name, buyer_email, buyer_phone, buyer_address, buyer_city, status
            )
          `)
          .eq('shop_id', user.id)
          .eq('orders.status', 'PAID')
          .order('created_at', { ascending: false })

        if (error) throw error
        setItems((data as unknown as OrderItem[]) || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [user])

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ status: newStatus })
        .eq('id', itemId)

      if (error) throw error
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, status: newStatus } : item))
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const totalSales = items.reduce((sum, item) => sum + Number(item.price), 0)
  const totalCommission = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.commission_rate)), 0)
  const netEarnings = totalSales - totalCommission

  const renderItem = ({ item }: { item: OrderItem }) => {
    const isProcessing = item.status === 'PROCESSING' || !item.status
    const isShipped = item.status === 'SHIPPED'
    const isDelivered = item.status === 'DELIVERED'

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.price}>TZS {item.price.toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.buyerInfo}>
          <Text style={styles.buyerLabel}>Buyer</Text>
          <Text style={styles.buyerText}>{item.orders?.buyer_name || item.orders?.buyer_email}</Text>
          <Text style={styles.buyerText}>{item.orders?.buyer_phone}</Text>
          {item.orders?.buyer_city ? (
            <Text style={styles.buyerText}>{item.orders.buyer_city} - {item.orders.buyer_address}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {isProcessing && (
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => handleUpdateStatus(item.id, 'SHIPPED')}
            >
              <Text style={styles.btnTextPrimary}>Mark as Shipped</Text>
            </TouchableOpacity>
          )}
          {isShipped && (
            <TouchableOpacity 
              style={[styles.btn, styles.btnSuccess]}
              onPress={() => handleUpdateStatus(item.id, 'DELIVERED')}
            >
              <Text style={styles.btnTextPrimary}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
          {isDelivered && (
            <View style={styles.badgeSuccess}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.badgeSuccessText}>Delivered</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: '#18181b' }]}>
                <Ionicons name="cash-outline" size={24} color="#a1a1aa" />
                <Text style={styles.statValueDark}>TZS {netEarnings.toLocaleString()}</Text>
                <Text style={styles.statLabelDark}>Net Earnings</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCardSmall}>
                  <Text style={styles.statValue}>TZS {totalSales.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Sales</Text>
                </View>
                <View style={styles.statCardSmall}>
                  <Text style={styles.statValue}>TZS {totalCommission.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Platform Fees</Text>
                </View>
              </View>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={64} color="#e4e4e7" />
              <Text style={styles.emptyText}>No sales yet</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  
  statsContainer: { marginBottom: 24 },
  statCard: {
    padding: 24, borderRadius: 24,
    marginBottom: 12,
  },
  statValueDark: { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 12, marginBottom: 4 },
  statLabelDark: { fontSize: 14, color: '#a1a1aa', fontWeight: '500' },
  
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCardSmall: {
    flex: 1, padding: 16,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#71717a', fontWeight: '500' },
  
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#e4e4e7',
    marginBottom: 16, padding: 16,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#18181b', marginRight: 12 },
  price: { fontSize: 16, fontWeight: '800', color: '#2563eb' },
  
  divider: { height: 1, backgroundColor: '#f4f4f5', marginVertical: 12 },
  
  buyerInfo: { marginBottom: 16 },
  buyerLabel: { fontSize: 12, fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: 4 },
  buyerText: { fontSize: 14, color: '#3f3f46', marginBottom: 2 },
  
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  btnPrimary: { backgroundColor: '#000' },
  btnTextPrimary: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnSuccess: { backgroundColor: '#16a34a' },
  
  badgeSuccess: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#dcfce7', borderRadius: 12 },
  badgeSuccessText: { color: '#166534', fontSize: 13, fontWeight: '600' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#a1a1aa', marginTop: 16 },
})


