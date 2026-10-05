import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# ----------------- FRONTEND SETUP -----------------

frontend_package_json = """{
  "name": "shopping-cart-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.21",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "vite": "^5.2.8"
  }
}
"""
write_file('frontend/package.json', frontend_package_json)

frontend_vite_config = """import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 80,
    host: true,
    proxy: {
      '/api': {
        target: 'http://api-gateway:8080',
        changeOrigin: true
      }
    }
  }
})
"""
write_file('frontend/vite.config.js', frontend_vite_config)

frontend_index_html = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shopping Cart</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
"""
write_file('frontend/index.html', frontend_index_html)

frontend_main = """import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

createApp(App).use(router).mount('#app')
"""
write_file('frontend/src/main.js', frontend_main)

frontend_style = """body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f4f4f4;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
nav {
  background: #333;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
nav a {
  color: white;
  text-decoration: none;
  margin-right: 15px;
}
.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 4px;
}
.btn:hover {
  background: #0056b3;
}
.card {
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
"""
write_file('frontend/src/style.css', frontend_style)

frontend_app = """<template>
  <div id="app">
    <nav>
      <div>
        <router-link to="/">Home</router-link>
        <router-link to="/cart">Cart</router-link>
        <router-link to="/orders">Orders</router-link>
      </div>
      <div>
        <span v-if="user">Hello, {{ user.name }}! <button class="btn" @click="logout">Logout</button></span>
        <button v-else class="btn" @click="login">Login with Google</button>
      </div>
    </nav>
    <div class="container">
      <router-view :user="user"></router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'

const user = ref(null)

const checkAuth = async () => {
  try {
    const res = await fetch('/api/me')
    const data = await res.json()
    if (data.authenticated) {
      user.value = data
      // Sync user with backend
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, name: data.name })
      })
    } else {
      user.value = null
    }
  } catch (e) {
    console.error('Not authenticated', e)
  }
}

const login = () => {
  window.location.href = '/oauth2/authorization/google'
}

const logout = async () => {
  await fetch('/api/logout', { method: 'POST' })
  user.value = null
  window.location.href = '/'
}

onMounted(() => {
  checkAuth()
})

provide('user', user)
</script>
"""
write_file('frontend/src/App.vue', frontend_app)

frontend_router = """import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Cart from './views/Cart.vue'
import Orders from './views/Orders.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/cart', component: Cart },
  { path: '/orders', component: Orders }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
"""
write_file('frontend/src/router.js', frontend_router)

frontend_home = """<template>
  <div>
    <h2>Products</h2>
    <div class="grid">
      <div v-for="product in products" :key="product.id" class="card">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description }}</p>
        <p><strong>${{ product.price }}</strong></p>
        <button class="btn" @click="addToCart(product)">Add to Cart</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'

const products = ref([])
const user = inject('user')

const loadProducts = async () => {
  const res = await fetch('/api/products')
  products.value = await res.json()
}

const addToCart = async (product) => {
  if (!user.value) {
    alert("Please login to add to cart")
    return
  }
  const item = {
    productId: product.id,
    productName: product.name,
    quantity: 1,
    price: product.price
  }
  await fetch(`/api/cart/${user.value.email}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  })
  alert('Added to cart')
}

onMounted(() => {
  loadProducts()
})
</script>
"""
write_file('frontend/src/views/Home.vue', frontend_home)

frontend_cart = """<template>
  <div>
    <h2>Shopping Cart</h2>
    <div v-if="!user">Please login to view your cart.</div>
    <div v-else>
      <div v-if="cartItems.length === 0">Your cart is empty.</div>
      <div v-else>
        <div class="card" v-for="item in cartItems" :key="item.productId">
          <h4>{{ item.productName }}</h4>
          <p>Quantity: {{ item.quantity }} | Price: ${{ item.price }} | Subtotal: ${{ item.quantity * item.price }}</p>
          <button class="btn" @click="removeFromCart(item.productId)">Remove</button>
        </div>
        <h3>Total: ${{ cartTotal }}</h3>
        <button class="btn" @click="placeOrder" style="background: green;">Place Order</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed, watch } from 'vue'

const cartItems = ref([])
const user = inject('user')

const cartTotal = computed(() => {
  return cartItems.value.reduce((total, item) => total + (item.quantity * item.price), 0)
})

const loadCart = async () => {
  if (!user.value) return
  const res = await fetch(`/api/cart/${user.value.email}`)
  if (res.ok) {
    const data = await res.json()
    cartItems.value = data.items || []
  }
}

const removeFromCart = async (productId) => {
  await fetch(`/api/cart/${user.value.email}/remove/${productId}`, { method: 'DELETE' })
  await loadCart()
}

const placeOrder = async () => {
  const order = {
    userEmail: user.value.email,
    items: cartItems.value,
    totalAmount: cartTotal.value
  }
  await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  })
  await fetch(`/api/cart/${user.value.email}/clear`, { method: 'DELETE' })
  alert('Order placed successfully!')
  loadCart()
}

onMounted(() => {
  if(user.value) loadCart()
})
watch(user, (newVal) => {
  if(newVal) loadCart()
})
</script>
"""
write_file('frontend/src/views/Cart.vue', frontend_cart)

frontend_orders = """<template>
  <div>
    <h2>My Orders</h2>
    <div v-if="!user">Please login to view your orders.</div>
    <div v-else>
      <div v-if="orders.length === 0">No orders found.</div>
      <div class="card" v-for="order in orders" :key="order.id">
        <h3>Order ID: {{ order.id }}</h3>
        <p>Status: {{ order.status }} | Date: {{ new Date(order.orderDate).toLocaleString() }}</p>
        <p><strong>Total: ${{ order.totalAmount }}</strong></p>
        <ul>
          <li v-for="item in order.items" :key="item.productId">
            {{ item.productName }} (x{{ item.quantity }}) - ${{ item.price }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, watch } from 'vue'

const orders = ref([])
const user = inject('user')

const loadOrders = async () => {
  if (!user.value) return
  const res = await fetch(`/api/orders/${user.value.email}`)
  if (res.ok) {
    orders.value = await res.json()
  }
}

onMounted(() => {
  if(user.value) loadOrders()
})
watch(user, (newVal) => {
  if(newVal) loadOrders()
})
</script>
"""
write_file('frontend/src/views/Orders.vue', frontend_orders)

print("Frontend setup complete.")
