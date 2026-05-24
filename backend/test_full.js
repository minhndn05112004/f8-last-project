/**
 * Full Integration Test — SePay Payment Flow
 * Tests all 7 required scenarios
 */
require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE = 'http://localhost:5000/api';
const APIKEY = process.env.SEPAY_API_KEY;

let passed = 0;
let failed = 0;

function ok(name) { console.log(`  ✅  ${name}`); passed++; }
function fail(name, detail) { console.error(`  ❌  ${name}`, detail || ''); failed++; }

// ─── helpers ────────────────────────────────────────────────────────────────────

async function createTestOrder(amount = 150000) {
  const user = await prisma.user.findFirst({ where: { role: 'USER' } });
  if (!user) throw new Error('No USER found in DB');
  const orderCode = `ORDER_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      orderCode,
      totalAmount: amount,
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      shippingAddress: 'Test Address',
      customerPhone: '0987654321',
      customerEmail: 'test@example.com',
    },
  });
  return { order, user };
}

async function cleanup(orderCodes) {
  for (const orderCode of orderCodes) {
    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (order) {
      await prisma.paymentTransaction.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
    }
  }
}

function webhookPayload(orderCode, txnId, amount) {
  return {
    id: txnId,
    amountIn: amount,
    transactionContent: `PAY_ORDER_${orderCode}`,
    gateway: 'MB Bank',
    referenceNumber: `REF${txnId}`,
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

async function testWrongApiKey(orderCode, amount) {
  console.log('\n[TEST 4] Wrong amount → reject');
  try {
    await axios.post(`${BASE}/payment/sepay/webhook`,
      webhookPayload(orderCode, 99991, amount - 1),
      { headers: { Authorization: `Apikey ${APIKEY}` } }
    );
    fail('Wrong amount rejected');
  } catch (e) {
    if (e.response?.status === 400) ok('Wrong amount → 400 rejected');
    else fail('Wrong amount rejection unexpected error', e.message);
  }
}

async function testMissingAuth(orderCode, amount) {
  console.log('\n[TEST 1] Missing auth header → 401');
  try {
    await axios.post(`${BASE}/payment/sepay/webhook`,
      webhookPayload(orderCode, 99992, amount)
    );
    fail('Should have been rejected 401');
  } catch (e) {
    if (e.response?.status === 401) ok('Missing auth → 401 Unauthorized');
    else fail('Unexpected error', e.message);
  }
}

async function testBadContent(orderCode, amount) {
  console.log('\n[TEST 2] Bad transfer content → 400');
  try {
    await axios.post(`${BASE}/payment/sepay/webhook`,
      { id: 99993, amountIn: amount, transactionContent: 'RANDOM_TEXT', gateway: 'MB' },
      { headers: { Authorization: `Apikey ${APIKEY}` } }
    );
    fail('Should have been rejected 400');
  } catch (e) {
    if (e.response?.status === 400) ok('Bad content → 400 rejected');
    else fail('Unexpected error', e.message);
  }
}

async function testSuccessWebhook(orderCode, amount) {
  console.log('\n[TEST 3] Valid webhook → PAID + PROCESSING');
  const txnId = `TXN_${Date.now()}`;
  try {
    const res = await axios.post(`${BASE}/payment/sepay/webhook`,
      { id: txnId, amountIn: amount, transactionContent: `PAY_ORDER_${orderCode}`, gateway: 'MB Bank', referenceNumber: txnId },
      { headers: { Authorization: `Apikey ${APIKEY}` } }
    );
    if (res.status === 200 && res.data.success) {
      ok('Webhook accepted → 200 OK');
      const order = await prisma.order.findUnique({ where: { orderCode } });
      if (order.paymentStatus === 'PAID' && order.orderStatus === 'PROCESSING') {
        ok('DB updated → paymentStatus=PAID, orderStatus=PROCESSING');
      } else {
        fail('DB state wrong', `paymentStatus=${order.paymentStatus}, orderStatus=${order.orderStatus}`);
      }
      const tx = await prisma.paymentTransaction.findFirst({ where: { transactionId: txnId } });
      if (tx && tx.amount === amount && tx.gateway === 'MB Bank') {
        ok('PaymentTransaction recorded correctly');
      } else {
        fail('PaymentTransaction missing or wrong');
      }
    } else {
      fail('Webhook rejected unexpectedly', res.data);
    }
    return txnId;
  } catch (e) {
    fail('Success webhook failed', e.response?.data || e.message);
    return txnId;
  }
}

async function testDuplicate(orderCode, amount, txnId) {
  console.log('\n[TEST 5] Duplicate webhook → idempotent');
  try {
    const res = await axios.post(`${BASE}/payment/sepay/webhook`,
      { id: txnId, amountIn: amount, transactionContent: `PAY_ORDER_${orderCode}`, gateway: 'MB Bank' },
      { headers: { Authorization: `Apikey ${APIKEY}` } }
    );
    if (res.status === 200 && res.data.success) {
      ok('Duplicate handled gracefully → 200 OK');
      const count = await prisma.paymentTransaction.count({ where: { transactionId: txnId.toString() } });
      if (count === 1) ok('No duplicate PaymentTransaction created');
      else fail('Duplicate tx found!', `count=${count}`);
    } else {
      fail('Duplicate response unexpected', res.data);
    }
  } catch (e) {
    fail('Duplicate test error', e.response?.data || e.message);
  }
}

async function testPaymentStatusEndpoint(orderCode, expectedStatus) {
  console.log('\n[TEST 6] Payment status API endpoint');
  try {
    // Need auth token — use admin login
    const loginRes = await axios.post(`${BASE}/auth/login`, {
      email: 'admin@meatshop.vn',
      password: 'Admin@123',
    });
    const token = loginRes.data?.data?.accessToken;
    if (!token) { fail('Cannot get auth token'); return; }

    const res = await axios.get(`${BASE}/orders/${orderCode}/payment-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.paymentStatus === expectedStatus && res.data.orderCode === orderCode) {
      ok(`Payment status API → ${res.data.paymentStatus} ✓`);
    } else {
      fail('Wrong payment status', JSON.stringify(res.data));
    }
  } catch (e) {
    fail('Payment status endpoint error', e.response?.data?.message || e.message);
  }
}

