<template>
  <header class="global-navbar">
    <div class="container-wide nav-container">
      <!-- Left: Brand Identity -->
      <div class="brand-section">
        <router-link to="/" class="brand-link">
          <div class="brand-seal wax-seal">
            <SvgIcon name="zap" size="20" color="var(--surface-dark)" />
          </div>
          <div class="brand-text">
            <span class="brand-title font-display">Aura &amp; Earth</span>
            <span class="brand-subtitle">Precision Electronics</span>
          </div>
        </router-link>

        <!-- Navigation Links -->
        <nav class="nav-links">
          <router-link to="/" class="nav-item">Catalog</router-link>
          <router-link to="/orders" class="nav-item">
            <SvgIcon name="package" size="16" />
            <span>Orders</span>
          </router-link>
          <router-link v-if="authStore.isAdmin" to="/admin" class="nav-item admin-nav-item">
            <SvgIcon name="shield" size="16" />
            <span>Admin</span>
          </router-link>
        </nav>
      </div>

      <!-- Right: Unified Auth & Cart Actions -->
      <div class="action-section">
        <!-- Quick Command Palette Trigger -->
        <button
          type="button"
          class="cmd-k-trigger-btn"
          @click="openCommandPalette"
          title="Search catalog (Ctrl+K)"
        >
          <SvgIcon name="search" size="14" color="var(--text-muted)" />
          <span class="cmd-k-text">Search...</span>
          <kbd class="cmd-k-kbd font-mono">⌘K</kbd>
        </button>

        <!-- Single Unified Authentication State -->
        <div class="auth-box">
          <template v-if="authStore.isAuthenticated">
            <div class="user-pill embossed-badge">
              <SvgIcon name="user" size="14" color="var(--text-secondary)" />
              <span class="user-id">{{ authStore.currentUserId }}</span>
              <span v-if="authStore.isAdmin" class="role-tag admin-tag">ADMIN</span>
              <span v-else-if="authStore.isDeveloper" class="role-tag dev-tag">DEV</span>
              <span v-else class="role-tag user-tag">MEMBER</span>
            </div>
            <button
              type="button"
              class="logout-btn"
              @click="authStore.logout"
              title="Sign out of session"
            >
              Sign out
            </button>
          </template>

          <!-- Single Unified Sign In Button -->
          <template v-else>
            <button
              type="button"
              class="sign-in-btn btn-clay-sand"
              @click="authStore.openAuthModal"
            >
              <SvgIcon name="user" size="15" />
              <span>Sign In</span>
            </button>
          </template>
        </div>

        <!-- Tactile Cart Drawer Trigger -->
        <button
          type="button"
          class="cart-trigger-btn btn-terracotta"
          @click="cartStore.toggleDrawer"
          aria-label="Open shopping basket"
        >
          <SvgIcon name="bag" size="18" color="#FFFFFF" />
          <span class="cart-label">Basket</span>
          <span v-if="cartStore.itemCount > 0" class="cart-badge">
            {{ cartStore.itemCount }}
          </span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import SvgIcon from './SvgIcon.vue'

const authStore = useAuthStore()
const cartStore = useCartStore()

function openCommandPalette() {
  window.dispatchEvent(new CustomEvent('open-command-palette'))
}
</script>

<style scoped>
.global-navbar {
  background-color: var(--surface-card);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(23, 35, 29, 0.03);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 2.25rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  text-decoration: none;
  color: var(--text-primary);
}

.brand-seal {
  background: var(--canvas-alt);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--surface-dark);
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  font-weight: 600;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0.4rem 0.65rem;
  border-radius: 0.65rem;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--surface-dark);
}

.nav-item.router-link-active {
  color: var(--surface-dark);
  background: linear-gradient(180deg, #EFE8DC 0%, #F6F1E7 100%);
  box-shadow: inset 1px 1.5px 3px rgba(25, 49, 38, 0.08), 0 1px 1px rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(25, 49, 38, 0.06);
}

.admin-nav-item {
  color: var(--accent-clay);
}

.action-section {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.auth-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.sign-in-btn {
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
}

.user-pill {
  background: var(--canvas-alt);
  padding: 0.35rem 0.75rem;
  gap: 0.45rem;
  color: var(--text-primary);
}

.user-id {
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 600;
}

.role-tag {
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.admin-tag {
  background: var(--surface-dark);
  color: var(--text-inverse);
}

.dev-tag {
  background: #2C221E;
  color: var(--accent-amber);
}

.user-tag {
  background: rgba(25, 49, 38, 0.1);
  color: var(--surface-dark);
}

.logout-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
  text-decoration: underline;
  transition: color 0.15s ease;
}

.logout-btn:hover {
  color: var(--accent-danger);
}

.cart-trigger-btn {
  padding: 0.65rem 1.15rem;
  position: relative;
}

.cart-label {
  font-weight: 600;
  font-size: 0.875rem;
}

.cart-badge {
  background: var(--surface-dark);
  color: var(--text-inverse);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  margin-left: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cmd-k-trigger-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 9999px;
  padding: 0.4rem 0.75rem 0.4rem 0.85rem;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.825rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.cmd-k-trigger-btn:hover {
  background: #FFFFFF;
  border-color: var(--accent-terracotta);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cmd-k-kbd {
  font-size: 0.65rem;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  .cmd-k-trigger-btn {
    display: none;
  }
  .cart-label {
    display: none;
  }
}
</style>
