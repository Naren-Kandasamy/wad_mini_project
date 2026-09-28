# Shopping Cart Application

## Consolidated Architecture — Research Group 1: Core Microservice Architecture

**Stack:** Vue.js + Spring Boot + MongoDB
**Architecture:** Microservices + API Gateway
**Primary communication:** Synchronous REST
**Deployment target:** Local/Docker-friendly prototype
**Implementation constraint:** ~2 hours
**Design goal:** Production-minded architecture without unnecessary infrastructure

---

# 1. Architecture Objective

The application will implement the assignment's required microservice architecture while keeping the system small enough to build, test, and demonstrate within approximately two hours.

The system will consist of:

* Vue.js frontend
* Spring Cloud API Gateway
* Product Service
* Cart Service
* Order Service
* MongoDB
* Authentication/authorization infrastructure, covered in the security architecture group

The architecture deliberately avoids introducing Kafka/RabbitMQ, Saga orchestration, Eureka, Kubernetes, or separate MongoDB deployments because these components add substantial implementation and operational complexity without being necessary for the required shopping-cart workflow.

The architecture should nevertheless demonstrate production-minded principles:

* Clear service ownership
* Database isolation
* API Gateway
* Authentication
* RBAC
* Input validation
* Service-to-service timeouts
* Controlled retries
* Idempotent checkout
* Error handling
* Automated testing
* Observable request flow
* Clean separation between business logic and infrastructure

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Vue.js UI      │
                         │                     │
                         │ Customer UI         │
                         │ Admin UI             │
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
                         │ JWT validation      │
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
        │ Products       │ │ Cart items    │ │ Order history  │
        │ Pricing        │ │ Quantities    │ │ Checkout       │
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
                         │ GET cart
                         ▼
                    Cart Service
```

`*` Rate limiting is an optional enhancement if implementation time permits.

---

# 3. Service Boundaries

## 3.1 Product Service

### Responsibility

The Product Service is the sole owner of product catalog information.

### Owns

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

* Create products
* Update products
* Delete/deactivate products
* Retrieve products
* Retrieve individual products
* Search/filter products if implemented
* Validate product information
* Maintain current product price

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

### Owns

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

* Retrieve user's cart
* Add product to cart
* Update quantity
* Remove item
* Clear cart
* Calculate cart subtotal
* Ensure users can access only their own carts

### Example APIs

```text
GET    /api/carts/me
POST   /api/carts/me/items
PUT    /api/carts/me/items/{productId}
DELETE /api/carts/me/items/{productId}
DELETE /api/carts/me
```

The API should derive the user identity from the authenticated security context rather than trusting a user ID supplied by the browser.

---

# 5. Order Service

The Order Service owns the order lifecycle.

### Owns

```text
Order
├── id
├── userId
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

* Checkout
* Create orders
* Retrieve user's orders
* Maintain order status
* Preserve historical purchase information
* Prevent duplicate checkout where possible

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
      │ REST
      ▼
Cart Service
      │
      ▼
cart_db
```

This preserves logical database ownership while avoiding the operational overhead of running three independent MongoDB deployments.

---

# 7. Product Information in Cart

Cart items will contain a **product snapshot** rather than only a product ID.

Example:

```json
{
  "productId": "P1001",
  "productName": "Wireless Mouse",
  "unitPrice": 799.00,
  "quantity": 2
}
```

This means the cart can display the product name and price without requiring Product Service to be available for every cart retrieval.

However, the cart snapshot is **not authoritative product data**.

The Product Service remains the source of truth for the current catalog.

---

# 8. Checkout Architecture

Checkout is owned by the Order Service.

```text
Vue.js
   │
   │ POST /api/orders/checkout
   ▼
API Gateway
   │
   ▼
Order Service
   │
   │ GET /api/carts/me
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
   ├── Create immutable order snapshot
   ├── Calculate total
   └── Persist order
          │
          ▼
       order_db
