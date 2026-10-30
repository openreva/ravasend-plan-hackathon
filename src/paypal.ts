import {randomUUID} from 'node:crypto';
const BASE='https://api-m.sandbox.paypal.com'; // deliberately not configurable to a live endpoint
export class PayPalSandbox {
 constructor(private clientId:string,private secret:string){}
 private async token(){
  const r=await fetch(BASE+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(this.clientId+':'+this.secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('PayPal sandbox authentication failed. Check local sandbox credentials.');
  return (await r.json() as {access_token:string}).access_token;
 }
 async request(path:string,body:unknown,key:string=randomUUID()){
  const token=await this.token();
  const r=await fetch(BASE+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','PayPal-Request-Id':key},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await r.json() as any;
  if(!r.ok)throw Error('PayPal sandbox request failed ('+r.status+'). No live funds are involved.');
  return data;
 }
 create(amountCents:number,key:string){return this.request('/v2/checkout/orders',{intent:'CAPTURE',purchase_units:[{description:'Ravasend Plan sandbox budget funding demonstration',amount:{currency_code:'USD',value:(amountCents/100).toFixed(2)}}]},key);}
 capture(id:string,key:string){if(!/^[A-Z0-9]{5,32}$/.test(id))throw Error('Invalid order ID.');return this.request('/v2/checkout/orders/'+id+'/capture',{},key);}
}
