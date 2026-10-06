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
})
