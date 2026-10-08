import assert from 'node:assert/strict';
import {test} from 'node:test';
import {checkMarketEvidence} from './market-policy.mjs';
const now = Date.parse('2026-10-08T12:00:00Z');
test('stale live quotes cannot pass the publication check', () => {
  assert.match(checkMarketEvidence({verified:'2026-07-22', now})[0], /live market data.*old/);
});
test('explicit archived references keep their true date and visible warning', () => {
  assert.deepEqual(checkMarketEvidence({verified:'2026-07-22', status:'archived', notice:'Archived snapshot · 22 July 2026. Historical reference, not current quotes.', now}), []);
});
test('archive status alone cannot conceal stale quotes', () => {
  assert.equal(checkMarketEvidence({verified:'2026-07-22', status:'archived', now}).length, 1);
});
test('recent live evidence is accepted', () => {
  assert.deepEqual(checkMarketEvidence({verified:'2026-10-01', now}), []);
});
test('invalid and future dates cannot manufacture freshness', () => {
  for (const verified of ['2026-02-30', '2027-01-01', '']) assert.ok(checkMarketEvidence({verified, now}).length);
});
