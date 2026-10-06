import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { apiClient } from '../api/client'
import CatalogView from '../views/CatalogView.vue'

describe('Frontend Cyber Attack Defense Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('XSS DEFENSE: renders product names containing HTML tags as plain text without script execution', () => {
    const maliciousPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>'

    // Mount CatalogView or a simple component displaying user-supplied input
    const wrapper = mount({
      template: '<div class="product-title">{{ title }}</div>',
      data() {
        return { title: maliciousPayload }
      }
    })

    // Verify raw HTML tags are NOT interpreted as DOM nodes
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    // The text content should be safely encoded text
    expect(wrapper.text()).toBe(maliciousPayload)
  })

  it('OBSERVABILITY: request interceptor injects unique X-Request-Id correlation header', async () => {
    const handler = (apiClient.interceptors.request as any).handlers[0].fulfilled
    const config = await handler({
      headers: new Map(),
      method: 'get',
      url: '/products'
    } as any)

    expect(config.headers.get('X-Request-Id')).toBeTruthy()
    expect(typeof config.headers.get('X-Request-Id')).toBe('string')
  })

  it('AUTH DEFENSE: request interceptor automatically attaches in-memory Bearer token', async () => {
    const auth = useAuthStore()
    auth.loginAsUser('charlie')

    const handler = (apiClient.interceptors.request as any).handlers[0].fulfilled
    const config = await handler({
      headers: new Map(),
      method: 'get',
      url: '/carts/me'
    } as any)

    expect(config.headers.get('Authorization')).toBe(`Bearer ${auth.token}`)
  })
})
