import assert from 'node:assert/strict';
import {test} from 'node:test';
import redirect from '../assets/redirect.js';

const base = 'https://alexkyen.github.io/compute-desk/';

test('a saved scenario keeps every parameter and lands on the section anchor', () => {
  assert.equal(
    redirect.forward(base + 'the-fabric.html?fabric=ib&over=1&params=70', {to: 'network.html', hash: 'time'}),
    base + 'network.html?fabric=ib&over=1&params=70#time'
  );
});
test('clashing parameters are renamed and nothing else is touched', () => {
  assert.equal(
    redirect.forward(base + 'plate-pod.html?stage=2&x=1', {to: 'network.html', rename: redirect.parseRename('stage:row')}),
    base + 'network.html?row=2&x=1'
  );
});
test('an anchor in the old link wins over the default landing spot', () => {
  assert.equal(redirect.forward(base + 'sla-anatomy.html#refdeal', {to: 'contracts.html', hash: 'outage'}), base + 'contracts.html#refdeal');
});
test('a link with no parameters forwards cleanly', () => {
  assert.equal(redirect.forward(base + 'silicon-ladder.html', {to: 'hardware.html'}), base + 'hardware.html');
});
test('rename specs are validated', () => {
  assert.deepEqual(redirect.parseRename(' stage:row , over:bomover '), {stage: 'row', over: 'bomover'});
  assert.deepEqual(redirect.parseRename(''), {});
  for (const bad of ['stage', 'stage:', ':row', 'a:b:c']) assert.throws(() => redirect.parseRename(bad), /expected old:new/);
});
