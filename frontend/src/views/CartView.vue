<template>
  <div class="cart-page container-wide">
    <div class="cart-header">
      <h1 class="cart-title font-display">Precision Checkout</h1>
      <p class="cart-subtitle">Guided 3-step checkout with RFC 7231 cryptographic idempotency defense.</p>
    </div>

    <!-- Role-Adaptive Tactile Error Banner -->
    <RoleAdaptiveErrorBanner
      v-if="cartStore.error"
      :error="cartStore.error"
      :dismissible="true"
      @dismiss="cartStore.error = null"
      @action="handleErrorAction"
    />

    <!-- 3-Step Tactile Checkout Stepper Header -->
    <div v-if="cartStore.items.length > 0 || checkoutSuccess" class="stepper-nav debossed-well">
      <button
        type="button"
        class="step-item"
        :class="{ active: currentStep === 1, completed: currentStep > 1 }"
        @click="goToStep(1)"
      >
        <span class="step-num font-mono">01</span>
        <div class="step-info">
          <span class="step-title font-display">Basket Review</span>
          <span class="step-sub">{{ cartStore.itemCount }} Items</span>
        </div>
      </button>

      <div class="step-arrow font-mono">→</div>

      <button
        type="button"
        class="step-item"
        :class="{ active: currentStep === 2, completed: currentStep > 2 }"
        :disabled="cartStore.items.length === 0"
        @click="goToStep(2)"
      >
        <span class="step-num font-mono">02</span>
        <div class="step-info">
          <span class="step-title font-display">Shipping &amp; Security Lock</span>
          <span class="step-sub">RFC 7231 Idempotent</span>
        </div>
      </button>

      <div class="step-arrow font-mono">→</div>

      <div
        class="step-item"
        :class="{ active: currentStep === 3 }"
      >
        <span class="step-num font-mono">03</span>
        <div class="step-info">
          <span class="step-title font-display">Order Confirmation</span>
          <span class="step-sub">Warranty Certificate</span>
        </div>
      </div>
    </div>

    <!-- Step 3: Order Confirmed Success Screen -->
    <div v-if="currentStep === 3 && checkoutSuccess" class="success-card tactile-card">
      <div class="success-seal embossed-seal">
        <SvgIcon name="check" size="32" color="var(--accent-success)" />
      </div>
      <div class="confirmation-pill font-mono">CRYPTOGRAPHIC TRANSACTION AUTHORIZED</div>
      <h2 class="success-title font-display">Hardware Order Confirmed</h2>
      <p class="success-text">
        Your precision hardware order has been verified and registered on our atomic inventory ledger.
      </p>

      <div class="order-id-badge embossed-badge">
        <span>Order #{{ checkoutSuccess.orderId }}</span>
      </div>

      <div class="confirmation-meta debossed-well">
        <div class="meta-row">
          <span class="meta-label">Total Amount:</span>
          <span class="meta-val font-display text-terracotta">${{ Number(checkoutSuccess.totalAmount).toFixed(2) }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Protection:</span>
          <span class="meta-val font-mono">RFC 7231 Idempotency-Key Locked</span>
        </div>
      </div>

      <div class="success-actions">
        <router-link to="/orders" class="btn-forest">
          <SvgIcon name="package" size="18" />
          <span>View Orders &amp; Warranty Slip</span>
        </router-link>
        <router-link to="/" class="btn-secondary">
          <span>Continue Shopping</span>
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="cartStore.loading && !cartStore.cart" class="cart-loading">
      <div class="skeleton-shimmer h-12 w-3/4 mb-4"></div>
      <div class="skeleton-shimmer h-48 w-full"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="cartStore.items.length === 0" class="empty-cart-card ceramic-card">
      <div class="wax-seal empty-cart-seal">
        <SvgIcon name="bag" size="32" color="var(--accent-clay)" />
      </div>
      <h2 class="empty-title font-display">Your basket is empty</h2>
      <p class="empty-desc">
        You have no items in your basket. Explore our catalog to discover precision computing devices and hardware.
      </p>
      <router-link to="/" class="btn-clay-terracotta mt-4">
        <span>Browse Catalog</span>
        <SvgIcon name="arrow-right" size="18" />
      </router-link>
    </div>

    <!-- Step 1 & Step 2 Checkout Layout -->
    <div v-else class="cart-layout-grid">
      <!-- Left Column -->
      <div class="cart-left-column">
        <!-- STEP 1: Items List -->
        <div v-if="currentStep === 1" class="ceramic-card items-card">
          <div class="items-card-header">
            <div class="flex items-center gap-2">
              <span class="items-count-tag font-display">{{ cartStore.itemCount }} Items</span>
              <span class="version-tag embossed-badge">
                Concurrency Guarded v{{ cartStore.version }}
              </span>
            </div>
            <button
              type="button"
              class="clear-cart-link"
              @click="cartStore.clearCart"
            >
              Clear Basket
            </button>
          </div>

          <div class="items-table">
            <div
              v-for="item in cartStore.items"
              :key="item.productId"
              class="cart-row"
            >
              <div class="item-meta">
                <h4 class="item-title">{{ item.productName }}</h4>
                <span class="unit-price">${{ Number(item.unitPrice).toFixed(2) }} each</span>
              </div>

              <div class="item-stepper-wrap">
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

                <div class="item-subtotal-box">
                  <span class="line-price font-display">${{ Number(item.lineTotal).toFixed(2) }}</span>
                  <button
                    type="button"
                    class="remove-icon-btn"
                    @click="handleRemove(item.productId)"
                    title="Remove item"
                  >
                    <SvgIcon name="trash" size="15" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2: Shipping Address & Idempotency Lock -->
        <div v-else-if="currentStep === 2" class="step-shipping-container">
          <!-- Shipping Address Form -->
          <div class="ceramic-card shipping-card">
            <div class="card-section-header">
              <div class="wax-seal-dark section-seal">
                <SvgIcon name="package" size="18" color="var(--accent-sage)" />
              </div>
              <div>
                <h3 class="section-title font-display">Courier Dispatch Destination</h3>
                <p class="section-sub">Insured white-glove transport directly to your workstation</p>
              </div>
            </div>

            <form class="shipping-form" @submit.prevent="proceedToCheckout">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Full Name / Recipient</label>
                  <input
                    v-model="shippingForm.fullName"
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Email</label>
                  <input
                    v-model="shippingForm.email"
                    type="email"
                    required
                    placeholder="alex@workstation.io"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Street Address</label>
                <input
                  v-model="shippingForm.address"
                  type="text"
                  required
                  placeholder="742 Silicon Parkway, Suite 400"
                  class="form-input"
                />
              </div>

              <div class="form-row form-row-3">
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input
                    v-model="shippingForm.city"
                    type="text"
                    required
                    placeholder="San Francisco"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Postal / ZIP Code</label>
                  <input
                    v-model="shippingForm.postalCode"
                    type="text"
                    required
                    placeholder="94107"
                    class="form-input font-mono"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Country</label>
                  <select v-model="shippingForm.country" class="form-input">
                    <option value="United States">United States</option>
                    <option value="Germany">Germany</option>
                    <option value="Japan">Japan</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <!-- RFC 7231 Idempotency Key Lock Card -->
          <div class="ceramic-card idempotency-card debossed-well">
            <div class="idempotency-header">
              <div class="flex items-center gap-2">
                <div class="lock-indicator-dot"></div>
                <span class="font-display lock-title">RFC 7231 Idempotency Lock Active</span>
              </div>
              <span class="badge-lock font-mono">ATOMIC GUARD</span>
            </div>

            <p class="idempotency-explanation">
              A cryptographically unique execution token has been initialized on the client heap. If network timeouts or duplicate button taps occur, the server guarantees your transaction executes at most once.
            </p>

            <div class="token-display-box">
              <span class="token-header font-mono">HEADER: Idempotency-Key</span>
              <code class="token-value font-mono">{{ pendingIdempotencyKey }}</code>
            </div>
          </div>
        </div>

        <div class="back-link-box">
          <button
            v-if="currentStep === 2"
            type="button"
            class="continue-link btn-link"
            @click="currentStep = 1"
          >
            <SvgIcon name="chevron-left" size="16" />
            <span>Back to Basket Items</span>
          </button>
          <router-link v-else to="/" class="continue-link">
            <SvgIcon name="chevron-left" size="16" />
            <span>Continue Shopping</span>
          </router-link>
        </div>
      </div>

      <!-- Right Column: Sticky Order Summary & Stepper Action -->
      <div class="summary-column">
        <div class="ceramic-card summary-card">
          <h3 class="summary-title font-display">Order Summary</h3>

          <div class="summary-breakdown">
            <div class="breakdown-row">
              <span>Items Subtotal</span>
              <span class="font-display">${{ Number(cartStore.subtotal).toFixed(2) }}</span>
            </div>
            <div class="breakdown-row">
              <span>Insured Transport</span>
              <span class="free-shipping">Complimentary</span>
            </div>
            <div class="breakdown-row">
              <span>Concurrency Lock</span>
              <span class="font-mono text-sage">v{{ cartStore.version }} Active</span>
            </div>
          </div>

          <div class="summary-total-row">
            <span class="total-label">Estimated Total</span>
            <span class="total-amount font-display">${{ Number(cartStore.subtotal).toFixed(2) }}</span>
          </div>

          <!-- Step 1 Button: Proceed to Step 2 -->
          <button
            v-if="currentStep === 1"
            type="button"
            class="btn-clay-terracotta checkout-btn"
            @click="proceedToShipping"
          >
            <span>Proceed to Shipping &amp; Security</span>
            <SvgIcon name="arrow-right" size="18" />
          </button>

          <!-- Step 2 Button: Confirm & Place Order -->
          <button
            v-else-if="currentStep === 2"
            type="button"
            class="btn-clay-terracotta checkout-btn"
            :disabled="cartStore.loading"
            @click="proceedToCheckout"
          >
            <template v-if="cartStore.loading">
              <span>Executing Idempotent Order...</span>
            </template>
            <template v-else>
              <span>Authorize &amp; Place Order</span>
              <SvgIcon name="shield" size="18" color="#FFFFFF" />
            </template>
          </button>

          <!-- Security Badges -->
          <div class="security-guarantees">
            <div class="guarantee-item">
              <SvgIcon name="shield" size="16" color="var(--accent-sage)" />
              <span>Idempotency-Key (RFC 7231) Defended</span>
            </div>
            <div class="guarantee-item">
              <SvgIcon name="check" size="16" color="var(--accent-sage)" />
              <span>Optimistic Concurrency Protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, CheckoutResponse, CartItem } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import SvgIcon from '../components/SvgIcon.vue'
