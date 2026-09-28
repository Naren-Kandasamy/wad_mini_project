# Group 2 — Security Architecture
## OAuth/OIDC, RBAC, JWT, Resource Ownership & Security

**Project:** Shopping Cart Full-Stack Web Application  
**Stack:** Vue.js + Spring Boot + MongoDB + Spring Cloud Gateway  
**Architecture:** Microservices  
**Status:** READY — CONSOLIDATED FROM RESEARCH

---

## 1. Purpose

This document defines the security architecture for the Shopping Cart application. It covers authentication, authorization, RBAC, JWT handling, resource ownership, frontend security, Gateway responsibilities, internal service protection, and security testing boundaries.

The design is intentionally scoped to the project's approximately 2-hour implementation constraint. Features that add substantial operational complexity without materially improving the demonstration are documented as future work.

---

## 2. Core Security Decisions

| Decision | Project Decision |
|---|---|
| Identity Provider | **Keycloak** |
| Authentication protocol | **OpenID Connect (OIDC)** |
| Authorization framework | OAuth 2.0 |
| Browser flow | **Authorization Code + PKCE** |
| API authentication | Bearer access token / JWT |
| JWT issuer | Keycloak |
| Gateway authentication | JWT validation |
| Service authentication | JWT/resource-server validation |
| Authorization | Gateway coarse checks + service fine-grained checks |
| User identity | JWT `sub` claim |
| User-specific APIs | `/me` pattern |
| Roles | `USER`, `ADMIN`, `DEVELOPER` |
| Store-owner role | Omitted for current scope |
| Frontend access-token storage | In-memory |
| `localStorage` for tokens | **Not used** |
| Custom authentication server | Not built |
| Flask authentication service | Not used |
| CSRF | Not required for pure Authorization-header JWT authentication |
| Rate limiting | Optional if time permits |
| Service-to-service auth | Must be explicitly protected; minimal implementation preferred |
| Token revocation | Future work |
| Production secrets manager | Future work |

---

# 3. Identity Provider — Keycloak

## 3.1 Why Keycloak

Keycloak is selected as the project's Identity Provider because it provides:

- OIDC authentication
- OAuth 2.0 support
- User management
- Realm and client roles
- JWT issuance
- JWKS/public-key based token validation
- Local Docker deployment
- No custom password database required
- Open-source/self-hosted deployment
- Production relevance

This is preferable to implementing authentication directly inside the Spring Boot application.

### Important clarification

**Flask is not an OAuth/OIDC Identity Provider.** Flask is a Python web framework. Introducing Flask solely for authentication would add another technology without solving the actual identity-management problem.

The application therefore remains:

```text
Vue
  ↓
Spring Cloud Gateway
  ↓
Spring Boot services
```

with Keycloak as the external identity provider.

---

# 4. OAuth 2.0 vs OpenID Connect

OAuth 2.0 is an authorization framework: it answers what a client is allowed to access.

OpenID Connect is an authentication/identity layer built on OAuth 2.0: it answers who the user is.

For this application, **OIDC is required** because users must authenticate and the backend must associate requests with an authenticated identity.

```text
OIDC
  └── built on OAuth 2.0
       ├── Authorization
       └── Authentication / Identity
```

---

# 5. Browser Authentication Flow

## 5.1 Authorization Code + PKCE

The Vue SPA uses the **Authorization Code Flow with PKCE**. This is appropriate for a browser-based public client because the SPA cannot safely keep a traditional client secret.

```text
Vue SPA
   │
   │ 1. Generate code_verifier / code_challenge
   │
   │ 2. Authorization request
   ▼
Keycloak
   │
   │ 3. User authenticates
   │
   │ 4. Authorization code
   ▼
Vue SPA
   │
   │ 5. Code + code_verifier
   ▼
Keycloak
   │
   │ 6. Access token + ID token (+ refresh token if issued)
   ▼
Vue SPA
   │
   │ 7. Authorization: Bearer <access_token>
   ▼
Spring Cloud Gateway
```

The deprecated implicit flow is not used.

---

# 6. Token Responsibilities

| Token | Purpose | Application Usage |
|---|---|---|
| Access token | API authorization | Sent to Gateway in `Authorization` header |
| ID token | User identity information for the client | Used by Vue for authenticated-user information |
| Refresh token | Obtain new access tokens | Managed according to the selected OIDC client/provider flow |

The application must **not** use the ID token as the API authorization token. API calls use the access token.

---

# 7. Frontend Token Storage

## Access Tokens

Access tokens should be kept in **memory** rather than `localStorage`.

```text
Vue application state / authentication composable
```

