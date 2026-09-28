# Shopping Cart Application
## Consolidated Architecture — Research Group 1: Core Microservice Architecture

**Stack:** Vue.js + Spring Boot + MongoDB  
**Architecture:** Microservices + API Gateway  
**Primary communication:** Synchronous REST  
**Implementation constraint:** Approximately 2 hours  
**Design goal:** Production-minded architecture without unnecessary infrastructure

> **Status: READY — TARGETED CHANGES INCORPORATED**
>
> This document is the Group 1 baseline after architecture research and Claude review. Security-specific decisions, particularly JWT propagation and service-to-service trust, are intentionally deferred to Research Group 2.

---

# 1. Architecture Objective

The application will implement the assignment's required microservice architecture while remaining small enough to build, test, and demonstrate within approximately two hours.

The system consists of:

- Vue.js frontend
- Spring Cloud API Gateway
- Product Service
- Cart Service
- Order Service
- MongoDB
- Authentication/authorization infrastructure, finalized in the security architecture group

The architecture deliberately avoids Kafka/RabbitMQ, Saga orchestration, Eureka, Kubernetes, and separate physical MongoDB deployments because these add substantial implementation and operational complexity without being necessary for the required shopping-cart workflow.

The project should nevertheless demonstrate production-minded principles:

- Clear service ownership
- Database ownership
- API Gateway
- Authentication and RBAC
- Input validation
- Service-to-service timeouts
- Controlled retries
- Idempotent checkout
- Explicit failure handling
- Centralized error handling
- Automated testing
- Request/correlation tracking where practical
- Configuration through environment variables

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Vue.js UI      │
                         │                     │
                         │ Customer UI         │
                         │ Admin UI            │
                         │ Developer/Test UI   │
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS / REST
                                    ▼
                         ┌─────────────────────┐
                         │   API Gateway       │
                         │ Spring Cloud        │
                         │ Gateway              │
                         ├─────────────────────┤
                         │ Routing             │
                         │ Authentication*     │
                         │ Authorization*      │
                         │ CORS                │
                         │ Rate limiting*      │
                         │ Request logging     │
                         │ Correlation ID      │
                         └───────┬─────────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 │               │                │
                 ▼               ▼                ▼
        ┌────────────────┐ ┌───────────────┐ ┌────────────────┐
        │ Product        │ │ Cart          │ │ Order          │
        │ Service        │ │ Service       │ │ Service        │
        │ :8081          │ │ :8082         │ │ :8083          │
        ├────────────────┤ ├───────────────┤ ├────────────────┤
        │ Catalog        │ │ Cart state    │ │ Orders         │
        │ Products       │ │ Cart items    │ │ Checkout       │
        │ Pricing        │ │ Quantities    │ │ Order status   │
        └───────┬────────┘ └──────┬────────┘ └───────┬────────┘
                │                  │                  │
                ▼                  ▼                  ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │ product_db   │   │ cart_db      │   │ order_db     │
        │ MongoDB      │   │ MongoDB      │   │ MongoDB      │
        └──────────────┘   └──────────────┘   └──────────────┘


             Service-to-service communication

                    Order Service
                         │
                         │ internal REST
                         ▼
                    Cart Service
```

`*` The exact authentication, authorization, and service-to-service trust mechanism is finalized in Research Group 2.

---

# 3. Service Boundaries

## 3.1 Product Service

### Responsibility

The Product Service is the sole owner of product catalog information.

### Product model

```text
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

### Responsibilities

- Create products
- Update products
- Delete/deactivate products
- Retrieve products
- Retrieve individual products
- Search/filter products if implemented
- Validate product information
- Maintain current product price

### Example APIs

```text
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

Administrative endpoints must be protected by RBAC.

---

# 4. Cart Service

The Cart Service owns all user cart state.

### Cart model

```text
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

### Responsibilities

- Retrieve a user's cart
- Add product to cart
- Update quantity
- Remove item
- Clear cart
- Calculate cart subtotal
- Validate ownership
- Validate product existence/availability when adding an item

