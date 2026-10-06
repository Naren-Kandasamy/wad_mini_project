<template>
  <Transition name="slide-up">
    <aside
      v-if="isVisible"
      class="sticky-basket-bar"
      aria-label="Floating quick basket summary"
    >
      <div class="basket-pill ceramic-card">
        <!-- Left: Bag Icon & Item Counter -->
        <div class="pill-left">
          <div class="wax-seal-clay pill-seal">
            <SvgIcon name="bag" size="18" color="#FFFFFF" />
          </div>
          <div class="pill-details">
            <span class="pill-count font-display">
              {{ cartStore.itemCount }} {{ cartStore.itemCount === 1 ? 'Hardware Item' : 'Hardware Items' }}
            </span>
            <span class="pill-shipping font-mono">INSURED COURIER DISPATCH</span>
          </div>
        </div>

        <div class="pill-divider"></div>

        <!-- Center: Running Subtotal -->
        <div class="pill-center">
          <span class="subtotal-label">Subtotal:</span>
          <span class="subtotal-amount font-display">${{ Number(cartStore.subtotal).toFixed(2) }}</span>
        </div>

        <!-- Right: Action Button -->
        <div class="pill-right">
          <button
            type="button"
            class="btn-clay-terracotta pill-action-btn"
            @click="cartStore.openDrawer"
          >
            <span>Review Basket</span>
            <SvgIcon name="arrow-right" size="15" />
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCartStore } from '../stores/cart'
import SvgIcon from './SvgIcon.vue'

const cartStore = useCartStore()
const isScrolled = ref(false)

const isVisible = computed(() => {
  return isScrolled.value && cartStore.itemCount > 0 && !cartStore.isDrawerOpen
})

function handleScroll() {
  isScrolled.value = window.scrollY > 300
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.sticky-basket-bar {
  position: fixed;
  bottom: 1.75rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 95;
  pointer-events: none;
  padding: 0 1rem;
}

.basket-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.25rem 0.75rem 0.85rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  box-shadow:
    0 16px 36px -8px rgba(18, 30, 24, 0.28),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.pill-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pill-seal {
  width: 38px;
  height: 38px;
}

.pill-details {
  display: flex;
  flex-direction: column;
}

.pill-count {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.pill-shipping {
  font-size: 0.65rem;
  color: var(--accent-sage);
  letter-spacing: 0.05em;
}

.pill-divider {
  width: 1px;
  height: 28px;
  background: var(--border-subtle);
}

.pill-center {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.subtotal-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.subtotal-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.pill-action-btn {
  padding: 0.55rem 1.15rem;
  font-size: 0.825rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}

@media (max-width: 680px) {
  .basket-pill {
    gap: 0.85rem;
    padding: 0.6rem 0.85rem;
  }
  .pill-shipping {
    display: none;
  }
  .pill-divider {
    display: none;
  }
}
</style>
