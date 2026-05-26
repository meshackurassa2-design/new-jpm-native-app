// app/(settings)/ads.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'
import { createClient } from '../../lib/supabase'

export default function AdsScreen() {
  const supabase = createClient()
  const [ads, setAds] = useState<any[]>([])
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ads' | 'create' | 'creators'>('ads')

  // Ad Form State
  const [adTitle, setAdTitle] = useState('')
  const [adDesc, setAdDesc] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [targetViews, setTargetViews] = useState('1000')
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [postingAd, setPostingAd] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    if (activeTab === 'create') return
    setLoading(true)
    if (activeTab === 'ads') {
      const { data } = await supabase.from('direct_ads').select('*').order('created_at', { ascending: false })
      setAds(data || [])
    } else if (activeTab === 'creators') {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, settings, created_at')
        .neq('settings->creator_application_status', null)
        .eq('settings->creator_application_status', 'pending')
      setCreators(data || [])
    }
    setLoading(false)
  }

  const handleCreatorAction = async (creatorId: string, action: 'approved' | 'declined') => {
    const { data: profileData } = await supabase.from('profiles').select('settings').eq('id', creatorId).single()
    const newSettings = { ...profileData?.settings, creator_application_status: action }
    
    const updates: any = { settings: newSettings }
    if (action === 'approved') {
      updates.monetization_enabled = true
      updates.is_verified = true
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', creatorId)
    if (!error) {
      Alert.alert('Success', `Creator ${action} successfully!`)
      fetchData()
    } else {
      Alert.alert('Error', error.message)
    }
  }

  const deleteAd = async (id: string) => {
    await supabase.from('direct_ads').delete().eq('id', id)
    setAds(prev => prev.filter(a => a.id !== id))
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    })
    if (!result.canceled) setImage(result.assets[0])
  }

  const handlePostAd = async () => {
    if (!adTitle || !image || !targetUrl) {
      Alert.alert('Error', 'Please provide a title, image, and target URL.')
      return
    }

    setPostingAd(true)
    try {
      let imageUrl = null
      if (image.base64) {
        const ext = image.uri.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}_${Math.random()}.${ext}`
        
        const { error: uploadError } = await supabase.storage
          .from('ads')
          .upload(fileName, decode(image.base64), { contentType: `image/${ext}` })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('ads').getPublicUrl(fileName)
        imageUrl = urlData?.publicUrl
      }

      const { error } = await supabase.from('direct_ads').insert({
        title: adTitle,
        description: adDesc,
        target_url: targetUrl,
        target_views: parseInt(targetViews) || 1000,
        image_url: imageUrl,
        status: 'active'
      })

      if (error) throw error

      Alert.alert('Success', 'Ad created successfully!')
      setAdTitle(''); setAdDesc(''); setTargetUrl(''); setTargetViews('1000'); setImage(null);
      setActiveTab('ads')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setPostingAd(false)
    }
  }

  const renderAd = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.image_url && <Image source={{ uri: item.image_url }} style={styles.image} />}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
        <Text style={styles.cardStats}>Views: {item.views || 0} / {item.target_views || 1000}</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteAd(item.id)}>
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
          <Text style={styles.deleteText}>Delete Ad</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderCreator = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}><Text>{item.username?.[0]}</Text></View>
        )}
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.cardTitle}>{item.full_name}</Text>
          <Text style={styles.cardDesc}>@{item.username}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => handleCreatorAction(item.id, 'approved')}>
          <Text style={styles.actionText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={() => handleCreatorAction(item.id, 'declined')}>
          <Text style={styles.actionText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'ads' && styles.tabActive]} onPress={() => setActiveTab('ads')}>
          <Text style={[styles.tabText, activeTab === 'ads' && styles.tabTextActive]}>Active Ads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'create' && styles.tabActive]} onPress={() => setActiveTab('create')}>
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>Create Ad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'creators' && styles.tabActive]} onPress={() => setActiveTab('creators')}>
          <Text style={[styles.tabText, activeTab === 'creators' && styles.tabTextActive]}>Creators</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create a New Ad</Text>
              
              <Text style={styles.label}>Ad Title *</Text>
              <TextInput style={styles.input} placeholder="e.g. Summer Sale" value={adTitle} onChangeText={setAdTitle} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={styles.input} placeholder="Short subtitle" value={adDesc} onChangeText={setAdDesc} />

              <Text style={styles.label}>Target URL *</Text>
              <TextInput style={styles.input} placeholder="https://" value={targetUrl} onChangeText={setTargetUrl} keyboardType="url" autoCapitalize="none" />

              <Text style={styles.label}>Target Views</Text>
              <TextInput style={styles.input} placeholder="1000" value={targetViews} onChangeText={setTargetViews} keyboardType="numeric" />

              <Text style={styles.label}>Ad Image *</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color="#a1a1aa" />
                    <Text style={styles.imagePickerText}>Select Ad Creative</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handlePostAd} disabled={postingAd}>
                {postingAd ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Launch Ad</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#000" /></View>
      ) : activeTab === 'ads' ? (
        <FlatList
          data={ads}
          keyExtractor={item => item.id}
          renderItem={renderAd}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No active ads.</Text>}
        />
      ) : (
        <FlatList
          data={creators}
          keyExtractor={item => item.id}
          renderItem={renderCreator}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending creator applications.</Text>}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  
  
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e4e4e7' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#71717a' },
  tabTextActive: { color: '#000' },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { height: 2, width: 0 } },
  image: { width: '100%', height: 160 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#52525b', marginBottom: 8 },
  cardStats: { fontSize: 12, color: '#a1a1aa', marginBottom: 12, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: 8, backgroundColor: '#fef2f2', borderRadius: 6 },
  deleteText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#a1a1aa', marginTop: 40, fontSize: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e4e4e7', justifyContent: 'center', alignItems: 'center' },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  formContainer: { padding: 16 },
  cardTitle2: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f4f4f5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#e4e4e7' },
  imagePicker: { backgroundColor: '#f4f4f5', borderRadius: 12, borderWidth: 1, borderColor: '#e4e4e7', borderStyle: 'dashed', height: 160, justifyContent: 'center', alignItems: 'center', marginTop: 12, overflow: 'hidden' },
  imagePickerText: { color: '#71717a', marginTop: 8, fontWeight: '600' },
  imagePreview: { width: '100%', height: '100%' },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})