import RoleAdaptiveErrorBanner from '../components/RoleAdaptiveErrorBanner.vue'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

function handleErrorAction(type?: string) {
  if (type === 'login') {
    authStore.openAuthModal()
  } else if (type === 'refresh' || type === 'retry') {
    cartStore.error = null
    cartStore.syncCartWithServer()
  } else if (type === 'catalog') {
    router.push('/')
  }
}

const currentStep = ref<1 | 2 | 3>(1)
const checkoutSuccess = ref<CheckoutResponse | null>(null)

const pendingIdempotencyKey = ref(
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'idem-' + Math.random().toString(36).substring(2, 12)
)

const shippingForm = ref({
  fullName: 'Alex Mercer',
  email: 'alex@workstation.io',
  address: '742 Silicon Parkway, Suite 400',
  city: 'San Francisco',
  postalCode: '94107',
  country: 'United States'
})

function goToStep(step: 1 | 2 | 3) {
  if (step === 2 && cartStore.items.length === 0) return
  if (step === 3 && !checkoutSuccess.value) return
  currentStep.value = step
}

function proceedToShipping() {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal()
    toastStore.show('Please sign in to proceed with checkout', 'info')
    return
  }
  currentStep.value = 2
}

async function proceedToCheckout() {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal()
    toastStore.show('Please sign in to place your order', 'info')
    return
  }

  try {
    const res = await cartStore.checkout()
    checkoutSuccess.value = res
    currentStep.value = 3
    toastStore.show('Order successfully confirmed!', 'success')
  } catch (err: any) {
    if (authStore.isDeveloper) {
      toastStore.show(cartStore.error || 'Checkout could not be processed', 'error')
    } else {
      toastStore.show('Could not process checkout at this time. Please try again.', 'error')
    }
  }
}

