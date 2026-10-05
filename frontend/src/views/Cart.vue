<template>
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
