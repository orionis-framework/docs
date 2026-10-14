import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const source = await fs.readFile(new URL('../src/utils/contributors.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
let instance = 0;
async function freshAPI() {
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}#${instance++}`)).ContributorsAPI;
}
const user = (login, contributions) => ({ login, contributions, avatar_url: 'https://avatars.githubusercontent.com/example', html_url: `https://github.com/${login}` });
const response = (data, link) => new Response(JSON.stringify(data), { headers: link ? { link } : {} });

test('all contributor pages are fetched, owner aliases are merged, and locale requests share a cache', async (t) => {
  const api = await freshAPI();
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async (input) => {
    requests++;
    const url = new URL(input);
    assert.equal(url.searchParams.get('per_page'), '100');
    if (url.pathname.includes('/framework/')) {
      if (url.searchParams.get('page') === '1') return response([
        user('rmunate', 10), user('web-flow', 20), ...Array.from({ length: 98 }, (_, i) => user(`developer-${i}`, 1)),
      ], '<https://api.github.com/repos/orionis-framework/framework/contributors?page=2>; rel="next"');
      return response([{ type: 'Anonymous', name: 'Raul Mauricio Uñate Castro', contributions: 7 }]);
    }
    if (url.pathname.includes('/skeleton/')) return response([user('rmunate', 5)]);
    if (url.pathname.includes('/docs/')) return response([user('alice', 3)]);
    return response([]);
  });
  const [en, es] = await Promise.all([api.fetchContributors(), api.fetchContributors()]);
  assert.deepEqual(en, es);
  assert.equal(requests, 5);
  assert.equal(en[0].login, 'rmunate');
  assert.equal(en[0].rank, 1);
  assert.equal(en[0].frameworkContributions, 37);
  assert.equal(en[0].totalContributions, 42);
  assert.ok(!en.some((person) => person.login === 'web-flow'));
  assert.equal(api.hasIncompleteData(), false);
  await api.fetchContributors();
  assert.equal(requests, 5);
});

test('a rate-limited repository does not lose successful contributions or trigger retries', async (t) => {
  const api = await freshAPI();
  let requests = 0;
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (input) => {
    requests++;
    if (new URL(input).pathname.includes('/docs/')) return new Response('', { status: 403, statusText: 'Rate limited' });
    return response([user('alice', 2)]);
  });
  const contributors = await api.fetchContributors();
  assert.equal(requests, 4);
  assert.equal(contributors[0].totalContributions, 6);
  assert.equal(api.hasIncompleteData(), true);
});

test('offline builds return an unavailable state and avoid repeating failed locale requests', async (t) => {
  const api = await freshAPI();
  let requests = 0;
  t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'error', () => {});
  t.mock.method(api, 'delay', async () => {});
  t.mock.method(globalThis, 'fetch', async () => { requests++; throw new TypeError('Offline test fixture'); });
  assert.deepEqual(await api.fetchContributors(), []);
  assert.equal(api.hasIncompleteData(), true);
  assert.equal(requests, 12);
  assert.deepEqual(await api.fetchContributors(), []);
  assert.equal(requests, 12);
});
