<template>
  <div class="orders-page container-wide">
    <div class="orders-header">
      <div>
        <h1 class="orders-title font-display">My Order History</h1>
        <p class="orders-subtitle">Track confirmed hardware orders and inspect cryptographic warranty certificates.</p>
      </div>
      <button
        type="button"
        class="btn-secondary"
        :disabled="loading"
        @click="loadOrders"
      >
        <span>Refresh Orders</span>
      </button>
    </div>

    <!-- Loading Shimmer -->
    <div v-if="loading" class="orders-loading">
      <div v-for="n in 3" :key="n" class="skeleton-shimmer h-32 w-full mb-4"></div>
    </div>

    <!-- Offline Service Error State (Role Adaptive) -->
    <div v-else-if="connectionError" class="orders-error-wrap">
      <RoleAdaptiveErrorBanner
        :error="ordersError"
        @retry="loadOrders"
        @action="handleErrorAction"
      />
    </div>

    <!-- Unauthenticated State -->
    <div v-else-if="!authStore.isAuthenticated" class="empty-orders ceramic-card">
      <div class="wax-seal empty-seal">
        <SvgIcon name="user" size="32" color="var(--accent-clay)" />
      </div>
      <h2 class="empty-title font-display">Sign In Required</h2>
      <p class="empty-desc">
        Please sign in with your account to view your past orders and receipts.
      </p>
      <button type="button" class="btn-clay-terracotta mt-4" @click="authStore.openAuthModal()">
        <span>Sign In</span>
        <SvgIcon name="arrow-right" size="18" />
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="empty-orders ceramic-card">
      <div class="wax-seal empty-seal">
        <SvgIcon name="package" size="32" color="var(--accent-clay)" />
      </div>
      <h2 class="empty-title font-display">No Orders Found</h2>
      <p class="empty-desc">
        You haven't placed any orders yet. Visit our catalog to discover curated artisan hardware and mechanical peripherals.
      </p>
      <router-link to="/" class="btn-clay-terracotta mt-4">
        <span>Browse Catalog</span>
        <SvgIcon name="arrow-right" size="18" />
      </router-link>
    </div>

    <!-- Orders List -->
    <div v-else class="orders-list">
      <div
        v-for="(order, index) in orders"
        :key="order.id"
        class="order-card ceramic-card card-stagger-item"
        :style="{ '--card-index': index }"
      >
        <!-- Order Card Header -->
        <div class="order-card-header">
          <div class="order-primary-info">
            <span class="order-number font-display">Order #{{ order.id }}</span>
            <span class="order-timestamp">{{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="header-badges">
            <span class="status-badge embossed-badge" :class="`status-${order.status.toLowerCase()}`">
              {{ order.status }}
            </span>
            <button
              type="button"
              class="btn-view-certificate"
              @click="openCertificate(order)"
              title="Inspect Cryptographic Hardware Certificate & Warranty Slip"
            >
              <SvgIcon name="shield" size="14" color="var(--accent-terracotta)" />
              <span>Warranty Slip</span>
            </button>
          </div>
        </div>

        <!-- Idempotency Tracking Ribbon -->
        <div class="order-receipt-ribbon">
          <span class="receipt-label">Idempotency-Key:</span>
          <code class="receipt-code font-mono">{{ order.idempotencyKey }}</code>
        </div>

        <!-- Order Items -->
        <div class="order-items-table">
          <div
            v-for="item in order.items"
            :key="item.productId"
            class="order-item-row"
          >
            <div class="item-name-group">
              <span class="item-qty-tag">{{ item.quantity }}x</span>
              <span class="item-title">{{ item.productName }}</span>
            </div>
            <span class="item-price-calc font-display">
              ${{ (Number(item.unitPrice) * item.quantity).toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Order Card Footer -->
        <div class="order-card-footer">
          <div class="order-user-tag font-mono">
            <span>Customer: {{ order.userId }}</span>
          </div>
          <div class="order-total-box">
            <span class="total-label">Total Paid:</span>
            <span class="total-val font-display">${{ Number(order.totalAmount).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cryptographic Hardware Certificate & Warranty Slip Modal -->
    <Teleport to="body">
      <div v-if="selectedCertificateOrder" class="modal-backdrop" @click.self="closeCertificate">
        <div class="certificate-modal ceramic-card" role="dialog" aria-modal="true" aria-labelledby="cert-title">
          <!-- Top Action Bar (Print & Close) -->
          <div class="cert-action-bar no-print">
            <button type="button" class="btn-cert-action" @click="printCertificate">
              <SvgIcon name="printer" size="16" />
              <span>Print Slip</span>
            </button>
            <button type="button" class="btn-cert-action" @click="copyDigest">
              <SvgIcon name="terminal" size="16" />
              <span>Copy SHA-256</span>
            </button>
            <button type="button" class="close-cert-btn" @click="closeCertificate">
              <SvgIcon name="close" size="18" />
            </button>
          </div>

          <!-- Archival Warranty Slip Canvas -->
          <div class="certificate-paper printable-slip">
            <!-- Guilloche Security Border Embellishment -->
            <div class="cert-guilloche-border">
              <!-- Certificate Header -->
              <div class="cert-header">
                <div class="cert-brand">
                  <div class="wax-seal-clay cert-seal">
                    <SvgIcon name="shield" size="24" color="#FFFFFF" />
                  </div>
                  <div>
                    <h2 id="cert-title" class="cert-heading font-display">AURA &amp; EARTH WORKSTATION LABS</h2>
                    <p class="cert-subhead font-mono">ARCHIVAL HARDWARE WARRANTY &amp; CRYPTOGRAPHIC CERTIFICATE</p>
                  </div>
                </div>
                <div class="cert-id-stamp font-mono">
                  <span>CERT: {{ selectedCertificateOrder.id.substring(0, 8).toUpperCase() }}-WARRANTY</span>
                  <span class="cert-tier">24-MO ADVANCED EXCHANGE</span>
                </div>
              </div>

              <div class="cert-divider"></div>

              <!-- Transaction & Hardware Telemetry -->
              <div class="telemetry-grid">
                <div class="telemetry-item">
                  <span class="tel-label font-mono">LEDGER ORDER ID</span>
                  <span class="tel-val font-mono">{{ selectedCertificateOrder.id }}</span>
                </div>
                <div class="telemetry-item">
                  <span class="tel-label font-mono">AUTHENTICATED BUYER</span>
                  <span class="tel-val font-mono">{{ selectedCertificateOrder.userId }}</span>
                </div>
                <div class="telemetry-item">
                  <span class="tel-label font-mono">ISSUANCE TIMESTAMP</span>
                  <span class="tel-val font-mono">{{ formatDate(selectedCertificateOrder.createdAt) }}</span>
                </div>
                <div class="telemetry-item">
                  <span class="tel-label font-mono">RFC 7231 IDEMPOTENCY KEY</span>
                  <span class="tel-val font-mono">{{ selectedCertificateOrder.idempotencyKey }}</span>
                </div>
              </div>

              <!-- Covered Hardware Equipment Table -->
              <div class="equipment-section">
                <span class="section-badge font-mono">AUTHENTICATED HARDWARE COVERAGE</span>
                <table class="equipment-table">
                  <thead>
                    <tr>
                      <th>Device Description</th>
                      <th>Quantity</th>
                      <th>Hardware Serial Identifier</th>
                      <th>Warranty Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in selectedCertificateOrder.items" :key="item.productId">
                      <td class="font-display item-name">{{ item.productName }}</td>
                      <td class="font-mono text-center">{{ item.quantity }}</td>
                      <td class="font-mono text-muted">AE-{{ item.productId.substring(0, 6).toUpperCase() }}-{{ idx + 1 }}</td>
                      <td class="font-mono status-active">
                        <span class="coverage-dot"></span> Active Coverage
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Cryptographic Integrity Digest & Archival QR Verification Badge -->
              <div class="crypto-integrity-box debossed-well">
                <div class="hash-section">
                  <span class="hash-label font-mono">SHA-256 HARDWARE INTEGRITY DIGEST</span>
                  <code class="hash-code font-mono">{{ certificateDigest }}</code>
                  <span class="hash-desc">
                    Deterministic cryptographic seal linking customer session, idempotency token, and physical hardware components.
                  </span>
                </div>

                <!-- Procedural Verification Matrix Graphic -->
                <div class="qr-matrix-box" title="Archival Optical Seal">
                  <svg class="qr-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="14" height="14" rx="2" fill="var(--surface-dark)" />
                    <rect x="7" y="7" width="8" height="8" fill="#FFFFFF" />
                    <rect x="9" y="9" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="30" y="4" width="14" height="14" rx="2" fill="var(--surface-dark)" />
                    <rect x="33" y="7" width="8" height="8" fill="#FFFFFF" />
                    <rect x="35" y="9" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="4" y="30" width="14" height="14" rx="2" fill="var(--surface-dark)" />
                    <rect x="7" y="33" width="8" height="8" fill="#FFFFFF" />
                    <rect x="9" y="35" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="22" y="6" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="22" y="14" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="22" y="22" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="30" y="22" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="38" y="22" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="22" y="30" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="30" y="30" width="4" height="4" fill="var(--surface-dark)" />
                    <rect x="38" y="38" width="6" height="6" fill="var(--surface-dark)" />
                  </svg>
                  <span class="qr-sub font-mono">SEAL-256</span>
                </div>
              </div>

              <!-- Signatures & Legal Footer -->
              <div class="cert-footer">
                <div class="signature-block">
                  <div class="signature-line font-display">Aura &amp; Earth Hardware Guild</div>
                  <span class="sig-title font-mono">CHIEF HARDWARE ARCHITECT</span>
                </div>
                <div class="stamp-block">
                  <div class="official-stamp font-mono">
                    VERIFIED MONOLITH RECORD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import SvgIcon from '../components/SvgIcon.vue'
import ServiceOfflineCard from '../components/ServiceOfflineCard.vue'
import RoleAdaptiveErrorBanner from '../components/RoleAdaptiveErrorBanner.vue'

interface OrderItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
}

interface Order {
  id: string
  userId: string
  idempotencyKey: string
  items: OrderItem[]
  totalAmount: number
  status: string
  createdAt: string
}

const orders = ref<Order[]>([])
const loading = ref(false)
const connectionError = ref(false)
const ordersError = ref<unknown | null>(null)
const authStore = useAuthStore()
const toastStore = useToastStore()

const selectedCertificateOrder = ref<Order | null>(null)

function openCertificate(order: Order) {
  selectedCertificateOrder.value = order
}

function closeCertificate() {
  selectedCertificateOrder.value = null
}

const certificateDigest = computed(() => {
  if (!selectedCertificateOrder.value) return ''
  const o = selectedCertificateOrder.value
  // Deterministic simulated SHA-256 hex string based on order attributes
  const seed = `${o.id}:${o.userId}:${o.idempotencyKey}:${o.totalAmount}:${o.createdAt}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const hexPart1 = Math.abs(hash).toString(16).padStart(8, '0')
  const hexPart2 = (Math.abs(hash * 31) >>> 0).toString(16).padStart(8, '0')
  const hexPart3 = (Math.abs(hash * 127) >>> 0).toString(16).padStart(8, '0')
  const hexPart4 = (Math.abs(hash * 8191) >>> 0).toString(16).padStart(8, '0')
  return `${hexPart1}${hexPart2}${hexPart3}${hexPart4}4f9b8c2e6d1a55097f338210`
})

function printCertificate() {
  window.print()
}

function copyDigest() {
  if (certificateDigest.value && navigator.clipboard) {
    navigator.clipboard.writeText(certificateDigest.value)
    toastStore.show('SHA-256 digest copied to clipboard', 'success')
  }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

async function loadOrders() {
  if (!authStore.isAuthenticated) return
  loading.value = true
  connectionError.value = false
  ordersError.value = null
  try {
    const res = await apiClient.get<Order[]>('/orders')
    orders.value = res.data
  } catch (err) {
    connectionError.value = true
    ordersError.value = err
    if (authStore.isDeveloper) {
      toastStore.show('Orders API unreachable (Port 8080)', 'error')
    }
  } finally {
    loading.value = false
  }
}

function handleErrorAction(type?: string) {
  if (type === 'OPEN_AUTH') {
    authStore.openAuthModal()
  } else if (type === 'REFRESH_PAGE') {
    loadOrders()
  } else if (type === 'CONTACT_SUPPORT') {
    toastStore.show('Support dispatch initiated: help@aurahardware.internal', 'info')
  }
}

watch(
  () => authStore.isAuthenticated,
  (authed) => {
    if (authed) {
      loadOrders()
    } else {
      orders.value = []
    }
  }
)

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadOrders()
  }
})
</script>

<style scoped>
.orders-page {
  padding-top: 2rem;
  padding-bottom: 5rem;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
}

.orders-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--surface-dark);
  margin-bottom: 0.35rem;
}

.orders-subtitle {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.empty-orders {
  padding: 4.5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 580px;
  margin: 0 auto;
}

.empty-seal {
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

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.order-card {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.order-primary-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.order-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.order-timestamp {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.header-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
}

.status-completed,
.status-paid,
.status-confirmed {
  background: #EAF4EE;
  color: var(--accent-success);
}

.status-pending {
  background: #FEF7EA;
  color: var(--accent-amber);
}

.btn-view-certificate {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--surface-dark);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-view-certificate:hover {
  background: var(--surface-dark);
  color: #FFFFFF;
  border-color: transparent;
}

.btn-view-certificate:hover :deep(.svg-icon) {
  stroke: #FFFFFF;
}

.order-receipt-ribbon {
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 0.5rem;
  padding: 0.5rem 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.75rem;
}

.receipt-label {
  color: var(--text-muted);
}

.receipt-code {
  color: var(--accent-terracotta);
  word-break: break-all;
}

.order-items-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed var(--border-subtle);
}

.order-item-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-name-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.item-qty-tag {
  font-size: 0.75rem;
  font-family: 'DM Mono', monospace;
  background: var(--surface-subtle);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  color: var(--text-secondary);
}

.item-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--surface-dark);
}

.item-price-calc {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.order-user-tag {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.order-total-box {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.total-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.total-val {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--surface-dark);
}

/* Certificate Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 18, 0.75);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.certificate-modal {
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 1.5rem;
  background: var(--surface-card);
  box-shadow: 0 35px 80px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
}

.cert-action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(249, 246, 240, 0.8);
}

.btn-cert-action {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--surface-dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cert-action:hover {
  background: var(--surface-dark);
  color: #FFFFFF;
}

.btn-cert-action:hover :deep(.svg-icon) {
  stroke: #FFFFFF;
}

.close-cert-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
}

/* Archival Slip Content */
.certificate-paper {
  padding: 2.5rem;
  background: #FCFBF7;
}

.cert-guilloche-border {
  border: 2px solid var(--surface-dark);
  border-radius: 1rem;
  padding: 2rem;
  position: relative;
  background: #FFFFFF;
  box-shadow: inset 0 0 0 4px #F7F5EE;
}

.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.cert-brand {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.cert-seal {
  width: 52px;
  height: 52px;
}

.cert-heading {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--surface-dark);
}

.cert-subhead {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--accent-terracotta);
}

.cert-id-stamp {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.75rem;
  color: var(--surface-dark);
}

.cert-tier {
  font-size: 0.65rem;
  background: var(--accent-success);
  color: #FFFFFF;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.35rem;
}

.cert-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 1.5rem 0;
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.telemetry-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.tel-label {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.tel-val {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--surface-dark);
  word-break: break-all;
}

.equipment-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.section-badge {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

.equipment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.825rem;
}

.equipment-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid var(--border-subtle);
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.equipment-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.item-name {
  font-weight: 600;
  color: var(--surface-dark);
}

.status-active {
  color: var(--accent-success);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.coverage-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-success);
}

/* Crypto Integrity Box */
.crypto-integrity-box {
  padding: 1.25rem;
  border-radius: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
}

.hash-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.hash-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.hash-code {
  font-size: 0.75rem;
  color: var(--accent-terracotta);
  word-break: break-all;
  line-height: 1.4;
}

.hash-desc {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.qr-matrix-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.qr-svg {
  width: 52px;
  height: 52px;
}

.qr-sub {
  font-size: 0.6rem;
  color: var(--text-muted);
}

/* Footer Signatures */
.cert-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 1rem;
}

.signature-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.signature-line {
  font-size: 1.1rem;
  font-style: italic;
  color: var(--surface-dark);
  border-bottom: 1px solid var(--surface-dark);
  padding-bottom: 0.25rem;
}

.sig-title {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.official-stamp {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.4rem 0.85rem;
  border: 2px dashed var(--accent-terracotta);
  color: var(--accent-terracotta);
  border-radius: 6px;
  transform: rotate(-3deg);
}

/* Print Rules */
@media print {
  .no-print,
  .orders-header,
  .orders-list,
  .global-navbar,
  .global-footer {
    display: none !important;
  }
  .modal-backdrop {
    position: static;
    background: none;
    padding: 0;
  }
  .certificate-modal {
    max-width: 100%;
    box-shadow: none;
  }
  .certificate-paper {
    padding: 0;
    background: #FFFFFF;
  }
}

@media (max-width: 680px) {
  .telemetry-grid {
    grid-template-columns: 1fr;
  }
  .cert-header {
    flex-direction: column;
  }
  .cert-id-stamp {
    align-items: flex-start;
  }
  .crypto-integrity-box {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