Do not use:

```text
localStorage.accessToken
```

The consequence is that a full browser refresh may require the OIDC client to establish the session again.

## Refresh Tokens

The project should **not build its own refresh-token endpoint**. If refresh tokens are used, the selected OIDC client/provider flow should manage them according to its documented SPA security model.

We should not introduce a custom `POST /refresh` endpoint merely to demonstrate token renewal.

---

# 8. Keycloak Realm and Roles

Create a Keycloak realm:

```text
shopping-cart
```

The application uses three roles:

```text
USER
ADMIN
DEVELOPER
```

### USER

Regular customer: browse products, manage own cart, checkout, and view own orders.

### ADMIN

Administrative user: manage products and access administrative resources such as cross-user orders where required.

### DEVELOPER

Testing/development-oriented role for the academic application. It may access the developer/test UI, controlled test scenarios, and explicitly permitted diagnostics.

The role is explicitly scoped as a **testing/development role**, not a general production privilege.

---

# 9. Why STORE_OWNER Is Not Included

A `STORE_OWNER` role would imply a multi-vendor marketplace and require store ownership, product ownership, vendor isolation, and seller-specific authorization.

Those features are outside the current shopping-cart scope.

Therefore the current role set is:

```text
USER
ADMIN
DEVELOPER
```

`STORE_OWNER` is a future extension.

---

# 10. JWT Architecture

Keycloak issues signed JWT access tokens. Relevant claims include:

- `sub` — canonical authenticated user identifier
- `iss` — token issuer
- `exp` — expiration
- role claims such as Keycloak's `realm_access.roles`

Conceptually:

```json
{
  "sub": "user-123",
  "iss": "https://keycloak/realms/shopping-cart",
  "aud": "shopping-cart-api",
  "exp": 1695123456,
  "iat": 1695120000,
  "realm_access": {
    "roles": ["USER"]
  },
  "preferred_username": "user"
}
```

The exact claims generated by Keycloak are configuration-dependent. The architecture relies primarily on `sub`, issuer/expiry, and role claims.

---

# 11. JWT Validation Architecture

## Gateway

Spring Cloud Gateway validates the incoming access token, including signature, expiration, issuer, and relevant claims.

## Services

The Product, Cart, and Order services also operate as OAuth2 Resource Servers and validate the JWT.

This is a deliberate defense-in-depth decision rather than having services blindly trust headers inserted by the Gateway.

```text
Vue
 │
 │ Bearer JWT
 ▼
Gateway
 │
 │ validates JWT
 ▼
Product / Cart / Order
 │
 │ validates JWT
 │ enforces authorization
 ▼
Business logic
```

This is the final project decision even though the research identified Gateway-only validation as a simpler alternative. The extra Spring Security configuration is small relative to the security benefit.

---

# 12. Gateway vs Service Responsibilities

| Responsibility | Gateway | Services |
|---|---:|---:|
| JWT validation | Yes | Yes |
| Token expiration validation | Yes | Yes |
| Issuer/signature validation | Yes | Yes |
| Coarse route authorization | Yes | — |
| Fine-grained authorization | — | Yes |
| Resource ownership | — | **Yes** |
| Business validation | — | **Yes** |
| CORS | **Yes** | No |
| Rate limiting | Optional | No |
| Correlation ID | Yes | Propagated |
| Client-header filtering | Yes | — |
| Audit/business security logging | Basic | **Yes** |

**Principle:** The Gateway is the security entry point, but services remain security authorities for their own resources.

---

# 13. Gateway Coarse Authorization

The Gateway may reject obviously unauthorized routes early.

Examples:

```text
/api/admin/** → ADMIN
/api/dev/**   → DEVELOPER
```

However, the Gateway does not perform resource-level business authorization. For example, whether a cart belongs to a user belongs to Cart Service.

---

# 14. Resource Ownership and IDOR Prevention

## 14.1 The Problem

Insecure Direct Object Reference (IDOR) occurs when an attacker manipulates an identifier to access another user's resource.

Unsafe example:

```http
GET /api/carts/123
```

if the identifier exposes a user-controlled owner relationship without a proper ownership check.

---

# 15. `/me` API Pattern

User-specific APIs use `/me`.

### Cart

```http
GET    /api/carts/me
POST   /api/carts/me/items
PUT    /api/carts/me/items/{productId}
DELETE /api/carts/me/items/{productId}
DELETE /api/carts/me
```

### Orders

```http
GET  /api/orders/me
POST /api/orders/checkout
```

The authenticated user is obtained from:

```text
JWT sub
  ↓
Spring Security Authentication
  ↓
service user identity
```

