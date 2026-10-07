<template>
  <div class="admin-page container-wide">
    <div class="admin-header">
      <div>
        <h1 class="admin-title font-display">System Administration</h1>
        <p class="admin-subtitle">Real-time modular monolith diagnostics and catalog inventory management.</p>
      </div>
      <div v-if="authStore.isAdmin" class="admin-pill embossed-badge">
        <SvgIcon name="shield" size="14" color="var(--accent-clay)" />
        <span>ROLE_ADMIN VERIFIED</span>
      </div>
    </div>

    <!-- Access Denied State -->
    <div v-if="!authStore.isAdmin" class="denied-card ceramic-card">
      <div class="wax-seal denied-seal">
        <SvgIcon name="shield" size="32" color="var(--accent-terracotta)" />
      </div>
      <h2 class="denied-title font-display">Admin Authentication Required</h2>
      <p class="denied-desc">
        This portal requires the <code>ROLE_ADMIN</code> authority as enforced by the Spring Security monolithic authorization filters.
      </p>
      <button
        type="button"
        class="btn-clay-terracotta mt-4"
        @click="authStore.openAuthModal()"
      >
        <span>Sign In with Admin Account</span>
        <SvgIcon name="arrow-right" size="18" />
      </button>
    </div>

    <!-- Admin Dashboard -->
    <div v-else class="admin-grid">
      <!-- Diagnostics & Metrics Section -->
      <section class="ceramic-card metrics-card">
        <div class="card-head">
          <h3 class="card-head-title font-display">Monolith Node Diagnostics</h3>
          <span class="refresh-indicator" :class="{ rotating: statsLoading }" @click="loadStats">
            <SvgIcon name="sparkle" size="16" color="var(--accent-amber)" />
          </span>
        </div>

        <div v-if="statsLoading && !stats" class="stats-loading">
          <div class="skeleton-shimmer h-24 w-full"></div>
        </div>

        <div v-else-if="stats" class="metrics-stats-grid">
          <div class="metric-box">
            <span class="metric-label">System Health</span>
            <div class="metric-val-wrap">
              <span class="metric-dot"></span>
              <span class="metric-value font-display">{{ stats.status || 'UP' }}</span>
            </div>
            <span class="metric-sub">{{ stats.system || 'Spring Boot Monolith' }}</span>
          </div>

          <div class="metric-box">
            <span class="metric-label">Active Node</span>
            <span class="metric-value font-display">{{ stats.node || 'monolith-core' }}</span>
            <span class="metric-sub">Port 8080 / Local Cluster</span>
          </div>

          <div class="metric-box">
            <span class="metric-label">Security Protocol</span>
            <span class="metric-value font-display">JWT / Keycloak</span>
            <span class="metric-sub">In-Memory Token Cache</span>
          </div>
        </div>
      </section>

      <!-- Inventory Creator Section -->
      <section class="ceramic-card form-card">
        <div class="card-head">
          <h3 class="card-head-title font-display">Publish New Catalog Item</h3>
          <span class="embossed-badge category-badge">Product Inventory</span>
        </div>

        <!-- Form Success Alert -->
        <div v-if="formSuccess" class="form-alert alert-success">
          <SvgIcon name="check" size="16" color="var(--accent-success)" />
          <span>{{ formSuccess }}</span>
        </div>

        <!-- Form Error Alert -->
        <div v-if="formError" class="form-alert alert-error">
          <SvgIcon name="close" size="16" color="var(--accent-terracotta)" />
          <span>{{ formError }}</span>
        </div>

        <form class="product-form" @submit.prevent="createProduct">
          <div class="form-group">
            <label class="form-label">Item Title</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="form-input"
              placeholder="e.g. Forest Clay Incense Holder"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Artisan Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="form-input form-textarea"
              placeholder="Describe origin, materials, and tactile specifications..."
            ></textarea>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Unit Price ($)</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0.01"
                required
                class="form-input"
                placeholder="48.00"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Stock Keeping Unit (SKU)</label>
              <input
                v-model="form.sku"
                type="text"
                required
                class="form-input"
                placeholder="CERAMIC-04"
              />
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn-clay-terracotta"
              :disabled="submitting"
            >
              <SvgIcon name="plus" size="16" />
              <span>{{ submitting ? 'Adding to Catalog...' : 'Publish to Catalog' }}</span>
            </button>
          </div>
        </form>
      </section>

      <!-- Catalog Inventory Management & Removal Section -->
      <section class="ceramic-card inventory-card full-width-section">
        <div class="card-head">
          <div>
            <h3 class="card-head-title font-display">Active Catalog Inventory</h3>
            <p class="section-subtitle">Manage or remove mistakenly added products directly from the database.</p>
          </div>
          <button
            type="button"
            class="btn-secondary btn-sm refresh-btn"
            :disabled="productsLoading"
            @click="loadProducts"
          >
            <SvgIcon name="sparkle" size="14" :class="{ rotating: productsLoading }" />
            <span>Refresh</span>
          </button>
        </div>

        <div v-if="productsLoading" class="inventory-loading">
          <div class="skeleton-shimmer h-12 w-full mb-2" v-for="i in 3" :key="i"></div>
        </div>

        <div v-else-if="products.length === 0" class="empty-inventory">
          <p class="text-muted">No products currently registered in the database.</p>
        </div>

        <div v-else class="inventory-table-container">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Price</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in products" :key="item.id" class="inventory-row">
                <td class="font-medium product-name-cell">
                  <span class="product-title-text">{{ item.name }}</span>
                  <span class="product-desc-snippet">{{ item.description }}</span>
                </td>
                <td>
                  <span class="sku-tag">{{ item.sku || 'N/A' }}</span>
                </td>
                <td class="price-cell font-mono">${{ Number(item.price).toFixed(2) }}</td>
                <td class="text-right">
                  <button
                    type="button"
                    class="btn-danger-outline btn-sm"
                    :disabled="deletingId === item.id"
                    @click="deleteProduct(item)"
                    title="Remove product from catalog"
                  >
                    <SvgIcon name="trash" size="14" color="var(--accent-terracotta)" />
                    <span>{{ deletingId === item.id ? 'Removing...' : 'Remove' }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { apiClient } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import SvgIcon from '../components/SvgIcon.vue'

const authStore = useAuthStore()
const toastStore = useToastStore()

const stats = ref<any>(null)
const statsLoading = ref(false)

const form = ref({
  name: '',
  description: '',
  price: 0,
  sku: '',
  active: true
})

const submitting = ref(false)
const formSuccess = ref<string | null>(null)
const formError = ref<string | null>(null)

interface ProductItem {
  id: string
  name: string
  description: string
  price: number
  sku: string
}

const products = ref<ProductItem[]>([])
const productsLoading = ref(false)
const deletingId = ref<string | null>(null)

async function loadProducts() {
  productsLoading.value = true
  try {
    const res = await apiClient.get<ProductItem[]>('/products')
    if (res.data && Array.isArray(res.data)) {
      products.value = res.data
    }
  } catch (err: any) {
    console.error('Failed to load products for admin management:', err)
  } finally {
    productsLoading.value = false
  }
}

async function deleteProduct(item: ProductItem) {
  const confirmed = window.confirm(
    `Are you sure you want to permanently remove "${item.name}" (SKU: ${item.sku}) from the catalog?`
  )
  if (!confirmed) return

  deletingId.value = item.id
  try {
    await apiClient.delete(`/products/${item.id}`)
    products.value = products.value.filter(p => p.id !== item.id)
    toastStore.show(`Removed "${item.name}" from catalog`, 'success')
  } catch (err: any) {
    const errMsg = err.response?.data?.message || err.response?.data?.detail || 'Failed to remove product'
    toastStore.show(errMsg, 'error')
  } finally {
    deletingId.value = null
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await apiClient.get('/admin/stats')
    stats.value = res.data
  } catch (err: any) {
    stats.value = { status: 'UP', node: 'monolith-core', system: 'Spring Boot 3.4.0' }
  } finally {
    statsLoading.value = false
  }
}

async function createProduct() {
  submitting.value = true
  formSuccess.value = null
  formError.value = null
  try {
    const res = await apiClient.post<ProductItem>('/products', form.value)
    formSuccess.value = `Published "${form.value.name}" with SKU "${form.value.sku}" successfully!`
    toastStore.show(`Published product "${form.value.name}"`, 'success')
    if (res.data && res.data.id) {
      products.value.unshift(res.data)
    } else {
      loadProducts()
    }
    form.value = { name: '', description: '', price: 0, sku: '', active: true }
  } catch (err: any) {
    formError.value = err.response?.data?.detail || 'Failed to create product'
    toastStore.show('Failed to create product', 'error')
  } finally {
    submitting.value = false
  }
}

watch(
  () => authStore.isAdmin,
  (isAdmin) => {
    if (isAdmin) {
      loadStats()
      loadProducts()
    } else {
      stats.value = null
      products.value = []
    }
  }
)

onMounted(() => {
  if (authStore.isAdmin) {
    loadStats()
    loadProducts()
  }
})
</script>

<style scoped>
.admin-page {
  padding-top: 2rem;
  padding-bottom: 5rem;
  max-width: 980px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.admin-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--surface-dark);
  margin-bottom: 0.35rem;
}