async function handleIncrement(item: CartItem) {
  try {
    await cartStore.updateQuantity(item.productId, item.quantity + 1)
  } catch (err) {
    if (authStore.isDeveloper) {
      toastStore.show('Failed to update quantity', 'error')
    }
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
  } catch (err) {
    if (authStore.isDeveloper) {
      toastStore.show('Failed to update quantity', 'error')
    }
  }
}

async function handleRemove(productId: string) {
  try {
    await cartStore.removeItem(productId)
    toastStore.show('Item removed from basket', 'info')
  } catch (err) {
    if (authStore.isDeveloper) {
      toastStore.show('Failed to remove item', 'error')
    }
  }
}

watch(
  () => authStore.isAuthenticated,
  (authed) => {
    if (authed) {
      cartStore.fetchCart()
    }
  }
)

onMounted(() => {
  if (authStore.isAuthenticated) {
    cartStore.fetchCart()
  }
})
</script>

<style scoped>
.cart-page {
  padding-top: 2rem;
  padding-bottom: 5rem;
}

.cart-header {
  margin-bottom: 1.5rem;
}

.cart-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--surface-dark);
  margin-bottom: 0.35rem;
}

.cart-subtitle {
  font-size: 0.95rem;
  color: var(--text-muted);
}

/* 3-Step Stepper Header */
.stepper-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.75rem;
  border-radius: 1rem;
  margin-bottom: 2.5rem;
  gap: 1rem;
}

