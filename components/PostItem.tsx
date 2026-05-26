// components/PostItem.tsx — Reusable feed post component
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { createClient } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export type PostType = {
  id: string
  content: string
  image_urls?: string[]
  created_at: string
  creator_id: string
  likes_count?: number
  comments_count?: number
  reposts_count?: number
  is_liked?: boolean
  is_bookmarked?: boolean
  is_reposted?: boolean
  settings?: any
  profiles?: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
    is_verified?: boolean
  }
}

export function PostItem({ post: initialPost }: { post: PostType }) {
  const { user } = useAuth()
  const supabase = createClient()
  const [post, setPost] = useState(initialPost)

  const timeAgo = (date: string) => {
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (secs < 60) return `${secs}s`
    if (secs < 3600) return `${Math.floor(secs / 60)}m`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h`
    return `${Math.floor(secs / 86400)}d`
  }

  const toggleLike = async () => {
    if (!user) return
    const wasLiked = post.is_liked
    setPost(p => ({ ...p, is_liked: !wasLiked, likes_count: (p.likes_count || 0) + (wasLiked ? -1 : 1) }))
    if (wasLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
    }
  }

  const toggleRepost = async () => {
    if (!user) return
    const wasReposted = post.is_reposted
    setPost(p => ({ ...p, is_reposted: !wasReposted, reposts_count: (p.reposts_count || 0) + (wasReposted ? -1 : 1) }))
    if (wasReposted) {
      await supabase.from('reposts').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('reposts').insert({ post_id: post.id, user_id: user.id })
    }
  }

  const toggleBookmark = async () => {
    if (!user) return
    const wasBookmarked = post.is_bookmarked
    setPost(p => ({ ...p, is_bookmarked: !wasBookmarked }))
    if (wasBookmarked) {
      await supabase.from('bookmarks').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('bookmarks').insert({ post_id: post.id, user_id: user.id })
    }
  }

  const hasImage = post.image_urls && post.image_urls.length > 0

  return (
    <View style={styles.post}>
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => router.push(`/user-profile?id=${post.creator_id}`)}
        activeOpacity={0.7}
      >
        {post.profiles?.avatar_url ? (
          <Image source={{ uri: post.profiles.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{post.profiles?.full_name?.[0] || '?'}</Text>
          </View>
        )}
        <View style={styles.postHeaderText}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.fullName}>{post.profiles?.full_name}</Text>
            {post.profiles?.is_verified && (
              <Ionicons name="checkmark-circle" size={14} color="#2563eb" />
            )}
          </View>
          <Text style={styles.username}>@{post.profiles?.username} · {timeAgo(post.created_at)}</Text>
        </View>
        <TouchableOpacity style={{ padding: 4 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#a1a1aa" />
        </TouchableOpacity>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.9}>
        {!!post.content && (
          <Text style={styles.postContent}>{post.content}</Text>
        )}
      </TouchableOpacity>

      {hasImage && (
        <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.95}>
          <Image
            source={{ uri: post.image_urls![0] }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleLike} activeOpacity={0.7}>
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={22}
            color={post.is_liked ? '#ef4444' : '#71717a'}
          />
          {(post.likes_count || 0) > 0 && (
            <Text style={[styles.actionCount, post.is_liked && { color: '#ef4444' }]}>
              {post.likes_count}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={22} color="#71717a" />
          {(post.comments_count || 0) > 0 && (
            <Text style={styles.actionCount}>{post.comments_count}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={toggleRepost}>
          <Ionicons
            name={post.is_reposted ? 'repeat' : 'repeat-outline'}
            size={22}
            color={post.is_reposted ? '#16a34a' : '#71717a'}
          />
          {(post.reposts_count || 0) > 0 && (
            <Text style={[styles.actionCount, post.is_reposted && { color: '#16a34a' }]}>
              {post.reposts_count}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.actionBtn} onPress={toggleBookmark} activeOpacity={0.7}>
          <Ionicons
            name={post.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={post.is_bookmarked ? '#2563eb' : '#71717a'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
    </View>
  )
}

const styles = StyleSheet.create({
  post: { paddingHorizontal: 16, paddingTop: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarFallback: { backgroundColor: '#e4e4e7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#71717a' },
  postHeaderText: { flex: 1 },
  fullName: { fontSize: 16, fontWeight: '800', color: '#000' },
  username: { fontSize: 14, color: '#71717a', marginTop: 1 },
  postContent: { fontSize: 16, color: '#000', lineHeight: 24, marginBottom: 12 },
  postImage: { width: '100%', height: 300, borderRadius: 16, marginBottom: 12, backgroundColor: '#f4f4f5' },
  actions: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionCount: { fontSize: 14, color: '#71717a', marginLeft: 6, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f4f4f5', marginHorizontal: -16 },
})
