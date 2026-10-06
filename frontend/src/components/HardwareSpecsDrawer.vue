<template>
  <Teleport to="body">
    <div v-if="isOpen" class="drawer-backdrop" @click.self="close">
      <aside
        class="specs-drawer ceramic-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="specs-drawer-title"
      >
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="header-left">
            <div class="wax-seal-dark header-seal">
              <SvgIcon name="sliders" size="20" color="var(--accent-sage)" />
            </div>
            <div>
              <div class="drawer-sku font-mono">{{ product?.sku || 'HW-CORE' }} &bull; BLUEPRINT TELEMETRY</div>
              <h3 id="specs-drawer-title" class="drawer-title font-display">{{ product?.name || 'Hardware Specifications' }}</h3>
            </div>
          </div>
          <button type="button" class="close-btn" @click="close" aria-label="Close specifications sheet">
            <SvgIcon name="close" size="18" />
          </button>
        </div>

        <!-- Scrollable Spec Content -->
        <div class="drawer-body">
          <!-- Hardware Visual Preview Snippet -->
          <div class="blueprint-summary debossed-well">
            <div class="summary-info">
              <span class="summary-label">MATERIAL &amp; FINISH</span>
              <span class="summary-val font-display capitalize">{{ finishName }} Anodized Chassis</span>
            </div>
            <div class="summary-badge embossed-badge">
              <SvgIcon name="check" size="12" color="var(--accent-success)" />
              <span>MIL-SPEC 810H CERTIFIED</span>
            </div>
          </div>

          <!-- Section 1: Core Physical Architecture -->
          <div class="spec-section">
            <h4 class="spec-section-title font-display">
              <SvgIcon name="cpu" size="16" color="var(--accent-terracotta)" />
              <span>Core Architecture &amp; Silicon</span>
            </h4>
            <div class="spec-grid">
              <div class="spec-card">
                <span class="spec-key">Microcontroller</span>
                <span class="spec-val font-mono">ARM Cortex-M4 32-bit</span>
                <span class="spec-note">Dedicated hardware debounce engine</span>
              </div>
              <div class="spec-card">
                <span class="spec-key">Polling Frequency</span>
                <span class="spec-val font-mono">1,000 Hz / 0.125ms</span>
                <span class="spec-note">Zero perceived input jitter</span>
              </div>
              <div class="spec-card">
                <span class="spec-key">Connectivity Protocol</span>
                <span class="spec-val font-mono">Tri-Mode (RF / BT / USB-C)</span>
                <span class="spec-note">Custom 2.4GHz low-latency dongle</span>
              </div>
              <div class="spec-card">
                <span class="spec-key">Battery Subsystem</span>
                <span class="spec-val font-mono">4,000 mAh Li-Po</span>
                <span class="spec-note">Up to 240 hours continuous runtime</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Device-Specific Componentry -->
          <div class="spec-section">
            <h4 class="spec-section-title font-display">
              <SvgIcon name="keyboard" size="16" color="var(--accent-amber)" />
              <span>Componentry &amp; Materials</span>
            </h4>
            <div class="spec-grid">
              <!-- Keyboard specs -->
              <template v-if="deviceType === 'keyboard'">
                <div class="spec-card">
                  <span class="spec-key">Plate Construction</span>
                  <span class="spec-val">Gasket-Mounted Solid Brass</span>
                  <span class="spec-note">Poron foam acoustic isolation dampeners</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Switch Sockets</span>
                  <span class="spec-val">Kailh 5-Pin Hot-Swap</span>
                  <span class="spec-note">Rated for 10,000 insertion cycles</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Keycap Profile</span>
                  <span class="spec-val">Cherry Profile Double-Shot PBT</span>
                  <span class="spec-note">1.5mm wall thickness, non-shine texture</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Chassis Mass</span>
                  <span class="spec-val font-mono">1,240g (2.73 lbs)</span>
                  <span class="spec-note">Precision CNC milled 6063 Aluminum</span>
                </div>
              </template>

              <!-- Mouse specs -->
              <template v-else-if="deviceType === 'mouse'">
                <div class="spec-card">
                  <span class="spec-key">Optical Sensor</span>
                  <span class="spec-val font-mono">PixArt PAW3395</span>
                  <span class="spec-note">26,000 DPI • 650 IPS • 50G Acceleration</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Micro-Switches</span>
                  <span class="spec-val">TTC Gold Optical</span>
                  <span class="spec-note">80 Million actuations &bull; Zero double-click</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Skates</span>
                  <span class="spec-val">100% Virgin Grade PTFE</span>
                  <span class="spec-note">Curved edge chamfer for friction reduction</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Weight</span>
                  <span class="spec-val font-mono">64g Balanced</span>
                  <span class="spec-note">Honeycomb internal sub-skeleton</span>
                </div>
              </template>

              <!-- Monitor specs -->
              <template v-else-if="deviceType === 'monitor'">
                <div class="spec-card">
                  <span class="spec-key">Panel Technology</span>
                  <span class="spec-val">27" Fast-IPS Matte</span>
                  <span class="spec-note">2560 x 1440 QHD Resolution</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Refresh &amp; Response</span>
                  <span class="spec-val font-mono">144Hz &bull; 1ms GtG</span>
                  <span class="spec-note">AMD FreeSync Pro &amp; G-Sync Compatible</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Color Gamut</span>
                  <span class="spec-val font-mono">99% DCI-P3 &bull; HDR400</span>
                  <span class="spec-note">Factory calibrated Delta E &lt; 1.5</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Stand Base</span>
                  <span class="spec-val">Solid Ceramic &amp; Steel</span>
                  <span class="spec-note">Pivot, tilt, height-adjustable gas spring</span>
                </div>
              </template>

              <!-- Audio / General Specs -->
              <template v-else>
                <div class="spec-card">
                  <span class="spec-key">Acoustic Transducer</span>
                  <span class="spec-val">40mm Planar Magnetic</span>
                  <span class="spec-note">Ultra-thin neodymium diaphragm</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Frequency Range</span>
                  <span class="spec-val font-mono">10 Hz – 45,000 Hz</span>
                  <span class="spec-note">Hi-Res Audio Certified</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Impedance</span>
                  <span class="spec-val font-mono">32 Ohms</span>
                  <span class="spec-note">Optimized for mobile &amp; studio amplifiers</span>
                </div>
                <div class="spec-card">
                  <span class="spec-key">Earpad Cushions</span>
                  <span class="spec-val">Memory Foam &amp; Linen</span>
                  <span class="spec-note">Cooling breathable mesh wrap</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class="drawer-footer">
          <div class="footer-price-box">
            <span class="footer-price-label">Price</span>
            <div class="price-val">
              <span class="currency">$</span>
              <span class="amount font-display">{{ Number(product?.price || 0).toFixed(2) }}</span>
            </div>
          </div>
          <button
            type="button"
            class="btn-clay-terracotta footer-action-btn"
            @click="handleAddToCart"
          >
            <SvgIcon name="bag" size="18" color="#FFFFFF" />
            <span>Add to Basket</span>
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import SvgIcon from './SvgIcon.vue'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  active?: boolean
}

