<template>
  <Teleport to="body">
    <div v-if="isOpen" class="palette-backdrop" @click.self="close">
      <div
        class="command-palette ceramic-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-search"
      >
        <!-- Search Input Bar -->
        <div class="palette-search-bar">
          <SvgIcon name="search" size="20" color="var(--accent-terracotta)" class="search-icon" />
          <input
            id="command-palette-search"
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="Search hardware, keyboards, switches, specs, or actions..."
            class="palette-input font-display"
            autocomplete="off"
            @keydown="handleKeyNavigation"
          />
          <button v-if="query" type="button" class="clear-btn" @click="query = ''">
            <SvgIcon name="close" size="14" />
          </button>
          <div class="kbd-pill font-mono">ESC</div>
        </div>

        <!-- Scrollable Results Section -->
        <div class="palette-results">
          <!-- Quick Navigation Actions -->
          <div v-if="filteredActions.length > 0" class="results-group">
            <span class="group-title font-mono">WORKSPACE ACTIONS</span>
            <div
              v-for="(act, idx) in filteredActions"
              :key="act.id"
              class="result-row action-row"
              :class="{ highlighted: activeIndex === idx }"
              @mouseenter="activeIndex = idx"
              @click="executeAction(act)"
            >
              <div class="row-icon-box">
                <SvgIcon :name="act.icon" size="16" color="var(--accent-terracotta)" />
              </div>
              <div class="row-content">
                <span class="row-label">{{ act.label }}</span>
                <span class="row-sub">{{ act.sub }}</span>
              </div>
              <span class="font-mono action-key-hint">↵</span>
            </div>
          </div>

          <!-- Product Matches -->
          <div v-if="filteredProducts.length > 0" class="results-group">
            <span class="group-title font-mono">PRECISION HARDWARE ({{ filteredProducts.length }})</span>
            <div
              v-for="(prod, idx) in filteredProducts"
              :key="prod.id"
              class="result-row product-row"
              :class="{ highlighted: activeIndex === filteredActions.length + idx }"
              @mouseenter="activeIndex = filteredActions.length + idx"
              @click="selectProduct(prod)"
            >
              <div class="row-icon-box">
                <SvgIcon :name="getProductIcon(prod.name)" size="16" color="var(--surface-dark)" />
              </div>
              <div class="row-content">
                <div class="flex items-center gap-2">
                  <span class="row-label">{{ prod.name }}</span>
                  <span class="row-sku font-mono">{{ prod.sku }}</span>
                </div>
                <span class="row-sub">{{ prod.description }}</span>
              </div>
              <div class="row-action-end">
                <span class="font-display row-price">${{ Number(prod.price).toFixed(2) }}</span>
                <button
                  type="button"
                  class="btn-quick-add"
                  title="Add to Basket"
                  @click.stop="quickAddToCart(prod)"
                >
                  <SvgIcon name="plus" size="13" color="#FFFFFF" />
                </button>
              </div>
            </div>
          </div>

          <!-- Empty Search State -->
          <div v-if="query && filteredActions.length === 0 && filteredProducts.length === 0" class="empty-results">
            <SvgIcon name="search" size="24" color="var(--text-muted)" />
            <p>No hardware or action found matching "{{ query }}"</p>
          </div>
        </div>

        <!-- Palette Footer with Keyboard Hints -->
        <div class="palette-footer">
          <div class="footer-hint">
            <kbd class="kbd-key">↑</kbd><kbd class="kbd-key">↓</kbd>
            <span>to navigate</span>
          </div>
          <div class="footer-hint">
            <kbd class="kbd-key">↵</kbd>
            <span>to select</span>
          </div>
          <div class="footer-hint">
            <kbd class="kbd-key">ESC</kbd>
            <span>to exit</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '../api/client'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import SvgIcon from './SvgIcon.vue'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
}

interface PaletteAction {
  id: string
  label: string
  sub: string
  icon: string
  handler: () => void
}

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const isOpen = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)
const products = ref<Product[]>([])

const baseActions: PaletteAction[] = [
  {
    id: 'catalog',
    label: 'Explore Catalog',
    sub: 'Browse all precision hardware peripherals',
    icon: 'zap',
    handler: () => {
      router.push('/')
      close()
    }
  },
  {
    id: 'cart',
    label: 'Open Shopping Basket',
    sub: 'Review current hardware items and subtotal',
    icon: 'bag',
    handler: () => {
      cartStore.openDrawer()
      close()
    }
  },
  {
    id: 'orders',
    label: 'Order History & Certificates',
    sub: 'View previous orders and cryptographic warranty slips',
    icon: 'package',
    handler: () => {
      router.push('/orders')
      close()
    }
  },
  {
    id: 'auth',
    label: 'Session Access / Account',
    sub: 'Sign in, register, or manage authentication state',
    icon: 'user',
    handler: () => {
      authStore.openAuthModal()
      close()
    }
  }
]

