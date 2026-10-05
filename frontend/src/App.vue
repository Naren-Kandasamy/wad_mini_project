<template>
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