### Client-facing APIs

```text
GET    /api/carts/me
POST   /api/carts/me/items
PUT    /api/carts/me/items/{productId}
DELETE /api/carts/me/items/{productId}
DELETE /api/carts/me
```

The API derives the user identity from the authenticated security context rather than trusting a user ID supplied by the browser.

### Internal API

Order Service requires a service-to-service mechanism to retrieve a specific user's cart.

The architecture therefore defines an internal endpoint conceptually as:

```text
GET /internal/carts/{userId}
```

This endpoint is **not intended to be exposed through the public API Gateway**.

The exact authentication/trust mechanism for this internal endpoint is intentionally deferred to Research Group 2.

### Product validation

When an item is added:

```text
Client
  ↓
Cart Service
  ↓
Product Service
  ↓
Validate product exists + is active
  ↓
Store cart snapshot
```

Cart Service should **not** call Product Service on every cart read. This prevents Product Service from becoming an unnecessary runtime dependency for displaying a cart.

---

# 5. Order Service

The Order Service owns the order lifecycle and checkout operation.

### Order model

```text
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

### Responsibilities

- Checkout
- Create orders
- Retrieve user's orders
- Maintain order status
- Preserve historical purchase information
- Prevent duplicate checkout requests
- Calculate totals server-side

### Example APIs

```text
POST /api/orders/checkout
GET  /api/orders
GET  /api/orders/{id}
```

Administrative users may receive additional order-management endpoints.

---

# 6. Database Architecture

MongoDB will use a **single MongoDB deployment with logically separated databases**.

```text
MongoDB
│
├── product_db
│   └── products
│
├── cart_db
│   └── carts
│
└── order_db
    └── orders
```

Each microservice connects only to its own database.

```text
Product Service ──→ product_db

Cart Service ─────→ cart_db

Order Service ─────→ order_db
```

No service directly reads or writes another service's MongoDB database.

For example:

```text
❌ Cart Service → order_db.orders

❌ Order Service → cart_db.carts

❌ Product Service → cart_db.carts
```

Instead:

```text
Order Service
      │
      │ internal REST
      ▼
Cart Service
      │
      ▼
cart_db
```

This preserves logical database ownership while avoiding the operational overhead of running three independent MongoDB deployments.

---

# 7. Product Information in Carts and Orders

Cart items contain a **product snapshot** rather than only a product ID.

Example:

```json
{
  "productId": "P1001",
  "productName": "Wireless Mouse",
  "unitPrice": 799.00,
  "quantity": 2
}
```

This allows the Cart Service to display the cart without calling Product Service for every read.

The snapshot is **not authoritative product data**.

The Product Service remains the source of truth for the current catalog.

## Price behavior

For this two-hour project, the cart snapshot price will be used during checkout.

The system will **not revalidate the product price at checkout** in the baseline implementation.

This is a deliberate scope decision:

> If the product price changes after the item is added to the cart, the checkout uses the price stored in the cart snapshot.

This should be documented as a known limitation rather than left as an unspecified optional behavior.

A future production implementation could revalidate current pricing during checkout and return a price-change conflict requiring user confirmation.

---

# 8. Checkout Architecture

Checkout is owned by the Order Service.

```text
Vue.js
   │
   │ POST /api/orders/checkout
   │ Idempotency-Key: <UUID>
   ▼
API Gateway
   │
   ▼
Order Service
   │
   │ GET /internal/carts/{userId}
   ▼
Cart Service
   │
   ▼
cart_db

Cart returned
   │
   ▼
Order Service
   │
   ├── Validate cart
   ├── Calculate total
   ├── Create immutable order snapshot
   └── Persist order
          │
          ▼
       order_db
          │
          │ clear cart
          ▼
     Cart Service
```

The exact authentication/trust mechanism for the internal Cart request is defined by the Security Architecture Group.

---

# 9. Checkout Idempotency and Order Status

Checkout is a non-idempotent operation and must not be blindly retried.

The frontend generates a UUID for each logical checkout attempt and sends it using an idempotency header:

```http
POST /api/orders/checkout
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