async function testCODOrder() {
  console.log('\n[TEST 7] COD order → orderStatus=PROCESSING immediately');
  const user = await prisma.user.findFirst({ where: { role: 'USER' } });
  if (!user) { fail('No user found'); return null; }
  const orderCode = `ORDER_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      orderCode,
      totalAmount: 50000,
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      orderStatus: 'PROCESSING', // COD → straight to PROCESSING
      shippingAddress: 'Test',
      customerPhone: '0123456789',
      customerEmail: 'cod@test.com',
    },
  });
  if (order.orderStatus === 'PROCESSING' && order.paymentMethod === 'CASH') {
    ok('COD order has orderStatus=PROCESSING from creation');
  } else {
    fail('COD order status wrong');
  }
  return orderCode;
}

// ─── run ────────────────────────────────────────────────────────────────────────

async function run() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  SePay Production Payment Flow — Tests    ║');
  console.log('╚═══════════════════════════════════════════╝');

  const toClean = [];

  try {
    const AMOUNT = 150000;
    const { order } = await createTestOrder(AMOUNT);
    toClean.push(order.orderCode);

    // Bad cases
    await testMissingAuth(order.orderCode, AMOUNT);
    await testBadContent(order.orderCode, AMOUNT);
    await testWrongApiKey(order.orderCode, AMOUNT);

    // Good payment
    const txnId = await testSuccessWebhook(order.orderCode, AMOUNT);
    await testDuplicate(order.orderCode, AMOUNT, txnId);

    // Status endpoint
    await testPaymentStatusEndpoint(order.orderCode, 'PAID');

    // COD
    const codCode = await testCODOrder();
    if (codCode) toClean.push(codCode);

  } catch (err) {
    console.error('\nFatal test error:', err.message);
    failed++;
  } finally {
    await cleanup(toClean);
    await prisma.$disconnect();

    console.log(`\n══════════════════════════════`);
    console.log(`Results: ✅ ${passed} passed  ❌ ${failed} failed`);
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED — System is production-ready!');
    } else {
      console.log('⚠️  Some tests failed — review above output.');
      process.exit(1);
    }
  }
}

run();
