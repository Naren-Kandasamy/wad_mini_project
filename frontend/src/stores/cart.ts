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
      const response = await apiClient.get<CartResponse>('/carts/me')
      cart.value = response.data
    } catch (err: any) {
      const axiosErr = err as AxiosError<ProblemDetail>
      error.value = axiosErr.response?.data?.detail || 'Failed to fetch cart'
    } finally {
      loading.value = false
    }
  }

  async function addItem(productId: string, quantity = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.post<CartResponse>('/carts/me/items', {
        productId,
        quantity
      })
      cart.value = response.data
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
      const response = await apiClient.put<CartResponse>(`/carts/me/items/${productId}`, {
        quantity
      })
      cart.value = response.data
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
      const response = await apiClient.delete<CartResponse>(`/carts/me/items/${productId}`)
      cart.value = response.data
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
      const response = await apiClient.post<CheckoutResponse>('/orders/checkout', null, {
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
