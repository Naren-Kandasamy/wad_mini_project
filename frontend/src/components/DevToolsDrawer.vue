<template>
  <div v-if="authStore.isDeveloper" class="devtools-root">
    <!-- Floating Launcher Pill -->
    <button
      type="button"
      class="devtools-launcher-pill"
      :class="{ 'pill-active': isOpen }"
      @click="isOpen = !isOpen"
      aria-label="Toggle developer diagnostic panel"
    >
      <span class="pill-dot"></span>
      <SvgIcon name="shield" size="14" color="var(--accent-clay)" />
      <span class="pill-text">DevTools (dev1)</span>
    </button>

    <!-- Slide-Up Diagnostic Drawer -->
    <Transition name="drawer">
      <div v-if="isOpen" class="devtools-panel tactile-card">
        <div class="panel-header">
          <div class="flex items-center gap-2">
            <span class="font-display panel-title">Monolith Developer Console</span>
            <span class="embossed-badge dev-badge">ROLE_DEVELOPER</span>
          </div>
          <button
            type="button"
            class="close-btn"
            @click="isOpen = false"
            aria-label="Close developer console"
          >
            <SvgIcon name="close" size="16" />
          </button>
        </div>

        <div class="panel-body">
          <!-- Live Service Connectivity -->
          <div class="diagnostic-section">
            <h4 class="section-heading">Service Telemetry Status</h4>
            <div class="status-grid">
              <div class="status-chip">
                <span class="status-label">Spring Boot API</span>
                <span class="status-val" :class="backendStatus === 'UP' ? 'val-up' : 'val-down'">
                  {{ backendStatus }} (Port 8080)
                </span>
              </div>
              <div class="status-chip">
                <span class="status-label">Auth Provider</span>
                <span class="status-val val-info">
                  {{ authStore.authMode === 'keycloak' ? 'Keycloak 24 (Port 8180)' : 'Local Resilient Fallback' }}
                </span>
              </div>
              <div class="status-chip">
                <span class="status-label">Mongo Replica Set</span>
                <span class="status-val val-info">Port 27018 (rs0)</span>
              </div>
            </div>
          </div>

          <!-- Dev Info Endpoint Telemetry -->
          <div class="diagnostic-section">
            <div class="flex justify-between items-center mb-1">
              <h4 class="section-heading">Node Info (/api/dev/info)</h4>
              <button
                type="button"
                class="refresh-link"
                :disabled="loading"
                @click="loadDevInfo"
              >
                Refresh
              </button>
            </div>

            <div v-if="devInfo" class="code-box">
              <div class="code-row"><span class="k">application:</span> <span class="v">"{{ devInfo.application }}"</span></div>
              <div class="code-row"><span class="k">activeProfiles:</span> <span class="v">{{ JSON.stringify(devInfo.activeProfiles) }}</span></div>
              <div class="code-row"><span class="k">javaVersion:</span> <span class="v">"{{ devInfo.javaVersion }}"</span></div>
              <div class="code-row"><span class="k">status:</span> <span class="v">"{{ devInfo.status }}"</span></div>
            </div>
            <div v-else class="code-box code-dim">
              <span>Endpoint unreachable. Run Spring Boot on port 8080 to fetch live environment details.</span>
            </div>
          </div>

          <!-- JWT Token Claims -->
          <div class="diagnostic-section">
            <h4 class="section-heading">In-Memory JWT Claims</h4>
            <div class="claims-box">
              <div class="claim-item">
                <span class="claim-key">Subject (sub):</span>
                <code class="claim-code">{{ authStore.currentUserId }}</code>
              </div>
              <div class="claim-item">
                <span class="claim-key">Realm Roles:</span>
                <span class="roles-pill-group">
                  <span
                    v-for="role in (authStore.user?.roles || [])"
                    :key="role"
                    class="role-pill"
                  >
                    {{ role }}
                  </span>
                </span>
              </div>
              <div class="claim-item">
                <span class="claim-key">Storage Policy:</span>
                <span class="policy-note">Strict Heap Memory (0 tokens in localStorage)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiClient } from '../api/client'
import SvgIcon from './SvgIcon.vue'

const authStore = useAuthStore()
const isOpen = ref(false)
const loading = ref(false)
const backendStatus = ref<'UP' | 'UNREACHABLE'>('UNREACHABLE')
const devInfo = ref<any>(null)

async function checkHealth() {
  try {
    const res = await apiClient.get('/actuator/health')
    backendStatus.value = res.data?.status === 'UP' ? 'UP' : 'UNREACHABLE'
  } catch {
    backendStatus.value = 'UNREACHABLE'
  }
}

async function loadDevInfo() {
  loading.value = true
  await checkHealth()
  try {
    const res = await apiClient.get('/dev/info')
    devInfo.value = res.data
  } catch {
    devInfo.value = null
  } finally {
    loading.value = false
  }
}

watch(isOpen, (opened) => {
  if (opened) {
    loadDevInfo()
  }
})

onMounted(() => {
  if (authStore.isDeveloper) {
    checkHealth()
  }
})
</script>

<style scoped>
.devtools-root {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 9990;
}

.devtools-launcher-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-dark);
  color: var(--text-inverse);
  padding: 0.5rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid var(--border-dark-subtle);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(23, 35, 29, 0.25);
  transition: all 0.2s ease;
}

.devtools-launcher-pill:hover,
.pill-active {
  background: #0E1D16;
  border-color: var(--accent-amber);
  transform: translateY(-2px);
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-success);
}

.devtools-panel {
  position: absolute;
  bottom: calc(100% + 0.75rem);
  left: 0;
  width: 440px;
  max-width: 90vw;
  max-height: 520px;
  overflow-y: auto;
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 1.25rem;
  box-shadow: 0 15px 40px rgba(23, 35, 29, 0.25);
  border: 1px solid var(--border-subtle);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 1.25rem;
}

.panel-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.dev-badge {
  background: var(--canvas-alt);
  color: var(--surface-dark);
  padding: 0.15rem 0.5rem;
  font-size: 0.65rem;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-heading {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.status-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--canvas-alt);
  padding: 0.45rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.75rem;
}

.status-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.val-up {
  color: var(--accent-success);
  font-weight: 700;
}

.val-down {
  color: var(--accent-danger);
  font-weight: 700;
}

.val-info {
  color: var(--surface-dark);
  font-weight: 600;
}

.refresh-link {
  background: transparent;
  border: none;
  font-size: 0.7rem;
  color: var(--accent-terracotta);
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}

.code-box {
  background: #18221D;
  color: #F1ECE2;
  font-family: monospace;
  font-size: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.code-dim {
  color: #8FA593;
}

.code-row .k {
  color: var(--accent-amber);
}

.code-row .v {
  color: #A3D9B5;
}

.claims-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--canvas-alt);
  padding: 0.75rem;
  border-radius: 0.65rem;
  font-size: 0.75rem;
}

.claim-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.claim-key {
  font-weight: 600;
  color: var(--text-secondary);
}

.claim-code {
  font-family: monospace;
  font-weight: 700;
  color: var(--surface-dark);
}

.roles-pill-group {
  display: flex;
  gap: 0.25rem;
}

.role-pill {
  background: var(--surface-dark);
  color: var(--text-inverse);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
}

.policy-note {
  font-size: 0.7rem;
  color: var(--accent-success);
  font-weight: 600;
}

/* Transitions */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.96);
}
</style>
