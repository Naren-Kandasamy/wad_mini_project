import { createRouter, createWebHistory } from 'vue-router'
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
