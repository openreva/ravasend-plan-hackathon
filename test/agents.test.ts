import {test} from 'node:test';import assert from 'node:assert/strict';import {coordinate} from '../src/agents.js';
test('two genuine Mozaik loops overlap in offline integration test',async()=>{
const r=await coordinate({incomeCents:100000,currency:'USD',instruction:'10% for tithe, 20% to mummy, 10% for rent'},'offline');
const starts=r.trace.filter(x=>x.event==='inference.started');const ends=r.trace.filter(x=>x.event==='inference.completed');
assert.equal(starts.length,2);assert.equal(ends.length,2);assert.ok(Math.max(...starts.map(x=>x.at))<Math.min(...ends.map(x=>x.at)),'both agents start before either finishes');assert.equal(r.plan.reserveCents,60000);
console.log(JSON.stringify({mode:r.mode,trace:r.trace}));
});
