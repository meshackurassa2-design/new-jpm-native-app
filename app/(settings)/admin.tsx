// app/(settings)/admin.tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

export default function AdminScreen() {
  const { user } = useAuth()
  const supabase = createClient()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'jobs'>('reports')

  // Job Form State
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [salary, setSalary] = useState('')
  const [applyUrl, setApplyUrl] = useState('')
  const [description, setDescription] = useState('')
  const [postingJob, setPostingJob] = useState(false)

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select(`
        id, reason, created_at,
        posts (
          id, content, image_urls, created_at, is_archived,
          profiles ( id, username, full_name, avatar_url )
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (data) {
      const grouped = data.reduce((acc: any, report: any) => {
        const post = report.posts
        if (!post) return acc
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles

        if (!acc[post.id]) {
          acc[post.id] = { post: { ...post, profiles: profile }, reports: [], count: 0 }
        }
        acc[post.id].reports.push(report)
        acc[post.id].count += 1
        return acc
      }, {})

      setReports(Object.values(grouped).sort((a: any, b: any) => b.count - a.count))
    }
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [])

  const dismissReports = async (postId: string) => {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('post_id', postId).eq('status', 'pending')
    await supabase.from('posts').update({ is_archived: false }).eq('id', postId)
    setReports(prev => prev.filter(r => r.post.id !== postId))
  }

  const deletePost = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'This will permanently delete the post and all its reports. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await supabase.from('posts').delete().eq('id', postId)
            setReports(prev => prev.filter(r => r.post.id !== postId))
          }
        }
      ]
    )
  }

  const handlePostJob = async () => {
    if (!user) return
    if (!jobTitle || !companyName || !location || !applyUrl || !description) {
      Alert.alert('Error', 'Please fill in all required fields.')
      return
    }

    setPostingJob(true)
    const content = `💼 **New Job Opportunity: ${jobTitle} at ${companyName}**\n\n${description}\n\n📍 ${location} | 💰 ${salary || 'Unspecified'} | ⏱️ ${jobType}`

    const { error } = await supabase.from('posts').insert({
      creator_id: user.id,
      content,
      settings: {
        is_job: true,
        job_title: jobTitle,
        company_name: companyName,
        location,
        job_type: jobType,
        salary_range: salary,
        apply_url: applyUrl
      }
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Job posted successfully!')
      setJobTitle(''); setCompanyName(''); setLocation('')
      setSalary(''); setApplyUrl(''); setDescription('')
    }
    setPostingJob(false)
  }

  const renderItem = ({ item }: { item: any }) => {
    const post = item.post
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {post.is_archived && (
            <View style={styles.archivedBadge}>
              <Text style={styles.archivedText}>Auto-Archived</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.count} Report{item.count !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.postPreview}>
          <Text style={styles.posterName}>{post.profiles?.full_name || 'Unknown'}</Text>
          <Text style={styles.posterUsername}>@{post.profiles?.username || 'user'}</Text>
          {!!post.content && <Text style={styles.postContent} numberOfLines={4}>{post.content}</Text>}
          {post.image_urls && post.image_urls.length > 0 && (
            <Image source={{ uri: post.image_urls[0] }} style={styles.postImage} />
          )}
        </View>

        <View style={styles.reportReasons}>
          {item.reports.slice(0, 3).map((r: any, i: number) => (
            <View key={i} style={styles.reasonChip}>
              <Text style={styles.reasonText}>"{r.reason}"</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={() => deletePost(post.id)}>
            <Ionicons name="trash-outline" size={16} color="#dc2626" />
            <Text style={styles.btnDeleteText}>Delete Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnDismiss]} onPress={() => dismissReports(post.id)}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" />
            <Text style={styles.btnDismissText}>Dismiss (Safe)</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'reports' && styles.tabActive]} onPress={() => setActiveTab('reports')}>
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'jobs' && styles.tabActive]} onPress={() => setActiveTab('jobs')}>
          <Text style={[styles.tabText, activeTab === 'jobs' && styles.tabTextActive]}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'reports' ? (
        <FlatList
          data={reports}
          keyExtractor={item => item.post.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark" size={48} color="#d4d4d8" />
              <Text style={styles.emptyTitle}>No Pending Reports</Text>
              <Text style={styles.emptyDesc}>Your community is behaving nicely!</Text>
            </View>
          }
        />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Post a New Job</Text>

              <Text style={styles.label}>Job Title *</Text>
              <TextInput style={styles.input} placeholder="e.g. Senior Frontend Engineer" value={jobTitle} onChangeText={setJobTitle} />

              <Text style={styles.label}>Company Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Acme Corp" value={companyName} onChangeText={setCompanyName} />

              <Text style={styles.label}>Location *</Text>
              <TextInput style={styles.input} placeholder="e.g. Remote, or New York" value={location} onChangeText={setLocation} />

              <Text style={styles.label}>Job Type</Text>
              <TextInput style={styles.input} placeholder="Full-time, Part-time, Contract..." value={jobType} onChangeText={setJobType} />

              <Text style={styles.label}>Salary Range</Text>
              <TextInput style={styles.input} placeholder="e.g. $100k - $120k" value={salary} onChangeText={setSalary} />

              <Text style={styles.label}>Application URL *</Text>
              <TextInput style={styles.input} placeholder="https://..." value={applyUrl} onChangeText={setApplyUrl} keyboardType="url" autoCapitalize="none" />

              <Text style={styles.label}>Job Description *</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the role, requirements..." value={description} onChangeText={setDescription} multiline textAlignVertical="top" />

              <TouchableOpacity style={styles.submitBtn} onPress={handlePostJob} disabled={postingJob}>
                {postingJob ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post Job</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f4f5' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e4e4e7' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#71717a' },
  tabTextActive: { color: '#000' },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { height: 2, width: 0 } },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  badge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  archivedBadge: { backgroundColor: '#fef9c3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  archivedText: { color: '#a16207', fontSize: 12, fontWeight: '700' },
  postPreview: { backgroundColor: '#fafafa', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f4f4f5' },
  posterName: { fontSize: 14, fontWeight: '700', color: '#000' },
  posterUsername: { fontSize: 12, color: '#71717a', marginBottom: 8 },
  postContent: { fontSize: 14, color: '#3f3f46', lineHeight: 20, marginBottom: 8 },
  postImage: { width: '100%', height: 140, borderRadius: 8 },
  reportReasons: { gap: 6, marginBottom: 14 },
  reasonChip: { backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  reasonText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  btnDismiss: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  btnDismissText: { color: '#16a34a', fontWeight: '600', fontSize: 13 },
  btnDelete: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  btnDeleteText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#18181b' },
  emptyDesc: { fontSize: 14, color: '#a1a1aa', textAlign: 'center' },
  formContainer: { padding: 16 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#3f3f46', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#f4f4f5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, borderWidth: 1, borderColor: '#e4e4e7', color: '#000' },
  textArea: { height: 120 },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
