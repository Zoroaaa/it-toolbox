// Pure functions for encoding/decoding - works in browser and Workers

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

// ─── JSON ───────────────────────────────────────────────────────────────────

export function formatJson(input: string, indent = 2): Result<string> {
  try {
    const parsed = JSON.parse(input)
    return { ok: true, value: JSON.stringify(parsed, null, indent) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function minifyJson(input: string): Result<string> {
  try {
    const parsed = JSON.parse(input)
    return { ok: true, value: JSON.stringify(parsed) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function validateJson(input: string): Result<{ valid: boolean; type: string }> {
  try {
    const parsed = JSON.parse(input)
    return { ok: true, value: { valid: true, type: Array.isArray(parsed) ? 'array' : typeof parsed } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Base64 ─────────────────────────────────────────────────────────────────

export function encodeBase64(input: string): Result<string> {
  try {
    const bytes = new TextEncoder().encode(input)
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    return { ok: true, value: btoa(binary) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function decodeBase64(input: string): Result<string> {
  try {
    const binary = atob(input.trim())
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    return { ok: true, value: new TextDecoder().decode(bytes) }
  } catch (e) {
    return { ok: false, error: 'Invalid Base64 string' }
  }
}

// ─── URL ────────────────────────────────────────────────────────────────────

export function encodeUrl(input: string): Result<string> {
  try {
    return { ok: true, value: encodeURIComponent(input) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function decodeUrl(input: string): Result<string> {
  try {
    return { ok: true, value: decodeURIComponent(input) }
  } catch (e) {
    return { ok: false, error: 'Invalid URL encoded string' }
  }
}

// ─── Hash ────────────────────────────────────────────────────────────────────

export async function sha256(input: string): Promise<Result<string>> {
  try {
    const bytes = new TextEncoder().encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function sha512(input: string): Promise<Result<string>> {
  try {
    const bytes = new TextEncoder().encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-512', bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return { ok: true, value: hex }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── UUID ────────────────────────────────────────────────────────────────────

export function generateUUID(): string {
  return crypto.randomUUID()
}

export function generateUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => crypto.randomUUID())
}

// ─── JWT ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

export function parseJwt(token: string): Result<JwtPayload> {
  try {
    const parts = token.trim().split('.')
    if (parts.length !== 3) {
      return { ok: false, error: 'Invalid JWT format: must have 3 parts' }
    }
    const decode = (str: string) => {
      const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
      return JSON.parse(atob(padded))
    }
    return {
      ok: true,
      value: {
        header: decode(parts[0]),
        payload: decode(parts[1]),
        signature: parts[2],
      }
    }
  } catch (e) {
    return { ok: false, error: 'Failed to parse JWT: ' + (e as Error).message }
  }
}

// ─── Password Generator ──────────────────────────────────────────────────────

export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

export function generatePassword(opts: PasswordOptions): Result<string> {
  const chars = [
    opts.uppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
    opts.lowercase ? 'abcdefghijklmnopqrstuvwxyz' : '',
    opts.numbers   ? '0123456789' : '',
    opts.symbols   ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '',
  ].join('')

  if (!chars) return { ok: false, error: 'Select at least one character type' }

  const array = new Uint32Array(opts.length)
  crypto.getRandomValues(array)
  const password = Array.from(array, n => chars[n % chars.length]).join('')
  return { ok: true, value: password }
}

// ─── Case Converter ──────────────────────────────────────────────────────────

export type CaseType = 'camel' | 'pascal' | 'snake' | 'kebab' | 'upper' | 'lower' | 'constant' | 'title'

export function convertCase(input: string, to: CaseType): Result<string> {
  try {
    const words = input
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-\s]+/g, ' ')
      .trim()
      .toLowerCase()
      .split(' ')
      .filter(Boolean)

    const result = {
      camel:    words.map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join(''),
      pascal:   words.map(w => w[0].toUpperCase() + w.slice(1)).join(''),
      snake:    words.join('_'),
      kebab:    words.join('-'),
      upper:    input.toUpperCase(),
      lower:    input.toLowerCase(),
      constant: words.join('_').toUpperCase(),
      title:    words.map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    }[to]

    return { ok: true, value: result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