.step-item {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  color: var(--text-muted);
}

.step-item:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.step-item.active .step-num {
  background: var(--accent-terracotta);
  color: #FFFFFF;
  border-color: transparent;
  box-shadow: 0 4px 10px rgba(189, 99, 70, 0.3);
}

.step-item.completed .step-num {
  background: var(--accent-success);
  color: #FFFFFF;
  border-color: transparent;
}

.step-info {
  display: flex;
  flex-direction: column;
}

.step-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.step-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.step-arrow {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.875rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.alert-error {
  background: #FDF2F0;
  border: 1px solid rgba(200, 109, 81, 0.2);
  color: #943A24;
}

/* Success Card */
.success-card {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 620px;
  margin: 0 auto;
}

.success-seal {
  width: 72px;
  height: 72px;
  margin-bottom: 1.5rem;
  background: #EAF4EE;
  border-color: rgba(46, 125, 82, 0.2);
}

.confirmation-pill {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--accent-success);
  margin-bottom: 0.5rem;
}

.success-title {
  font-size: 2rem;
  color: var(--surface-dark);
  margin-bottom: 0.75rem;
}

.success-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  max-width: 460px;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.order-id-badge {
  background: var(--canvas-alt);
  color: var(--surface-dark);
  font-family: monospace;
  font-size: 0.95rem;
  padding: 0.4rem 1rem;
  margin-bottom: 1.25rem;
}

