import { describe, it, expect } from 'vitest'
import { sanitizeErrorMessage } from './format'

describe('sanitizeErrorMessage', () => {
  it('redacts API keys starting with sk-', () => {
    const msg = 'Auth failed for sk-abcdefghijklmnopqrstuvwxyz1234567890'
    expect(sanitizeErrorMessage(msg)).toBe('Auth failed for [REDACTED]')
  })

  it('redacts Bearer tokens', () => {
    const msg = 'Header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    expect(sanitizeErrorMessage(msg)).toBe('Header: [REDACTED]')
  })

  it('redacts URLs with auth tokens', () => {
    const msg = 'Request to https://api.example.com?key=secret123456 failed'
    expect(sanitizeErrorMessage(msg)).toBe('Request to [REDACTED_URL] failed')
  })

  it('preserves normal error messages', () => {
    const msg = 'Connection timeout after 30s'
    expect(sanitizeErrorMessage(msg)).toBe('Connection timeout after 30s')
  })
})
