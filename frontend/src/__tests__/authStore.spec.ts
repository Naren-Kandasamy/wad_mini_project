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

  it('authenticates successfully using email address instead of username', async () => {
    const auth = useAuthStore()
    const profile = await auth.login('user1@example.com', 'password123')

    expect(auth.isAuthenticated).toBe(true)
    expect(profile.sub).toBe('user1')
    expect(profile.email).toBe('user1@example.com')
    expect(profile.roles).toContain('USER')
  })

  it('authenticates case-insensitively with uppercase email address', async () => {
    const auth = useAuthStore()
    const profile = await auth.login('DEV1@EXAMPLE.COM', 'dev123')

    expect(auth.isAuthenticated).toBe(true)
    expect(profile.sub).toBe('dev1')
    expect(profile.roles).toContain('DEVELOPER')
  })

  it('allows registering a new user with email and logging in by email', async () => {
    const auth = useAuthStore()
    await auth.register({
      username: 'clara',
      email: 'clara@electronics.org',
      password: 'clarapassword'
    })

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.currentUserId).toBe('clara')

    // Logout and log back in using only the email
    auth.logout()
    expect(auth.isAuthenticated).toBe(false)

    const reLoggedIn = await auth.login('clara@electronics.org', 'clarapassword')
    expect(reLoggedIn.sub).toBe('clara')
    expect(reLoggedIn.email).toBe('clara@electronics.org')
    expect(auth.isAuthenticated).toBe(true)
  })

  it('rejects registering with an already existing email', async () => {
    const auth = useAuthStore()
    await expect(auth.register({
      username: 'another_user',
      email: 'user1@example.com',
      password: 'anypassword'
    })).rejects.toThrow('already exists')
  })
})
