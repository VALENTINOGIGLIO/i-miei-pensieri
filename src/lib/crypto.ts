// src/lib/crypto.ts

export async function deriveKey(password: string, saltStr: string, iterations: number = 100000): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const cryptoObj = window.crypto || (window as any).msCrypto;
  
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error("Crittografia WebCrypto API non supportata su questo dispositivo.");
  }

  const passwordKey = await cryptoObj.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(saltStr),
      iterations: iterations,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptText(text: string, key: CryptoKey): Promise<{ ciphertext: string, iv: string }> {
  const enc = new TextEncoder();
  const cryptoObj = window.crypto || (window as any).msCrypto;
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  
  const encrypted = await cryptoObj.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    enc.encode(text)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer)
  };
}

export async function decryptText(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const cryptoObj = window.crypto || (window as any).msCrypto;
  const encryptedBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);
  
  const decrypted = await cryptoObj.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    key,
    encryptedBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