const props = defineProps<{
  modelValue?: boolean
  product?: Product | null
  finish?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'addToCart', product: Product): void
}>()

const isOpen = ref(!!props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = !!val
  }
)

const finishName = computed(() => {
  return props.finish || 'terracotta'
})

const deviceType = computed<'keyboard' | 'mouse' | 'monitor' | 'audio'>(() => {
  const lower = (props.product?.name || '').toLowerCase()
  if (lower.includes('keyboard')) return 'keyboard'
  if (lower.includes('mouse')) return 'mouse'
  if (lower.includes('monitor') || lower.includes('display')) return 'monitor'
  return 'audio'
})

function open() {
  isOpen.value = true
  emit('update:modelValue', true)
}

function close() {
  isOpen.value = false
  emit('update:modelValue', false)
}

function handleAddToCart() {
  if (props.product) {
    emit('addToCart', props.product)
    close()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (isOpen.value && e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  open,
  close
})
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 18, 0.65);
  backdrop-filter: blur(6px);
  z-index: 9998;
  display: flex;
  justify-content: flex-end;
}

.specs-drawer {
  width: 100%;
  max-width: 540px;
  height: 100%;
  background: var(--surface-card);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  box-shadow: -20px 0 50px rgba(0, 0, 0, 0.35);
  animation: slideDrawer 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDrawer {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(249, 246, 240, 0.6);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-seal {
  width: 44px;
  height: 44px;
}

.drawer-sku {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--accent-terracotta);
}

.drawer-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: var(--surface-subtle);
  color: var(--text-primary);
}

.drawer-body {
  padding: 1.5rem 1.75rem;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.blueprint-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.65rem;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.summary-val {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--surface-dark);
  text-transform: capitalize;
}

.summary-badge {
  font-size: 0.675rem;
  font-family: 'DM Mono', monospace;
  padding: 0.25rem 0.6rem;
  gap: 0.35rem;
  color: var(--accent-success);
}

/* Spec Section */
.spec-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.spec-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--surface-dark);
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.spec-card {
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.spec-key {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.spec-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.spec-note {
  font-size: 0.675rem;
  color: var(--text-muted);
  line-height: 1.35;
  margin-top: 0.15rem;
}

/* Drawer Footer */
.drawer-footer {
  padding: 1.25rem 1.75rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(249, 246, 240, 0.8);
}

.footer-price-box {
  display: flex;
  flex-direction: column;
}

.footer-price-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.price-val {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.currency {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.amount {
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.footer-action-btn {
  padding: 0.75rem 1.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 600px) {
  .specs-drawer {
    max-width: 100%;
  }
  .spec-grid {
    grid-template-columns: 1fr;
  }
}
</style>
