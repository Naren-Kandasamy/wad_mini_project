<template>
  <div class="offline-card ceramic-card">
    <div class="wax-seal offline-seal">
      <SvgIcon name="zap" size="30" color="var(--accent-amber)" />
    </div>

    <h3 class="offline-title font-display">{{ title || 'Storefront Temporarily Reconnecting' }}</h3>
    <p class="offline-desc">
      {{ message || 'We are currently synchronizing our catalog inventory. Please check back in a moment or retry your connection.' }}
    </p>

    <!-- Retry Action -->
    <div class="offline-actions">
      <button
        type="button"
        class="btn-clay-terracotta retry-btn"
        :disabled="retrying"
        @click="handleRetry"
      >
        <span v-if="retrying">Reconnecting...</span>
        <template v-else>
          <SvgIcon name="sparkle" size="16" />
          <span>Retry Connection</span>
        </template>
      </button>
    </div>

    <!-- Collapsible Developer Diagnostic Telemetry (Visible ONLY to ROLE_DEVELOPER) -->
    <div v-if="authStore.isDeveloper" class="dev-telemetry-box">
      <button
        type="button"
        class="dev-telemetry-toggle"
        @click="showDevDetails = !showDevDetails"
      >
        <SvgIcon name="shield" size="14" color="var(--accent-clay)" />
        <span>Developer Diagnostic Telemetry</span>
        <SvgIcon :name="showDevDetails ? 'minus' : 'plus'" size="12" />
      </button>

      <div v-if="showDevDetails" class="dev-telemetry-content">
        <div class="telemetry-row">
          <span class="telemetry-key">Status:</span>
          <span class="telemetry-val text-error">BACKEND_UNREACHABLE (Port 8080)</span>
        </div>
        <div class="telemetry-row">
          <span class="telemetry-key">Target Endpoint:</span>
          <code class="telemetry-code">{{ endpoint || '/api/products' }}</code>
        </div>
        <div class="telemetry-row">
          <span class="telemetry-key">Remediation:</span>
          <span class="telemetry-val">Ensure Spring Boot is running on port 8080 and MongoDB replica set is up on port 27018.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import SvgIcon from './SvgIcon.vue'

const props = defineProps<{
  title?: string
  message?: string
  endpoint?: string
  onRetry?: () => Promise<void> | void
}>()

const authStore = useAuthStore()
const retrying = ref(false)
const showDevDetails = ref(false)

async function handleRetry() {
  if (!props.onRetry) return
  retrying.value = true
  try {
    await props.onRetry()
  } finally {
    setTimeout(() => {
      retrying.value = false
    }, 600)
  }
}
</script>

<style scoped>
.offline-card {
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  margin: 1.5rem auto;
}

.offline-seal {
  width: 72px;
  height: 72px;
  margin-bottom: 1.5rem;
  background: var(--canvas-alt);
}

.offline-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--surface-dark);
  margin-bottom: 0.65rem;
}

.offline-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  max-width: 440px;
  line-height: 1.55;
  margin-bottom: 1.75rem;
}

.offline-actions {
  display: flex;
  gap: 1rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
}

/* Developer Telemetry Accordion */
.dev-telemetry-box {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--border-medium);
  width: 100%;
  text-align: left;
}

.dev-telemetry-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent-clay);
  width: 100%;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.dev-telemetry-content {
  margin-top: 0.75rem;
  background: var(--canvas-alt);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.telemetry-row {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
}

.telemetry-key {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 110px;
}

.telemetry-val {
  color: var(--text-primary);
}

.text-error {
  color: var(--accent-danger);
  font-weight: 700;
}

.telemetry-code {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}
</style>
