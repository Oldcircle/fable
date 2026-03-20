/** Sanitize error messages to remove potential API keys or sensitive data */
export function sanitizeErrorMessage(message: string): string {
  // Remove anything that looks like an API key (long alphanumeric strings)
  let sanitized = message.replace(/\b(sk-|key-|Bearer\s+)[A-Za-z0-9_-]{20,}\b/g, '[REDACTED]')
  // Remove URLs with auth tokens
  sanitized = sanitized.replace(/(https?:\/\/[^\s]*(?:key|token|auth|secret)=[^\s&]*)/gi, '[REDACTED_URL]')
  return sanitized
}
