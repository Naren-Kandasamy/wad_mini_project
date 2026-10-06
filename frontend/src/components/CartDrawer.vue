<template>
  <Teleport to="body">
    <!-- Backdrop Overlay -->
    <Transition name="fade">
      <div
        v-if="cartStore.isDrawerOpen"
        class="drawer-backdrop"
        @click="cartStore.closeDrawer"
      ></div>
    </Transition>

    <!-- Slide-over Drawer -->
    <Transition name="slide">
      <div
        v-if="cartStore.isDrawerOpen"
        class="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="flex items-center gap-2">
            <h2 id="drawer-title" class="drawer-title font-display">Your Basket</h2>
            <span class="drawer-count embossed-badge">{{ cartStore.itemCount }} {{ cartStore.itemCount === 1 ? 'item' : 'items' }}</span>
          </div>
          <button
            type="button"
            class="drawer-close-btn"
            @click="cartStore.closeDrawer"
            aria-label="Close cart drawer"
          >
            <SvgIcon name="close" size="20" />
          </button>
        </div>

        <!-- Drawer Content -->
        <div class="drawer-body">
          <!-- Empty State -->
          <div v-if="cartStore.items.length === 0" class="drawer-empty-state">
            <div class="wax-seal empty-icon-wrap">
              <SvgIcon name="bag" size="28" color="var(--accent-clay)" />
            </div>
            <h3 class="font-display empty-title">Your basket is empty</h3>
            <p class="empty-desc">
              Explore our precision workstation hardware, mechanical peripherals, and displays.
            </p>
            <button
              type="button"
              class="btn-clay-terracotta mt-4"
              @click="handleStartShopping"
            >
              <span>Explore Collection</span>
              <SvgIcon name="arrow-right" size="16" />
            </button>
          </div>

          <!-- Items List -->
          <div v-else class="drawer-items-list">
            <div
              v-for="item in cartStore.items"
              :key="item.productId"
              class="drawer-item"
            >
              <div class="item-info">
                <h4 class="item-name">{{ item.productName }}</h4>
                <span class="item-unit-price">${{ (item.unitPrice ?? 0).toFixed(2) }} each</span>
              </div>

              <div class="item-controls">
                <!-- Quantity Stepper -->
                <div class="stepper-box">
                  <button
                    type="button"
                    class="stepper-btn"
                    :disabled="cartStore.loading"
                    @click="handleDecrement(item)"
                    aria-label="Decrease quantity"
                  >
                    <SvgIcon name="minus" size="14" />
                  </button>
                  <span class="stepper-value">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="stepper-btn"
                    :disabled="cartStore.loading"
                    @click="handleIncrement(item)"
                    aria-label="Increase quantity"
                  >
                    <SvgIcon name="plus" size="14" />
                  </button>
                </div>

                <!-- Line Total & Remove -->
                <div class="item-actions">
                  <span class="item-total-price font-display">${{ (item.lineTotal ?? 0).toFixed(2) }}</span>
                  <button
                    type="button"
                    class="item-remove-btn"
                    :disabled="cartStore.loading"
                    @click="handleRemove(item.productId)"
                    title="Remove item"
                  >
                    <SvgIcon name="trash" size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div v-if="cartStore.items.length > 0" class="drawer-footer">
          <div class="subtotal-row">
            <span class="subtotal-label">Subtotal</span>
            <span class="subtotal-amount font-display">${{ cartStore.subtotal.toFixed(2) }}</span>
          </div>
          <p class="shipping-note">
            Taxes and shipping calculated at checkout. Free shipping on orders over $50.
          </p>

          <div class="footer-buttons">
            <button
              type="button"
              class="btn-clay-terracotta w-full"
              @click="handleProceedToCheckout"
            >
              <span>Review & Checkout</span>
              <SvgIcon name="arrow-right" size="18" />
            </button>
            <button
              type="button"
              class="btn-secondary w-full"
              @click="cartStore.clearCart"
            >
              Clear Basket
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCartStore, CartItem } from '../stores/cart'
import { useToastStore } from '../stores/toast'
import SvgIcon from './SvgIcon.vue'

const router = useRouter()
const cartStore = useCartStore()
const toastStore = useToastStore()

function handleStartShopping() {
  cartStore.closeDrawer()
  router.push('/')
}

function handleProceedToCheckout() {
  cartStore.closeDrawer()
  router.push('/cart')
}

async function handleIncrement(item: CartItem) {
  try {
    await cartStore.updateQuantity(item.productId, item.quantity + 1)
  } catch (err: any) {
    toastStore.show('Failed to update quantity', 'error')
  }
}

async function handleDecrement(item: CartItem) {
  try {
    if (item.quantity <= 1) {
      await cartStore.removeItem(item.productId)
      toastStore.show('Item removed from basket', 'info')
    } else {
      await cartStore.updateQuantity(item.productId, item.quantity - 1)
    }
  } catch (err: any) {
    toastStore.show('Failed to update quantity', 'error')
  }
}

async function handleRemove(productId: string) {
  try {
    await cartStore.removeItem(productId)
    toastStore.show('Item removed from basket', 'info')
  } catch (err: any) {
    toastStore.show('Failed to remove item', 'error')
  }
}
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(23, 35, 29, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 440px;
  background-color: var(--canvas-bg);
  box-shadow: var(--shadow-drawer);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-subtle);
}

.drawer-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-card);
}

.drawer-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--surface-dark);
  margin: 0;
}

.drawer-count {
  background: var(--canvas-alt);
  color: var(--text-secondary);
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.drawer-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.drawer-close-btn:hover {
  background: var(--canvas-alt);
  color: var(--text-primary);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.drawer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  margin-bottom: 1.25rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  max-width: 260px;
  line-height: 1.5;
}

.drawer-items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drawer-item {
  background: var(--surface-card);
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.item-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.item-unit-price {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.item-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stepper-box {
  display: inline-flex;
  align-items: center;
  background: var(--canvas-alt);
  border-radius: 0.65rem;
  padding: 0.15rem;
  border: 1px solid var(--border-subtle);
}

.stepper-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: 0.45rem;
  transition: all 0.15s ease;
}

.stepper-btn:hover:not(:disabled) {
  background: #FFFFFF;
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.stepper-value {
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 28px;
  text-align: center;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.item-total-price {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--accent-terracotta);
}

.item-remove-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}

.item-remove-btn:hover:not(:disabled) {
  color: var(--accent-danger);
}

.drawer-footer {
  padding: 1.5rem;
  background: var(--surface-card);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.subtotal-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.subtotal-label {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.subtotal-amount {
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.shipping-note {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.footer-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
