# Microservices UI Component & Design System Bundle

This bundle contains the complete, self-contained **Vue 3 + Pinia + Vite** frontend implementing the **Artisanal Tactile Ceramic & Precision Hardware Design System** from the shopping cart application.

It is structured so you can either **drop the entire directory** into your microservices project as the frontend, or **copy individual components, views, and styles** into an existing frontend.

---

## 📦 Directory Structure

```text
microservices-ui-bundle/
├── README.md               # This integration guide
├── index.html              # HTML entrypoint with Fraunces & Plus Jakarta Sans typography
├── package.json            # Dependencies (Vue 3, Pinia, Axios, Vue Router, Vitest)
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration with API reverse proxy
├── vitest.config.ts        # Vitest unit test configuration
└── src/
    ├── App.vue             # Global layout (Paper grain overlay, Navbar, Drawers, Footer)
    ├── main.ts             # Application bootstrapper (Pinia + Vue Router mount)
    ├── style.css           # Complete tactile ceramic material system & design tokens
    │
    ├── api/
    │   └── client.ts       # Axios instance with Bearer Token & X-Request-Id interceptors
    │
    ├── components/
    │   ├── AuthModal.vue          # Unified modal with Keycloak OIDC & Local Dev fallbacks
    │   ├── CartDrawer.vue         # Slide-out basket drawer with live quantity incrementors
    │   ├── DevToolsDrawer.vue     # Diagnostic drawer with microservice telemetry status
    │   ├── Navbar.vue             # Global tactile header with brand seal & unified auth
    │   ├── ServiceOfflineCard.vue # Graceful reconnection card for disconnected services
    │   ├── SkeletonCard.vue       # Shimmer placeholder card during async loading
    │   ├── SvgIcon.vue            # Vector icon library (keyboard, mouse, monitor, cpu, zap, etc.)
    │   └── ToastContainer.vue     # Toast notification system with stack animations
    │
    ├── router/
    │   └── index.ts        # Declarative routing (/, /cart, /orders, /admin)
    │
    ├── stores/
    │   ├── auth.ts         # In-memory JWT token store (RFC XSS-defended heap storage)
    │   ├── cart.ts         # Cart management with cryptographic client Idempotency-Key
    │   └── toast.ts        # Reactive toast notification queue
    │
    ├── views/
    │   ├── CatalogView.vue # Precision hardware catalog, layered hero, filter pills
    │   ├── CartView.vue    # Full checkout review, order totals, and success confirmation
    │   ├── OrdersView.vue  # Customer order history with status timeline
    │   └── AdminView.vue   # Admin operations & real-time telemetry metrics
    │
    └── __tests__/          # Automated test suite (Auth store, Cart store, XSS safety)
```

---

## 🚀 How to Use in the Microservices Project

### Option A: Complete Drop-in Replacement (Recommended)
1. Replace your microservices `frontend/` directory with the contents of this bundle:
   ```bash
   cp -r microservices-ui-bundle/* /path/to/microservices-repo/frontend/
   ```
2. Install dependencies:
   ```bash
   cd /path/to/microservices-repo/frontend
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

---

### Option B: Incremental Component Copy
If your microservices repository already has an active frontend scaffolding, you can copy specific modules:

1. **Design System & Styling**:
   Copy `src/style.css` to your project and import it in your `main.ts` or root layout:
   ```ts
   import './style.css'
   ```
2. **Typography in `index.html`**:
   Add the Google Fonts link tags to your `index.html`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
   ```
3. **Components & Views**:
   Copy all files from `src/components/` and `src/views/` into your project's corresponding folders.
4. **Stores & API**:
   Copy `src/stores/` and `src/api/client.ts`. Ensure Pinia is installed:
   ```bash
   npm install pinia axios vue-router
   ```

---

## 🔌 Microservices API Routing Configuration

In this monolithic build, all requests route to a single origin `/api` (port 8080).

### Scenario 1: Using an API Gateway (Spring Cloud Gateway / Envoy / Nginx)
If your microservices architecture uses an API Gateway listening on e.g. port `8080` or `8000`:
* **No code changes are needed!** The existing `vite.config.ts` proxy will forward `/api/*` requests directly to the Gateway:
  ```ts
  // vite.config.ts
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Set to your API Gateway port
        changeOrigin: true
      }
    }
  }
  ```

---

### Scenario 2: Connecting Directly to Individual Microservices (No Gateway)
If each microservice runs on its own independent port without an API gateway, configure `vite.config.ts` to route each sub-path to the respective microservice port:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 1. Product Catalog Service (e.g., Port 8081)
      '/api/products': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      // 2. Shopping Cart Service (e.g., Port 8082)
      '/api/cart': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      // 3. Order Management Service (e.g., Port 8083)
      '/api/orders': {
        target: 'http://localhost:8083',
        changeOrigin: true
      },
      // 4. Checkout Service (e.g., Port 8084)
      '/api/checkout': {
        target: 'http://localhost:8084',
        changeOrigin: true
      },
      // 5. Admin / Telemetry Service (e.g., Port 8085)
      '/api/admin': {
        target: 'http://localhost:8085',
        changeOrigin: true
      }
    }
  }
})
```

---

## 🔐 Authentication & Keycloak Integration
* **Keycloak Realm**: Configured to connect to `http://localhost:8180/realms/shopping-cart`.
* **Direct Access Grants / PKCE**: The `useAuthStore` in `src/stores/auth.ts` connects via OAuth 2.0 password grant or OIDC authorization code flow.
* **In-Memory Security**: Tokens are strictly held in JavaScript runtime memory (`accessToken = ref<string | null>(null)`) and never stored in `localStorage` or `sessionStorage` (preventing XSS exfiltration).
* **Pre-seeded Testing Credentials**:
  * **Customer**: `user1` / `password123` (Role: `USER`)
  * **Admin**: `admin1` / `admin123` (Role: `ADMIN`, `USER`)
  * **Developer**: `dev1` / `dev123` (Role: `DEVELOPER`, `USER`)
* If Keycloak is offline or unreachable, the store provides a graceful local fallback so team members can continue testing without blocked workflows.

---

## 🎨 Key Design System Tokens (`src/style.css`)
* **Physical Ceramic Cards**: `.ceramic-card` with perimeter micro-bevels and ambient clay cast shadows.
* **Volumetric Convex Buttons**: `.btn-clay-terracotta`, `.btn-clay-sand`.
* **Recessed Ceramic Dishes**: `.ceramic-dish` with inset occlusion shadows.
* **Stamped Wax Seals**: `.wax-seal`, `.wax-seal-dark`, `.wax-seal-clay`.
* **Paper Grain Texture**: `.paper-grain` ambient SVG `feTurbulence` overlay.
* **Palette**:
  * Forest Deep Charcoal: `#193126` / `#11231A`
  * Baked Terracotta: `#BD6346` / `#784232`
  * Ceramic Glaze Linen: `#FAF6EE` / `#FFFFFF`
  * Antique Amber: `#E5A84B`
