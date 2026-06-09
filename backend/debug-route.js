'use strict';
require('dotenv').config();

const app = require('./src/app');
const http = require('http');

const server = http.createServer(app);

server.listen(5001, () => {
  console.log('[Debug] Server started on port 5001');

  // Test 1: Không có token
  const req1 = http.get('http://localhost:5001/api/auth/verify-email', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\n[Test 1] GET /api/auth/verify-email (no token)');
      console.log('  Status:', res.statusCode);
      console.log('  Headers location:', res.headers.location || 'N/A');
      console.log('  Body:', data.substring(0, 200));

      // Test 2: Có token giả
      http.get('http://localhost:5001/api/auth/verify-email?token=fake-token-123', (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => data2 += chunk);
        res2.on('end', () => {
          console.log('\n[Test 2] GET /api/auth/verify-email?token=fake-token-123');
          console.log('  Status:', res2.statusCode);
          console.log('  Headers location:', res2.headers.location || 'N/A');
          console.log('  Body:', data2.substring(0, 200));
          server.close(() => process.exit(0));
        });
      }).on('error', (e) => {
        console.error('[Test 2 Error]', e.message);
        server.close(() => process.exit(1));
      });
    });
  });

  req1.on('error', (e) => {
    console.error('[Test 1 Error]', e.message);
    server.close(() => process.exit(1));
  });
});

server.on('error', (e) => {
  console.error('[Server Error]', e.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('[Timeout] Server did not respond in time');
  server.close(() => process.exit(1));
}, 20000);
