<template>
  <div v-if="error" class="role-error-card ceramic-card" :class="[`severity-${formatted.severity}`]">
    <div class="error-main-layout">
      <!-- Tactile Icon Badge -->
      <div class="error-badge-well">
        <SvgIcon :name="iconName" size="20" :color="iconColor" />
      </div>

      <!-- Human Narrative Content -->
      <div class="error-body">
        <h4 class="error-title font-display">{{ formatted.title }}</h4>
        <p class="error-message">{{ formatted.message }}</p>

        <!-- Contextual Action Button (e.g. Sign In, Retry, Refresh) -->
        <div v-if="formatted.actionLabel" class="error-actions">
          <button
            type="button"
            class="action-btn"
            :class="formatted.severity === 'error' ? 'btn-clay-terracotta' : 'btn-clay-sand'"
            @click="handleActionClick"
          >
            <span>{{ formatted.actionLabel }}</span>
            <SvgIcon name="sparkle" size="14" />
          </button>
        </div>
      </div>

      <!-- Dismiss Button if dismissible -->
      <button
        v-if="dismissible"
        type="button"
        class="dismiss-btn"
        aria-label="Dismiss alert"
        @click="$emit('dismiss')"
      >
        <SvgIcon name="close" size="14" color="var(--text-muted)" />
      </button>
    </div>

    <!-- Diagnostic Telemetry Tray (Strictly for DEVELOPER & ADMIN) -->
    <div v-if="formatted.telemetry && (authStore.isDeveloper || authStore.isAdmin)" class="telemetry-tray">
      <button
        type="button"
        class="telemetry-toggle-btn"
        @click="showTelemetry = !showTelemetry"
      >
        <div class="flex items-center gap-2">
          <SvgIcon name="shield" size="13" color="var(--accent-clay)" />
          <span class="font-mono text-xs font-semibold">
            {{ authStore.isDeveloper ? 'Developer Telemetry' : 'Administrative Diagnostics' }}
          </span>
          <span v-if="formatted.telemetry.status" class="status-pill font-mono">
            HTTP {{ formatted.telemetry.status }}
          </span>
        </div>
        <SvgIcon :name="showTelemetry ? 'minus' : 'plus'" size="12" color="var(--text-muted)" />
      </button>

      <div v-if="showTelemetry" class="telemetry-details">
        <div class="telemetry-grid">
          <div v-if="formatted.telemetry.status" class="telemetry-item">
            <span class="telemetry-label">Status Code:</span>
            <span class="telemetry-val text-error font-mono font-bold">{{ formatted.telemetry.status }}</span>
          </div>
          <div v-if="formatted.telemetry.endpoint" class="telemetry-item">
            <span class="telemetry-label">Target Endpoint:</span>
            <code class="telemetry-code">{{ formatted.telemetry.endpoint }}</code>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Timestamp:</span>
            <span class="telemetry-val font-mono">{{ formatted.telemetry.timestamp }}</span>
          </div>
        </div>

        <div class="raw-detail-box">
          <span class="raw-detail-label">Raw Exception / RFC 7807 Detail:</span>
          <pre class="raw-detail-pre">{{ formatted.telemetry.rawDetail }}</pre>
        </div>

        <div class="telemetry-actions">
          <button type="button" class="btn-copy-json" @click="copyTelemetry">
            <SvgIcon :name="copied ? 'check' : 'terminal'" size="13" />
            <span>{{ copied ? 'Copied to Clipboard!' : 'Copy Diagnostic JSON' }}</span>
          </button>

          <button
            v-if="authStore.isDeveloper"
            type="button"
            class="btn-open-devtools"
            @click="openDevTools"
          >
            <SvgIcon name="sliders" size="13" />
            <span>Open DevTools HUD</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { formatRoleError, type RoleFormattedError } from '../utils/errorFormatter'
import SvgIcon from './SvgIcon.vue'

const props = withDefaults(
  defineProps<{
    error: unknown
    dismissible?: boolean
  }>(),
  {
    dismissible: false
  }
)

const emit = defineEmits<{
  (e: 'action', type?: string): void
  (e: 'dismiss'): void
}>()

