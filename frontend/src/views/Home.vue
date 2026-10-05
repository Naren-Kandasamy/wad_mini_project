<template>
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
  try {
    const res = await fetch('/api/cart/me/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (res.ok) {
      alert('Added to cart')
    } else {
      alert('Failed to add to cart')
    }
  } catch (err) {
    console.error('Failed to add to cart', err)
  }
}

onMounted(() => {
  loadProducts()
})
</script>
