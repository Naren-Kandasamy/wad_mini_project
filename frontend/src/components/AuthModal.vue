<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="authStore.isAuthModalOpen"
        class="auth-backdrop"
        @click.self="authStore.closeAuthModal"
      >
        <div class="auth-modal ceramic-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <!-- Modal Header -->
          <div class="auth-header">
            <div class="flex items-center gap-2">
              <div class="wax-seal header-seal">
                <SvgIcon name="zap" size="18" color="var(--surface-dark)" />
              </div>
              <div>
                <h2 id="auth-title" class="auth-title font-display">Aura &amp; Earth</h2>
                <span class="auth-subtitle">Unified Authentication</span>
              </div>
            </div>
            <button
              type="button"
              class="close-modal-btn"
              @click="authStore.closeAuthModal"
              aria-label="Close dialog"
            >
              <SvgIcon name="close" size="18" />
            </button>
          </div>

          <!-- Auth Mode Badge -->
          <div class="mode-ribbon">
            <span class="mode-tag embossed-badge">
              <SvgIcon name="shield" size="13" color="var(--accent-sage)" />
              Google Cloud OAuth 2.0 / Resilient Persona RBAC
            </span>
          </div>

          <!-- Google OAuth Live Login -->
          <div class="google-auth-section">
            <button
              type="button"
              class="btn-google-auth"
              @click="authStore.loginWithGoogle"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" class="google-icon">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <div class="auth-divider">
              <span>or test persona credentials</span>
            </div>
          </div>

          <!-- Tab Switcher (Sign In vs Register) -->
          <div class="auth-tabs" role="tablist">
            <button
              type="button"
              class="auth-tab"
              :class="{ active: activeTab === 'signin' }"
              @click="activeTab = 'signin'"
            >
              Sign In
            </button>
            <button
              type="button"
              class="auth-tab"
              :class="{ active: activeTab === 'register' }"
              @click="activeTab = 'register'"
            >
              Create Account
            </button>
          </div>

          <!-- Error Alert Banner -->
          <div v-if="errorMessage" class="auth-error-banner">
            <SvgIcon name="close" size="15" color="var(--accent-terracotta)" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Sign In Form -->
          <form v-if="activeTab === 'signin'" class="auth-form" @submit.prevent="handleSignIn">
            <div class="form-group">
              <label class="form-label">Username or Email</label>
              <div class="input-wrap">
                <SvgIcon name="user" size="16" class="input-icon" />
                <input
                  v-model="loginUsername"
                  type="text"
                  required
                  placeholder="e.g. user1 or dev1"
                  class="auth-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-wrap">
                <input
                  v-model="loginPassword"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  placeholder="••••••••"
                  class="auth-input no-left-icon"
                />
                <button
                  type="button"
                  class="toggle-pwd-btn"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="btn-clay-terracotta w-full submit-btn"
              :disabled="submitting"
            >
              <span v-if="submitting">Authenticating...</span>
              <template v-else>
                <span>Sign In to Account</span>
                <SvgIcon name="arrow-right" size="16" />
              </template>
            </button>
          </form>

          <!-- Register Form -->
          <form v-else class="auth-form" @submit.prevent="handleRegister">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input
                v-model="registerName"
                type="text"
                placeholder="Eleanor Vance"
                class="auth-input no-left-icon"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Username</label>
              <input
                v-model="registerUsername"
                type="text"
                required
                placeholder="eleanor"
                class="auth-input no-left-icon"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input
                v-model="registerEmail"
                type="email"
                required
                placeholder="eleanor@example.com"
                class="auth-input no-left-icon"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input
                v-model="registerPassword"
                type="password"
                required
                placeholder="••••••••"
                class="auth-input no-left-icon"
              />
            </div>

            <button
              type="submit"
              class="btn-clay-terracotta w-full submit-btn"
              :disabled="submitting"
            >
              <span v-if="submitting">Registering Account...</span>
              <template v-else>
                <span>Create &amp; Sign In</span>
                <SvgIcon name="arrow-right" size="16" />
              </template>
            </button>
          </form>

          <!-- Quick-Select Persona Bar (Local Dev & Testing Helper) -->
          <div class="quick-persona-section">
            <span class="quick-title">Quick-Select Persona for Local Testing:</span>
            <div class="persona-chips">
              <button
                type="button"
                class="persona-chip"
                @click="quickSelect('user1', 'password123')"
              >
                <span class="persona-role">Customer</span>
                <span class="persona-user">user1</span>
              </button>

              <button
                type="button"
                class="persona-chip chip-admin"
                @click="quickSelect('admin1', 'admin123')"
              >
                <span class="persona-role">Admin</span>
                <span class="persona-user">admin1</span>
              </button>

              <button
                type="button"
                class="persona-chip chip-dev"
                @click="quickSelect('dev1', 'dev123')"
              >
                <span class="persona-role">Developer</span>
                <span class="persona-user">dev1</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import SvgIcon from './SvgIcon.vue'

