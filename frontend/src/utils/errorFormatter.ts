import { AxiosError } from 'axios'
import type { ProblemDetail } from '../api/client'

export interface RoleFormattedError {
  title: string
  message: string
  actionLabel?: string
  actionType?: 'login' | 'refresh' | 'retry' | 'catalog'
  severity: 'warning' | 'error' | 'info'
  telemetry?: {
    status?: number
    title?: string
    rawDetail?: string
    endpoint?: string
    timestamp: string
    rawJson: string
  }
}

/**
 * Transforms raw error strings or Axios errors into role-appropriate presentations.
 *
 * - Standard Customers (USER / Guest): Friendly, empathetic prose with clear recovery actions.
 *   Zero technical jargon, no raw token/crypto stack traces, no port numbers.
 * - Administrators (ADMIN): Operational clarity with business logic context.
 * - Developers (DEVELOPER): Complete diagnostic telemetry, HTTP codes, and raw JSON.
 */
export function formatRoleError(
  errorInput: unknown,
  roles: string[] = ['USER']
): RoleFormattedError {
  const isDev = roles.includes('DEVELOPER') || roles.includes('ROLE_DEVELOPER')
  const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')

  let status: number | undefined
  let rawDetail = ''
  let problemTitle = ''
  let endpoint = ''

  if (typeof errorInput === 'string') {
    rawDetail = errorInput
    if (errorInput.toLowerCase().includes('jwt') || errorInput.toLowerCase().includes('token') || errorInput.includes('401')) {
      status = 401
    } else if (errorInput.includes('403') || errorInput.toLowerCase().includes('access is denied')) {
      status = 403
    } else if (errorInput.includes('409') || errorInput.toLowerCase().includes('conflict')) {
      status = 409
    } else if (errorInput.includes('404') || errorInput.toLowerCase().includes('not found')) {
      status = 404
    } else if (errorInput.toLowerCase().includes('port') || errorInput.toLowerCase().includes('network') || errorInput.toLowerCase().includes('unreachable')) {
      status = 503
    }
  } else if (errorInput && typeof errorInput === 'object') {
    const axiosErr = errorInput as AxiosError<ProblemDetail>
    status = axiosErr.response?.status
    endpoint = axiosErr.config?.url || ''
    if (axiosErr.response?.data) {
      const data = axiosErr.response.data
      rawDetail = data.detail || axiosErr.message || ''
      problemTitle = data.title || ''
    } else if (axiosErr.message) {
      rawDetail = axiosErr.message
    }
  }

  const timestamp = new Date().toISOString()
  const telemetry = {
    status,
    title: problemTitle || (status ? `HTTP ${status}` : 'Client Error'),
    rawDetail: rawDetail || 'Unknown error occurred',
    endpoint,
    timestamp,
    rawJson: JSON.stringify({ status, title: problemTitle, detail: rawDetail, endpoint, timestamp }, null, 2)
  }

  // ── 1. 401 Unauthorized / Expired / Malformed Token ───────────────────────────
  if (status === 401 || rawDetail.toLowerCase().includes('jwt') || rawDetail.toLowerCase().includes('malformed token')) {
    if (isDev) {
      return {
        title: 'JWT Authentication Failed (HTTP 401)',
        message: 'Spring Security rejected the Bearer token. Verify Keycloak realm issuer, audience, and Direct Access Grant scope.',
        actionLabel: 'Re-authenticate',
        actionType: 'login',
        severity: 'error',
        telemetry
      }
    }
    if (isAdmin) {
      return {
        title: 'Admin Session Expired',
        message: 'Your administrative session has timed out. Please sign in again to continue managing store operations.',
        actionLabel: 'Sign In Again',
        actionType: 'login',
        severity: 'warning',
        telemetry
      }
    }
    return {
      title: 'Your Session Has Ended',
      message: 'Please sign in to view your saved items and proceed with checkout.',
      actionLabel: 'Sign In',
      actionType: 'login',
      severity: 'info',
      telemetry: undefined // Zero technical leakage to customer
    }
  }

  // ── 2. 403 Forbidden / Access Denied ──────────────────────────────────────────
  if (status === 403 || rawDetail.toLowerCase().includes('access denied')) {
    if (isDev) {
      return {
        title: 'Access Denied (HTTP 403)',
        message: 'SecurityFilterChain authorization rule evaluation failed. Missing required role in token claims.',
        severity: 'error',
        telemetry
      }
    }
    if (isAdmin) {
      return {
        title: 'Elevated Privilege Required',
        message: 'This operation requires specific administrative entitlements that are not present in your current profile.',
        actionLabel: 'Refresh Session',
        actionType: 'login',
        severity: 'warning',
        telemetry
      }
    }
    return {
      title: 'Access Restricted',
      message: 'This section requires special account permissions.',
      actionLabel: 'Browse Catalog',
      actionType: 'catalog',
      severity: 'warning',
      telemetry: undefined
    }
  }

  // ── 3. 409 Conflict / Optimistic Concurrency Lock ────────────────────────────
  if (status === 409 || rawDetail.toLowerCase().includes('conflict')) {
    if (isDev) {
      return {
        title: 'Optimistic Locking Failure (HTTP 409)',
        message: 'Cart aggregate root @Version conflict. Entity was modified concurrently in another thread/session.',
        actionLabel: 'Fetch Latest Aggregate',
        actionType: 'refresh',
        severity: 'warning',
        telemetry
      }
    }
    if (isAdmin) {
      return {
        title: 'Concurrency Conflict Detected',
        message: 'Cart state was modified simultaneously in another transaction. Refreshing will load the latest persisted version.',
        actionLabel: 'Sync State',
        actionType: 'refresh',
        severity: 'warning',
        telemetry
      }
    }
    return {
      title: 'Basket Synchronized',
      message: 'Your hardware basket was updated in another window. We have synchronized with the latest item quantities.',
      actionLabel: 'Refresh Basket',
      actionType: 'refresh',
      severity: 'info',
      telemetry: undefined
    }
  }

  // ── 4. 404 Not Found ──────────────────────────────────────────────────────────
  if (status === 404 || rawDetail.toLowerCase().includes('not found')) {
    return {
      title: 'Hardware Item Unavailable',
      message: 'The requested product or resource could not be found in the active catalog.',
      actionLabel: 'Browse Catalog',
      actionType: 'catalog',
      severity: 'warning',
      telemetry: isDev || isAdmin ? telemetry : undefined
    }
  }

  // ── 5. Network / Server Unreachable / 503 / 500 ───────────────────────────────
  if (
    status === 503 ||
    status === 502 ||
    status === 500 ||
    rawDetail.toLowerCase().includes('unreachable') ||
    rawDetail.toLowerCase().includes('network') ||
    rawDetail.toLowerCase().includes('connection refused')
  ) {
    if (isDev) {
      return {
        title: `Service Communication Failure (${status ? `HTTP ${status}` : 'Network Error'})`,
        message: 'Spring Boot backend (Port 8080) or MongoDB replica set (Port 27018) is unreachable or threw an unhandled exception.',
        actionLabel: 'Retry Request',
        actionType: 'retry',
        severity: 'error',
        telemetry
      }
    }
    if (isAdmin) {
      return {
        title: 'Hardware Services Momentarily Unavailable',
        message: 'The inventory backend is temporarily offline or synchronizing. Automatic recovery is underway.',
        actionLabel: 'Retry Operation',
        actionType: 'retry',
        severity: 'warning',
        telemetry
      }
    }
    return {
      title: 'Storefront Reconnecting',
      message: 'We are currently synchronizing our hardware inventory services. Your basket is safe.',
      actionLabel: 'Retry Connection',
      actionType: 'retry',
      severity: 'info',
      telemetry: undefined
    }
  }

  // ── 6. Generic Default Fallback ──────────────────────────────────────────────
  if (isDev) {
    return {
      title: 'Application Error Occurred',
      message: rawDetail || 'An unexpected client error occurred.',
      severity: 'error',
      telemetry
    }
  }

  return {
    title: 'Notice',
    message: rawDetail.includes('Malformed') || rawDetail.includes('Jwt')
      ? 'Your session has ended. Please sign in to continue.'
      : (rawDetail || 'An issue occurred with your request. Please try again.'),
    actionLabel: rawDetail.includes('Malformed') || rawDetail.includes('Jwt') ? 'Sign In' : undefined,
    actionType: rawDetail.includes('Malformed') || rawDetail.includes('Jwt') ? 'login' : undefined,
    severity: 'info',
    telemetry: undefined
  }
}
