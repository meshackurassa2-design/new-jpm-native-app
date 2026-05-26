// app/(tabs)/search.tsx
import React, { useState, useCallback } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'
import { Skeleton } from '../../components/Skeleton'

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const search = useCallback(async (q: string) => {
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(20)
    
    if (error) {
      console.error('Search error:', error)
    }
    
    setResults(data || [])
    setLoading(false)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#a1a1aa" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Search people..."
          placeholderTextColor="#a1a1aa"
          value={query}
          onChangeText={search}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]) }}>
            <Ionicons name="close-circle" size={18} color="#a1a1aa" />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={{ paddingTop: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.row}>
              <Skeleton width={50} height={50} borderRadius={25} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="50%" height={15} />
                <Skeleton width="30%" height={13} />
              </View>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/user-profile?id=${item.id}`)}
          >
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{item.full_name?.[0] || '?'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.name}>{item.full_name}</Text>
                {item.is_verified && (
                  <Ionicons name="checkmark-circle" size={14} color="#2563eb" />
                )}
              </View>
              <Text style={styles.username}>@{item.username}</Text>
              {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#d4d4d8" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#000' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#f4f4f5', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 16, color: '#000' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f4f4f5',
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: { backgroundColor: '#e4e4e7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#71717a' },
  name: { fontSize: 15, fontWeight: '700', color: '#000' },
  username: { fontSize: 13, color: '#71717a' },
  bio: { fontSize: 13, color: '#a1a1aa', marginTop: 2 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#a1a1aa', fontSize: 15 },
})
