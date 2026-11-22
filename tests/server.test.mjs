import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer } from '../scripts/dev-server.mjs';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

test('dev-server starts and serves workbench with HTTP 200', async () => {
  const { server, port } = await startServer(4210);
  assert.ok(port >= 4210);

  try {
    const resRoot = await fetchUrl(`http://localhost:${port}/`);
    assert.equal(resRoot.status, 200);
    assert.ok(resRoot.body.includes('ZunDeck'));
    assert.ok(resRoot.headers['content-type'].includes('text/html'));

    const resApp = await fetchUrl(`http://localhost:${port}/apps/web/index.html`);
    assert.equal(resApp.status, 200);
    assert.ok(resApp.body.includes('ZunDeck'));
    assert.ok(resApp.body.includes('Studio'));

    const res404 = await fetchUrl(`http://localhost:${port}/non-existent-file.xyz`);
    assert.equal(res404.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('dev-server handles port collision by auto-incrementing', async () => {
  // Occupy port 4220 first
  const dummy = http.createServer((_, res) => { res.end('dummy'); });
  await new Promise((resolve) => dummy.listen(4220, '0.0.0.0', resolve));

  try {
    // startServer starting from 4220 must fallback to 4221+
    const { server, port } = await startServer(4220);
    assert.ok(port > 4220, `Port should have incremented beyond 4220, got ${port}`);
    server.close();
  } finally {
    dummy.close();
  }
});
