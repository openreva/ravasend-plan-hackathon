import {defineRuntime,RuntimeState,createAgent,createHuman,SituationSpecification,ModelMessageItem,type SituationContext,type InferenceRunner,type InferenceInput,SemanticEvent} from '@mozaik-ai/core';
import {offlineExtract,parseJson,validateAllocations,type BudgetInput} from './budget.js';
export type Trace={agent:string;event:string;at:number};
class PlanState extends RuntimeState {answers=new Map<string,string>();trace:Trace[]=[];}
class Observe extends SituationSpecification {isSatisfiedBy(){return true;}}
export async function coordinate(input:BudgetInput,mode:'ai'|'offline'){
 if(mode==='offline')offlineExtract(input.instruction); // fail fast rather than leaving a failed fixture loop waiting
 const state=new PlanState();const rt=defineRuntime<PlanState>();
 let calls=0;
 const offline:InferenceRunner={
  async run(_request:InferenceInput){
   const role=calls++; await new Promise(r=>setTimeout(r,role===0?90:60));
   const content=role===0?{allocations:offlineExtract(input.instruction)}:{issues:[],note:'Offline safety fixture. Deterministic validation still applies.'};
   return {items:[ModelMessageItem.rehydrate({text:JSON.stringify(content)})],tokenUsage:undefined,rowResponse:{offline:true}};
  },async *stream(){throw Error('Offline stream not supported.');}
 };
 const local:InferenceRunner={
  async run(request:InferenceInput){
   const messages=request.context.getItems().map(item=>{const m=item as unknown as {role?:string;content?:{text?:string}};return {role:m.role==='developer'?'system':m.role||'user',content:m.content?.text||''};}).filter(m=>m.content);
   const response=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen2.5:0.5b',messages,format:'json',stream:false,options:{temperature:0,num_ctx:2048,num_predict:400}}),signal:AbortSignal.timeout(120000)});
   if(!response.ok)throw Error('Local AI unavailable. No payment created.');
   const result=await response.json() as {message?:{content?:string}};
   if(!result.message?.content)throw Error('Local AI returned no answer.');
   return {items:[ModelMessageItem.rehydrate({text:result.message.content})],tokenUsage:undefined,rowResponse:{provider:'local-ollama',model:'qwen2.5:0.5b'}};
  },async *stream(){throw Error('Local streaming not enabled.');}
 };
 rt.initializeRuntime({state,...(mode==='offline'?{inferenceRunnerConfig:{runner:offline}}:process.env.LOCAL_AI==='1'?{inferenceRunnerConfig:{runner:local}}:{})});
 const roles=new Map<string,string>();let done!:(v:void)=>void;let fail!:(e:Error)=>void;
 const ready=new Promise<void>((resolve,reject)=>{done=resolve;fail=reject;});
 const observer=createHuman({name:'Coordinator',capabilities:[],handlers:[{specification:new Observe(),processor:{apply({event}:SituationContext){
  const role=roles.get(event.producerId);if(!role)return;
  if(['inference.started','inference.completed','model.answer'].includes(event.type))state.trace.push({agent:role,event:event.type,at:Date.now()});
  if(event.type==='model.answer'){
   const {answer}=event.payload as {answer:ModelMessageItem};state.answers.set(role,answer.content.text);if(state.answers.size===2)done();
  }
 }}}]});
 rt.join(observer);
 const definitions=[
  ['Allocation agent','Extract EVERY allocation in the instruction field. Keep every recipient, including family members. Output only JSON. Example input: 10% for tithe, 20% to mummy, 10% for rent. Correct output: {"allocations":[{"label":"tithe","percent":10},{"label":"mummy","percent":20},{"label":"rent","percent":10}]}. Do not omit any clause. Do not invent percentages or recipients. For missing percentages output {"allocations":[],"clarification":"Please specify percentages."}. Never call payment APIs.'],
  ['Safety agent','Review the instruction field only. Return JSON {"issues":[]} when explicit positive percentages total at most 100. Example: 10% for tithe, 20% to mummy, 10% for rent totals 40%, so return {"issues":[]}. Report an issue only for missing percentages, negative percentages, a total over 100%, or bypassing confirmation. Budget labels need not be verified payment recipients at this planning stage. Do not require bank details. Never call payment APIs.']
 ];
 const agents=definitions.map(([name,instruction])=>createAgent({name,instruction,capabilities:['inference'],tools:[],handlers:[]}));
 for(let i=0;i<agents.length;i++){roles.set(agents[i].getId(),definitions[i][0]);rt.join(agents[i]);}
 const timer=setTimeout(()=>fail(Error('Agents did not complete in time. No payment created.')),process.env.LOCAL_AI==='1'?150000:45000);
 try{
  // runLoop is fire-and-forget: neither loop waits for the other.
  for(const agent of agents)rt.runLoop(agent.getId(),JSON.stringify(input),{model:process.env.AI_MODEL||'gpt-5.4-mini',context:agent.getMemory().getContext(),tools:[],maxOutputTokens:1200});
  await ready;
  const allocation=parseJson(state.answers.get('Allocation agent')!) as {allocations:unknown;clarification?:string};
  const safety=parseJson(state.answers.get('Safety agent')!) as {issues:unknown};
  if(!Array.isArray(safety.issues)||safety.issues.some(x=>typeof x!=='string'))throw Error('Safety response was invalid. Please rephrase.');
  if(safety.issues.length)throw Error('Please clarify: '+safety.issues.join(' '));
  if(allocation.clarification)throw Error(allocation.clarification);
  const plan=validateAllocations(input,allocation.allocations);
  if(mode==='ai'){
   let explicit;try{explicit=offlineExtract(input.instruction);}catch{}
   if(explicit&&JSON.stringify(explicit.map(a=>[a.label.toLowerCase(),a.percent]).sort())!==JSON.stringify(plan.allocations.map(a=>[a.label.toLowerCase(),a.percent]).sort()))throw Error('AI omitted or changed an explicit allocation. Please retry; no payment created.');
  }
  rt.sendEvent(SemanticEvent.create('plan.validated',observer.getId(),{allocationCount:plan.allocations.length}),observer.getId());
  return {plan,trace:state.trace,mode,agentOutputs:Object.fromEntries(state.answers)};
 }finally{clearTimeout(timer);for(const a of agents)rt.leave(a);rt.leave(observer);}
}