The client does not provide the identity used for ownership.

---

# 16. Administrative Resource Access

Administrators may have dedicated administrative endpoints:

```http
GET /api/admin/orders
GET /api/admin/orders/{orderId}
GET /api/admin/carts
```

These require `ROLE_ADMIN`.

---

# 17. Ownership Rule

Even with `/me` endpoints, ownership must be enforced in the service layer.

```text
Authenticated user = A

Cart query:
    find cart where userId = A
```

The service must not accept `userId = B` from an untrusted request body, query parameter, or header.

---

# 18. Internal Service Endpoint

Group 1 defines an internal Cart endpoint:

```http
GET /internal/carts/{userId}
```

Order Service uses this during checkout.

It is **not a public client API**.

The endpoint must:

- Not be exposed as a normal public Gateway route
- Be reachable only within the internal service network
- Require an authenticated/trusted service request
- Validate the authenticated context
- Never rely solely on a client-supplied `X-User-Id`

Production approaches could include OAuth2 client credentials/service accounts or mTLS. **mTLS is not required for the 2-hour implementation.** The implementation must nevertheless prevent an arbitrary external client from invoking the endpoint.

---

# 19. Client-Provided Identity Headers

Headers such as:

```http
X-User-Id
X-User-Role
```

must never be treated as authoritative when supplied directly by the client.

If the Gateway adds internal identity headers for an implementation reason:

1. Client-supplied versions must be stripped.
2. The Gateway must generate the trusted value.
3. Services must not be publicly reachable in a way that allows those headers to be forged.

The preferred architecture remains **forwarding the authenticated JWT and validating it in services**.

---

# 20. RBAC Model

Roles are managed by Keycloak, represented in the access token, and converted into Spring Security authorities.

```text
Keycloak role
     ↓
JWT role claim
     ↓
JwtAuthenticationConverter
     ↓
ROLE_USER / ROLE_ADMIN / ROLE_DEVELOPER
     ↓
@PreAuthorize
```

Roles should not be stored as a second source of truth in MongoDB for this project, and frontend role state is never treated as authoritative.

---

# 21. Authorization Matrix

| Operation | USER | ADMIN | DEVELOPER |
|---|---:|---:|---:|
| Browse products | Yes | Yes | Yes |
| Manage own cart | Yes | Yes | Yes, if required for testing |
| Checkout | Yes | Yes | Test-only if enabled |
| View own orders | Yes | Yes | Test-only if enabled |
| Create/update/delete products | No | Yes | Test data only if explicitly enabled |
| View all orders | No | Yes | Test-only if explicitly enabled |
| Manage users/roles | No | Yes | No |
| Developer/test scenarios | No | Optional | Yes |
| Debug/test endpoints | No | Optional | Yes |

`DEVELOPER` should not automatically become equivalent to `ADMIN`.

---

# 22. Spring Security

Each backend service uses Spring Security OAuth2 Resource Server.

Conceptually:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${KEYCLOAK_ISSUER_URI}
```

Spring Security obtains Keycloak's public signing keys through issuer/JWKS configuration and validates the access token.

The application configures issuer validation, signature validation, expiration validation, role mapping, and method-level authorization.

---

# 23. Method-Level Authorization

Enable method security:

```java
@EnableMethodSecurity
```

Then use:

```java
@PreAuthorize("hasRole('ADMIN')")
```

or:

```java
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
```

Authorization stays close to the protected operation.

---

# 24. Frontend Security

## Route Guards

Vue routes may declare security metadata:

```javascript
{
  path: '/admin',
  component: AdminDashboard,
  meta: {
    requiresAuth: true,
    requiresRole: ['ADMIN']
  }
}
```

Route guards improve UX but are not security boundaries.

## Role-Aware UI

The frontend may hide controls the current user cannot use. Backend authorization remains mandatory because attackers can call APIs directly.

Unauthorized backend operations must return `403 Forbidden`.

---

# 25. XSS Considerations

The Vue application should:

- Use Vue's normal template escaping
- Avoid `v-html` for untrusted content
- Avoid persistent browser token storage
- Apply an appropriate Content Security Policy where practical
- Validate/sanitize untrusted input where applicable

---

# 26. CSRF Decision

The application uses:

```http
Authorization: Bearer <JWT>
```

rather than browser-managed authentication cookies. Browsers do not automatically attach arbitrary `Authorization` headers to cross-site requests.

Therefore traditional cookie-based CSRF protection is not required for the pure bearer-token API design.

If the authentication architecture later introduces cookie-based authentication, this decision must be revisited.

---

# 27. CORS

CORS is configured centrally at the Gateway.

During local development, the Vue development origin may be explicitly allowed, for example:

```text
http://localhost:5173
```

Do not use `Access-Control-Allow-Origin: *` for an authenticated production deployment.

---

# 28. Rate Limiting

Rate limiting can protect against brute-force attempts, API abuse, excessive requests, and basic DoS patterns.

Spring Cloud Gateway can provide rate limiting, potentially backed by Redis. Redis introduces additional infrastructure, so:

```text
Rate limiting → optional enhancement
```

for the 2-hour project.

---

# 29. Security Threat Model

| Threat | Mitigation |
|---|---|
| IDOR | `/me` APIs + service ownership checks |
| Privilege escalation | RBAC + `@PreAuthorize` |
| Forged identity header | Validate JWT; reject/strip client identity headers |
| Stolen browser token | In-memory access-token storage |
| Invalid/expired token | Gateway + service JWT validation |
| Direct service access | Internal network isolation |
| CORS abuse | Explicit allowed origins |
| Mass assignment | DTOs + explicit server-side mapping |
| Client-modified prices | Server-side price calculation/validation |
| Exposed internal endpoint | No public route + service authentication |
| Weak credentials/secrets | Environment variables; no committed secrets |
| Duplicate checkout | Group 1 idempotency mechanism |
| API abuse | Optional Gateway rate limiting |

---

# 30. Critical Security Rules

### Rule 1 — Never trust the frontend

The frontend cannot establish user identity, role, product price, order total, or resource ownership.

### Rule 2 — Derive user identity from the validated security context

```text
JWT sub
  ↓
