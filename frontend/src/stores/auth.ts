import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface UserProfile {
  sub: string
  preferred_username: string
  roles: string[]
  email?: string
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<UserProfile | null>(null)
  const isAuthModalOpen = ref(false)
  const authMode = ref<'keycloak' | 'local'>('local')

  const isAuthenticated = computed(() => !!user.value)
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

  // Google OAuth redirect
  function loginWithGoogle() {
    window.location.href = '/oauth2/authorization/google'
  }

  // Resilient in-memory local persona logins
  function loginAsUser(username = 'user1'): UserProfile {
    accessToken.value = `dev-token-${username}-user`
    user.value = {
      sub: username,
      preferred_username: username,
      roles: ['USER'],
      email: `${username}@example.com`
    }
    return user.value
  }

  function loginAsAdmin(username = 'admin1'): UserProfile {
    accessToken.value = `dev-token-${username}-admin`
    user.value = {
      sub: username,
      preferred_username: username,
      roles: ['ADMIN'],
      email: `${username}@example.com`
    }
    return user.value
  }

  function loginAsDeveloper(username = 'dev1'): UserProfile {
    accessToken.value = `dev-token-${username}-dev`
    user.value = {
      sub: username,
      preferred_username: username,
      roles: ['DEVELOPER'],
      email: `${username}@example.com`
    }
    return user.value
  }

  // Standard login method: routes based on username or defaults to user
  async function login(username = 'user1', password?: string): Promise<UserProfile> {
    const uname = (username || '').toLowerCase()
    if (uname.includes('admin')) {
      return loginAsAdmin(username)
    }
    if (uname.includes('dev')) {
      return loginAsDeveloper(username)
    }
    return loginAsUser(username)
  }

  // Fallback for register, creates local user session
  async function register(payload: any): Promise<UserProfile> {
    return login(payload.username || 'user1')
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
        
        // Sync user with backend
        try {
          await axios.post('/api/users/sync', {
            email: res.data.email,
            name: res.data.name,
            role: roles[0] || 'USER'
          }, { withCredentials: true })
        } catch (e) {
          console.error("Failed to sync user", e)
        }
      } else {
        user.value = null
      }
    } catch (err) {
      console.warn("Check auth failed", err)
      user.value = null
    }
  }

  async function logout() {
    accessToken.value = null
    user.value = null
    try {
      await axios.post('/api/logout', null, { withCredentials: true })
    } catch (e) {
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
