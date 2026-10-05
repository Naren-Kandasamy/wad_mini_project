/**
 * End-to-End (E2E) Integration & Security Test Suite
 * Validates the complete Shopping Cart microservices architecture:
 * 1. Frontend Nginx reverse proxy & static asset delivery
 * 2. API Gateway unauthenticated routing (/api/me, /api/products)
 * 3. Microservice inter-communication & MongoDB persistence
 * 4. Shopping workflow: catalog -> cart -> checkout -> order history
 * 5. Security & anti-tampering enforcement:
 *    - Server-side price computation
 *    - IDOR rejection (HTTP 403)
 *    - Empty checkout validation (HTTP 400)
 */

const FRONTEND_URL = 'http://localhost:80';
const GATEWAY_URL = 'http://localhost:8080';
const USER_SERVICE_URL = 'http://localhost:8081';
const PRODUCT_SERVICE_URL = 'http://localhost:8082';
const CART_SERVICE_URL = 'http://localhost:8083';
const ORDER_SERVICE_URL = 'http://localhost:8084';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('=== STARTING END-TO-END (E2E) TEST SUITE ===\n');

  // Test 1: Frontend Static Assets
  console.log('Test Scenario 1: Frontend & Gateway Public Ingress');
  try {
    const res = await fetch(`${FRONTEND_URL}/`);
    assert(res.status === 200, `Frontend root returns HTTP 200 (Got ${res.status})`);
    const html = await res.text();
    assert(html.includes('Shopping Cart'), `Frontend HTML contains application title`);
  } catch (err) {
    assert(false, `Frontend root accessible: ${err.message}`);
  }

  // Test 2: Unauthenticated Auth Check via Gateway
  try {
    const res = await fetch(`${FRONTEND_URL}/api/me`);
    assert(res.status === 200, `GET /api/me returns HTTP 200`);
    const data = await res.json();
    assert(data.authenticated === false, `Unauthenticated visitor reports { authenticated: false }`);
  } catch (err) {
    assert(false, `GET /api/me accessible: ${err.message}`);
  }

  // Test 3: Public Catalog Query via Nginx -> Gateway -> Product Service
  console.log('\nTest Scenario 2: Catalog Discovery via API Gateway');
  let testProduct;
  try {
    // Seed test product directly
    const createRes = await fetch(`${PRODUCT_SERVICE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Noise Cancelling Headphones',
        description: 'Active ANC wireless over-ear headphones',
        price: 150.00,
        imageUrl: 'http://example.com/anc.png'
      })
    });
    testProduct = await createRes.json();
    assert(testProduct && testProduct.id, `Created product with ID: ${testProduct?.id}`);

    // Fetch via Frontend Proxy
    const catalogRes = await fetch(`${FRONTEND_URL}/api/products`);
    assert(catalogRes.status === 200, `GET /api/products returns HTTP 200`);
    const catalog = await catalogRes.json();
    assert(Array.isArray(catalog) && catalog.some(p => p.id === testProduct.id), `Catalog includes newly seeded product`);
  } catch (err) {
    assert(false, `Product catalog discovery: ${err.message}`);
  }

  // Test 4: User Sync
  console.log('\nTest Scenario 3: User Identity Synchronization');
  const testUserEmail = 'shopper.e2e@ssn.edu.in';
  try {
    const syncRes = await fetch(`${USER_SERVICE_URL}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, name: 'E2E Shopper' })
    });
    assert(syncRes.status === 200, `POST /api/users/sync returns HTTP 200`);
    const user = await syncRes.json();
    assert(user.email === testUserEmail, `Synced user email matches ${testUserEmail}`);
  } catch (err) {
    assert(false, `User sync: ${err.message}`);
  }

  // Test 5: Cart Add & Query (/api/cart/me)
  console.log('\nTest Scenario 4: Shopping Cart Operations');
  try {
    // Add item to cart
    const addRes = await fetch(`${CART_SERVICE_URL}/api/cart/me/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': testUserEmail
      },
      body: JSON.stringify({
        productId: testProduct.id,
        productName: testProduct.name,
        quantity: 2,
        price: testProduct.price
      })
    });
    assert(addRes.status === 200, `POST /api/cart/me/items returns HTTP 200`);
    const cart = await addRes.json();
    assert(cart.items && cart.items.length === 1, `Cart contains 1 distinct item`);
    assert(cart.items[0].quantity === 2, `Cart item quantity is 2`);

    // Verify GET /api/cart/me
    const getCartRes = await fetch(`${CART_SERVICE_URL}/api/cart/me`, {
      headers: { 'X-User-Email': testUserEmail }
    });
    const fetchedCart = await getCartRes.json();
    assert(fetchedCart.userEmail === testUserEmail, `Fetched cart belongs to ${testUserEmail}`);
    assert(fetchedCart.items.length === 1, `Cart persistence verified across queries`);
  } catch (err) {
    assert(false, `Cart operations: ${err.message}`);
  }

  // Test 6: Order Checkout & Server-Side Price Calculation
  console.log('\nTest Scenario 5: Checkout & Anti-Tampering Price Calculation');
  let orderResult;
  try {
    // Malicious client tampers with totalAmount (submits 0.05 instead of 2 * 150 = 300)
    const checkoutRes = await fetch(`${ORDER_SERVICE_URL}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': testUserEmail
      },
      body: JSON.stringify({
        items: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 2,
            price: 150.00
          }
        ],
        totalAmount: 0.05 // Tampered price
      })
    });
    assert(checkoutRes.status === 200, `POST /api/orders/checkout returns HTTP 200`);
    orderResult = await checkoutRes.json();
    assert(orderResult.status === 'PLACED', `Order status is PLACED`);
    assert(orderResult.totalAmount === 300.00, `Server recalculates exact total: expected $300.00, got $${orderResult.totalAmount}`);

    // Clean cart after order
    const clearRes = await fetch(`${CART_SERVICE_URL}/api/cart/me`, {
      method: 'DELETE',
      headers: { 'X-User-Email': testUserEmail }
    });
    assert(clearRes.status === 200, `DELETE /api/cart/me empties cart post-checkout`);

    // Verify cart is empty
    const emptyCartRes = await fetch(`${CART_SERVICE_URL}/api/cart/me`, {
      headers: { 'X-User-Email': testUserEmail }
    });
    const emptyCart = await emptyCartRes.json();
    assert(emptyCart.items.length === 0, `Cart is confirmed empty`);
  } catch (err) {
    assert(false, `Checkout & price calculation: ${err.message}`);
  }

  // Test 7: Order History
  console.log('\nTest Scenario 6: Order History Retrieval');
  try {
    const ordersRes = await fetch(`${ORDER_SERVICE_URL}/api/orders/me`, {
      headers: { 'X-User-Email': testUserEmail }
    });
    assert(ordersRes.status === 200, `GET /api/orders/me returns HTTP 200`);
    const orders = await ordersRes.json();
    assert(Array.isArray(orders) && orders.length >= 1, `Order history contains placed orders`);
    assert(orders.some(o => o.id === orderResult.id), `Order ID in history matches placed order ID`);
  } catch (err) {
    assert(false, `Order history retrieval: ${err.message}`);
  }

  // Test 8: Security & Negative Scenarios
  console.log('\nTest Scenario 7: Security Guardrails & IDOR Protection');
  try {
    // Negative 1: Attacker tries to view victim's cart
    const idorCartRes = await fetch(`${CART_SERVICE_URL}/api/cart/${testUserEmail}`, {
      headers: { 'X-User-Email': 'attacker@ssn.edu.in' }
    });
    assert(idorCartRes.status === 403, `IDOR Cart attack rejected with HTTP 403 (Got ${idorCartRes.status})`);

    // Negative 2: Attacker tries to view victim's orders
    const idorOrderRes = await fetch(`${ORDER_SERVICE_URL}/api/orders/${testUserEmail}`, {
      headers: { 'X-User-Email': 'attacker@ssn.edu.in' }
    });
    assert(idorOrderRes.status === 403, `IDOR Order history attack rejected with HTTP 403 (Got ${idorOrderRes.status})`);

    // Negative 3: Empty checkout validation
    const emptyCheckoutRes = await fetch(`${ORDER_SERVICE_URL}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': testUserEmail
      },
      body: JSON.stringify({ items: [] })
    });
    assert(emptyCheckoutRes.status === 400, `Empty checkout rejected with HTTP 400 (Got ${emptyCheckoutRes.status})`);
  } catch (err) {
    assert(false, `Security negative tests: ${err.message}`);
  }

  // Summary
  console.log('\n===========================================');
  console.log(`TOTAL TESTS: ${passCount + failCount}`);
  console.log(`PASSED:      ${passCount}`);
  console.log(`FAILED:      ${failCount}`);
  console.log('===========================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('\n>>> ALL END-TO-END TESTS PASSED SUCCESSFULLY! <<<\n');
    process.exit(0);
  }
}

runTests();
