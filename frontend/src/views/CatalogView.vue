<template>
  <div class="catalog-page">
    <!-- Hero Banner (Layered Tactile Paper-Cut & Hardware Precision - Inspired by Ref 10) -->
    <section class="hero-section">
      <div class="container-wide">
        <div class="hero-card paper-plane-forest">
          <!-- Procedural Geometric Circuit Trace Filigree -->
          <svg class="circuit-filigree" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 40 H160 L210 90 V220 L240 250 H290" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="4 4" />
            <path d="M80 20 V120 L130 170 H250" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            <path d="M120 70 H200 L240 110 V270" stroke="rgba(255,255,255,0.1)" stroke-width="1.2" />
            <circle cx="160" cy="40" r="3" fill="var(--accent-amber)" />
            <circle cx="210" cy="90" r="3.5" fill="var(--accent-terracotta)" />
            <circle cx="130" cy="170" r="3.5" fill="var(--accent-sage)" />
          </svg>

          <div class="hero-content">
            <div class="hero-eyebrow">
              <span class="embossed-badge hero-badge">
                <SvgIcon name="zap" size="14" color="var(--accent-amber)" />
                Curated Hardware Release &bull; High-Performance Workstation
              </span>
            </div>
            <h1 class="hero-title font-display">
              <span class="hero-title-italic">Precision</span> Computing &amp; Electronic Hardware
            </h1>
            <p class="hero-subtitle">
              High-performance computing appliances, mechanical peripherals, and workstation displays engineered with tactile materials and uncompromising performance.
            </p>
            <div class="hero-actions">
              <a href="#product-grid" class="btn-clay-terracotta">
                <span>Explore Catalog</span>
                <SvgIcon name="arrow-right" size="18" />
              </a>
              <button
                type="button"
                class="btn-clay-sand"
                @click="cartStore.openDrawer"
              >
                <span>View Basket ({{ cartStore.itemCount }})</span>
              </button>
            </div>
          </div>

          <!-- Layered Terracotta Paper Card (Diagonal Depth from Ref 10) -->
          <div class="hero-highlights paper-plane-terracotta">
            <div class="highlight-item">
              <div class="wax-seal-dark highlight-seal">
                <SvgIcon name="cpu" size="20" color="var(--accent-sage)" />
              </div>
              <div class="highlight-text">
                <span class="highlight-title">Silicon Architecture</span>
                <span class="highlight-desc">High-efficiency micro-electronics</span>
              </div>
            </div>
            <div class="highlight-item">
              <div class="wax-seal-clay highlight-seal">
                <SvgIcon name="keyboard" size="20" color="#FFFFFF" />
              </div>
              <div class="highlight-text">
                <span class="highlight-title">Tactile Mechanical Craft</span>
                <span class="highlight-desc">Anodized frames &amp; linear switches</span>
              </div>
            </div>
            <div class="highlight-item">
              <div class="wax-seal-dark highlight-seal">
                <SvgIcon name="shield" size="20" color="var(--accent-terracotta)" />
              </div>
              <div class="highlight-text">
                <span class="highlight-title">Idempotent Checkout</span>
                <span class="highlight-desc">RFC 7231 defended transactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4-Pillar Sculpted Tactile Feature Strip (Ref 10 Mid-Section) -->
    <section class="container-wide feature-strip-wrap">
      <div class="feature-strip ceramic-card">
        <div class="feature-col">
          <div class="wax-seal-dark">
            <SvgIcon name="cpu" size="20" color="var(--accent-sage)" />
          </div>
          <div class="feature-info">
            <h4 class="feature-heading font-display">Precision Engineering</h4>
            <p class="feature-sub">High-efficiency micro-architecture</p>
          </div>
        </div>
        <div class="feature-divider"></div>
        <div class="feature-col">
          <div class="wax-seal-clay">
            <SvgIcon name="keyboard" size="20" color="#FFFFFF" />
          </div>
          <div class="feature-info">
            <h4 class="feature-heading font-display">Tactile Hardware</h4>
            <p class="feature-sub">Anodized alloy &amp; custom switches</p>
          </div>
        </div>
        <div class="feature-divider"></div>
        <div class="feature-col">
          <div class="wax-seal-dark">
            <SvgIcon name="shield" size="20" color="var(--accent-terracotta)" />
          </div>
          <div class="feature-info">
            <h4 class="feature-heading font-display">RFC 7231 Defended</h4>
            <p class="feature-sub">Cryptographic duplicate guard</p>
          </div>
        </div>
        <div class="feature-divider"></div>
        <div class="feature-col">
          <div class="wax-seal-clay">
            <SvgIcon name="zap" size="20" color="#FFFFFF" />
          </div>
          <div class="feature-info">
            <h4 class="feature-heading font-display">In-Memory Vault</h4>
            <p class="feature-sub">Strict ephemeral heap security</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Filter & Search Controls (Jakob's Law Ref 6) -->
    <section id="product-grid" class="catalog-main container-wide">
      <div class="filter-bar">
        <!-- Category Pills in Debossed Container -->
        <div class="category-pills debossed-well" role="tablist">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="category-pill"
            :class="{ active: selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Search Input -->
        <div class="search-box">
          <SvgIcon name="search" size="18" color="var(--text-muted)" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search hardware, keyboards, displays..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="clear-search-btn"
            @click="searchQuery = ''"
          >
            <SvgIcon name="close" size="14" />
          </button>
        </div>
      </div>

      <!-- Active Filter Summary -->
      <div class="catalog-header-info">
        <div>
          <h2 class="section-title font-display">Hardware Catalog</h2>
          <p class="section-subtitle">Showing {{ filteredProducts.length }} items</p>
        </div>
        <button
          type="button"
          class="refresh-btn btn-secondary"
          :disabled="loading"
          @click="loadProducts"
        >
          <span>Refresh</span>
        </button>
      </div>

      <!-- Loading State: Skeleton Shimmer Grid -->
      <div v-if="loading" class="products-grid">
        <SkeletonCard v-for="n in 6" :key="n" />
      </div>

      <!-- Service Offline State (Decoupled from Empty State) -->
      <ServiceOfflineCard
        v-else-if="connectionError"
        title="Catalog Temporarily Offline"
        message="Our inventory service is currently synchronizing with the store database. Please check back shortly or retry your connection."
        endpoint="/api/products"
        :onRetry="loadProducts"
      />

      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" class="empty-catalog tactile-card">
        <div class="embossed-seal empty-seal">
          <SvgIcon name="search" size="28" color="var(--accent-clay)" />
        </div>
        <h3 class="font-display empty-title">No products found</h3>
        <p class="empty-desc">
          We couldn't find any products matching "{{ searchQuery }}". Try clearing your search or selecting another category.
        </p>
        <button
          type="button"
          class="btn-secondary mt-3"
          @click="resetFilters"
        >
          Reset All Filters
        </button>
      </div>

      <!-- Products Grid -->
      <div v-else class="products-grid">
        <article
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-card ceramic-card"
          :style="cardTiltStyles[product.id] || {}"
          @mousemove="handleCardMouseMove($event, product.id)"
          @mouseleave="handleCardMouseLeave(product.id)"
        >
          <!-- Specular Sheen Layer on Hover -->
          <div class="card-sheen" :style="sheenStyles[product.id] || {}"></div>

          <!-- Product Media Image Card with Recessed Ceramic Dish & Vector Blueprint -->
          <div class="card-media ceramic-dish">
            <HardwareIllustration
              :name="product.name"
              :finish="selectedFinishes[product.id] || 'terracotta'"
            />
            <span class="stock-badge embossed-badge">
              <span class="stock-dot"></span> In Stock
            </span>

            <!-- Quick Specs Blueprint Trigger Button -->
            <button
              type="button"
              class="quick-specs-btn"
              title="Inspect Architectural Specs"
              @click.stop="openSpecsDrawer(product)"
            >
              <SvgIcon name="sliders" size="13" color="var(--surface-dark)" />
              <span>Specs</span>
            </button>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <div class="card-category-row">
              <span class="product-sku">{{ product.sku }}</span>
              <div class="rating-box">
                <SvgIcon name="star" size="13" color="var(--accent-amber)" />
                <span class="rating-val">4.9</span>
              </div>
            </div>

            <h3 class="product-title font-display">{{ product.name }}</h3>
            <p class="product-description">{{ product.description }}</p>

            <!-- Physical Finish Material Swatches -->
            <div class="swatches-selector-row">
              <span class="swatches-label">FINISH:</span>
              <div class="swatches-group">
                <button
                  v-for="f in availableFinishes"
                  :key="f.id"
                  type="button"
                  class="swatch-btn"
                  :class="{ active: (selectedFinishes[product.id] || 'terracotta') === f.id }"
                  :style="{ backgroundColor: f.color }"
                  :title="`${f.name} anodized finish`"
                  @click.stop="selectFinish(product.id, f.id)"
                />
              </div>
              <span class="swatch-name-display">{{ getFinishName(selectedFinishes[product.id] || 'terracotta') }}</span>
            </div>

            <!-- Audition Mechanical Switch Button (Keyboards only) -->
            <div v-if="isKeyboardProduct(product.name)" class="audition-action-row">
              <button
                type="button"
                class="btn-audition-switch"
                @click.stop="openSoundTester"
              >
                <SvgIcon name="volume-2" size="14" color="var(--accent-terracotta)" />
                <span>Audition Switch Acoustics</span>
              </button>
            </div>
          </div>

          <!-- Card Footer (Price & Action) -->
          <div class="card-footer">
            <div class="price-box">
              <span class="price-currency">$</span>
              <span class="price-amount font-display">{{ Number(product.price).toFixed(2) }}</span>
            </div>

            <button
              type="button"
              class="btn-clay-terracotta add-btn"
              :class="{ 'btn-added': recentlyAdded === product.id }"
              :disabled="addingId === product.id"
              @click="addToCart(product)"
            >
              <template v-if="recentlyAdded === product.id">
                <SvgIcon name="check" size="16" color="#FFFFFF" />
                <span>Added!</span>
              </template>
              <template v-else-if="addingId === product.id">
                <span>Adding...</span>
              </template>
              <template v-else>
                <SvgIcon name="bag" size="16" color="#FFFFFF" />
                <span>Add to Basket</span>
              </template>
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- Modals & Drawers -->
    <SwitchSoundTester ref="soundTesterRef" />
    <HardwareSpecsDrawer
      v-model="isSpecsDrawerOpen"
      :product="activeSpecsProduct"
      :finish="selectedFinishes[activeSpecsProduct?.id || ''] || 'terracotta'"
      @addToCart="addToCart"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../api/client'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import SvgIcon from '../components/SvgIcon.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import ServiceOfflineCard from '../components/ServiceOfflineCard.vue'
import HardwareIllustration from '../components/HardwareIllustration.vue'
import SwitchSoundTester from '../components/SwitchSoundTester.vue'
import HardwareSpecsDrawer from '../components/HardwareSpecsDrawer.vue'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  active?: boolean
}

