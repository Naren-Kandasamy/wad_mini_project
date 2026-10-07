import { describe, it, expect } from 'vitest'
import { formatRoleError } from '../utils/errorFormatter'

describe('errorFormatter utility', () => {
  it('formats 401 JWT error for standard customer (USER) with zero technical leakage', () => {
    const rawError = 'An error occurred while attempting to decode the Jwt: Malformed token'
    const result = formatRoleError(rawError, ['USER'])

    expect(result.title).toBe('Your Session Has Ended')
    expect(result.message).toContain('Please sign in')
    expect(result.actionLabel).toBe('Sign In')
    expect(result.actionType).toBe('login')
    expect(result.telemetry).toBeUndefined()
    expect(result.message).not.toContain('Jwt')
    expect(result.message).not.toContain('Malformed')
  })

  it('formats 401 JWT error for DEVELOPER with full diagnostic telemetry', () => {
    const rawError = 'An error occurred while attempting to decode the Jwt: Malformed token'
    const result = formatRoleError(rawError, ['DEVELOPER'])

    expect(result.title).toContain('JWT Authentication Failed')
    expect(result.telemetry).toBeDefined()
    expect(result.telemetry?.rawDetail).toBe(rawError)
    expect(result.telemetry?.status).toBe(401)
    expect(result.telemetry?.rawJson).toContain('Malformed token')
  })

  it('formats 401 JWT error for ADMIN with operational clarity', () => {
    const rawError = 'An error occurred while attempting to decode the Jwt: Malformed token'
    const result = formatRoleError(rawError, ['ADMIN'])

    expect(result.title).toBe('Admin Session Expired')
    expect(result.telemetry).toBeDefined()
  })

  it('formats 409 concurrency conflict for USER as gentle basket synchronization', () => {
    const rawError = 'Cart state conflict detected: The cart was modified concurrently'
    const result = formatRoleError(rawError, ['USER'])

    expect(result.title).toBe('Basket Synchronized')
    expect(result.actionType).toBe('refresh')
    expect(result.telemetry).toBeUndefined()
  })

  it('formats network / port 8080 errors for USER as storefront reconnecting', () => {
    const rawError = 'Catalog API unreachable (Port 8080)'
    const result = formatRoleError(rawError, ['USER'])

    expect(result.title).toBe('Storefront Reconnecting')
    expect(result.message).not.toContain('Port 8080')
    expect(result.telemetry).toBeUndefined()
  })

  it('formats network / port 8080 errors for DEVELOPER with target port telemetry', () => {
    const rawError = 'Catalog API unreachable (Port 8080)'
    const result = formatRoleError(rawError, ['DEVELOPER'])

    expect(result.title).toContain('Service Communication Failure')
    expect(result.message).toContain('Port 8080')
    expect(result.telemetry).toBeDefined()
  })
})