The Order Service stores this key with the order.

A unique constraint is maintained on:

```text
(userId, idempotencyKey)
```

This prevents the same user from creating multiple orders from repeated requests using the same key.

## Order Status

The minimum order lifecycle is:

```text
PENDING
   ↓
CONFIRMED
```

or, if checkout fails and compensation also fails:

```text
PENDING
   ↓
FAILED
```

- `PENDING` — order has been created, but cart clearing has not yet completed.
- `CONFIRMED` — order was created and cart clearing succeeded.
- `FAILED` — cart clearing failed and the compensating order deletion also failed.

If cart clearing fails, the service first attempts the best-effort compensating deletion described in the checkout failure contract. If that deletion also fails, the order remains recorded with status `FAILED` so that the failed checkout is distinguishable from a confirmed order.

## Repeated Request Behavior

If the same authenticated user submits the same idempotency key again, the service uses the existing order state rather than creating another order:

```text
Existing CONFIRMED order
        ↓
Return the existing successful checkout result

Existing PENDING order
        ↓
Return 409/503 indicating the checkout is
still in progress or requires recovery

Existing FAILED order
        ↓
Return 409 indicating the previous checkout failed;
a new checkout requires a new idempotency key

No existing order
        ↓
Proceed with checkout
```

The semantic contract is:

> **Same authenticated user + same idempotency key → same logical checkout operation, with the response determined by the existing order state.**

This protects against double-clicks, frontend retries, and HTTP timeouts while keeping failed and confirmed orders distinguishable.


# 10. Checkout Failure Contract

Checkout crosses two independently owned services/databases, so it is **not an atomic distributed transaction**.

The failure behavior is explicitly defined.

## Case 1 — Cart retrieval fails

```text
Order Service → Cart Service
                 ↓
              failure
```

Result:

```text
503 Service Unavailable
No order created
```

---

## Case 2 — Cart is empty

```text
Cart Service → empty cart
```

Result:

```text
400 Bad Request
No order created
```

---

## Case 3 — Order creation succeeds and cart clearing succeeds

```text
Create Order
    ↓
Clear Cart
    ↓
SUCCESS
```

Order status:

```text
CONFIRMED
```

Result:

```text
200/201 + order
```

---

## Case 4 — Order creation succeeds but cart clearing fails

```text
Create Order
    ↓
Clear Cart fails
    ↓
Attempt compensating order deletion
    ↓
Return 503
```

The compensating deletion is **best-effort**.

This is not a distributed transaction and does not provide the guarantees of a Saga.

It is a deliberately lightweight mechanism appropriate for the project's scope.

If the compensating delete itself fails, the implementation must log the failure clearly. The order remains with status `FAILED` and must not silently be presented as a successful checkout.

# 11. Cart Clearing Semantics

Cart clearing should be idempotent.

Therefore:

```text
DELETE /api/carts/me
```

should succeed even if the cart is already empty.

For example:

```text
Existing cart → clear → 204

Already empty → clear → 204
```

The operation should not return `404` merely because there are currently no items.

This makes the checkout compensation/retry behavior easier to reason about.

---

# 12. Order Status

The Order document contains an explicit lifecycle status.

Minimum baseline states:

```text
CONFIRMED
FAILED
```

`CONFIRMED` means:

- order was created successfully,
- cart clearing completed successfully.

`FAILED` is available for explicit failure handling/logging where an order record must exist temporarily.

The baseline compensation path attempts to remove an order created before a failed cart clear. Therefore, the `FAILED` state is primarily a safety/failure representation rather than a replacement for transactional guarantees.

Future versions could introduce richer states such as:

```text
PENDING
CONFIRMED
CANCELLED
FAILED
```

but the two-hour implementation should avoid unnecessary lifecycle complexity.

---

# 13. Inter-Service Communication

The default communication mechanism is **synchronous HTTP REST**.

### Communication map

