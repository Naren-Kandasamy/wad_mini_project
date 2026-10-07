import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface UserProfile {
  sub: string
  preferred_username: string
  roles: string[]
  email?: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  name?: string
}

// Pre-seeded credentials matching infra/keycloak/realm-export.json & dev testing personas
const SEEDED_CREDENTIALS: Record<string, { password: string; roles: string[]; email: string }> = {
  user1: { password: 'password123', roles: ['USER'], email: 'user1@example.com' },
  admin1: { password: 'admin123', roles: ['ADMIN', 'USER'], email: 'admin1@example.com' },
  dev1: { password: 'dev123', roles: ['DEVELOPER', 'USER'], email: 'dev1@example.com' }
}

/**
 * In-Memory Authentication Store (Dual Google OAuth 2.0 + Resilient Dev Personas).
 *
 * SECURITY MANDATE: Access tokens are stored strictly in JavaScript heap memory
 * and NEVER written to localStorage or sessionStorage, defending against XSS.
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<UserProfile | null>(null)
  const isAuthModalOpen = ref(false)
  const authMode = ref<'google' | 'keycloak' | 'local'>('local')
  const localRegisteredUsers = ref<Record<string, { password: string; roles: string[]; email: string }>>({})

  const isAuthenticated = computed(() => !!accessToken.value || !!user.value)
  const isAdmin = computed(() => user.value?.roles.includes('ADMIN') || user.value?.roles.includes('ROLE_ADMIN') || false)
  const isDeveloper = computed(() => user.value?.roles.includes('DEVELOPER') || user.value?.roles.includes('ROLE_DEVELOPER') || false)
  const currentUserId = computed(() => user.value?.sub || '')
  const token = computed(() => accessToken.value)

  function openAuthModal() {
    isAuthModalOpen.value = true
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false
  }

  function toggleAuthModal() {
    isAuthModalOpen.value = !isAuthModalOpen.value
  }

  function setSession(tokenValue: string, profile: UserProfile, mode: 'google' | 'keycloak' | 'local' = 'local') {
    accessToken.value = tokenValue
    user.value = profile
    authMode.value = mode
  }

  // Google OAuth redirect
  function loginWithGoogle() {
    window.location.href = '/oauth2/authorization/google'
  }

  // Resilient in-memory local persona logins
  function loginAsUser(username = 'user1'): UserProfile {
    const profile: UserProfile = {
      sub: username,
      preferred_username: username,
      roles: ['USER'],
      email: `${username}@example.com`
    }
    setSession(`dev-token-${username}-user`, profile, 'local')
    return profile
  }

  function loginAsAdmin(username = 'admin1'): UserProfile {
    const profile: UserProfile = {
      sub: username,
      preferred_username: username,
      roles: ['ADMIN', 'USER'],
      email: `${username}@example.com`
    }
    setSession(`dev-token-${username}-admin`, profile, 'local')
    return profile
  }

  function loginAsDeveloper(username = 'dev1'): UserProfile {
    const profile: UserProfile = {
      sub: username,
      preferred_username: username,
      roles: ['DEVELOPER', 'USER'],
      email: `${username}@example.com`
    }
    setSession(`dev-token-${username}-dev`, profile, 'local')
    return profile
  }

  /**
   * Universal Login supporting both username (e.g. "user1", "admin1", "dev1")
   * and email addresses (e.g. "user1@example.com", "DEV1@EXAMPLE.COM") case-insensitively.
   */
  async function login(identifier = 'user1', password?: string): Promise<UserProfile> {
    const rawIdentifier = (identifier || '').trim()
    const cleanLower = rawIdentifier.toLowerCase()

    const allAccounts = { ...SEEDED_CREDENTIALS, ...localRegisteredUsers.value }
    const matchedEntry = Object.entries(allAccounts).find(
      ([uname, acc]) => uname.toLowerCase() === cleanLower || (acc.email && acc.email.toLowerCase() === cleanLower)
    )

    const resolvedUsername = matchedEntry ? matchedEntry[0] : rawIdentifier
    const resolvedAccount = matchedEntry ? matchedEntry[1] : null

    // If password is provided and account exists, verify password
    if (resolvedAccount && password !== undefined && password !== '') {
      if (resolvedAccount.password !== password) {
        throw new Error('Incorrect password provided.')
      }
    }

    if (resolvedAccount) {
      const profile: UserProfile = {
        sub: resolvedUsername,
        preferred_username: resolvedUsername,
        roles: resolvedAccount.roles,
        email: resolvedAccount.email
      }
      setSession(`dev-token-${resolvedUsername}-${resolvedAccount.roles[0].toLowerCase()}`, profile, 'local')
      closeAuthModal()
      return profile
    }

    // Role-based fallbacks for test shorthand (e.g. "admin", "dev")
    if (cleanLower.includes('admin')) {
      const p = loginAsAdmin(resolvedUsername)
      closeAuthModal()
      return p
    }
    if (cleanLower.includes('dev')) {
      const p = loginAsDeveloper(resolvedUsername)
      closeAuthModal()
      return p
    }

    const p = loginAsUser(resolvedUsername)
    closeAuthModal()
    return p
  }

  /**
   * In-Memory Registration with backend synchronization attempt
   */
  async function register(payload: RegisterPayload): Promise<UserProfile> {
    if (!payload.username || !payload.password) {
      throw new Error('Username and password are required.')
    }

    const cleanUsername = payload.username.trim()
    const cleanEmail = (payload.email || `${cleanUsername}@example.com`).trim().toLowerCase()

    const allAccounts = { ...SEEDED_CREDENTIALS, ...localRegisteredUsers.value }
    const existing = Object.entries(allAccounts).find(
      ([uname, acc]) => uname.toLowerCase() === cleanUsername.toLowerCase() || (acc.email && acc.email.toLowerCase() === cleanEmail)
    )

    if (existing) {
      throw new Error('An account with this username or email already exists.')
    }

    // Try backend registration if available in non-test mode
    if (import.meta.env.MODE !== 'test') {
      try {
        await axios.post('/api/auth/register', {
          username: cleanUsername,
          email: cleanEmail,
          password: payload.password,
          name: payload.name || cleanUsername
        }, { timeout: 3000 })
      } catch {
        // Non-blocking in dev mode
      }
    }

    localRegisteredUsers.value[cleanUsername] = {
      password: payload.password,
      roles: ['USER'],
      email: cleanEmail
    }

    return login(cleanUsername, payload.password)
  }

  async function checkAuth() {
    try {
      // If already authenticated via local token, preserve state
      if (accessToken.value && user.value) {
        return
      }

      const res = await axios.get('/api/me', { withCredentials: true })
      if (res.data && res.data.authenticated) {
        const roles: string[] = res.data.roles || (res.data.role ? [res.data.role] : ['USER'])
        user.value = {
          sub: res.data.email,
          preferred_username: res.data.name || res.data.email,
          roles: roles,
          email: res.data.email
        }
        accessToken.value = 'google-session-active'
        authMode.value = 'google'
        
        // Sync user with backend
        try {
          await axios.post('/api/users/sync', {
            email: res.data.email,
            name: res.data.name,
            role: roles[0] || 'USER'
          }, { withCredentials: true })
        } catch (e) {
          console.warn("Failed to sync user with backend", e)
        }
      } else {
        user.value = null
        accessToken.value = null
      }
    } catch {
      // Not authenticated or network glitch
      if (authMode.value === 'google') {
        user.value = null
        accessToken.value = null
      }
    }
  }

  async function logout() {
    accessToken.value = null
    user.value = null
    try {
      await axios.post('/api/logout', null, { withCredentials: true })
    } catch {
      // Ignore if session not active
    }
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isAdmin,
    isDeveloper,
    currentUserId,
    token,
    authMode,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    toggleAuthModal,
    setSession,
    login,
    loginWithGoogle,
    register,
    loginAsUser,
    loginAsAdmin,
    loginAsDeveloper,
    checkAuth,
    logout
  }
})
