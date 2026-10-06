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

  // Google OAuth Login
  async function login(username?: string, password?: string): Promise<UserProfile> {
    window.location.href = '/oauth2/authorization/google'
    // Returns a dummy promise that won't resolve before redirect
    return new Promise(() => {})
  }

  // Fallback for register, just route to login
  async function register(payload: any): Promise<UserProfile> {
    return login()
  }

  function loginAsUser(username = 'user1') {
    return login()
  }

  function loginAsAdmin(username = 'admin1') {
    return login()
  }

  function loginAsDeveloper(username = 'dev1') {
    return login()
  }

  async function checkAuth() {
    try {
      const res = await axios.get('/api/me')
      if (res.data && res.data.authenticated) {
        user.value = {
          sub: res.data.email,
          preferred_username: res.data.name || res.data.email,
          roles: ['USER'],
          email: res.data.email
        }
        
        // Sync user with backend
        try {
          await axios.post('/api/users/sync', {
            email: res.data.email,
            name: res.data.name
          })
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
    try {
      await axios.post('/api/logout')
    } catch (e) {
      console.error(e)
    }
    user.value = null
    window.location.href = '/'
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
    register,
    loginAsUser,
    loginAsAdmin,
    loginAsDeveloper,
    checkAuth,
    logout
  }
})