```text
Frontend
   │
   ▼
Gateway
   │
   ├──→ Product Service
   │
   ├──→ Cart Service
   │
   └──→ Order Service
             │
             └──→ Cart Service
```

The architecture does not require Kafka, RabbitMQ, or another message broker.

### Why REST?

- Native fit with Spring Boot
- Simple to debug
- Easy to test using Postman/curl
- Low infrastructure overhead
- Appropriate for the limited workflow
- Achievable within the time constraint

---

# 14. API Gateway

Spring Cloud Gateway is the single external backend entry point.

The Vue application should **not directly communicate with individual microservices**.

```text
Vue
 │
 ▼
Gateway
 │
 ├── /api/products/** → Product Service
 ├── /api/carts/**    → Cart Service
 └── /api/orders/**   → Order Service
```

### Gateway responsibilities

- Routing
- Authentication, subject to Security Group 2 design
- Coarse route-level authorization, subject to Security Group 2 design
- CORS
- Request logging
- Correlation IDs
- Basic rate limiting if implemented
- Global error handling
- Gateway-level timeout configuration

### Gateway must NOT contain

- Product business logic
- Cart calculations
- Order creation
- Product validation rules
- Fine-grained resource authorization

Business logic remains inside the owning service.

---

# 15. Authentication and Service-to-Service Identity

The architecture establishes an important requirement but deliberately does not lock the implementation before the Security Group completes its research.

The Order Service must know **which authenticated user is performing checkout**.

It must then retrieve that user's cart through the internal Cart API.

The following implementation choices remain open:

### Option A — Services validate JWTs independently

```text
Client
  ↓ JWT
Gateway
  ↓ JWT
Order Service
  ↓ JWT / trusted identity
Cart Service
```

### Option B — Gateway establishes trusted identity context

```text
Client
  ↓ JWT
Gateway
  ↓ trusted identity
Order Service
  ↓ trusted service identity
Cart Service
```

The architecture explicitly rejects the assumption that an arbitrary client-supplied header such as:

```text
X-User-Id: 123
```

is trustworthy.

The Security Architecture Group will determine:

- JWT validation location
- token propagation
- service-to-service authentication
- internal endpoint protection
- trusted identity propagation
- role claims
- key management

This decision must be finalized before implementation of secured inter-service calls.

---

# 16. Resource Ownership

Authenticated user identity must be derived from the security context.

The system should prefer:

```text
GET /api/carts/me
GET /api/orders
```

rather than allowing the browser to choose another user's ID:

```text
GET /api/carts/{arbitraryUserId}
```

unless the endpoint is explicitly an authorized administrative endpoint.

The backend must never rely on:

```json
{
  "userId": "someone-else"
}
```

to determine ownership.

This prevents horizontal privilege escalation / IDOR-style vulnerabilities.

---

# 17. Service Discovery

No Eureka server will be introduced for the initial implementation.

## Local development

```text
Gateway         → localhost:8080
Product Service → localhost:8081
Cart Service    → localhost:8082
Order Service   → localhost:8083
```

## Docker Compose

Each service can run on its internal port:

```text
gateway:8080
product-service:8080
cart-service:8080
order-service:8080
```

Docker's internal DNS resolves service names.

The application must **not hard-code service URLs**.

For example:

```yaml
cart-service:
  url: ${CART_SERVICE_URL:http://localhost:8082}
```

Local environment:

```text
CART_SERVICE_URL=http://localhost:8082
```

Docker Compose:

```text
CART_SERVICE_URL=http://cart-service:8080
```

The same pattern should be used for all inter-service URLs.

This allows the same application code/configuration structure to work in both local and containerized environments.

---

# 18. Resilience

## Timeouts

Every inter-service HTTP request must have a bounded timeout.

Example:

```text
Order Service
      │
      │ request
      ▼
Cart Service
      │
      X unavailable
      │
      ▼
timeout
      │
      ▼
controlled 503 response
```

The system must not allow an unavailable downstream service to hold a request indefinitely.

## Retries

Retries may be used for safe/idempotent operations.