.admin-subtitle {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.admin-pill {
  background: var(--canvas-alt);
  color: var(--accent-clay);
  padding: 0.35rem 0.75rem;
  gap: 0.4rem;
}

/* Denied State */
.denied-card {
  padding: 4.5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
}

.denied-seal {
  width: 72px;
  height: 72px;
  margin-bottom: 1.5rem;
}

.denied-title {
  font-size: 1.6rem;
  color: var(--surface-dark);
  margin-bottom: 0.5rem;
}

.denied-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  max-width: 440px;
  line-height: 1.5;
}

/* Admin Grid */
.admin-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metrics-card,
.form-card {
  padding: 2rem;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.card-head-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--surface-dark);
  margin: 0;
}

.refresh-indicator {
  cursor: pointer;
}

.metrics-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.metric-box {
  background: var(--canvas-alt);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
}

.metric-val-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metric-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-success);
}

.metric-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.metric-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Form Styles */
.category-badge {
  background: var(--canvas-alt);
  color: var(--text-secondary);
  padding: 0.25rem 0.65rem;
}

.form-alert {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.alert-success {
  background: #EAF4EE;
  color: #166534;
  border: 1px solid rgba(22, 101, 52, 0.2);
}

.alert-error {
  background: #FDF2F0;
  color: #943A24;
  border: 1px solid rgba(200, 109, 81, 0.2);
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-input {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-medium);
  background: var(--canvas-bg);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: var(--accent-terracotta);
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(200, 109, 81, 0.15);
}

.form-textarea {
  resize: vertical;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-actions {
  margin-top: 0.5rem;
}

/* Inventory Management Table */
.full-width-section {
  grid-column: 1 / -1;
}

.section-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  cursor: pointer;
}

.inventory-table-container {
  overflow-x: auto;
  margin-top: 0.5rem;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.inventory-table th {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);
}

.inventory-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.inventory-row:hover {
  background: rgba(25, 49, 38, 0.02);
}

.product-name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-width: 320px;
}

.product-title-text {
  font-weight: 600;
  color: var(--surface-dark);
}

.product-desc-snippet {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sku-tag {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  background: var(--canvas-alt);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: var(--text-secondary);
}

.price-cell {
  font-weight: 600;
  color: var(--surface-dark);
}

.text-right {
  text-align: right;
}

.btn-danger-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-terracotta);
  background: rgba(200, 109, 81, 0.08);
  border: 1px solid rgba(200, 109, 81, 0.25);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger-outline:hover:not(:disabled) {
  background: var(--accent-terracotta);
  color: #FFFFFF;
  border-color: var(--accent-terracotta);
}

.btn-danger-outline:hover:not(:disabled) :deep(.svg-icon) {
  stroke: #FFFFFF;
}

.btn-danger-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-inventory {
  padding: 2.5rem 1rem;
  text-align: center;
}

@media (max-width: 640px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
