<template>
  <div class="app-layout">
    <!-- Ambient Procedural Paper Grain & Hardware Circuit PCB Traces Overlay -->
    <div class="paper-grain" aria-hidden="true"></div>
    <HardwareCircuitBackground />

    <Navbar />

    <main class="main-content">
      <router-view v-slot="{ Component, route }">
        <transition name="page-glide" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <!-- Global Cart Drawer, Unified Auth Modal, DevTools HUD, Command Palette, Sticky Basket & Toasts -->
    <CartDrawer />
    <AuthModal />
    <DevToolsDrawer />
    <CommandPalette />
    <StickyBasketBar />
    <ToastContainer />

    <!-- Tactile Editorial Footer -->
    <footer class="global-footer">
      <div class="container-wide footer-content">
        <div class="footer-brand">
          <div class="flex items-center gap-2 mb-2">
            <div class="embossed-seal" style="width: 32px; height: 32px;">
              <SvgIcon name="zap" size="16" color="var(--surface-dark)" />
            </div>
            <span class="font-display footer-logo">Aura & Earth</span>
          </div>
          <p class="footer-desc">
            An artisan microservices architecture blending Spring Cloud Gateway & Vue 3.
          </p>
        </div>

        <div class="footer-links">
          <div class="footer-col">
            <h5 class="col-title">Navigation</h5>
            <router-link to="/">Catalog</router-link>
            <router-link to="/orders">My Orders</router-link>
            <router-link to="/cart">Checkout</router-link>
          </div>
          <div class="footer-col">
            <h5 class="col-title">Architecture</h5>
            <span>Idempotency-Key (RFC 7231)</span>
            <span>In-Memory JWT Token Store</span>
            <span>OWASP Defended Microservices</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container-wide text-center">
          <p class="copyright">
            © 2026 Aura & Earth Microservices. All rights reserved. Built with pride for WAD Mini Project.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import Navbar from './components/Navbar.vue'
import CartDrawer from './components/CartDrawer.vue'
import AuthModal from './components/AuthModal.vue'
import DevToolsDrawer from './components/DevToolsDrawer.vue'
import CommandPalette from './components/CommandPalette.vue'
import StickyBasketBar from './components/StickyBasketBar.vue'
import ToastContainer from './components/ToastContainer.vue'
import SvgIcon from './components/SvgIcon.vue'
import HardwareCircuitBackground from './components/HardwareCircuitBackground.vue'

const authStore = useAuthStore()
onMounted(() => {
  authStore.checkAuth()
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.global-footer {
  background-color: var(--canvas-alt);
  border-top: 1px solid var(--border-subtle);
  margin-top: 4rem;
  padding-top: 3.5rem;
}

.footer-content {
  display: grid;
  grid-template-columns: 1.2fr 1.8fr;
  gap: 3rem;
  padding-bottom: 2.5rem;
}

.footer-logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.footer-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  max-width: 320px;
  line-height: 1.5;
}

.footer-links {
  display: flex;
  gap: 4rem;
  justify-content: flex-end;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.col-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.35rem;
}

.footer-col a,
.footer-col span {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.footer-col a:hover {
  color: var(--accent-terracotta);
}

.footer-bottom {
  border-top: 1px solid var(--border-subtle);
  padding: 1.25rem 0;
  background-color: rgba(25, 49, 38, 0.02);
}

.copyright {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .footer-links {
    justify-content: flex-start;
    gap: 2.5rem;
  }
}
</style>