They should:

- Be limited
- Use backoff where appropriate
- Apply primarily to safe/idempotent requests
- Never blindly retry checkout/order creation

For example:

```text
GET cart
→ potentially safe to retry

POST create order
→ do NOT blindly retry
```

Checkout is protected by an explicit idempotency mechanism instead.

## Circuit breaker

Resilience4j circuit breaking remains optional.

It should only be considered after all core functionality and tests are working.

---

# 19. Error Handling

Services should return predictable HTTP responses.

```text
400 Bad Request
→ Invalid input

401 Unauthorized
→ Authentication missing/invalid

403 Forbidden
→ Authenticated but insufficient permissions

404 Not Found
→ Resource does not exist

409 Conflict
→ Resource/business-state conflict

503 Service Unavailable
→ Required downstream service unavailable

500 Internal Server Error
→ Unexpected server-side failure
```

Internal stack traces and sensitive implementation details must not be exposed to the frontend.

A standardized error response format will be finalized in the testing/production-readiness architecture group.

---

# 20. Configuration

Environment-specific values must not be hard-coded into business logic.

Examples:

```text
PRODUCT_SERVICE_URL
CART_SERVICE_URL
ORDER_SERVICE_URL
MONGODB_URI
JWT_ISSUER
JWT_PUBLIC_KEY / signing configuration
```

Development configuration can use `application.yml` with environment-variable overrides.

Each service must explicitly select its own MongoDB database.

Example:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/product_db
```

The equivalent Cart and Order configurations must use:

```text
cart_db
order_db
```

respectively.

This prevents the accidental situation where all services connect to the same default MongoDB database.

---

# 21. Architectural Alternatives Considered

## Alternative A — Monolith

```text
Vue
 ↓
Spring Boot
 ↓
MongoDB
```

### Advantages

- Fastest implementation
- Simplest testing
- Simplest transactions

### Decision

Rejected because the assignment explicitly requires microservice architecture.

---

## Alternative B — Microservices + REST

```text
Vue
 ↓
Gateway
 ↓
Product / Cart / Order
 ↓
MongoDB
```

### Decision

**Selected as the baseline architecture.**

It satisfies the assignment while remaining achievable within the available time.

---

## Alternative C — Event-Driven Microservices

```text
Services
   ↓
Kafka/RabbitMQ
   ↓
Events
   ↓
Consumers/Saga
```

### Decision

Not selected for the initial implementation.

It introduces:

- Message broker infrastructure
- Event schemas
- Consumer management
- Retry/DLQ handling
- Eventual consistency
- Additional idempotency requirements
- Saga complexity

These are useful production patterns but are not required for this application's limited workflow.

---

# 22. Explicit Non-Goals

The following are intentionally outside the initial implementation:

- Kafka
- RabbitMQ
- Saga orchestration
- Eureka
- Kubernetes
- Separate physical MongoDB deployments
- Payment gateway
- Real inventory reservation
- Distributed transactions
- Complex event sourcing
- Advanced recommendation systems
- Full-text search infrastructure
- Advanced price revalidation
- Full production observability stack

They may be documented as future extensions.

---

# 23. Production-Minded Features Required

## Architecture

- [ ] Independent Product Service
- [ ] Independent Cart Service
- [ ] Independent Order Service
- [ ] API Gateway
- [ ] Database ownership
- [ ] Internal service API for checkout
- [ ] Environment-based service URLs

## Security

- [ ] Authentication
- [ ] RBAC
- [ ] Resource ownership validation
- [ ] No client-controlled authorization decisions
- [ ] Secure service-to-service identity
- [ ] Protected internal endpoints

## Reliability

- [ ] HTTP timeouts
- [ ] Controlled retries
- [ ] Idempotent checkout
- [ ] Explicit checkout failure contract
- [ ] Best-effort compensation
- [ ] Idempotent cart clearing
- [ ] Proper error responses

## Development quality

- [ ] DTOs rather than exposing persistence models directly
- [ ] Input validation
- [ ] Centralized exception handling
- [ ] Configuration through environment variables
- [ ] Structured logging where practical
- [ ] Correlation/request IDs where practical

## Testing

The final architecture must support:

- Unit tests
- Controller/API tests
- Service-layer tests
- Repository tests
- Security tests
- Integration tests
- Inter-service communication tests
- End-to-end frontend/backend tests
- Negative tests
- RBAC tests

The exact testing architecture is finalized in Research Group 3.

---

# 24. Target Project Structure

```text
shopping-cart/
│
├── frontend/
│   └── Vue.js application
│
├── gateway/
│   └── Spring Cloud Gateway
│
├── product-service/
│   └── Spring Boot application
│
├── cart-service/
│   └── Spring Boot application
│
├── order-service/
│   └── Spring Boot application
│
├── docker-compose.yml
│
└── README.md
```

Each service should internally follow a consistent structure:

```text
src/
└── main/
    └── java/
        └── ...
            ├── controller/
            ├── service/
            ├── repository/
            ├── model/
            ├── dto/
            ├── exception/
            └── config/
