# Shopping Cart --- Master Architecture

**Status:** AUTHORITATIVE IMPLEMENTATION CONTRACT\
**Scope:** Approximately 2-hour academic full-stack implementation\
**Stack:** Vue.js + Spring Boot + Spring Cloud Gateway + MongoDB +
Keycloak\
**Architecture:** Three Spring Boot microservices behind a Spring Cloud
Gateway

------------------------------------------------------------------------

## 1. Project Scope

This document is the single implementation source of truth for the
Shopping Cart application.

The system consists of:

-   Vue.js SPA
-   Spring Cloud Gateway
-   Product Service
-   Cart Service
-   Order Service
-   MongoDB with logical database separation
-   Keycloak for OIDC authentication and JWT issuance

The architecture is intentionally production-minded rather than
enterprise-heavy. It must remain realistically implementable within
approximately two hours.

### Explicit scope boundary

The following are not part of the baseline implementation:

-   Kafka
-   RabbitMQ
-   Kubernetes
-   Eureka
-   service mesh
-   mTLS
-   distributed transactions
-   event sourcing
-   complex Saga frameworks
-   Redis unless a genuine blocking requirement appears
-   custom authentication servers
-   unnecessary confidential OAuth clients
-   advanced SIEM infrastructure
-   full production secrets management

------------------------------------------------------------------------

## 2. Architecture Goals

The architecture must demonstrate:

1.  Clear microservice boundaries.
2.  Database ownership.
3.  Secure authentication and authorization.
4.  Resource ownership and IDOR protection.
5.  Server-authoritative business data.
6.  Idempotent checkout handling.
7.  Explicit failure behavior.
8.  Practical testing.
9.  Basic observability.
10. Reproducible local deployment.
11. A clear implementation order suitable for a two-hour exercise.

The architecture must not sacrifice the locked security or
service-boundary decisions merely to reduce implementation effort.

------------------------------------------------------------------------

## 3. Technology Stack

  Layer                    Technology                                    Status
  ------------------------ --------------------------------------------- -------------------------------
  Frontend                 Vue.js                                        LOCKED
  API Gateway              Spring Cloud Gateway                          LOCKED
  Backend                  Spring Boot                                   LOCKED
  Persistence              MongoDB                                       LOCKED
  Identity Provider        Keycloak                                      LOCKED
  Browser authentication   OIDC Authorization Code + PKCE                LOCKED
  API authentication       Bearer JWT                                    LOCKED
  API style                REST                                          LOCKED
  Service communication    Synchronous REST                              LOCKED
  Backend security         Spring Security Resource Server               LOCKED
  Backend tests            JUnit 5, Spring Boot Test, MockMvc, Mockito   MUST
  Frontend/E2E             Playwright                                    SHOULD / critical path
  Containers               Docker Compose                                MUST for local infrastructure
  CI                       Lightweight automated build/test pipeline     SHOULD
  Distributed tracing      OpenTelemetry/Jaeger/etc.                     DOCUMENT ONLY

------------------------------------------------------------------------

## 4. System Architecture

### 4.1 Public request path

``` text
                         ┌─────────────────────┐
                         │      Vue SPA        │
                         └──────────┬──────────┘
                                    │
                         HTTPS / REST + JWT
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Spring Cloud        │
                         │ Gateway             │
                         │                     │
                         │ Routing             │
                         │ JWT validation      │
                         │ Coarse RBAC         │
                         │ CORS                │
                         │ Correlation ID      │
                         │ Request logging     │
                         │ Error handling      │
                         └───────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
       │ Product      │   │ Cart         │   │ Order        │
       │ Service      │   │ Service      │   │ Service      │
       │ :8081        │   │ :8082        │   │ :8083        │
       └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
              │                  │                  │
              ▼                  ▼                  ▼
       ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
       │ product_db   │   │ cart_db      │   │ order_db     │
       └──────────────┘   └──────────────┘   └──────────────┘

                         Order Service
                              │
                         internal REST
                              ▼
                         Cart Service
```

### 4.2 Identity path

``` text
Vue SPA
   │
   │ Authorization Code + PKCE
   ▼
Keycloak
   │
   │ access token
   ▼
Vue SPA
   │
   │ Authorization: Bearer <JWT>
   ▼
Gateway
   │
   │ same authenticated JWT
   ▼
Backend service
```

### 4.3 Architectural boundary rule

The Gateway is the public entry point, but it is not the sole security
boundary.

Every backend service independently validates the JWT and enforces
authorization relevant to resources it owns.

------------------------------------------------------------------------

## 5. Service Responsibilities

### 5.1 Product Service

The Product Service is the sole owner of product catalog information.

Responsibilities:

-   Create products.
-   Update products.
-   Delete/deactivate products.
-   Retrieve products.
-   Retrieve individual products.
-   Search/filter products if implemented.
-   Validate product information.
-   Maintain the current product price.
-   Enforce administrative authorization.

Product model:

``` text
Product
├── id
├── name
├── description
├── price
├── imageUrl
├── category
├── stock
└── active
```

`stock` exists in the broader model but no stock reservation or
inventory workflow is required for the two-hour implementation. No
checkout behavior may depend on stock unless that behavior is explicitly
implemented as an additional feature.

