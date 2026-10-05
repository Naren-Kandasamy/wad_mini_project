import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Orders from '../views/Orders.vue'

describe('Orders.vue Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders login prompt when user is unauthenticated', () => {
    const wrapper = mount(Orders, {
      global: {
        provide: {
          user: ref(null)
        }
      }
    })
    expect(wrapper.text()).toContain('Please login to view your orders')
  })

  it('renders orders history when loaded', async () => {
    const mockOrders = [
      {
        id: 'ord-999',
        status: 'PLACED',
        orderDate: '2026-10-05T10:00:00.000Z',
        totalAmount: 125.5,
        items: [
          { productId: 'p1', productName: 'Item 1', quantity: 2, price: 50.0 },
          { productId: 'p2', productName: 'Item 2', quantity: 1, price: 25.5 }
        ]
      }
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOrders
    })

    const wrapper = mount(Orders, {
      global: {
        provide: {
          user: ref({ email: 'user@example.com', name: 'User' })
        }
      }
    })

    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith('/api/orders/me')
    expect(wrapper.text()).toContain('Order ID: ord-999')
    expect(wrapper.text()).toContain('Total: $125.5')
    expect(wrapper.text()).toContain('Item 1 (x2) - $50')
  })
})
