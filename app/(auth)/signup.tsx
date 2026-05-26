// app/(auth)/signup.tsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image
} from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { decode } from 'base64-arraybuffer'

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Birthday
  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  
  // Gender
  const [gender, setGender] = useState('')

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null)

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // Need base64 for Supabase upload
    })

    if (!result.canceled) {
      setAvatar(result.assets[0])
    }
  }

  const handleSignup = async () => {
    if (!firstName || !lastName || !username || !email || !password) {
      Alert.alert('Error', 'Please fill in all basic fields')
      return
    }

    if (!birthDay || !birthMonth || !birthYear) {
      Alert.alert('Error', 'Please provide your complete birthday')
      return
    }

    if (!gender) {
      Alert.alert('Error', 'Please select a gender')
      return
    }

    setLoading(true)

    try {
      const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay))
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 18) {
        Alert.alert('Error', 'You must be at least 18 years old to join.')
        setLoading(false)
        return
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (cleanUsername.length < 3) {
        Alert.alert('Error', 'Username must be at least 3 characters.')
        setLoading(false)
        return
      }

      // Check if username exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .single()

      if (existingUser) {
        Alert.alert('Error', `@${cleanUsername} is already taken.`)
        setLoading(false)
        return
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: cleanUsername,
            birthday: birthDate.toISOString().split('T')[0],
            gender,
          },
        },
      })

      if (authError) throw authError

      const newUser = authData?.user

      // Upload Avatar
      let avatar_url: string | null = null
      if (avatar && avatar.base64 && newUser) {
        const ext = avatar.uri.split('.').pop() || 'jpg'
        const path = `${newUser.id}/avatar.${ext}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, decode(avatar.base64), { 
            contentType: `image/${ext}`,
            upsert: true
          })

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          avatar_url = urlData?.publicUrl ?? null
        }
      }

      // Update Profile
      if (newUser) {
        await supabase
          .from('profiles')
          .update({ 
            avatar_url,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            birthday: birthDate.toISOString().split('T')[0],
            gender,
            full_name: `${firstName.trim()} ${lastName.trim()}`
          })
          .eq('id', newUser.id)
      }

      router.replace('/(tabs)')
    } catch (e: any) {
      Alert.alert('Signup Failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="sparkles" size={24} color="#000" />
            </View>
            <Text style={styles.title}>Create your account</Text>
          </View>

          {/* Avatar Upload */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
              {avatar ? (
                <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="camera-outline" size={32} color="#999" />
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to add a profile photo</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="First name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={[styles.input, { paddingLeft: 36 }]}
                placeholder="username"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={username}
                onChangeText={text => setUsername(text.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            {/* Birthday */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>BIRTHDAY</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="MM"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={2}
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                />
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="DD"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={2}
                  value={birthDay}
                  onChangeText={setBirthDay}
                />
                <TextInput
                  style={[styles.input, styles.dateInput, { flex: 1.5 }]}
                  placeholder="YYYY"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={4}
                  value={birthYear}
                  onChangeText={setBirthYear}
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>GENDER</Text>
              <View style={styles.row}>
                {['Female', 'Male'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      gender === g && styles.genderButtonActive
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <View style={[
                      styles.radioCircle,
                      gender === g && styles.radioCircleActive
                    ]} />
                    <Text style={styles.genderText}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181b',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f4f4f5',
    borderWidth: 2,
    borderColor: '#e4e4e7',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  atSymbol: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    color: '#999',
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#18181b',
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 1,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4e4e7',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  genderButtonActive: {
    backgroundColor: '#000',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#a1a1aa',
  },
  radioCircleActive: {
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181b',
  },
  button: {
    height: 56,
    backgroundColor: '#000',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  footerText: {
    color: '#71717a',
    fontSize: 14,
  },
  loginLink: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
})