APIs:

``` http
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

`POST`, `PUT`, and `DELETE` require `ADMIN`.

------------------------------------------------------------------------

### 5.2 Cart Service

The Cart Service owns all user cart state.

Responsibilities:

-   Retrieve the authenticated user's cart.
-   Add an item.
-   Update quantity.
-   Remove an item.
-   Clear the cart.
-   Calculate cart subtotal.
-   Validate cart ownership.
-   Validate product existence/availability when adding an item.
-   Store the server-owned product snapshot.

Cart model:

``` text
Cart
├── id
├── userId
├── items[]
│   ├── productId
│   ├── productName
│   ├── unitPrice
│   └── quantity
└── updatedAt
```

Client APIs:

``` http
GET    /api/carts/me
POST   /api/carts/me/items
PUT    /api/carts/me/items/{productId}
DELETE /api/carts/me/items/{productId}
DELETE /api/carts/me
```

The authenticated user comes from `JWT.sub`. The browser must never
choose the ownership identity.

Internal API:

``` http
GET /internal/carts/{userId}
```

This endpoint exists solely for Order Service checkout and is never
routed through the Gateway.

------------------------------------------------------------------------

### 5.3 Order Service

The Order Service owns orders and checkout.

Responsibilities:

-   Checkout.
-   Create orders.
-   Retrieve the authenticated user's orders.
-   Maintain order status.
-   Preserve historical order snapshots.
-   Enforce checkout idempotency.
-   Calculate totals server-side.
-   Perform the Order → Cart internal call.
-   Handle checkout failure and compensation.

Order model:

``` text
Order
├── id
├── userId
├── idempotencyKey
├── items[]
│   ├── productId
│   ├── productName
│   ├── unitPrice
│   └── quantity
├── totalAmount
├── status
├── createdAt
└── updatedAt
```

APIs:

``` http
POST /api/orders/checkout
GET  /api/orders
GET  /api/orders/{id}
```

Optional administrative endpoints, if required:

``` http
GET /api/admin/orders
GET /api/admin/orders/{orderId}
```

------------------------------------------------------------------------

### 5.4 API Gateway

The Gateway is the public entry point.

Responsibilities:

-   Routing.
-   JWT validation.
-   Coarse authorization.
-   CORS.
-   Correlation IDs.
-   Request logging.
-   Global error handling.
-   Optional rate limiting.
-   Timeouts where applicable.
-   Removal/filtering of client-supplied identity headers.

The Gateway must not contain business logic or resource ownership logic.

The Gateway must not expose:

``` text
/internal/**
```

------------------------------------------------------------------------

### 5.5 Keycloak

Keycloak is the Identity Provider.

Responsibilities:

-   User authentication.
-   OIDC authorization flow.
-   JWT issuance.
-   Realm role management.
-   JWKS/public-key publication.

Realm:

``` text
shopping-cart
```

SPA client:

``` text
public client
Authorization Code + PKCE
```

API audience:

``` text
shopping-cart-api
```

Realm roles:

``` text
USER
ADMIN
DEVELOPER
```

------------------------------------------------------------------------

## 6. Database Architecture

MongoDB is deployed as one MongoDB instance with three logically
separated databases:

``` text
MongoDB
├── product_db
├── cart_db
└── order_db
```

Ownership:

  Database       Owner
  -------------- -----------------
  `product_db`   Product Service
  `cart_db`      Cart Service
  `order_db`     Order Service

No service directly reads or writes another service's database.

Forbidden examples:

``` text
Cart Service  → order_db.orders
Order Service → cart_db.carts
Product Service → cart_db.carts
```

Required cross-service access is performed through REST APIs.

This preserves service ownership while avoiding the operational overhead
of separate physical MongoDB deployments.

------------------------------------------------------------------------

## 7. Product Snapshots and Price Authority

Cart items store:

``` text
productId
productName
unitPrice
quantity
```

When an item is added:

``` text
Client
  ↓
Cart Service
  ↓
Product Service
  ↓
Validate product
  ↓
Read current server price/name
  ↓
Store cart snapshot
```

The frontend never supplies an authoritative price.

The current Product Service price is not revalidated during baseline
checkout.

Therefore:

> If a product price changes after the item enters the cart, checkout
> uses the price stored in the cart snapshot.

This is an explicit two-hour scope/business-consistency limitation.

The Order Service calculates the order total from the server-owned cart
snapshot, never from a frontend-submitted total.

------------------------------------------------------------------------

## 8. API Contract

### 8.1 Product APIs

``` http
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

Authorization:

``` text
GET       USER / ADMIN / DEVELOPER as appropriate
POST      ADMIN
PUT       ADMIN
DELETE    ADMIN
```

### 8.2 Cart APIs

``` http
GET    /api/carts/me
POST   /api/carts/me/items
PUT    /api/carts/me/items/{productId}
DELETE /api/carts/me/items/{productId}
DELETE /api/carts/me
```

All operate on the authenticated user's cart.

### 8.3 Order APIs

``` http
POST /api/orders/checkout
GET  /api/orders
GET  /api/orders/{id}
```

`GET /api/orders` returns only the authenticated user's orders for
normal users.

`GET /api/orders/{id}` performs an explicit ownership check.

### 8.4 Internal API

``` http
GET /internal/carts/{userId}
```

Properties:

-   Direct Order Service → Cart Service call.
-   Never routed through Gateway.
-   JWT is forwarded.
-   Cart Service independently validates the JWT.
-   `userId` must equal `JWT.sub`.

------------------------------------------------------------------------

## 9. Authentication and Authorization

### 9.1 OIDC + PKCE

Vue is a public SPA client.

Flow:

``` text
Vue
 ↓
Generate PKCE verifier/challenge
 ↓
Keycloak authorization endpoint
 ↓
User authenticates
 ↓
Authorization code
 ↓
Vue
 ↓
Token endpoint + verifier
 ↓
Access token
```

The implicit flow is not used.

The access token is used for API calls.

The ID token is not used as an API authorization token.

No custom `/refresh` endpoint is implemented.

------------------------------------------------------------------------

### 9.2 Token storage

Access tokens are kept in memory.

Do not store API access tokens in:

``` text
localStorage
```

Frontend authentication state may be held in a Vue authentication
composable/store.

A browser refresh may require the OIDC client/session to establish
authentication again.

------------------------------------------------------------------------

### 9.3 JWT validation

Gateway and every backend service independently validate:

1.  Signature.
2.  Issuer.
3.  Expiration.
4.  Audience.

Expected audience:

``` text
shopping-cart-api
```

Conceptually:

``` text
JWT
├── iss  → canonical Keycloak issuer
├── exp  → must be valid
├── aud  → must contain shopping-cart-api
├── sub  → authenticated user identity
└── realm_access.roles → application roles
```

Spring Security must explicitly validate the expected audience; enabling
JWT decoding alone is not sufficient.

------------------------------------------------------------------------

### 9.4 Canonical Keycloak issuer

The architecture must establish one canonical Keycloak issuer.

Do not assume:

``` text
http://keycloak:8080
```

is the issuer merely because it is the Docker hostname.

The token `iss` value and Spring Security configured issuer must match
exactly.

Before application security debugging:

1.  Start Keycloak.
2.  Verify the SPA can reach it.
3.  Inspect a real access token.
4.  Confirm the `iss` claim.
5.  Configure Spring Security with that exact issuer.
6.  Confirm backend JWKS retrieval works.
7.  Validate a real token in a backend service.

Issuer identity and the internal network address used to reach JWKS are
related but are not interchangeable concepts.

------------------------------------------------------------------------

### 9.5 Role mapping

Keycloak realm roles appear in:

``` text
realm_access.roles
```

Spring Security maps them to authorities:

``` text
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

Roles are not stored as a second authorization source in MongoDB.

Frontend role state is never authoritative.

------------------------------------------------------------------------

### 9.6 Roles

#### USER

May:

-   Browse products.
-   Manage own cart.
-   Checkout.
-   View own orders.

#### ADMIN

May:

-   Perform product administration.
-   Access explicitly authorized administrative order resources.
-   Perform other explicitly defined administrative operations.

#### DEVELOPER

A testing/development role.

It may access explicitly permitted developer/test scenarios and
diagnostics.

`DEVELOPER` must not automatically imply `ADMIN`.

`STORE_OWNER` is outside scope and is not implemented.

------------------------------------------------------------------------

### 9.7 Gateway versus service authorization

  Responsibility                             Gateway   Service
  ---------------------------------------- --------- ---------
  JWT validation                                 Yes       Yes
  Signature/issuer/expiration validation         Yes       Yes
  Audience validation                            Yes       Yes
  Coarse route authorization                     Yes       ---
  Fine-grained authorization                     ---       Yes
  Resource ownership                             ---       Yes
  Business validation                            ---       Yes
  CORS                                           Yes        No
  Audit/business security logging              Basic       Yes

The service that owns a resource is the authority for resource-level
authorization.

------------------------------------------------------------------------

## 10. Resource Ownership and IDOR Prevention

### 10.1 Identity source

Authenticated identity is always:

``` text
JWT.sub
```

Never use:

``` text
X-User-Id
X-User-Role
```

from the browser as authoritative identity.

Never trust a client-provided `userId` in a request body, query
parameter, or header for ownership.

------------------------------------------------------------------------

### 10.2 Cart ownership

Client-facing cart APIs use `/me`:

``` http
GET    /api/carts/me
POST   /api/carts/me/items
PUT    /api/carts/me/items/{productId}
DELETE /api/carts/me/items/{productId}
DELETE /api/carts/me
```

The service obtains:

``` text
authenticatedUser = JWT.sub
```

and queries the cart belonging to that user.

------------------------------------------------------------------------

### 10.3 Order ownership

For:

``` http
GET /api/orders
```

normal users receive only their own orders.

For:

``` http
GET /api/orders/{id}
```

the service performs:

``` text
authenticatedUser = JWT.sub

order = findOrder(id)

if order does not exist:
    return 404

if order.userId == authenticatedUser:
    return order

if caller has ROLE_ADMIN:
    return order

otherwise:
    return 404
```

A non-admin user must not be able to distinguish another user's order
from a nonexistent order.

Therefore unauthorized ownership failures for individual orders return:

``` text
404 Not Found
```

rather than `403`.

------------------------------------------------------------------------

## 11. Internal Service Communication

### 11.1 Order → Cart

Checkout requires:

``` text
Order Service
      │
      │ GET /internal/carts/{userId}
      ▼
Cart Service
```

The call is direct over the Docker/local service network and bypasses
the Gateway.

### 11.2 JWT forwarding

The locked mechanism is:

``` text
Client
  │ Authorization: Bearer <JWT>
  ▼
Gateway
  │ Authorization: Bearer <same JWT>
  ▼
Order Service
  │ Authorization: Bearer <same JWT>
  ▼
Cart Service
```

Cart Service:

1.  Validates the JWT.
2.  Extracts `JWT.sub`.
3.  Compares it to `{userId}`.
4.  Rejects the request if they do not match.

This deliberately avoids:

-   trusted `X-User-Id` propagation;
-   custom service authentication infrastructure;
-   mTLS;
-   service mesh;
-   OAuth2 Client Credentials.

Those are future hardening options, not baseline requirements.

### 11.3 Internal endpoint isolation

The Gateway must have no route for:

``` text
/internal/**
```

The internal endpoint must not be publicly reachable through the public
API.

------------------------------------------------------------------------

## 12. Checkout Architecture

### 12.1 Normal flow

``` text
Vue
 ↓
Gateway
 ↓
POST /api/orders/checkout
 ↓
Order Service
 ↓
GET /internal/carts/{userId}
 ↓
Cart Service
 ↓
Cart
 ↓
Order Service
 ↓
Calculate total
 ↓
Create immutable order snapshot
 ↓
Clear cart
 ↓
CONFIRMED
```

### 12.2 Idempotency

Every checkout request requires:

``` http
Idempotency-Key: <UUID>
```

The Order Service stores the key with the order.

A unique constraint is required on:

``` text
(userId, idempotencyKey)
```

This must be a database-level uniqueness guarantee, not only a
check-then-insert application pattern.

### 12.3 Repeated requests

Same authenticated user + same idempotency key means the same logical
checkout operation.

``` text
Existing CONFIRMED
    → return existing successful result

Existing PENDING
    → return 409/503 according to the implementation contract;
      do not create another order

Existing FAILED
    → return 409;
      require a new idempotency key

No existing order
    → execute checkout
```

------------------------------------------------------------------------

## 13. Order Lifecycle

Minimum lifecycle:

``` text
PENDING → CONFIRMED
PENDING → FAILED
```

Definitions:

-   `PENDING`: order creation has occurred but cart clearing has not
    completed.
-   `CONFIRMED`: order was created and cart clearing succeeded.
-   `FAILED`: cart clearing failed and compensating deletion also
    failed.

------------------------------------------------------------------------

## 14. Checkout Failure Handling

Checkout crosses independently owned services and databases. It is not a
distributed transaction.

### Case 1 --- Cart retrieval fails

``` text
Order Service → Cart Service
                 ↓
               failure
```

Result:

``` text
503 Service Unavailable
No order created
```

### Case 2 --- Cart is empty

Result:

``` text
400 Bad Request
No order created
```

The baseline API contract may use `409 Conflict` for the empty-cart
business conflict if that is consistently implemented across the
application. The implementation must choose one response and use it
consistently; the locked architecture favors explicit conflict
semantics.

### Case 3 --- Order creation and cart clearing succeed

``` text
Create Order
    ↓
Clear Cart
    ↓
CONFIRMED
```

Return successful checkout result (`200` or `201` according to the
concrete controller contract).

### Case 4 --- Order creation succeeds but cart clearing fails

``` text
Create Order
    ↓
Clear Cart fails
    ↓
Attempt compensating order deletion
```

If compensation succeeds:

``` text
Return checkout failure
```

If compensation also fails:

``` text
Order remains FAILED
Log the failure clearly
Return failure
```

This is best-effort compensation only.

It is not:

-   a distributed transaction;
-   a Saga;
-   event sourcing;
-   a transactional guarantee across MongoDB databases.

------------------------------------------------------------------------

## 15. Cart Clearing Semantics

Clearing a cart is idempotent.

``` http
DELETE /api/carts/me
```

Expected behavior:

``` text
Existing cart → clear → 204

Already empty → 204
```

An empty cart is not a reason to return `404`.

This simplifies checkout retry and compensation behavior.

------------------------------------------------------------------------

## 16. Error Handling

Use a consistent Spring Problem Details / RFC 7807-style error
representation.

Baseline mapping:

  Condition                                   HTTP
  ----------------------------------------- ------
  Invalid request / validation failure         400
  Missing/invalid authentication               401
  Insufficient role                            403
  Unauthorized individual-order ownership      404
  Resource not found                           404
  Empty-cart business conflict                 409
  Duplicate/idempotency conflict               409
  Downstream Cart Service failure              503
  Unexpected backend failure                   500

Never expose:

-   Java stack traces;
-   MongoDB exception details;
-   internal hostnames;
-   secrets;
-   implementation internals

to the browser.

------------------------------------------------------------------------

## 17. Frontend Architecture

### 17.1 Authentication

Vue uses the Keycloak OIDC Authorization Code + PKCE flow.

API requests use:

``` http
Authorization: Bearer <access-token>
```

The ID token is not used as the API credential.

### 17.2 Route guards

Vue route guards may use:

``` text
requiresAuth
requiresRole
```

They exist for user experience.

They are not security boundaries.

### 17.3 Role-aware UI

The frontend may hide controls based on roles.

Example:

``` text
ADMIN → show product management UI
USER  → hide product management UI
```

This must never replace backend authorization.

### 17.4 CORS

CORS is centralized at the Gateway for browser-facing APIs.

The Gateway permits the Vue development origin and appropriate
methods/headers.

The backend services do not need to duplicate public CORS handling when
they are only reachable through the Gateway.

Internal service-to-service traffic does not depend on browser CORS.

### 17.5 CSRF

The application uses bearer access tokens in the `Authorization` header
rather than authentication cookies.

Therefore the baseline API architecture does not require traditional
CSRF protection for bearer-token API authentication.

If authentication later moves to cookies, CSRF protection must be
revisited.

### 17.6 XSS

Vue should:

-   use normal template escaping;
-   avoid `v-html` for untrusted content;
-   avoid persistent token storage;
-   validate/sanitize untrusted input where applicable;
-   apply CSP where practical.

A CSP is a useful hardening measure but must not displace core
authentication, authorization, and ownership tests during the two-hour
implementation.

------------------------------------------------------------------------

## 18. Testing Architecture

Testing must prove the security and business boundaries rather than
merely demonstrate code execution.

### 18.1 Backend --- MUST

Use:

-   JUnit 5.
-   Spring Boot Test.
-   Mockito where appropriate.
-   MockMvc.
-   Spring Security Test.

Critical tests:

1.  Invalid product input is rejected.
2.  USER cannot mutate products.
3.  ADMIN can mutate products.
4.  JWT audience/issuer/expiration failures are rejected where
    integration coverage is available.
5.  Cart ownership cannot cross users.
6.  Order list is restricted to the authenticated user.
7.  Individual order IDOR returns 404.
8.  Internal Cart endpoint rejects mismatched `{userId}` versus
    `JWT.sub`.
9.  Add-to-cart validates product existence.
10. Add-to-cart stores server-side product price.
11. Frontend-supplied price cannot become authoritative.
12. Empty-cart checkout is rejected.
13. Checkout calculates totals server-side.
14. Successful checkout produces an order snapshot.
15. Successful checkout clears the cart.
16. Reusing the same idempotency key does not create a duplicate order.
17. Cart clearing is idempotent.
18. Cart retrieval failure produces controlled failure.
19. Compensation behavior is covered at least at service-level test
    scope.

### 18.2 Frontend

Minimum:

-   Authentication state works.
-   Route guard behavior is sensible.
-   Role-aware UI does not expose invalid controls.
-   API errors are presented safely.

Exhaustive Vue unit coverage is not required.

### 18.3 E2E

A single golden-path Playwright test is the preferred high-value E2E
test:

``` text
Authenticate
 ↓
Browse products
 ↓
Add product
 ↓
Change quantity
 ↓
Checkout
 ↓
Verify order confirmation
 ↓
Verify cart is empty
```

### 18.4 Security tests

Critical security scenarios:

``` text
No token
    → 401

Expired/invalid JWT
    → 401

USER → admin product mutation
    → 403

USER A → USER B cart
    → rejected

USER A → USER B order ID
    → 404

Internal userId ≠ JWT.sub
    → rejected

Client X-User-Id header
    → ignored/untrusted
```

### 18.5 Priority

#### Critical

-   JWT validation.
-   RBAC.
-   Cart ownership.
-   Order IDOR.
-   Price authority.
-   Checkout total.
-   Idempotency.
-   Cart clearing.
-   Checkout failure behavior.

#### Medium

-   Developer/tester role.
-   Route guards.
-   CSP.
-   Unauthorized CORS origin tests.
-   Additional negative E2E cases.
-   Detailed audit logging.

#### Low / Document Only

-   Full contract testing.
-   Distributed tracing integration.
-   Load testing.
-   Full production security platform.
-   Kubernetes/network policy testing.

------------------------------------------------------------------------

## 19. Observability

### 19.1 Logging

Log useful structured/request information such as:

-   timestamp;
-   service;
-   request path;
-   HTTP method;
-   status;
-   correlation ID;
-   authenticated subject where appropriate;
-   error category;
-   checkout/idempotency context where safe.

Never log:

-   access tokens;
-   refresh tokens;
-   client secrets;
-   passwords;
-   unnecessary personal data.

### 19.2 Correlation IDs

The Gateway generates or accepts a correlation/request ID.

That ID is propagated to downstream services.

Conceptually:

``` text
Client
 ↓
Gateway
 └── X-Correlation-ID
      ↓
Product / Cart / Order
      ↓
logs
```

If a client supplies a correlation ID, the implementation should
validate/normalize it rather than allowing unbounded arbitrary log
content.

### 19.3 Health checks

Each backend exposes a health endpoint such as:

``` text
/actuator/health
```

Health checks should verify application availability and relevant local
dependencies without turning the endpoint into a business operation.

### 19.4 Error reporting

For the two-hour project:

-   console logs are sufficient;
-   clear error categories are required;
-   centralized error tracking is optional/future work.

Do not introduce ELK, OpenTelemetry, Jaeger, or similar infrastructure
solely for the demo.

------------------------------------------------------------------------

## 20. Developer / Tester Interface

The `DEVELOPER` role is an explicit testing/development role.

It may support:

-   developer/test scenarios;
-   controlled diagnostics;
-   explicitly authorized test endpoints;
-   test data workflows if implemented.

It must not automatically grant:

``` text
ROLE_ADMIN
```

A developer/test interface is useful but is not part of the critical
checkout path.

If time is constrained, the role and backend authorization remain
implemented while a polished developer dashboard is deferred.

------------------------------------------------------------------------

## 21. Docker and Deployment

### 21.1 Local Compose topology

Docker Compose may run:

``` text
keycloak
mongodb
gateway
product-service
cart-service
order-service
```

The exact choice between running all application containers or running
Spring Boot applications locally is an implementation convenience, not a
reason to change service boundaries.

### 21.2 Environment configuration

Inter-service URLs must be configurable.

Example:

``` yaml
cart-service:
  url: ${CART_SERVICE_URL:http://localhost:8082}
```

Docker:

``` text
CART_SERVICE_URL=http://cart-service:8080
```

Local development:

``` text
CART_SERVICE_URL=http://localhost:8082
```

Never hard-code deployment-specific hostnames into business logic.

### 21.3 Keycloak configuration

Keycloak must be configured consistently with its browser-facing URL,
Docker networking, issuer, and JWKS availability.

Do not substitute the Docker hostname for the JWT issuer unless Keycloak
actually issues that value.

------------------------------------------------------------------------

## 22. CI/CD

A full enterprise pipeline is not required.

A lightweight CI workflow should, when available:

1.  Build backend services.
2.  Run backend tests.
3.  Build the Vue application.
4.  Run lint/compile checks.
5.  Run the critical E2E test when an environment is available.
6.  Produce clear pass/fail output.

Container publishing and deployment automation are optional for the
academic scope.

A complete Kubernetes deployment pipeline is explicitly out of scope.

------------------------------------------------------------------------

## 23. Production Readiness

The project is **production-minded**, not production-ready.

### Included production-minded practices

-   Independent JWT validation.
-   Explicit issuer/audience checks.
-   Backend authorization.
-   Resource ownership enforcement.
-   Server-authoritative prices.
-   Idempotency.
-   Explicit failure states.
-   Bounded downstream timeouts.
-   Restricted retries.
-   Correlation IDs.
-   Health checks.
-   Standardized errors.
-   Environment configuration.
-   Database ownership.
-   Automated critical tests.

### Deferred production hardening

-   OAuth2 Client Credentials for service identity.
-   mTLS.
-   Workload identity.
-   Service mesh.
-   Production secrets manager.
-   Token revocation infrastructure.
-   SIEM.
-   Advanced distributed tracing.
-   Kubernetes network policies.
-   Advanced fraud detection.
-   Stronger transactional checkout consistency.

------------------------------------------------------------------------

## 24. MUST / SHOULD / DOCUMENT ONLY

### MUST IMPLEMENT

-   Three independent backend services.
-   Spring Cloud Gateway.
-   Keycloak.
-   `shopping-cart` realm.
-   SPA public client.
-   Authorization Code + PKCE.
-   JWT access tokens.
-   Gateway JWT validation.
-   Product/Cart/Order JWT validation.
-   Signature, issuer, expiration, and audience validation.
-   `shopping-cart-api` audience.
-   `USER`, `ADMIN`, `DEVELOPER`.
-   Spring Security role conversion.
-   JWT `sub` ownership.
-   `/api/carts/me` APIs.
-   Order ownership checks.
-   404 for unauthorized individual order access.
-   Internal `/internal/carts/{userId}`.
-   JWT forwarding Order → Cart.
-   `{userId} == JWT.sub` validation.
-   No public `/internal/**` Gateway route.
-   Product snapshot in carts.
-   Server-side order totals.
-   Checkout idempotency.
-   Unique `(userId, idempotencyKey)` constraint.
-   `PENDING`, `CONFIRMED`, `FAILED`.
-   Compensating order deletion.
-   Idempotent cart clearing.
-   Independent database ownership.
-   Critical backend security/business tests.
-   Correlation IDs.
-   Health checks.
-   Safe logging.
-   Docker/local environment configuration.

### SHOULD IMPLEMENT

-   Playwright golden-path E2E.
-   Developer/tester UI.
-   Rate limiting if time permits.
-   CSP.
-   Additional negative security tests.
-   Lightweight CI build/test workflow.
-   More detailed audit logging.
-   Automated Keycloak integration verification.

### DOCUMENT ONLY / FUTURE WORK

-   mTLS.
-   OAuth2 Client Credentials/service accounts.
-   Service mesh.
-   Kubernetes.
-   Eureka.
-   Kafka/RabbitMQ.
-   Saga.
-   Distributed transactions.
-   Event sourcing.
-   Redis unless justified.
-   Token revocation infrastructure.
-   Production secrets manager.
-   SIEM.
-   Full OpenTelemetry/Jaeger deployment.
-   Advanced fraud detection.
-   Multi-vendor `STORE_OWNER`.
-   Full contract-testing platform.
-   Full production deployment automation.

------------------------------------------------------------------------

## 25. Non-Goals and Future Work

The baseline does not attempt to solve:

-   Real inventory reservation.
-   Payment processing.
-   Multi-vendor commerce.
-   Distributed transaction guarantees.
-   Strongly consistent cross-service checkout.
-   Advanced pricing revalidation.
-   Refresh-token infrastructure owned by the application.
-   Enterprise service identity.
-   Production-grade secret rotation.
-   Full operational monitoring.

A future evolution may introduce:

``` text
Current
  ↓
Real service identity
  ↓
Stronger checkout consistency
  ↓
Contract testing
  ↓
Distributed tracing
  ↓
Production deployment/orchestration
```

These future changes must preserve the core ownership, authorization,
pricing, and order-snapshot principles.

------------------------------------------------------------------------

## 26. Final Architecture Diagram

``` text
                                ┌───────────────────┐
                                │     Keycloak      │
                                │                   │
                                │ OIDC + PKCE       │
                                │ JWT issuance      │
                                │ Realm roles       │
                                └─────────┬─────────┘
                                          │
                                          │ Access Token
                                          ▼
┌───────────────┐                 ┌───────────────────┐
│   Vue SPA     │ ──────────────► │ Spring Cloud      │
│               │  Bearer JWT     │ Gateway            │
└───────────────┘                 │                   │
                                  │ JWT validation    │
                                  │ Coarse RBAC       │
                                  │ CORS              │
                                  │ Correlation ID    │
                                  └───────┬───────────┘
                                          │
                    ┌─────────────────────┼────────────────────┐
                    │                     │                    │
                    ▼                     ▼                    ▼
             ┌────────────┐       ┌────────────┐       ┌────────────┐
             │  Product   │       │   Cart     │       │   Order    │
             │  Service   │       │  Service   │       │  Service   │
             └─────┬──────┘       └─────┬──────┘       └─────┬──────┘
                   │                    │                    │
                   ▼                    ▼                    ▼
             product_db             cart_db              order_db

                                         ▲
                                         │
                               JWT forwarded directly
                                         │
                                   Order Service
                                         │
                              GET /internal/carts/{userId}
                                         │
                                         ▼
                                   Cart Service
                              userId == JWT.sub
```

------------------------------------------------------------------------

## 27. Implementation Order

The implementation should proceed in dependency order.

### Phase 1 --- Infrastructure

1.  Create repository/monorepo.
2.  Start MongoDB.
3.  Start Keycloak.
4.  Configure `shopping-cart` realm.
5.  Configure SPA client and roles.
6.  Verify the canonical issuer.
7.  Verify a real token can be issued.

### Phase 2 --- Backend skeleton

8.  Create Product Service.
9.  Create Cart Service.
10. Create Order Service.
11. Configure separate logical MongoDB databases.
12. Add Spring Security resource-server configuration.

### Phase 3 --- Gateway

13. Create Spring Cloud Gateway.
14. Configure routes.
15. Configure JWT validation.
16. Configure CORS.
17. Configure correlation ID.
18. Ensure `/internal/**` has no public route.

### Phase 4 --- Product

19. Implement product model/repository.
20. Implement public product reads.
21. Implement admin mutations.
22. Add validation.

### Phase 5 --- Cart

23. Implement `/api/carts/me`.
24. Implement item add/update/remove.
25. Call Product Service when adding.
26. Store product snapshot.
27. Enforce JWT-based ownership.
28. Implement idempotent cart clearing.

### Phase 6 --- Order and checkout

29. Implement order model.
30. Implement `/api/orders`.
31. Implement individual ownership checks.
32. Implement internal Cart API.
33. Forward JWT.
34. Validate `{userId} == JWT.sub`.
35. Implement checkout.
36. Add idempotency key.
37. Add unique `(userId, idempotencyKey)` index.
38. Implement lifecycle and compensation.

### Phase 7 --- Frontend

39. Implement OIDC login.
40. Keep access token in memory.
41. Implement product list.
42. Implement cart UI.
43. Implement checkout.
44. Implement role-aware UI.
45. Implement route guards.

### Phase 8 --- Verification

46. Run critical backend tests.
47. Verify 401/403/404 security behavior.
48. Verify IDOR protection.
49. Verify duplicate checkout behavior.
50. Verify cart clearing.
51. Run the golden-path E2E test if time permits.
52. Verify health endpoints and logs.

------------------------------------------------------------------------

## 28. Internal Consistency Rules

The following rules must hold everywhere in the implementation:

1.  Every public API is routed through the Gateway.
2.  No `/internal/**` endpoint is publicly routed.
3.  Every backend service validates JWTs independently.
4.  `JWT.sub` is the authoritative user identity.
5.  Client identity headers are never trusted.
6.  No service reads another service's database.
7.  Product Service owns current product truth.
8.  Cart owns its product snapshot.
9.  Checkout uses the cart snapshot price.
10. Frontend totals are never authoritative.
11. Order Service owns checkout.
12. Checkout uses an idempotency key.
13. `(userId, idempotencyKey)` is unique.
14. Checkout is not described as atomic.
15. Compensation is best effort.
16. Cart clearing is idempotent.
17. Individual unauthorized order access returns 404 for non-admin
    users.
18. Role-aware UI never replaces backend authorization.
19. The Gateway contains no business logic.
20. Advanced infrastructure remains outside the two-hour baseline.

------------------------------------------------------------------------

## 29. Cross-Document Reconciliation

The three source documents contain one major architectural conflict and
several smaller scope differences.

### Major conflict: Group 3 simplification

Group 3 proposes:

-   no API Gateway;
-   no external Keycloak/OIDC;
-   a development authentication stub;
-   Cart + Order as one deployable application;
-   one MongoDB with `products`, `carts`, and `orders` collections.

Those choices are internally coherent for a strict two-hour sprint, but
they directly contradict the locked architecture supplied for this
consolidation.

Therefore they are **not adopted** in this Master Architecture.

The locked architecture takes precedence:

-   three independent services;
-   Spring Cloud Gateway;
-   Keycloak;
-   OIDC Authorization Code + PKCE;
-   JWT validation at Gateway and services;
-   Order → Cart internal REST;
-   logically separated `product_db`, `cart_db`, and `order_db`.

### API naming

The consolidated contract uses the locked `/api/carts/me` paths rather
than Group 3's shortened `/api/cart` paths.

For orders, the locked contract uses:

``` http
GET /api/orders
GET /api/orders/{id}
```

The optional `/api/orders/me` alias is not required.

### Error handling

Group 3's Problem Details recommendation is retained because it
complements rather than contradicts the locked service architecture.

### Testing

Group 3's emphasis on targeted tests, a single golden-path E2E test, and
cutting UI polish before security/business correctness is retained.

### Observability

Group 1/2's Gateway-based correlation model is retained. Group 3's
recommendation to avoid full tracing/ELK infrastructure is retained.

### Docker

Docker Compose remains the practical local orchestration mechanism. It
may run the complete local stack or infrastructure selectively, but
Docker topology must not collapse the service boundaries.

------------------------------------------------------------------------

## 30. Locked Decisions

The following decisions should not be changed during implementation
unless a genuine technical blocker is discovered.

### Architecture

-   Three independent Spring Boot services: Product, Cart, Order.
-   Spring Cloud Gateway is the public entry point.
-   Each service owns its own logical database.
-   No direct cross-service database access.
-   Synchronous REST is sufficient.
-   Gateway contains no business logic.

### Security

-   Keycloak is the Identity Provider.
-   Realm is `shopping-cart`.
-   SPA is a public client.
-   Authorization Code + PKCE.
-   API audience is `shopping-cart-api`.
-   Roles are `USER`, `ADMIN`, `DEVELOPER`.
-   Access tokens are JWTs.
-   Gateway validates JWTs.
-   Product, Cart, and Order Services independently validate JWTs.
-   Validation includes signature, issuer, expiration, and audience.
-   `JWT.sub` is the canonical user identity.
-   Backend authorization is mandatory.
-   Frontend UI is not a security boundary.
-   Access tokens are not stored in `localStorage`.
-   No custom authentication server.
-   No unnecessary confidential backend client.

### Ownership

-   Cart APIs use `/me`.
-   Order ownership is checked server-side.
-   Unauthorized individual order access returns 404 for non-admin
    users.
-   Client-supplied identity headers are not trusted.
-   Internal Cart access verifies `{userId} == JWT.sub`.

### Internal communication

-   Order → Cart uses direct internal REST.
-   The authenticated JWT is forwarded.
-   `/internal/**` is not exposed through the Gateway.
-   mTLS/client credentials/service mesh are future hardening only.

### Checkout

-   Order Service owns checkout.
-   Checkout uses `Idempotency-Key`.
-   Unique `(userId, idempotencyKey)`.
-   Lifecycle is `PENDING → CONFIRMED` or `PENDING → FAILED`.
-   Cart clearing is idempotent.
-   Failed cart clearing triggers best-effort compensating deletion.
-   Checkout is not a distributed transaction.
-   Checkout is not a Saga.
-   Frontend prices/totals are never authoritative.
-   Checkout uses the cart's server-owned snapshot price.

### Scope

-   Kafka/RabbitMQ/Kubernetes/Eureka/service mesh/mTLS/Saga/event
    sourcing are not baseline requirements.
-   Advanced observability is documented, not implemented.
-   Production secrets management is future work.
-   The project is production-minded, not literally production-ready.

------------------------------------------------------------------------

# Final Position

This Master Architecture preserves the explicitly locked
Product/Cart/Order topology and security model while absorbing the
useful implementation, testing, error-handling, observability, Docker,
and two-hour prioritization guidance from the other documents.

The key reconciliation principle is simple:

> **The two-hour constraint controls how much supporting infrastructure
> is implemented; it does not override the explicitly locked service,
> Gateway, Keycloak, JWT, ownership, and checkout decisions.**

That distinction is the basis for this document being the implementation
source of truth.
