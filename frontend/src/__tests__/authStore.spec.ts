import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth'

describe('Auth Store Security Specifications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear browser storages
    localStorage.clear()
    sessionStorage.clear()
  })

  it('initializes in unauthenticated state with null token', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.token).toBeNull()
    expect(auth.user).toBeNull()
  })

  it('SECURITY: stores access token strictly in JavaScript heap memory and NEVER in localStorage', () => {
    const auth = useAuthStore()
    auth.loginAsUser('alice')

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.currentUserId).toBe('alice')
    expect(auth.token).toBeTruthy()

    // STRICT VERIFICATION: localStorage and sessionStorage must contain ZERO tokens
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('jwt')).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('correctly grants ROLE_ADMIN privileges and detects admin authority', () => {
    const auth = useAuthStore()
    auth.loginAsAdmin('admin-super')

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isAdmin).toBe(true)
    expect(auth.currentUserId).toBe('admin-super')
  })

  it('clears all in-memory credentials upon logout', () => {
    const auth = useAuthStore()
    auth.loginAsUser('bob')
    expect(auth.isAuthenticated).toBe(true)

    auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.token).toBeNull()
    expect(auth.user).toBeNull()
    expect(auth.currentUserId).toBe('')
  })
})