```

After successful order creation, the Cart Service is instructed to clear the cart.

The order contains its own snapshot of:

* Product ID
* Product name
* Unit price
* Quantity
* Total

Therefore, later product changes do not modify historical orders.

---

# 9. Checkout Consistency

The project will **not** implement a full distributed transaction or Saga architecture.

Instead, checkout will use:

1. Synchronous REST
2. Explicit timeouts
3. Limited retries for transient failures
4. Validation
5. Idempotency protection where practical
6. Clear failure responses

Potential failure:

```text
Order created
      ↓
Cart clearing fails
      ↓
Order exists + cart still exists
```

The implementation should prevent duplicate orders through an idempotency mechanism or checkout-state check where practical.

A complete distributed transaction mechanism is outside the scope of this two-hour implementation.

---

# 10. Inter-Service Communication

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

* Native fit with Spring Boot
* Simple to debug
* Easy to test using Postman/curl
* Low infrastructure overhead
* Appropriate for the limited workflow
* Keeps implementation achievable within the time constraint

---

# 11. API Gateway

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

The Gateway handles:

* Routing
* Authentication/token validation
* Coarse route-level authorization
* CORS
* Request logging
* Correlation IDs
* Basic rate limiting if implemented
* Global error handling
* Gateway-level timeout configuration

### Gateway must NOT contain

* Product business logic
* Cart calculations
* Order creation
* Product validation rules
* Fine-grained resource authorization

Business logic remains inside the owning service.

---

# 12. Authorization Boundary

Authentication and RBAC will be addressed in detail by the security architecture.

The architectural rule established here is:

```text
Gateway
    ↓
Coarse route authorization

Service
    ↓
Fine-grained authorization
```

Example:

```text
POST /api/products
        ↓
Gateway checks authenticated role
        ↓
Product Service performs final authorization
```

For user-owned resources:

```text
GET /api/carts/me
        ↓
Cart Service
        ↓
authenticated user's identity
        ↓
retrieve only that user's cart
```

The backend must never trust:

```text
userId = request.body.userId
```

when determining ownership.

---

# 13. Service Discovery

No Eureka server will be introduced for the initial implementation.

For local development:

```text
Product Service → localhost:8081
Cart Service    → localhost:8082
Order Service   → localhost:8083
Gateway         → localhost:8080
```

For Docker Compose:

```text
product-service:8080
cart-service:8080
order-service:8080
gateway:8080
```

Docker's internal DNS can resolve service names.

This preserves the option to introduce proper service discovery later without making it a requirement for the prototype.

---

# 14. Resilience

The minimum resilience layer is:

### Timeouts

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

The system must not allow a failed downstream service to hold a request indefinitely.

### Retries

Retries may be used for transient failures.

They should:

* Be limited
* Use backoff
* Apply only to safe/idempotent operations
* Never blindly retry order creation

This distinction is important.

```text
GET cart
→ retry potentially safe

POST create order
→ do NOT blindly retry
```

### Circuit breaker

Resilience4j circuit breaking is an optional enhancement if sufficient time remains after the core functionality and tests are complete.

---

# 15. Error Handling

Services should return predictable HTTP responses.

Example:

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
→ Duplicate/conflicting operation

503 Service Unavailable
→ Required downstream service unavailable

500 Internal Server Error
→ Unexpected server-side failure
```

Internal stack traces and sensitive implementation details must not be exposed to the frontend.

---

# 16. Configuration

Environment-specific values must not be hard-coded into business logic.

Examples:

```text
PRODUCT_SERVICE_URL
CART_SERVICE_URL
ORDER_SERVICE_URL
MONGODB_URI
JWT_ISSUER
JWT_SECRET / public-key configuration
```

Development configuration can use `application.yml` and environment variables.

---

# 17. Architectural Alternatives Considered

## Alternative A — Monolith

```text
Vue
 ↓
Spring Boot
 ↓
MongoDB
```

