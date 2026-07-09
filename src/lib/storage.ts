// src/lib/storage.ts

const SALT = "i-miei-pensieri-secure-salt-1984";

function encryptSync(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(result)));
}

function decryptSync(encoded: string): string {
  if (!encoded) return "";
  try {
    const text = decodeURIComponent(escape(atob(encoded)));
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return "";
  }
}

export function setSecureItem(key: string, value: string): void {
  const secureKey = encryptSync(key);
  const secureValue = encryptSync(value);
  localStorage.setItem(secureKey, secureValue);
}

export function getSecureItem(key: string): string | null {
  const secureKey = encryptSync(key);
  const secureValue = localStorage.getItem(secureKey);
  if (secureValue === null) return null;
  return decryptSync(secureValue);
}

export function removeSecureItem(key: string): void {
  const secureKey = encryptSync(key);
  localStorage.removeItem(secureKey);
}
