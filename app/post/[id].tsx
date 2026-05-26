// app/post/[id].tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Dimensions, ScrollView
} from 'react-native'

const { width } = Dimensions.get('window')
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useUI } from '../../lib/ui'
import { BackButton } from '../../components/BackButton'
import { Video, ResizeMode } from 'expo-av'

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { showActionSheet, showToast } = useUI()
  const supabase = createClient()

  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return

    // Fetch Post
    const { data: postData } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:creator_id(id, full_name, username, avatar_url, is_verified)
      `)
      .eq('id', id)
      .single()
    
    if (postData) {
      // Check like
      if (user) {
        const { data: likes } = await supabase.from('likes').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle()
        postData.is_liked = !!likes
      }
      setPost(postData)
    }

    // Fetch Comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*, profiles(id, full_name, username, avatar_url, is_verified)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    setComments(commentsData || [])
    setLoading(false)
  }, [id, user])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleLike = async () => {
    if (!user || !post) return
    const isLiked = post.is_liked
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
    }
    setPost({ ...post, is_liked: !isLiked, likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1) })
  }

  const handlePostOptions = () => {
    if (!user || !post) return
    if (user.id === post.creator_id) return // Own post
    showActionSheet('Post Options', [
      { text: 'Report Post', style: 'destructive', icon: 'flag', onPress: async () => {
        const { error } = await supabase.from('content_reports').insert({
          reporter_id: user.id,
          post_id: post.id,
          reason: 'Inappropriate content'
        })
        if (!error) showToast('Post reported for review.', 'success')
        else showToast('Could not submit report.', 'error')
      }},
      { text: 'Cancel', style: 'cancel', onPress: () => {} }
    ])
  }

  const submitComment = async () => {
    if (!newComment.trim() || !user || !post) return
    setSubmitting(true)
    
    const { data, error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim()
    }).select('*, profiles(id, full_name, username, avatar_url, is_verified)').single()

    if (error) {
      Alert.alert('Error', error.message)
    } else if (data) {
      setComments(prev => [...prev, data])
      setNewComment('')
      setPost({ ...post, comments_count: (post.comments_count || 0) + 1 })
    }
    setSubmitting(false)
  }

  const timeAgo = (date: string) => {
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (secs < 60) return `${secs}s`
    if (secs < 3600) return `${Math.floor(secs / 60)}m`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h`
    return `${Math.floor(secs / 86400)}d`
  }

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentRow}>
      {item.profiles?.avatar_url ? (
        <Image source={{ uri: item.profiles.avatar_url }} style={styles.commentAvatar} />
      ) : (
        <View style={[styles.commentAvatar, styles.avatarFallback]}>
          <Text style={styles.avatarFallbackText}>{item.profiles?.full_name?.[0] || '?'}</Text>
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName}>{item.profiles?.full_name}</Text>
          {item.profiles?.is_verified && <Ionicons name="checkmark-circle" size={12} color="#2563eb" />}
          <Text style={styles.commentMeta}>@{item.profiles?.username} · {timeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  )

  const renderPost = () => {
    if (!post) return null
    const hasImage = post.image_urls && post.image_urls.length > 0
    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          {post.profiles?.avatar_url ? (
            <Image source={{ uri: post.profiles.avatar_url }} style={styles.postAvatar} />
          ) : (
            <View style={[styles.postAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>{post.profiles?.full_name?.[0] || '?'}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.postName}>{post.profiles?.full_name}</Text>
              {post.profiles?.is_verified && <Ionicons name="checkmark-circle" size={14} color="#2563eb" />}
            </View>
            <Text style={styles.postUsername}>@{post.profiles?.username} · {timeAgo(post.created_at)}</Text>
          </View>
          {user?.id !== post.creator_id && (
            <TouchableOpacity onPress={handlePostOptions} style={{ padding: 4 }}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>

        {!!post.content && <Text style={styles.postText}>{post.content}</Text>}
        {post.video_url && (
          <View style={{ marginBottom: 12 }}>
            <Video
              source={{ uri: post.video_url }}
              style={styles.postImage}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              isLooping
            />
          </View>
        )}
        {hasImage && (
          <View>
            {post.image_urls.length > 1 ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {post.image_urls.map((url: string, idx: number) => (
                  <Image key={idx} source={{ uri: url }} style={[styles.postImage, { width: width - 32, marginBottom: 0 }]} />
                ))}
              </ScrollView>
            ) : (
              <Image source={{ uri: post.image_urls[0] }} style={styles.postImage} />
            )}
          </View>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
            <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={24} color={post.is_liked ? '#ef4444' : '#71717a'} />
            <Text style={[styles.actionCount, post.is_liked && { color: '#ef4444' }]}>{post.likes_count || 0}</Text>
          </TouchableOpacity>
          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={22} color="#71717a" />
            <Text style={styles.actionCount}>{post.comments_count || 0}</Text>
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton style={styles.backBtn} />
        <Text style={styles.headerTitle}>Post</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <>
              {renderPost()}
              <View style={styles.divider} />
            </>
          }
          renderItem={renderComment}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Post a reply..."
            placeholderTextColor="#a1a1aa"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!newComment.trim() || submitting) && styles.sendBtnDisabled]}
            onPress={submitComment}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f4f4f5',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#000' },
  postContainer: { padding: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  postAvatar: { width: 44, height: 44, borderRadius: 22 },
  postName: { fontSize: 16, fontWeight: '700', color: '#000' },
  postUsername: { fontSize: 14, color: '#71717a' },
  postText: { fontSize: 16, lineHeight: 24, color: '#111', marginBottom: 12 },
  postImage: { width: '100%', height: 300, borderRadius: 16, marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 24, paddingTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 15, color: '#71717a', fontWeight: '500' },
  divider: { height: 6, backgroundColor: '#f4f4f5' },
  commentRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f4f4f5', gap: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { backgroundColor: '#e4e4e7', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { fontSize: 16, fontWeight: '700', color: '#71717a' },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  commentName: { fontSize: 14, fontWeight: '700', color: '#000' },
  commentMeta: { fontSize: 13, color: '#71717a' },
  commentText: { fontSize: 14, lineHeight: 20, color: '#111' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#a1a1aa', fontSize: 15 },
  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#f4f4f5',
    backgroundColor: '#fff'
  },
  input: {
    flex: 1, backgroundColor: '#f4f4f5', borderRadius: 20,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    fontSize: 15, color: '#000', maxHeight: 100
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center'
  },
  sendBtnDisabled: { backgroundColor: '#bfdbfe' },
})