Advantages:

* Fastest implementation
* Simplest testing
* Simplest transactions

Rejected because the assignment explicitly asks for microservice architecture.

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

Selected as the baseline architecture.

It satisfies the assignment while remaining implementable within the available time.

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

Not selected for the initial implementation.

It introduces:

* Message broker infrastructure
* Event schemas
* Consumer management
* Retry/DLQ handling
* Eventual consistency
* Idempotency requirements
* Saga complexity

These are valuable production patterns but are not required for this application's limited workflow.

---

# 18. Explicit Non-Goals

The following are intentionally outside the initial implementation:

* Kafka
* RabbitMQ
* Saga orchestration
* Eureka
* Kubernetes
* Separate physical MongoDB deployments
* Payment gateway
* Real inventory reservation
* Distributed transactions
* Complex event sourcing
* Advanced recommendation systems
* Full-text search infrastructure

They may be documented as future extensions.

---

# 19. Production-Minded Features Required

Although this is a mini-project, the implementation should demonstrate:

### Architecture

* [ ] Independent Product Service
* [ ] Independent Cart Service
* [ ] Independent Order Service
* [ ] API Gateway
* [ ] Database ownership

### Security

* [ ] Authentication
* [ ] RBAC
* [ ] Resource ownership validation
* [ ] No client-controlled authorization decisions

### Reliability

* [ ] HTTP timeouts
* [ ] Controlled retries
* [ ] Idempotent checkout protection
* [ ] Proper error responses

### Development quality

* [ ] DTOs rather than exposing persistence models directly
* [ ] Input validation
* [ ] Centralized exception handling
* [ ] Configuration through environment variables
* [ ] Structured logging
* [ ] Correlation/request IDs where practical

### Testing

The architecture must support:

* Unit tests
* Controller/API tests
* Service-layer tests
* Repository tests
* Security tests
* Integration tests
* Inter-service communication tests
* End-to-end frontend/backend tests
* Negative tests
* RBAC tests

---

# 20. Target Project Structure

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

# 21. Final Architecture Decision

The baseline architecture is therefore:

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
             \             │             /
              \            │            /
               └──── MongoDB ──────────┘

Inter-service:
    Order Service ──REST──→ Cart Service
```

### Architectural principles

1. **Each service owns its domain.**
2. **Each service owns its database.**
3. **Services never directly access another service's database.**
4. **The Gateway is the external entry point.**
5. **The Gateway handles cross-cutting concerns, not business logic.**
6. **Services perform their own business authorization.**
7. **REST is the primary inter-service communication mechanism.**
8. **Checkout belongs to Order Service.**
9. **Orders contain immutable product/price snapshots.**
10. **Timeouts and controlled retries are mandatory resilience mechanisms.**
11. **Advanced distributed-system infrastructure is deliberately deferred.**
12. **Security and testing are first-class architectural concerns, not afterthoughts.**

---

# 22. Open Decisions for Subsequent Architecture Groups

The following are intentionally left for the next research groups rather than being prematurely decided here:

* OAuth provider and OAuth flow
* JWT architecture
* RBAC role model
* Admin permissions
* Developer/tester role
* Token storage
* Frontend route guards
* Backend authorization implementation
* Security testing
* Testing architecture
* Manual developer testing interface
* Integration/E2E testing strategy
* Observability and monitoring
* Deployment/CI/CD

```

**This is the document I would send to Claude**, not the raw Perplexity research.

The important distinction is:

**Perplexity → evidence/research → us → architectural decisions → Claude → architecture validation → revise → implementation.**

And I would **not yet call this final architecture**. This is the **Group 1 candidate architecture**. Claude's job is specifically to attack it: find contradictions, missing production concerns, bad assumptions, unnecessary complexity, and blockers against the 2-hour constraint.

Then we move to **Research Group 2 (authentication/OAuth/RBAC/security)** and eventually merge the validated groups into one master architecture.
```