Spring Security
  ↓
Authenticated user
```

### Rule 3 — Backend authorization is mandatory

Frontend route guards and hidden buttons are not security controls.

### Rule 4 — Services own authorization for their resources

The Gateway cannot replace service-level authorization.

### Rule 5 — Internal endpoints are not public APIs

`/internal/**` endpoints must not be exposed to arbitrary external clients.

### Rule 6 — Never trust client-supplied identity headers

`X-User-Id` and similar headers cannot be authoritative when supplied by a client.

---

# 31. Secrets and Configuration

Local configuration should use environment variables such as:

```text
KEYCLOAK_ISSUER_URI
KEYCLOAK_CLIENT_ID
KEYCLOAK_CLIENT_SECRET
MONGODB_URI
```

Development secrets may be provided through a local `.env` configuration excluded from Git:

```gitignore
.env
*.env
application-local.yml
```

Never commit real credentials.

For real production deployment, a dedicated secrets-management solution should be used. Examples include Kubernetes Secrets, HashiCorp Vault, AWS Secrets Manager, or equivalent cloud secret stores.

---

# 32. Security Testing

Security architecture is incomplete unless the controls are tested.

## Critical Tests

| Test | Expected Result |
|---|---|
| No Authorization header | `401 Unauthorized` |
| Malformed JWT | `401 Unauthorized` |
| Expired JWT | `401 Unauthorized` |
| USER → ADMIN endpoint | `403 Forbidden` |
| ADMIN → ADMIN endpoint | Success |
| USER creates product | `403 Forbidden` |
| User A requests own cart | Success |
| User A attempts User B resource | Rejected |
| Forged `X-User-Id` | Ignored/rejected |
| Direct internal endpoint access | Rejected |
| Modified client-side price | Server does not trust it |
| Duplicate checkout request | No duplicate order |

## Medium-Priority Tests

- DEVELOPER accessing developer endpoints
- Unauthorized CORS origin
- Mass-assignment attempts
- Route guard behavior
- Role-aware UI behavior
- Rate limiting if implemented

---

# 33. Testing Tools

Potential tools:

- JUnit
- Spring Boot Test
- MockMvc/WebTestClient as appropriate
- Postman
- curl
- Testcontainers
- Keycloak Testcontainers integration for realistic integration testing

For the initial implementation, automated backend security tests plus a small manual Postman/curl collection provide the highest practical value.

---

# 34. Relationship With Group 1

Group 1 established:

```text
Vue
 ↓
Gateway
 ↓
Product / Cart / Order
 ↓
MongoDB
```

Group 2 adds:

```text
Keycloak
 ↓
OIDC authentication
 ↓
JWT
 ↓
Gateway
 ↓
Services
```

Group 1's `/api/carts/me` design is retained.

Group 1's internal endpoint:

```http
GET /internal/carts/{userId}
```

is retained but must be protected according to this security architecture.

Group 1's checkout idempotency remains unchanged.

---

# 35. Relationship With Group 3

Group 3 should **test and operationalize** the security decisions from this document rather than redefine them.

| Group 2 Decision | Group 3 Responsibility |
|---|---|
| Keycloak authentication | Authentication E2E tests |
| JWT validation | Invalid/expired token tests |
| RBAC | Role-permission tests |
| `/me` ownership | IDOR tests |
| Internal endpoint protection | Service-boundary tests |
| Gateway security | Gateway integration tests |
| Security failures | Standardized errors/logging |
| Developer role | Developer/tester dashboard |
| Authentication events | Relevant audit/logging |
| Service identity | Service-to-service tests |

---

# 36. 2-Hour Implementation Scope

## Must Implement

1. Keycloak Docker setup
2. Shopping-cart realm
3. Vue OIDC Authorization Code + PKCE login
4. Spring Cloud Gateway JWT validation
5. Spring Boot service JWT resource-server validation
6. `USER`, `ADMIN`, `DEVELOPER` roles
7. Spring Security role mapping
8. `@PreAuthorize` authorization
9. `/api/carts/me` ownership model
10. Environment-based configuration
11. Gateway CORS
12. Critical security tests

## Implement If Time Permits

- Developer/tester security UI
- Rate limiting
- Additional security tests
- CSP
- More detailed audit logging
- Keycloak/Testcontainers integration

## Document Only / Future Work

- mTLS
- OAuth2 client-credentials service mesh
- Production secrets manager
- Token revocation infrastructure
- Advanced fraud detection
- Multi-vendor `STORE_OWNER`
- Full SIEM/security monitoring
- Kubernetes network policies

---

# 37. Final Security Architecture

```text
                         ┌──────────────────────┐
                         │       Keycloak       │
                         │                      │
                         │ OIDC / OAuth2        │
                         │ Users                │
                         │ Roles                │
                         │ JWT issuance         │
                         └──────────┬───────────┘
                                    │
                         Authorization Code
                              + PKCE
                                    │
                                    ▼
┌────────────────┐       ┌──────────────────────┐
│                │       │                      │
│    Vue SPA     │──────▶│  Spring Cloud        │
│                │  JWT  │  Gateway             │
└────────────────┘       │                      │
                         │ JWT validation       │
                         │ CORS                 │
                         │ Coarse authorization │
                         │ Correlation ID        │
                         └──────────┬───────────┘
                                    │
                      ┌─────────────┼─────────────┐
                      │             │             │
                      ▼             ▼             ▼
                ┌───────────┐ ┌───────────┐ ┌───────────┐
                │ Product   │ │   Cart    │ │   Order   │
                │ Service   │ │  Service  │ │  Service  │
                │           │ │           │ │           │
                │ JWT       │ │ JWT       │ │ JWT       │
                │ validation│ │ validation│ │ validation│
                │ RBAC      │ │ RBAC      │ │ RBAC      │
                │ business  │ │ ownership │ │ checkout  │
                │ rules     │ │ checks    │ │ rules     │
                └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                      │             │              │
                      ▼             ▼              ▼
                 product_db     cart_db        order_db
```

The security boundary is:

```text
External client
      │
      ▼
   Gateway
      │
      │ authenticated JWT
      ▼
 Internal services
      │
      ├── authenticate request
      ├── authorize operation
      ├── verify ownership
      └── execute business logic
```

The guiding principle is:

> **Authenticate centrally, authorize at the resource owner, and never trust client-controlled identity or business data.**

---

# 38. Final Decisions to Carry Forward

## LOCKED

- Keycloak
- OIDC
- Authorization Code + PKCE
- JWT access tokens
- Gateway JWT validation
- Service JWT validation
- `USER`, `ADMIN`, `DEVELOPER`
- `/me` ownership APIs
- JWT `sub` as authenticated identity
- Backend-enforced RBAC
- No client-trusted identity headers
- Internal endpoint protection
- In-memory access-token storage
- No custom Flask authentication layer
- No custom authentication database

## DEFERRED TO GROUP 3

- Exact security test implementation
- Developer/tester UI
- Security logging/auditing depth
- Rate limiting implementation
- Operational health/monitoring

## FUTURE / OUT OF SCOPE

- mTLS
- Full service mesh
- Advanced fraud detection
- Multi-vendor seller model
- Production secrets manager
- Kubernetes network policies
- Token revocation infrastructure

---

## Status

**GROUP 2 — SECURITY ARCHITECTURE: READY FOR GROUP 3 INTEGRATION**

This architecture is designed to remain consistent with the Group 1 microservice architecture while providing a realistic OAuth/OIDC + RBAC security layer without introducing unnecessary infrastructure for the assignment's time constraint.