.confirmation-meta {
  width: 100%;
  max-width: 380px;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.meta-label {
  color: var(--text-muted);
}

.text-terracotta {
  color: var(--accent-terracotta);
}

.text-sage {
  color: var(--accent-sage);
}

.success-actions {
  display: flex;
  gap: 1rem;
}

/* Empty State */
.empty-cart-card {
  padding: 4.5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 580px;
  margin: 0 auto;
}

.empty-cart-seal {
  width: 68px;
  height: 68px;
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.6rem;
  color: var(--surface-dark);
  margin-bottom: 0.5rem;
}

.empty-desc {
  font-size: 0.95rem;
  color: var(--text-muted);
  max-width: 360px;
  line-height: 1.5;
}

/* 2-Column Grid */
.cart-layout-grid {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

.items-card {
  padding: 1.75rem;
}

.items-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-subtle);
}

.items-count-tag {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--surface-dark);
}

.version-tag {
  background: var(--canvas-alt);
  color: var(--text-muted);
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
}

.clear-cart-link {
  background: transparent;
  border: none;
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s ease;
}

.clear-cart-link:hover {
  color: var(--accent-danger);
}

.items-table {
  display: flex;
  flex-direction: column;
}

.cart-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--border-subtle);
}

.cart-row:last-child {
  border-bottom: none;
}

.item-meta {
  flex: 1;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--surface-dark);
  margin-bottom: 0.25rem;
}

.unit-price {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.item-stepper-wrap {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stepper-box {
  display: flex;
  align-items: center;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 9999px;
  padding: 0.2rem 0.35rem;
}

.stepper-btn {
  background: transparent;
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.15s ease;
}

.stepper-btn:hover:not(:disabled) {
  background: #FFFFFF;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-value {
  padding: 0 0.65rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--surface-dark);
}

.item-subtotal-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 90px;
  justify-content: flex-end;
}

.line-price {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.remove-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.35rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.remove-icon-btn:hover {
  background: #FDF2F0;
  color: var(--accent-danger);
}

/* Step 2 Shipping Form */
.step-shipping-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.shipping-card {
  padding: 1.75rem;
}

.card-section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-seal {
  width: 42px;
  height: 42px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.section-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.shipping-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-row-3 {
  grid-template-columns: 1.2fr 1fr 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--surface-dark);
}

.form-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 0.6rem;
  border: 1px solid var(--border-subtle);
  background: var(--surface-subtle);
  font-size: 0.875rem;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: var(--accent-terracotta);
  background: #FFFFFF;
}

/* Idempotency Card */
.idempotency-card {
  padding: 1.5rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.idempotency-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lock-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-success);
  box-shadow: 0 0 6px var(--accent-success);
}

.lock-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.badge-lock {
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  background: var(--surface-card);
  border-radius: 4px;
  color: var(--accent-terracotta);
  border: 1px solid var(--border-subtle);
}

.idempotency-explanation {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.token-display-box {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border: 1px solid var(--border-subtle);
}

.token-header {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.token-value {
  font-size: 0.8rem;
  color: var(--accent-terracotta);
  word-break: break-all;
}

.back-link-box {
  margin-top: 1.25rem;
}

.continue-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.continue-link:hover {
  color: var(--accent-terracotta);
}

/* Right Summary Column */
.summary-card {
  padding: 1.75rem;
  position: sticky;
  top: 6rem;
}

.summary-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--surface-dark);
  margin-bottom: 1.25rem;
}

.summary-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 1.25rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.free-shipping {
  color: var(--accent-success);
  font-weight: 600;
}

.summary-total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.75rem;
}

.total-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.total-amount {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.checkout-btn {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.security-guarantees {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-subtle);
}

.guarantee-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .cart-layout-grid {
    grid-template-columns: 1fr;
  }
  .form-row,
  .form-row-3 {
    grid-template-columns: 1fr;
  }
}
</style>
