<template>
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
  try {
    const res = await fetch('/api/orders/me')
    if (res.ok) {
      orders.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to load orders', err)
  }
}

onMounted(() => {
  if(user.value) loadOrders()
})
watch(user, (newVal) => {
  if(newVal) loadOrders()
})
</script>
