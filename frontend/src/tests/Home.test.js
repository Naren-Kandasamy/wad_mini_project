import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Home from '../views/Home.vue'

describe('Home.vue Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches and renders products on mount', async () => {
    const mockProducts = [
      { id: '1', name: 'Mechanical Keyboard', description: 'RGB Gaming', price: 99.99 },
      { id: '2', name: 'Wireless Mouse', description: 'Ergonomic mouse', price: 49.99 }
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProducts
    })

    const wrapper = mount(Home, {
      global: {
        provide: {
          user: ref({ email: 'test@example.com', name: 'Test User' })
        }
      }
    })

    await flushPromises()

    const cards = wrapper.findAll('.card')
    expect(cards).toHaveLength(2)
    expect(wrapper.text()).toContain('Mechanical Keyboard')
    expect(wrapper.text()).toContain('Wireless Mouse')
    expect(wrapper.text()).toContain('$99.99')
  })

  it('posts to /api/cart/me/items when user clicks Add to Cart', async () => {
    const mockProducts = [
      { id: '101', name: '4K Monitor', description: 'IPS Display', price: 299.99 }
    ]

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'cart1', items: [] })
      })

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const wrapper = mount(Home, {
      global: {
        provide: {
          user: ref({ email: 'shopper@example.com', name: 'Shopper' })
        }
      }
    })

    await flushPromises()

    const addButton = wrapper.find('.btn')
    await addButton.trigger('click')
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/cart/me/items',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: '101',
          productName: '4K Monitor',
          quantity: 1,
          price: 299.99
        })
      })
    )
    expect(alertMock).toHaveBeenCalledWith('Added to cart')
  })
})
