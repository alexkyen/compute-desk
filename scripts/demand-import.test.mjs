import assert from 'node:assert/strict';
import {test} from 'node:test';
import demand from '../assets/demand-import.js';

test('reads single-column or timestamp + demand data, preserving legitimate zeros',()=>{
  assert.deepEqual(demand.parse('demand\n100\n0\n\n50\n'),[100,0,50]);
  assert.deepEqual(demand.parse('timestamp,demand\n2026-10-08T00:00:00Z,100\n2026-10-08T01:00:00Z,0'),[100,0]);
  assert.deepEqual(demand.parse('\uFEFFtime;GPUs\r\n"Oct 8, 2026";12.5\r\n"Oct 9, 2026";0'),[12.5,0]);
  assert.deepEqual(demand.parse('1\t20\n2\t30'),[20,30]);
  assert.deepEqual(demand.parse('"demand (GPUs)"\n"10"\n"0"'),[10,0]);
});
test('never imports an index or timestamp in place of negative or invalid demand',()=>{
  for(const body of ['1,-1\n2,-2','1,\n2,20','1,NaN\n2,20','1,Infinity\n2,20','1,bad\n2,20']){
    assert.throws(()=>demand.parse('timestamp,demand\n'+body),/Row 2:.*final field/);
  }
  assert.throws(()=>demand.parse('10\n-5\n20'),/Row 2:.*final field/);
  assert.throws(()=>demand.parse('10\nwat\n20'),/Row 2:.*final field/);
});
test('rejects repeated headers, undersized datasets and all-zero demand',()=>{
  assert.throws(()=>demand.parse('demand\n10\ndemand\n20'),/Row 3:/);
  assert.throws(()=>demand.parse('demand\n10'),/at least two/);
  assert.throws(()=>demand.parse('demand\n0\n0'),/above zero/);
});
test('optimizes the actual empirical observations, not an interpolated chart',()=>{
  assert.equal(demand.bestCommitment([100,0],2,6),100);
  assert.equal(demand.bestCommitment([100,0],3,6),0);
  assert.equal(demand.bestCommitment([100,0],6,6),0);
  assert.equal(demand.bestCommitment([100,0],8,6),0);
  assert.equal(demand.bestCommitment([0,0,100],2,6),0);
  assert.equal(demand.bestCommitment([40,60,80,100,120],2,6),100);
  assert.equal(demand.bestCommitment([1.3,0],2,6),1);
});
test('empirical optimum matches an exhaustive whole-GPU cost comparison',()=>{
  const cost=(xs,k,r,d)=>r*k+d*xs.reduce((total,x)=>total+Math.max(0,x-k),0)/xs.length;
  for(const xs of [[0,100],[0,0,10,10,50],[3,7,7,12,40],[0,1.3],[.4,2.7,5.2]]){
    for(const r of [1,2,3,6,8]){
      const k=demand.bestCommitment(xs,r,6),actual=cost(xs,k,r,6);
      for(let other=0;other<=Math.ceil(Math.max(...xs));other++)assert.ok(actual<=cost(xs,other,r,6)+1e-8,`${xs}: ${k} should beat ${other} at ${r}`);
    }
  }
});
test('displayed capacity, slider and saved URL can share one integer commitment',()=>{
  assert.equal(demand.clampCommitment(100,1.3),2);
  assert.equal(demand.clampCommitment(1.3,1.3),1);
  assert.equal(demand.clampCommitment(0,1.3),0);
  assert.equal(demand.clampCommitment(-10,1.3),0);
  for(const value of [0,1.3,100]){
    const clamped=demand.clampCommitment(value,1.3);
    assert.equal(clamped,demand.clampCommitment(Number(String(clamped)),1.3));
  }
});