```

The exact package structure may be refined during implementation.

---

# 25. Final Group 1 Architecture Decision

The baseline architecture is:

```text
                    ┌─────────────────┐
                    │     Vue.js      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  API Gateway    │
                    │ Spring Cloud    │
                    │    Gateway      │
                    └───────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Product  │  │   Cart   │  │  Order   │
        │ Service  │  │ Service  │  │ Service  │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             ▼             ▼             ▼
        product_db     cart_db       order_db
             \             │            /
              \            │           /
               └──── MongoDB ─────────┘

Inter-service:
    Cart Service → Product Service
    Order Service ──REST──→ Cart Service
```

### Locked architectural principles

1. **Each service owns its domain.**
2. **Each service owns its database.**
3. **Services never directly access another service's database.**
4. **The Gateway is the external entry point.**
5. **The Gateway handles cross-cutting concerns, not business logic.**
6. **Services enforce their own business authorization.**
7. **REST is the primary inter-service communication mechanism.**
8. **Checkout belongs to Order Service.**
9. **Orders contain immutable product/price snapshots.**
10. **Checkout uses an idempotency key.**
11. **Checkout failure behavior is explicitly defined.**
12. **Cart clearing is idempotent.**
13. **Inter-service URLs are environment-configurable.**
14. **Timeouts are required for downstream calls.**
15. **Retries are restricted to operations where they are safe.**
16. **No blind retry of checkout/order creation.**
17. **Cross-service checkout is not treated as an atomic distributed transaction.**
18. **Best-effort compensation is used instead of Saga/distributed transactions.**
19. **JWT/service-to-service trust architecture is deferred to Group 2.**
20. **Advanced distributed-system infrastructure is deliberately deferred.**

---

# 26. Decisions Deferred to Research Groups 2 and 3

## Research Group 2 — Security

Must finalize:

- OAuth/OIDC provider
- OAuth flow
- JWT architecture
- JWT validation location
- Token propagation
- Service-to-service authentication
- Internal endpoint protection
- Role model
- RBAC permissions
- Gateway vs service authorization
- Frontend token handling
- CORS/CSRF considerations
- Security testing

## Research Group 3 — Testing & Production Readiness

Must finalize:

- Backend testing strategy
- Frontend testing strategy
- E2E strategy
- Critical/Medium/Low test matrix
- Error response standardization
- Logging
- Correlation IDs
- Health checks
- Developer/Tester dashboard
- Docker strategy
- CI/CD
- Production-readiness checklist

---

# 27. Scope Principle

The goal is **production-minded**, not literally production-ready.

The architecture should demonstrate that the team understands:

- service boundaries,
- ownership,
- authentication,
- authorization,
- failure handling,
- idempotency,
- testing,
- configuration,
- and operational concerns,

without introducing infrastructure whose implementation cost is disproportionate to the application.

The project should prioritize **correctness and demonstrable engineering maturity over the number of technologies used**.
