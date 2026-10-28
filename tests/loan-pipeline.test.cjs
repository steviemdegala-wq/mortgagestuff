const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function load(file, prisma) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInNewContext(source, { exports, require(name) {
    if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
    if (name === '@/lib/prisma') return { prisma };
    if (name === '@/lib/loan-stages') return load('lib/loan-stages.ts', prisma);
    throw new Error(name);
  }, URL, Date, Set });
  return exports;
}
const request = body => ({json: async()=>body});
test('changing one loan stage leaves sibling loans and the person untouched',async()=>{
  const loans = [{id:'a',stage:'Application'},{id:'b',stage:'Closing'},{id:'c',stage:'Funded'}];
  const route = load('app/api/loans/[id]/route.ts',{loan:{update:async({where,data})=>Object.assign(loans.find(l=>l.id===where.id),data)}});
  const res = await route.PATCH(request({stage:'Underwriting'}), {params:Promise.resolve({id:'a'})});
  assert.equal(res.status,200);
  assert.deepEqual(loans.map(l=>l.stage),['Underwriting','Closing','Funded']);
  await route.PATCH(request({stage:null}), {params:Promise.resolve({id:'a'})});
  assert.equal(loans[0].stage,null);
  await route.PATCH(request({name:'Renamed'}), {params:Promise.resolve({id:'b'})});
  assert.equal(loans[1].stage,'Closing');
});
test('invalid stage is rejected before any database mutation',async()=>{
  const route = load('app/api/loans/[id]/route.ts',{});
  const res = await route.PATCH(request({stage:'Invalid'}), {params:Promise.resolve({id:'a'})});
  assert.equal(res.status,400);
});
test('stage filter queries matching loans and includes only those loans',async()=>{
  let query;
  const route=load('app/api/pipeline/route.ts',{person:{findMany:async q=>{query=q;return [];}}});
  await route.GET({url:'https://crm.example/api/pipeline?stage=Closing'});
  assert.equal(query.where.AND[2].Loan.some.stage,'Closing');
  assert.equal(query.include.Loan.where.stage,'Closing');
});
test('bulk delete removes only selected loan ids and rejects empty or malformed lists',async()=>{
  let ids;
  const route=load('app/api/pipeline/route.ts',{loan:{deleteMany:async q=>{ids=[...q.where.id.in];return {count:ids.length};}}});
  for (const loanIds of [[],[''],[null],Array(501).fill('a')]) {
    assert.equal((await route.DELETE(request({loanIds}))).status,400);
  }
  assert.equal(ids,undefined);
  const res=await route.DELETE(request({loanIds:['a','c','a']}));
  assert.deepEqual(ids,['a','c']);
  assert.equal(res.body.deleted,2);
});
test('new website submissions assign the stage to the created loan',async()=>{
  let query;
  const route=load('app/api/pipeline/route.ts',{person:{create:async q=>{query=q;return {id:'new'};}}});
  await route.POST(request({name:'Test',loanType:'DSCR'}));
  assert.equal(query.data.Loan.create.stage,'New Lead');
});