const authStore = useAuthStore()
const toastStore = useToastStore()

const activeTab = ref<'signin' | 'register'>('signin')
const showPassword = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

// Sign in inputs
const loginUsername = ref('user1')
const loginPassword = ref('password123')

// Register inputs
const registerName = ref('')
const registerUsername = ref('')
const registerEmail = ref('')
const registerPassword = ref('')

async function handleSignIn() {
  submitting.value = true
  errorMessage.value = null
  try {
    const profile = await authStore.login(loginUsername.value, loginPassword.value)
    authStore.closeAuthModal()
    toastStore.show(`Signed in as ${profile.preferred_username} (${profile.roles.join(', ')})`, 'success')
  } catch (err: any) {
    errorMessage.value = err.message || 'Authentication failed'
  } finally {
    submitting.value = false
  }
}

async function handleRegister() {
  submitting.value = true
  errorMessage.value = null
  try {
    const profile = await authStore.register({
      username: registerUsername.value,
      email: registerEmail.value,
      password: registerPassword.value,
      name: registerName.value
    })
    authStore.closeAuthModal()
    toastStore.show(`Account created! Welcome, ${profile.preferred_username}`, 'success')
  } catch (err: any) {
    errorMessage.value = err.message || 'Registration failed'
  } finally {
    submitting.value = false
  }
}

function quickSelect(user: string, pass: string) {
  loginUsername.value = user
  loginPassword.value = pass
  activeTab.value = 'signin'
  handleSignIn()
}
</script>

<style scoped>
.auth-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(23, 35, 29, 0.5);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.auth-modal {
  background: var(--surface-card);
  width: 100%;
  max-width: 440px;
  padding: 2.25rem 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 20px 50px rgba(23, 35, 29, 0.25);
  border: 1px solid var(--border-subtle);
  position: relative;
}

.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-seal {
  width: 38px;
  height: 38px;
}

.auth-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--surface-dark);
  margin: 0;
  line-height: 1.2;
}

.auth-subtitle {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
}

.close-modal-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-modal-btn:hover {
  background: var(--canvas-alt);
  color: var(--text-primary);
}

.mode-ribbon {
  margin-bottom: 1.25rem;
}

.mode-tag {
  background: var(--canvas-alt);
  color: var(--text-secondary);
  padding: 0.25rem 0.65rem;
  font-size: 0.7rem;
  gap: 0.4rem;
}

.auth-tabs {
  display: flex;
  background: var(--canvas-alt);
  border-radius: 0.85rem;
  padding: 0.25rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-subtle);
}

.auth-tab {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.55rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: 0.65rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-tab.active {
  background: #FFFFFF;
  color: var(--surface-dark);
  box-shadow: var(--shadow-sm);
}

.auth-error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FDF2F0;
  border: 1px solid rgba(200, 109, 81, 0.25);
  color: #943A24;
  padding: 0.75rem 0.9rem;
  border-radius: 0.75rem;
  font-size: 0.825rem;
  margin-bottom: 1.25rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  color: var(--text-muted);
  pointer-events: none;
}

.auth-input {
  width: 100%;
  padding: 0.7rem 0.9rem 0.7rem 2.4rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-medium);
  background: var(--canvas-bg);
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s ease;
}

.auth-input.no-left-icon {
  padding-left: 0.9rem;
}

.auth-input:focus {
  border-color: var(--accent-terracotta);
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(200, 109, 81, 0.15);
}

.toggle-pwd-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
}

.submit-btn {
  margin-top: 0.5rem;
  padding: 0.8rem;
}

/* Quick Personas */
.quick-persona-section {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.quick-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: var(--text-muted);
}

.persona-chips {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.persona-chip {
  background: var(--canvas-alt);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 0.5rem 0.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.persona-chip:hover {
  background: #E8E2D7;
  border-color: var(--border-medium);
  transform: translateY(-1px);
}

.persona-role {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.persona-user {
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--text-muted);
}

.chip-admin .persona-role {
  color: var(--accent-clay);
}

.chip-dev .persona-role {
  color: var(--surface-dark);
}

.google-auth-section {
  margin-bottom: 1.25rem;
}

.btn-google-auth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #ffffff;
  color: #3c4043;
  border: 1px solid #dadce0;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-google-auth:hover {
  background: #f8f9fa;
  border-color: #c6c9ce;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.google-icon {
  flex-shrink: 0;
}

.auth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1rem 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-subtle);
}

.auth-divider span {
  padding: 0 0.75rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