const products = ref<Product[]>([])
const loading = ref(false)
const connectionError = ref(false)
const addingId = ref<string | null>(null)
const recentlyAdded = ref<string | null>(null)

// Hardware Finish Material Swatches
const selectedFinishes = ref<Record<string, string>>({})
const availableFinishes = [
  { id: 'terracotta', name: 'Terracotta', color: '#BD6346' },
  { id: 'slate', name: 'Graphite Slate', color: '#2C333D' },
  { id: 'linen', name: 'Ceramic Linen', color: '#D6C8B4' },
  { id: 'sage', name: 'Nordic Sage', color: '#557060' }
]

function selectFinish(productId: string, finishId: string) {
  selectedFinishes.value[productId] = finishId
}

function getFinishName(finishId: string) {
  const found = availableFinishes.find((f) => f.id === finishId)
  return found ? found.name : 'Terracotta'
}

function isKeyboardProduct(name: string) {
  return (name || '').toLowerCase().includes('keyboard')
}

// 3D Perspective Card Tilt & Specular Sheen Physics
const cardTiltStyles = ref<Record<string, Record<string, string>>>({})
const sheenStyles = ref<Record<string, Record<string, string>>>({})

function handleCardMouseMove(e: MouseEvent, productId: string) {
  const card = e.currentTarget as HTMLElement
  if (!card) return
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const rotateX = -((y - centerY) / centerY) * 6.5
  const rotateY = ((x - centerX) / centerX) * 6.5
  const sheenX = (x / rect.width) * 100
  const sheenY = (y / rect.height) * 100

  cardTiltStyles.value[productId] = {
    transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`,
    transition: 'transform 0.08s ease-out'
  }
  sheenStyles.value[productId] = {
    background: `radial-gradient(circle at ${sheenX.toFixed(1)}% ${sheenY.toFixed(1)}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 65%)`,
    opacity: '1'
  }
}

function handleCardMouseLeave(productId: string) {
  cardTiltStyles.value[productId] = {
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  }
  sheenStyles.value[productId] = {
    opacity: '0',
    transition: 'opacity 0.4s ease'
  }
}

// Switch Sound Tester modal ref
const soundTesterRef = ref<InstanceType<typeof SwitchSoundTester> | null>(null)
function openSoundTester() {
  soundTesterRef.value?.open()
}

// Hardware Specs Drawer state
const isSpecsDrawerOpen = ref(false)
const activeSpecsProduct = ref<Product | null>(null)
function openSpecsDrawer(product: Product) {
  activeSpecsProduct.value = product
  isSpecsDrawerOpen.value = true
}

const searchQuery = ref('')
const selectedCategory = ref('All')
const categories = ['All', 'Keyboards', 'Mice', 'Displays', 'Audio', 'Peripherals']

const cartStore = useCartStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    if (!matchesSearch) return false

    if (selectedCategory.value === 'All') return true
    if (selectedCategory.value === 'Keyboards') {
      return p.name.toLowerCase().includes('keyboard') || p.sku.toLowerCase().includes('kb')
    }
    if (selectedCategory.value === 'Mice') {
      return p.name.toLowerCase().includes('mouse') || p.sku.toLowerCase().includes('ms')
    }
    if (selectedCategory.value === 'Displays') {
      return p.name.toLowerCase().includes('monitor') || p.name.toLowerCase().includes('display') || p.sku.toLowerCase().includes('mon')
    }
    if (selectedCategory.value === 'Audio') {
      return p.name.toLowerCase().includes('headphone') || p.name.toLowerCase().includes('audio') || p.sku.toLowerCase().includes('aud')
    }
    if (selectedCategory.value === 'Peripherals') {
      return p.name.toLowerCase().includes('mouse') || p.name.toLowerCase().includes('keyboard') || p.sku.toLowerCase().includes('per')
    }
    return true
  })
})

async function loadProducts() {
  loading.value = true
  connectionError.value = false
  try {
    const res = await apiClient.get<Product[]>('/products')
    products.value = res.data
  } catch (err) {
    connectionError.value = true
    // Only developers receive diagnostic failure notifications; customers see the reassuring offline state
    if (authStore.isDeveloper) {
      toastStore.show('Catalog API unreachable (Port 8080)', 'error')
    }
  } finally {
    loading.value = false
  }
}

async function addToCart(product: Product) {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal()
    return
  }
  addingId.value = product.id
  try {
    await cartStore.addItem(product.id, 1)
    recentlyAdded.value = product.id
    toastStore.show(`Added "${product.name}" to basket`, 'success')

    setTimeout(() => {
      if (recentlyAdded.value === product.id) {
        recentlyAdded.value = null
      }
    }, 1800)
  } catch (err) {
    toastStore.show('Could not add item to basket', 'error')
  } finally {
    addingId.value = null
  }
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'All'
}

function getGradientForProduct(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('keyboard')) {
    return { background: 'linear-gradient(135deg, #252830 0%, #3F4756 100%)' }
  }
  if (lower.includes('mouse')) {
    return { background: 'linear-gradient(135deg, #1C2E28 0%, #2E4B41 100%)' }
  }
  if (lower.includes('monitor') || lower.includes('display')) {
    return { background: 'linear-gradient(135deg, #1A2636 0%, #293E58 100%)' }
  }
  if (lower.includes('headphone') || lower.includes('audio')) {
    return { background: 'linear-gradient(135deg, #302621 0%, #523D33 100%)' }
  }
  return { background: 'linear-gradient(135deg, #342621 0%, #583F36 100%)' }
}

function getIconForProduct(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('keyboard')) return 'keyboard'
  if (lower.includes('mouse')) return 'mouse'
  if (lower.includes('monitor') || lower.includes('display')) return 'monitor'
  if (lower.includes('headphone') || lower.includes('audio')) return 'headphones'
  if (lower.includes('cpu') || lower.includes('processor')) return 'cpu'
  return 'zap'
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.catalog-page {
  padding-bottom: 4rem;
}

/* Hero Section (Paper-Cut Architecture Inspired by Ref 10) */
.hero-section {
  padding: 2rem 0 2rem;
}

.hero-card {
  padding: 3.5rem 3rem;
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 3rem;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.circuit-filigree,
.botanical-filigree {
  position: absolute;
  right: -50px;
  top: -40px;
  width: 400px;
  height: 400px;
  pointer-events: none;
}

.paper-plane-forest {
  background: linear-gradient(135deg, #1C362A 0%, #11231A 100%);
  border-radius: 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 50px -12px rgba(10, 25, 18, 0.45),
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.paper-plane-terracotta {
  background: linear-gradient(145deg, #784232 0%, #562B20 100%);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    -10px 16px 36px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transform: rotate(0.75deg);
}

.hero-eyebrow {
  margin-bottom: 1.25rem;
}

.hero-badge {
  background: rgba(255, 255, 255, 0.1);
  color: var(--accent-amber);
  padding: 0.4rem 0.95rem;
  gap: 0.45rem;
  border-color: rgba(255, 255, 255, 0.16);
  font-size: 0.8rem;
}

.hero-title {
  font-size: 2.9rem;
  line-height: 1.15;
  color: #FFFFFF;
  margin-bottom: 1.25rem;
  letter-spacing: -0.01em;
}

.hero-title-italic {
  font-style: italic;
  font-weight: 300;
  color: #F6EDE2;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--text-inverse-muted);
  line-height: 1.6;
  max-width: 520px;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

/* Layered Paper Badge Column (Ref 10) */
.hero-highlights {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2rem;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 1.15rem;
}

.highlight-seal {
  flex-shrink: 0;
}

.highlight-text {
  display: flex;
  flex-direction: column;
}

.highlight-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #FFFFFF;
}

.highlight-desc {
  font-size: 0.8rem;
  color: rgba(249, 246, 240, 0.72);
}

/* 4-Pillar Sculpted Feature Strip (Ref 10 Mid-Section) */
.feature-strip-wrap {
  margin-top: 1.5rem;
  margin-bottom: 3.5rem;
  position: relative;
  z-index: 5;
}

.feature-strip {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
  padding: 1.5rem 2rem;
  align-items: center;
}

.feature-col {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 0.5rem;
}

.feature-divider {
  width: 1px;
  height: 42px;
  background: rgba(25, 49, 38, 0.08);
}

.feature-heading {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--surface-dark);
  margin-bottom: 0.15rem;
}

.feature-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Filters & Search */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2.25rem;
  flex-wrap: wrap;
}

.category-pills.debossed-well {
  display: flex;
  gap: 0.35rem;
  padding: 0.35rem;
}

.category-pill {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 1.15rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-pill:hover {
  color: var(--text-primary);
}

.category-pill.active {
  background: var(--surface-dark);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(25, 49, 38, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2.2rem 0.6rem 2.5rem;
  border-radius: 9999px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  font-size: 0.875rem;
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: var(--accent-terracotta);
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.catalog-header-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--surface-dark);
}

.section-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Product Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 1.75rem;
}

.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
  transition: box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
}

.product-card:hover {
  box-shadow:
    0 22px 35px -10px rgba(18, 30, 24, 0.22),
    0 0 0 1px rgba(189, 99, 70, 0.3);
}

.card-sheen {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-media {
  position: relative;
  height: 200px;
  overflow: hidden;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-subtle);
}

.quick-specs-btn {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-subtle);
  border-radius: 9999px;
  padding: 0.25rem 0.65rem;
  font-size: 0.725rem;
  font-weight: 600;
  color: var(--surface-dark);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  z-index: 4;
}

.quick-specs-btn:hover {
  background: var(--surface-dark);
  color: #FFFFFF;
  border-color: transparent;
  transform: translateY(-1px);
}

.quick-specs-btn:hover :deep(.svg-icon) {
  stroke: #FFFFFF;
}

.stock-badge {
  position: absolute;
  top: 0.85rem;
  left: 0.85rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  padding: 0.2rem 0.6rem;
  gap: 0.35rem;
  color: var(--text-secondary);
  z-index: 4;
}

.stock-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-success);
}

/* Swatches */
.swatches-selector-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}

.swatches-label {
  font-size: 0.675rem;
  font-family: 'DM Mono', monospace;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.swatches-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.swatch-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.swatch-btn:hover {
  transform: scale(1.2);
}

.swatch-btn.active {
  outline: 2px solid var(--accent-terracotta);
  outline-offset: 2px;
  transform: scale(1.15);
}

.swatch-name-display {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Audition Button */
.audition-action-row {
  margin-bottom: 0.75rem;
}

.btn-audition-switch {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px dashed var(--accent-terracotta);
  background: rgba(189, 99, 70, 0.06);
  color: var(--accent-terracotta);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-audition-switch:hover {
  background: rgba(189, 99, 70, 0.14);
  transform: translateY(-1px);
}

.card-body {
  padding: 1.25rem 1.25rem 0.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.product-sku {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.rating-box {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.product-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.product-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 1rem;
}

.card-footer {
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(249, 246, 240, 0.4);
}

.price-box {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.price-currency {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.price-amount {
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.add-btn {
  padding: 0.65rem 1rem;
  font-size: 0.825rem;
}

.btn-added {
  background-color: var(--accent-success) !important;
}

/* Empty Catalog */
.empty-catalog {
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-seal {
  width: 64px;
  height: 64px;
  margin-bottom: 1.25rem;
}

.empty-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--surface-dark);
  margin-bottom: 0.5rem;
}

.empty-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  max-width: 360px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .hero-card {
    grid-template-columns: 1fr;
    padding: 2.5rem 1.75rem;
  }
  .hero-title {
    font-size: 2.2rem;
  }
  .feature-strip {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  .feature-divider {
    display: none;
  }
}

@media (max-width: 640px) {
  .feature-strip {
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding: 1.25rem;
  }
}
</style>
