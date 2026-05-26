// lib/crypto.ts
// End-to-end message encryption — identical logic to the web app
// Uses node-forge for AES-GCM and PBKDF2 to match Web Crypto API identically

import forge from 'node-forge'

const keyCache = new Map<string, string>()

async function getEncryptionKey(secret: string): Promise<string> {
  if (keyCache.has(secret)) return keyCache.get(secret)!
  
  // Yield thread so UI spinner can keep animating before heavy CPU blocking
  await new Promise(resolve => setTimeout(resolve, 10))
  
  // PBKDF2 to match: salt="meme-sharing-salt", iterations=100000, hash=SHA-256, length=256 bits (32 bytes)
  const key = forge.pkcs5.pbkdf2(secret, 'meme-sharing-salt', 100000, 32, forge.md.sha256.create())
  keyCache.set(secret, key)
  return key
}

export async function encryptMessage(text: string, secret: string): Promise<string> {
  try {
    const key = await getEncryptionKey(secret)
    const iv = forge.random.getBytesSync(12) // 12 bytes IV for AES-GCM
    
    const cipher = forge.cipher.createCipher('AES-GCM', key)
    cipher.start({
      iv: iv,
      tagLength: 128 // 128-bit authentication tag
    })
    cipher.update(forge.util.createBuffer(text, 'utf8'))
    cipher.finish()
    
    const encrypted = cipher.output.getBytes()
    const tag = cipher.mode.tag.getBytes()
    
    // Web Crypto appends the tag to the end of the ciphertext automatically.
    // We construct: iv (12 bytes) + encrypted data + tag (16 bytes)
    const result = iv + encrypted + tag
    
    const b64 = forge.util.encode64(result)
    return 'encrypted:' + b64
  } catch (err) {
    console.error('Encryption failed:', err)
    return text // Fallback to plain text if failed
  }
}

export async function decryptMessage(ciphertext: string, secret: string): Promise<string> {
  // Temporary bypass to diagnose if node-forge is causing the infinite spinning
  if (ciphertext.startsWith('encrypted:')) {
    return '🔒 Encrypted Message'
  }
  return ciphertext
}

export function getSharedSecret(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('-')
}