const filteredActions = computed(() => {
  if (!query.value.trim()) return baseActions
  const q = query.value.toLowerCase()
  return baseActions.filter(a => a.label.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q))
})

const filteredProducts = computed(() => {
  if (!query.value.trim()) return products.value.slice(0, 5)
  const q = query.value.toLowerCase()
  return products.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q)
  ).slice(0, 8)
})

const totalItems = computed(() => filteredActions.value.length + filteredProducts.value.length)

watch(query, () => {
  activeIndex.value = 0
})

function getProductIcon(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('keyboard')) return 'keyboard'
  if (lower.includes('mouse')) return 'mouse'
  if (lower.includes('monitor') || lower.includes('display')) return 'monitor'
  if (lower.includes('headphone') || lower.includes('audio')) return 'headphones'
  return 'zap'
}

async function loadProducts() {
  try {
    const res = await apiClient.get<Product[]>('/products')
    products.value = res.data
  } catch (err) {
    // Graceful fallback
  }
}

function handleKeyNavigation(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (totalItems.value > 0) {
      activeIndex.value = (activeIndex.value + 1) % totalItems.value
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (totalItems.value > 0) {
      activeIndex.value = (activeIndex.value - 1 + totalItems.value) % totalItems.value
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value < filteredActions.value.length) {
      const act = filteredActions.value[activeIndex.value]
      if (act) executeAction(act)
    } else {
      const prodIdx = activeIndex.value - filteredActions.value.length
      const prod = filteredProducts.value[prodIdx]
      if (prod) selectProduct(prod)
    }
  } else if (e.key === 'Escape') {
    close()
  }
}

function executeAction(act: PaletteAction) {
  act.handler()
}

function selectProduct(prod: Product) {
  router.push('/')
  close()
}

async function quickAddToCart(prod: Product) {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal()
    close()
    return
  }
  try {
    await cartStore.addItem(prod, 1)
    toastStore.show(`Added "${prod.name}" to basket`, 'success')
  } catch (err) {
    toastStore.show('Failed to add item', 'error')
  }
}

function open() {
  isOpen.value = true
  query.value = ''
  activeIndex.value = 0
  if (products.value.length === 0) {
    loadProducts()
  }
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function close() {
  isOpen.value = false
}

function handleGlobalShortcut(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }
}

// Global Custom Event for opening palette from other components
function handleCustomOpen() {
  open()
}

defineExpose({
  open,
  close
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)
  window.addEventListener('open-command-palette', handleCustomOpen)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
  window.removeEventListener('open-command-palette', handleCustomOpen)
})
</script>

<style scoped>
.palette-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 18, 0.65);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 5rem 1.25rem 1.25rem;
}

.command-palette {
  width: 100%;
  max-width: 640px;
  background: var(--surface-card);
  border-radius: 1.25rem;
  box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: paletteDrop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes paletteDrop {
  from {
    opacity: 0;
    transform: translateY(-16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.palette-search-bar {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.15rem 1.4rem;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(249, 246, 240, 0.7);
}

.search-icon {
  flex-shrink: 0;
}

.palette-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--text-primary);
  outline: none;
}

.palette-input::placeholder {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.kbd-pill {
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: var(--surface-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

.palette-results {
  max-height: 420px;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.results-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.group-title {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  padding: 0 0.6rem 0.25rem;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.result-row.highlighted {
  background: var(--surface-subtle);
  transform: translateX(3px);
}

.row-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-row.highlighted .row-icon-box {
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.row-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  overflow: hidden;
}

.row-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--surface-dark);
}

.row-sku {
  font-size: 0.7rem;
  color: var(--accent-terracotta);
  background: rgba(189, 99, 70, 0.08);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.row-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-key-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.row-action-end {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.row-price {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.btn-quick-add {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-terracotta);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.btn-quick-add:hover {
  transform: scale(1.15);
}

.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.palette-footer {
  padding: 0.75rem 1.4rem;
  border-top: 1px solid var(--border-subtle);
  background: rgba(249, 246, 240, 0.5);
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.kbd-key {
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-secondary);
}
</style>