const authStore = useAuthStore()
const showTelemetry = ref(false)
const copied = ref(false)

const formatted = computed<RoleFormattedError>(() => {
  const roles = authStore.user?.roles || (authStore.isAuthenticated ? ['USER'] : [])
  return formatRoleError(props.error, roles)
})

const iconName = computed(() => {
  if (formatted.value.severity === 'error') return 'close'
  if (formatted.value.severity === 'warning') return 'sliders'
  return 'info'
})

const iconColor = computed(() => {
  if (formatted.value.severity === 'error') return 'var(--accent-terracotta)'
  if (formatted.value.severity === 'warning') return 'var(--accent-amber)'
  return 'var(--surface-dark)'
})

function handleActionClick() {
  const type = formatted.value.actionType
  if (type === 'login') {
    authStore.openAuthModal()
  }
  emit('action', type)
}

async function copyTelemetry() {
  if (!formatted.value.telemetry) return
  try {
    await navigator.clipboard.writeText(formatted.value.telemetry.rawJson)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (e) {
    console.error('Failed to copy telemetry to clipboard', e)
  }
}

function openDevTools() {
  window.dispatchEvent(new CustomEvent('toggle-devtools-hud'))
}
</script>

<style scoped>
.role-error-card {
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 1.15rem;
  position: relative;
  border: 1px solid rgba(25, 49, 38, 0.1);
  box-shadow: 0 4px 16px rgba(25, 49, 38, 0.05);
  animation: bannerFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes bannerFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.severity-error {
  border-left: 4px solid var(--accent-terracotta);
  background: linear-gradient(155deg, #FFFFFF 0%, #FDF7F5 100%);
}

.severity-warning {
  border-left: 4px solid var(--accent-amber);
  background: linear-gradient(155deg, #FFFFFF 0%, #FCF9F1 100%);
}

.severity-info {
  border-left: 4px solid var(--surface-dark);
  background: linear-gradient(155deg, #FFFFFF 0%, #F8FAF8 100%);
}

.error-main-layout {
  display: flex;
  align-items: flex-start;
  gap: 1.1rem;
}

.error-badge-well {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--canvas-bg);
  box-shadow: inset 0 2px 4px rgba(25, 49, 38, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(25, 49, 38, 0.06);
}

.error-body {
  flex: 1;
}

.error-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.error-message {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.error-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.825rem;
  font-weight: 700;
  padding: 0.45rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.action-btn:active {
  transform: translateY(1px) scale(0.98);
}

.dismiss-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.dismiss-btn:hover {
  background: rgba(25, 49, 38, 0.06);
}

/* Telemetry Tray */
.telemetry-tray {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(25, 49, 38, 0.08);
}

.telemetry-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.35rem 0;
  color: var(--text-secondary);
}

.telemetry-toggle-btn:hover {
  color: var(--text-primary);
}

.status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(200, 109, 81, 0.12);
  color: var(--accent-terracotta);
  padding: 0.15rem 0.5rem;
  border-radius: 0.35rem;
  border: 1px solid rgba(200, 109, 81, 0.25);
}

.telemetry-details {
  margin-top: 0.75rem;
  background: #152920;
  color: #E8EFEA;
  border-radius: 0.85rem;
  padding: 1rem;
  font-size: 0.8rem;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.telemetry-label {
  font-size: 0.7rem;
  color: #A3B5AA;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.telemetry-val {
  font-size: 0.8rem;
}

.telemetry-code {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 0.3rem;
  word-break: break-all;
}

.raw-detail-box {
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.raw-detail-label {
  display: block;
  font-size: 0.7rem;
  color: #A3B5AA;
  margin-bottom: 0.35rem;
}

.raw-detail-pre {
  background: rgba(0, 0, 0, 0.25);
  padding: 0.65rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.75rem;
  color: #F8D7DA;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow-y: auto;
}

.telemetry-actions {
  display: flex;
  gap: 0.65rem;
  margin-top: 0.85rem;
  flex-wrap: wrap;
}

.btn-copy-json,
.btn-open-devtools {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: background 0.15s ease;
}

.btn-copy-json:hover,
.btn-open-devtools:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
