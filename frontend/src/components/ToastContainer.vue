<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
      >
        <div class="toast-icon">
          <SvgIcon v-if="toast.type === 'success'" name="check" size="18" color="#FFFFFF" />
          <SvgIcon v-else-if="toast.type === 'error'" name="close" size="18" color="#FFFFFF" />
          <SvgIcon v-else name="sparkle" size="18" color="#FFFFFF" />
        </div>
        <div class="toast-content">
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="toast-close"
          @click="toastStore.remove(toast.id)"
          aria-label="Dismiss notification"
        >
          <SvgIcon name="close" size="14" color="currentColor" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '../stores/toast'
import SvgIcon from './SvgIcon.vue'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 380px;
  width: calc(100% - 3rem);
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--surface-dark);
  color: var(--text-inverse);
  box-shadow: 0 10px 25px rgba(25, 49, 38, 0.25), 0 2px 6px rgba(0,0,0,0.1);
  border: 1px solid var(--border-dark-subtle);
}

.toast-success {
  background: #183326;
  border-left: 4px solid var(--accent-sage);
}

.toast-error {
  background: #381E1C;
  border-left: 4px solid var(--accent-terracotta);
}

.toast-info {
  background: var(--surface-dark);
  border-left: 4px solid var(--accent-amber);
}

.toast-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-message {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
}

.toast-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}

.toast-close:hover {
  color: #FFFFFF;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
</style>
