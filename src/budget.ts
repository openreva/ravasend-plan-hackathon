export type Allocation = {label:string; percent:number};
export type BudgetInput = {incomeCents:number; currency:'USD'; instruction:string};
export type Plan = {incomeCents:number;currency:'USD';allocations:(Allocation & {amountCents:number})[];reserveCents:number;warnings:string[]};
export function validateInput(v:unknown):BudgetInput {
 const x=v as Partial<BudgetInput>;
 if(!x || !Number.isSafeInteger(x.incomeCents)||x.incomeCents!<=0||x.incomeCents!>100000000)throw Error('Income must be a positive whole number of cents, at most USD1,000,000.');
 if(x.currency!=='USD')throw Error('This prototype supports USD only.');
 if(typeof x.instruction!=='string'||!x.instruction.trim()||x.instruction.length>2000)throw Error('Enter an instruction of 1–2,000 characters.');
 return x as BudgetInput;
}
export function validateAllocations(input:BudgetInput,raw:unknown):Plan {
 if(!Array.isArray(raw)||!raw.length||raw.length>12)throw Error('Provide 1–12 allocations.');
 const labels=new Set<string>();let sum=0;
 const allocations=raw.map((a:Allocation)=>{
  if(typeof a.label!=='string'||!a.label.trim()||a.label.length>80)throw Error('Every allocation needs a short label.');
  const key=a.label.trim().toLowerCase();if(labels.has(key))throw Error('Duplicate allocation labels need clarification.');labels.add(key);
  if(!Number.isFinite(a.percent)||a.percent<=0||a.percent>100||Math.abs(a.percent*100-Math.round(a.percent*100))>1e-6)throw Error('Percentages must be positive with at most two decimal places.');
  sum+=Math.round(a.percent*100);
  return {label:a.label.trim(),percent:a.percent,amountCents:Math.floor(input.incomeCents*Math.round(a.percent*100)/10000)};
 });
 if(sum>10000)throw Error('Allocations exceed 100%. Nothing has been charged.');
 const reserveCents=input.incomeCents-allocations.reduce((s,a)=>s+a.amountCents,0);
 return {incomeCents:input.incomeCents,currency:'USD',allocations,reserveCents,warnings:['These are budget labels, not verified beneficiaries.','No automatic transfers. Sandbox checkout funds one merchant order, not the individual allocations.']};
}
// Explicitly a deterministic offline parser, not an AI model.
export function offlineExtract(text:string):Allocation[]{
 const clauses=text.split(/[,;\n]|\band\b/i).map(s=>s.trim()).filter(Boolean);
 return clauses.map(c=>{
  const m=c.match(/^(?:pay|send|put|allocate|save)?\s*(-?\d+(?:\.\d+)?)\s*%\s*(?:for|to|towards|in)?\s+(.+)$/i);
  if(!m)throw Error('Offline mode expects clauses such as “10% for tithe, 20% to mummy, 10% for rent”. AI mode supports broader wording.');
  return {label:m[2].trim(),percent:Number(m[1])};
 });
}
export function parseJson(text:string):unknown{
 return JSON.parse(text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
}
