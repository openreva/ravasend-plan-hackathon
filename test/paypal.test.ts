import {test} from 'node:test';import assert from 'node:assert/strict';import {PayPalSandbox} from '../src/paypal.js';
test('sandbox adapter sends correct amount and idempotency key without live endpoints',async()=>{
 const original=globalThis.fetch;const calls:{url:string;init:any}[]=[];
 globalThis.fetch=(async(url:any,init:any)=>{calls.push({url:String(url),init});return new Response(JSON.stringify(String(url).endsWith('/token')?{access_token:'test-token'}:{id:'TESTORDER123',status:'CREATED'}),{status:200,headers:{'Content-Type':'application/json'}});}) as typeof fetch;
 try{await new PayPalSandbox('fixture-id','fixture-secret').create(12345,'request-1');assert.equal(calls.length,2);assert.ok(calls.every(c=>c.url.startsWith('https://api-m.sandbox.paypal.com/')));const order=calls[1];assert.equal(order.init.headers['PayPal-Request-Id'],'request-1');assert.equal(JSON.parse(order.init.body).purchase_units[0].amount.value,'123.45');}finally{globalThis.fetch=original;}
});
test('invalid order identifier rejected before network request',()=>{assert.throws(()=>new PayPalSandbox('x','y').capture('../live','request-2'));});
