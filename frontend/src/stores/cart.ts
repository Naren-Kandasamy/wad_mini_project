import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient, ProblemDetail } from '../api/client'
import { AxiosError } from 'axios'

export interface CartItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface CartResponse {
  id: string
  userId: string
  version: number
  items: CartItem[]
  subtotal: number
  updatedAt: string
}

export interface CheckoutResponse {
  orderId: string
  userId: string
  idempotencyKey: string
  totalAmount: number
  status: string
  createdAt: string
  items: CartItem[]
}

function normalizeCartItem(item: any): CartItem {
  const price = Number(item.price ?? item.unitPrice ?? 0)
  const quantity = Number(item.quantity ?? 1)
  return {
    productId: item.productId || '',
    productName: item.productName || 'Hardware Item',
    unitPrice: price,
    quantity: quantity,
    lineTotal: Number(item.lineTotal ?? (price * quantity))
  }
}

function normalizeCartResponse(data: any): CartResponse {
  if (!data) {
    return { id: '', userId: '', version: 1, items: [], subtotal: 0, updatedAt: '' }
  }
  const rawItems = Array.isArray(data.items) ? data.items : []
  const items: CartItem[] = rawItems.map(normalizeCartItem)
  const subtotal = Number(data.subtotal ?? items.reduce((sum: number, i: CartItem) => sum + i.lineTotal, 0))
  return {
    id: data.id || '',
    userId: data.userEmail || data.userId || '',
    version: data.version || 1,
    items: items,
    subtotal: Math.round(subtotal * 100) / 100,
    updatedAt: data.updatedAt || new Date().toISOString()
  }
}

export const useCartStore = defineStore('cart', () => {
  const cart = ref<CartResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isDrawerOpen = ref(false)

  const items = computed(() => cart.value?.items || [])
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() => cart.value?.subtotal || 0)
  const version = computed(() => cart.value?.version || 1)

  function openDrawer() {
    isDrawerOpen.value = true
  }

  function closeDrawer() {
    isDrawerOpen.value = false
  }

  function toggleDrawer() {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  async function fetchCart() {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get<any>('/carts/me')
      cart.value = normalizeCartResponse(response.data)
    } catch (err: any) {
      const axiosErr = err as AxiosError<ProblemDetail>
      error.value = axiosErr.response?.data?.detail || 'Failed to fetch cart'
    } finally {
      loading.value = false
    }
  }

  async function addItem(productOrId: string | { id: string; name: string; price: number }, quantity = 1) {
    loading.value = true
    error.value = null
    try {
      let productId = ''
      let productName = 'Hardware Item'
      let price = 0

      if (typeof productOrId === 'object' && productOrId !== null) {
        productId = productOrId.id
        productName = productOrId.name
        price = productOrId.price
      } else {
        productId = productOrId
      }

      const response = await apiClient.post<any>('/carts/me/items', {
        productId,
        productName,
        price,
        quantity
      })
      cart.value = normalizeCartResponse(response.data)
    } catch (err: any) {
      const axiosErr = err as AxiosError<ProblemDetail>
      error.value = axiosErr.response?.data?.detail || 'Failed to add item to cart'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.put<any>(`/carts/me/items/${productId}`, {
        quantity
      })
      cart.value = normalizeCartResponse(response.data)
    } catch (err: any) {
      const axiosErr = err as AxiosError<ProblemDetail>
      error.value = axiosErr.response?.data?.detail || 'Failed to update item quantity'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeItem(productId: string) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.delete<any>(`/carts/me/items/${productId}`)
      cart.value = normalizeCartResponse(response.data)
    } catch (err: any) {
      const axiosErr = err as AxiosError<ProblemDetail>
      error.value = axiosErr.response?.data?.detail || 'Failed to remove item'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function clearCart() {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete('/carts/me')
      if (cart.value) {
        cart.value.items = []
        cart.value.subtotal = 0
      }
    } catch (err: any) {
      const axiosErr = err as AxiosError<ProblemDetail>
      error.value = axiosErr.response?.data?.detail || 'Failed to clear cart'
    } finally {
      loading.value = false
    }
  }

  /**
   * Checkout Action.
   *
   * <p>PERMANENT RESOLUTION OF TD-T1-05:
   * The client explicitly generates a cryptographically random UUID Idempotency-Key
   * header on every checkout request, eliminating server-side key generation dependencies.
   */
  async function checkout(): Promise<CheckoutResponse> {
    loading.value = true
    error.value = null

    // Client-side UUID generation for Idempotency-Key
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'idem-' + Math.random().toString(36).substring(2, 12)

    try {
      const orderItems = (cart.value?.items || []).map(i => ({
        productId: i.productId,
        productName: i.productName,
        price: i.unitPrice,
        quantity: i.quantity
      }))
      const response = await apiClient.post<any>('/orders/checkout', { items: orderItems }, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      })
      // Clear cart locally upon successful checkout confirmation
      if (cart.value) {
        cart.value.items = []
        cart.value.subtotal = 0
      }
      return response.data
    } catch (err: any) {
      const axiosErr = err as AxiosError<ProblemDetail>
      if (axiosErr.response?.status === 409) {
        error.value = 'Cart state conflict detected: The cart was modified concurrently. Please review your cart and retry.'
      } else {
        error.value = axiosErr.response?.data?.detail || 'Checkout failed'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    cart,
    loading,
    error,
    items,
    itemCount,
    subtotal,
    version,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    checkout
  }
})
