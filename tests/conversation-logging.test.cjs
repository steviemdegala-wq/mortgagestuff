const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function load(file, prisma) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'), {
    compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
  }).outputText;
  vm.runInNewContext(source,{ exports, require(name) {
    if(name==='next/server') return {NextResponse:{json:(body,options)=>({body,status:options?.status ?? 200})}};
    if(name==='@/lib/prisma') return {prisma};
    if(name.startsWith('@/lib/')) return load(name.replace('@/','')+'.ts',prisma);
    if(name==='crypto') return require('node:crypto');
    throw new Error(name);
  },Date,Intl,Set,console});
  return exports;
}
function fixture(slots=[], count=0, found=true) {
  const logs=slots.map(slot=>({slot}));
  const state={logs,count,updated:false};
  const activity={id:'activity',conversationLogs:logs};
  const tx={
    person:{findUnique:async()=>found ? {id:'person',name:'Test Person'}:null,
      update:async({include})=>{state.updated=true;return {id:'person',name:'Test Person',tags:[],
        ...Object.fromEntries(Object.keys(include).map(key=>[key,[]]))};}},
    dailyActivity:{findUnique:async()=>activity,upsert:async()=>activity},
    conversationLog:{create:async({data})=>{logs.push(data);return data;}},
    dailyLog:{findUnique:async()=>({count:state.count}),upsert:async({update})=>{state.count=update.count;return {count:state.count};}},
  };
  const prisma={...tx,$transaction:async work=>work(tx)};
  return {state,route:load('app/api/people/[id]/log-contact/route.ts',prisma)};
}
const params={params:Promise.resolve({id:'person'})};
test('logging returns every relation used by the profile, preventing the missing-meetings crash',async()=>{
  const {route}=fixture();
  const res=await route.POST({},params);
  assert.equal(res.status,200);
  for(const relation of ['notes','Loan','faceToFaceMeetings']) assert.ok(Array.isArray(res.body.person[relation]),relation+' must be present');
});
test('profile logging uses dashboard slots 1–10 and synchronizes the visible count',async()=>{
  const {route,state}=fixture([1,2],2);
  const res=await route.POST({},params);
  assert.equal(res.status,200);
  assert.equal(state.logs.at(-1).slot,3);
  assert.equal(state.count,3);
  assert.equal(res.body.dailyCount,3);
});
test('manually marked conversations are preserved when adding details',async()=>{
  const {route,state}=fixture([1],8);
  await route.POST({},params);
  assert.equal(state.logs.at(-1).slot,2);
  assert.equal(state.count,8);
});
test('a full day reports the limit without falsely claiming a conversation was logged',async()=>{
  const {route,state}=fixture(Array.from({length:10},(_,i)=>i+1),10);
  const res=await route.POST({},params);
  assert.equal(res.status,409);
  assert.equal(state.logs.length,10);
  assert.equal(state.updated,false);
});
test('missing people return 404 before creating a conversation',async()=>{
  const {route,state}=fixture([],0,false);
  assert.equal((await route.POST({},params)).status,404);
  assert.equal(state.logs.length,0);
  assert.equal(state.updated,false);
});
