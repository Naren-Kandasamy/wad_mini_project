import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Cart from '../views/Cart.vue'

describe('Cart.vue Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders login prompt when user is not logged in', () => {
    const wrapper = mount(Cart, {
      global: {
        provide: {
          user: ref(null)
        }
      }
    })
    expect(wrapper.text()).toContain('Please login to view your cart')
  })

  it('renders empty cart message when cart has no items', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ userEmail: 'user@example.com', items: [] })
    })

    const wrapper = mount(Cart, {
      global: {
        provide: {
          user: ref({ email: 'user@example.com', name: 'User' })
        }
      }
    })

    await flushPromises()
    expect(wrapper.text()).toContain('Your cart is empty')
  })

  it('renders cart items and computes total accurately', async () => {
    const mockCart = {
      userEmail: 'user@example.com',
      items: [
        { productId: 'item-1', productName: 'Item One', quantity: 2, price: 10.0 },
        { productId: 'item-2', productName: 'Item Two', quantity: 1, price: 25.5 }
      ]
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCart
    })

    const wrapper = mount(Cart, {
      global: {
        provide: {
          user: ref({ email: 'user@example.com', name: 'User' })
        }
      }
    })

    await flushPromises()

    const cards = wrapper.findAll('.card')
    expect(cards).toHaveLength(2)
    expect(wrapper.text()).toContain('Item One')
    expect(wrapper.text()).toContain('Item Two')
    // 2 * 10 + 1 * 25.5 = 45.5
    expect(wrapper.text()).toContain('Total: $45.5')
  })

  it('removes item via DELETE /api/cart/me/items/:id', async () => {
    const mockCart = {
      userEmail: 'user@example.com',
      items: [
        { productId: 'item-1', productName: 'Item One', quantity: 1, price: 10.0 }
      ]
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCart
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userEmail: 'user@example.com', items: [] })
      })

    const wrapper = mount(Cart, {
      global: {
        provide: {
          user: ref({ email: 'user@example.com', name: 'User' })
        }
      }
    })

    await flushPromises()

    const removeBtn = wrapper.find('.btn')
    await removeBtn.trigger('click')
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith('/api/cart/me/items/item-1', { method: 'DELETE' })
  })

  it('places order via POST /api/orders/checkout and clears cart via DELETE /api/cart/me', async () => {
    const mockCart = {
      userEmail: 'user@example.com',
      items: [
        { productId: 'p1', productName: 'Gadget', quantity: 1, price: 50.0 }
      ]
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCart
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'ord-123', status: 'PLACED' })
      })
      .mockResolvedValueOnce({
        ok: true
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userEmail: 'user@example.com', items: [] })
      })

    vi.spyOn(window, 'alert').mockImplementation(() => {})

    const wrapper = mount(Cart, {
      global: {
        provide: {
          user: ref({ email: 'user@example.com', name: 'User' })
        }
      }
    })

    await flushPromises()

    const orderBtn = wrapper.findAll('.btn').find(b => b.text().includes('Place Order'))
    await orderBtn.trigger('click')
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/orders/checkout',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ items: mockCart.items })
      })
    )
    expect(global.fetch).toHaveBeenCalledWith('/api/cart/me', { method: 'DELETE' })
  })
})
