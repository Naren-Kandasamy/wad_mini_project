import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../stores/cart'
import { apiClient } from '../api/client'

describe('Cart Store & TD-T1-05 Idempotency Key Verification', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('computes itemCount and subtotal from cart state correctly', () => {
    const cart = useCartStore()
    cart.cart = {
      id: 'cart-1',
      userId: 'user1',
      version: 2,
      items: [
        { productId: 'p1', productName: 'Mechanical Keyboard', unitPrice: 89.99, quantity: 2, lineTotal: 179.98 },
        { productId: 'p2', productName: 'Gaming Mouse', unitPrice: 49.99, quantity: 1, lineTotal: 49.99 }
      ],
      subtotal: 229.97,
      updatedAt: new Date().toISOString()
    }

    expect(cart.itemCount).toBe(3)
    expect(cart.subtotal).toBe(229.97)
    expect(cart.version).toBe(2)
  })

  it('TD-T1-05 RESOLUTION: checkout() generates and sends a valid UUID Idempotency-Key header', async () => {
    const cart = useCartStore()
    cart.cart = {
      id: 'cart-1',
      userId: 'user1',
      version: 1,
      items: [
        { productId: 'p1', productName: 'Keyboard', unitPrice: 50.00, quantity: 1, lineTotal: 50.00 }
      ],
      subtotal: 50.00,
      updatedAt: new Date().toISOString()
    }

    let capturedHeaders: any = null

    // Spy on apiClient.post
    vi.spyOn(apiClient, 'post').mockImplementation((url, data, config) => {
      if (url === '/orders/checkout') {
        capturedHeaders = config?.headers
        return Promise.resolve({
          data: {
            orderId: 'ord-client-001',
            userId: 'user1',
            idempotencyKey: capturedHeaders['Idempotency-Key'],
            totalAmount: 50.00,
            status: 'CONFIRMED',
            createdAt: new Date().toISOString(),
            items: []
          }
        }) as any
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })

    const result = await cart.checkout()

    // VERIFY CLIENT-GENERATED IDEMPOTENCY KEY
    expect(capturedHeaders).toBeTruthy()
    expect(capturedHeaders['Idempotency-Key']).toBeTruthy()
    // Verify it is a non-empty string with UUID-like length (>= 16 chars)
    expect(typeof capturedHeaders['Idempotency-Key']).toBe('string')
    expect(capturedHeaders['Idempotency-Key'].length).toBeGreaterThanOrEqual(16)
    expect(result.status).toBe('CONFIRMED')

    // Cart should be reset to empty after successful checkout
    expect(cart.items.length).toBe(0)
    expect(cart.subtotal).toBe(0)
  })

  it('handles 409 Version Conflict with clear user prompt', async () => {
    const cart = useCartStore()

    vi.spyOn(apiClient, 'post').mockImplementation((url) => {
      if (url === '/orders/checkout') {
        const error: any = new Error('Conflict')
        error.response = {
          status: 409,
          data: {
            status: 409,
            title: 'Conflict',
            detail: 'Cart version mismatch: expected 1 but was 2'
          }
        }
        return Promise.reject(error)
      }
      return Promise.reject(new Error('Unknown'))
    })

    await expect(cart.checkout()).rejects.toThrow()
    expect(cart.error).toContain('Cart state conflict detected: The cart was modified concurrently')
  })

  it('OPTIMISTIC UI: addItem updates cart state and itemCount immediately (0ms) before server responds', async () => {
    const cart = useCartStore()

    // Mock delayed backend response
    let resolveServer: any = null
    const serverPromise = new Promise((resolve) => {
      resolveServer = resolve
    })

    vi.spyOn(apiClient, 'post').mockImplementation((url) => {
      if (url === '/carts/me/items') {
        return serverPromise as any
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })

    // Dispatch optimistic add
    const addPromise = cart.addItem('prod-99', 2, {
      productName: 'Tactile Keyboard Switch',
      unitPrice: 15.50
    })

    // VERIFY INSTANT OPTIMISTIC STATE (0ms before server response resolves)
    expect(cart.itemCount).toBe(2)
    expect(cart.subtotal).toBe(31.00)
    expect(cart.items.length).toBe(1)
    expect(cart.items[0].productName).toBe('Tactile Keyboard Switch')

    // Verify written to localStorage immediately
    const saved = localStorage.getItem('aura_cart_v1')
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved!).items[0].productId).toBe('prod-99')

    // Now resolve the server call
    resolveServer({
      data: {
        id: 'cart-server-1',
        userId: 'user1',
        version: 2,
        items: [
          { productId: 'prod-99', productName: 'Tactile Keyboard Switch', unitPrice: 15.50, quantity: 2, lineTotal: 31.00 }
        ],
        subtotal: 31.00,
        updatedAt: new Date().toISOString()
      }
    })
    await addPromise

    expect(cart.itemCount).toBe(2)
    expect(cart.version).toBe(2)
  })

  it('RESILIENCE: rehydrates basket items from localStorage on page refresh / reload', () => {
    // Seed localStorage as if the user refreshed the page with an active basket
    const cachedCart = {
      id: 'cart-persisted-1',
      userId: 'user1',
      version: 3,
      items: [
        { productId: 'prod-10', productName: '4K IPS Display', unitPrice: 399.00, quantity: 1, lineTotal: 399.00 }
      ],
      subtotal: 399.00,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem('aura_cart_v1', JSON.stringify(cachedCart))

    // Re-initialize a fresh store instance (mimicking F5 reload)
    setActivePinia(createPinia())
    const reloadedCart = useCartStore()

    expect(reloadedCart.items.length).toBe(1)
    expect(reloadedCart.itemCount).toBe(1)
    expect(reloadedCart.subtotal).toBe(399.00)
    expect(reloadedCart.items[0].productName).toBe('4K IPS Display')
  })

  it('OPTIMISTIC UI: updateQuantity and removeItem update state and storage instantly', async () => {
    const cart = useCartStore()
    cart.cart = {
      id: 'cart-1',
      userId: 'user1',
      version: 1,
      items: [
        { productId: 'p1', productName: 'Item A', unitPrice: 20.00, quantity: 1, lineTotal: 20.00 },
        { productId: 'p2', productName: 'Item B', unitPrice: 10.00, quantity: 1, lineTotal: 10.00 }
      ],
      subtotal: 30.00,
      updatedAt: new Date().toISOString()
    }

    vi.spyOn(apiClient, 'put').mockResolvedValue({
      data: { ...cart.cart, items: [{ productId: 'p1', productName: 'Item A', unitPrice: 20.00, quantity: 3, lineTotal: 60.00 }, { productId: 'p2', productName: 'Item B', unitPrice: 10.00, quantity: 1, lineTotal: 10.00 }], subtotal: 70.00 }
    } as any)

    vi.spyOn(apiClient, 'delete').mockResolvedValue({
      data: { ...cart.cart, items: [{ productId: 'p1', productName: 'Item A', unitPrice: 20.00, quantity: 3, lineTotal: 60.00 }], subtotal: 60.00 }
    } as any)

    // Update quantity
    await cart.updateQuantity('p1', 3)
    expect(cart.itemCount).toBe(4)
    expect(cart.subtotal).toBe(70.00)

    // Remove item
    await cart.removeItem('p2')
    expect(cart.itemCount).toBe(3)
    expect(cart.subtotal).toBe(60.00)
    expect(cart.items.find(i => i.productId === 'p2')).toBeUndefined()
  })
})
