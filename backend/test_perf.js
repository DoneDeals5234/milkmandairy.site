async function test(name, url, method = 'GET', body = null) {
  const t0 = Date.now();
  try {
    const opts = { method };
    if (body) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const text = await res.text();
    const ms = Date.now() - t0;
    console.log(`[${name}] Status: ${res.status} in ${ms}ms | Length: ${text.length}`);
    return { ms, status: res.status, text };
  } catch (err) {
    console.log(`[${name}] Error: ${err.message}`);
    return { error: err };
  }
}

console.log("=== PERFORMANCE & ENDPOINT VERIFICATION ===");
await test('GET Staff Subscribers (Authed)', 'http://localhost:8080/api/staff/subscribers?password=52345234&date=2026-10-26');
await test('GET My Status', 'http://localhost:8080/api/subscription/my-status?phone=9876543210');
await test('GET Staff Orders', 'http://localhost:8080/api/staff/orders?password=52345234');
await test('GET Staff Users', 'http://localhost:8080/api/staff/users?password=52345234');
await test('GET Serviceable Areas', 'http://localhost:8080/api/staff/serviceable-areas?password=52345234');
await test('GET Static staff.html', 'http://localhost:8080/staff.html');
await test('GET Static subscription.html', 'http://localhost:8080/subscription.html');
await test('GET Static orders.html', 'http://localhost:8080/orders.html');
await test('GET Static query-client.js', 'http://localhost:8080/js/query-client.js');
console.log("===========================================");
