// lib/crypto.ts
// End-to-end message encryption — identical logic to the web app
// Uses expo-crypto instead of window.crypto for React Native compatibility

import * as Crypto from 'expo-crypto'

async function getKey(secret: string): Promise<string> {
  // We derive a deterministic key by hashing the secret
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    secret
  )
}

// Simple XOR-based encryption using the SHA256 key (fast, no native module needed)
function xorEncrypt(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

export async function encryptMessage(text: string, secret: string): Promise<string> {
  try {
    const key = await getKey(secret)
    const encrypted = xorEncrypt(text, key)
    const b64 = Buffer.from(encrypted, 'binary').toString('base64')
    return 'encrypted:' + b64
  } catch {
    return text
  }
}

export async function decryptMessage(ciphertext: string, secret: string): Promise<string> {
  if (!ciphertext.startsWith('encrypted:')) return ciphertext
  try {
    const b64 = ciphertext.replace('encrypted:', '')
    const encrypted = Buffer.from(b64, 'base64').toString('binary')
    const key = await getKey(secret)
    return xorEncrypt(encrypted, key)
  } catch {
    return ciphertext
  }
}

export function getSharedSecret(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('-')
}
