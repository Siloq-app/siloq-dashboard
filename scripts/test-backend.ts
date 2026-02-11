/**
 * Quick diagnostic script to test backend connectivity
 * Run: npx tsx scripts/test-backend.ts
 */

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

async function testBackend() {
  console.log('Testing backend connectivity...');
  console.log('Backend URL:', BACKEND_URL);

  // Test 1: Basic connectivity
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/sites/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    console.log('\n✓ Backend is reachable');
    console.log('  Status:', res.status);
    const data = await res.json();
    console.log('  Response:', JSON.stringify(data).slice(0, 200));
  } catch (e: any) {
    console.log('\n✗ Backend connectivity failed');
    console.log('  Error:', e.message);
    console.log('  Code:', e.cause?.code || e.code);
  }

  // Test 2: With auth header (simulate what Next.js sends)
  try {
    const testToken = 'Token test123';
    const res = await fetch(`${BACKEND_URL}/api/v1/sites/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: testToken,
      },
      signal: AbortSignal.timeout(5000),
    });
    console.log('\n✓ Backend accepts auth header');
    console.log('  Status:', res.status);
  } catch (e: any) {
    console.log('\n✗ Backend rejected auth header');
    console.log('  Error:', e.message);
    console.log('  Code:', e.cause?.code || e.code);
  }

  // Test 3: Check if backend expects Bearer format
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/sites/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer test123',
      },
      signal: AbortSignal.timeout(5000),
    });
    console.log('\n✓ Backend accepts Bearer format');
    console.log('  Status:', res.status);
  } catch (e: any) {
    console.log('\n✗ Backend rejected Bearer format');
    console.log('  Error:', e.message);
    console.log('  Code:', e.cause?.code || e.code);
  }
}

testBackend();
