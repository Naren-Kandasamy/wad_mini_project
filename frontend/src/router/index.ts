import { createRouter, createWebHistory } from 'vue-router'
import CatalogView from '../views/CatalogView.vue'
import CartView from '../views/CartView.vue'
import OrdersView from '../views/OrdersView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  { path: '/', name: 'catalog', component: CatalogView, alias: '/catalog' },
  { path: '/cart', name: 'cart', component: CartView },
  { path: '/orders', name: 'orders', component: OrdersView },
  { path: '/admin', name: 'admin', component: AdminView }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
