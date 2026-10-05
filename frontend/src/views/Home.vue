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
