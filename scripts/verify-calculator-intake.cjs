const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript')
let authenticated = true, retry = false, people = [], loans = [], nextId = 1, calls = 0
const tx = {
  loan: {
    count: async () => 0,
    findUnique: async ({ where }) => loans.find(x => x.calculatorKey === where.calculatorKey),
    update: async ({ where, data }) => Object.assign(loans.find(x => x.id === where.id), data),
    create: async ({ data }) => { const loan = { id: String(nextId++), estimateBorrowerSent: false, estimateInternalSent: false, projectLetterSent: false, ...data }; loans.push(loan); return loan },
  },
  person: {
    findFirst: async ({ where }) => people.find(x => x.email.toLowerCase() === where.email.equals),
    create: async ({ data }) => { const person = { id: String(nextId++), ...data }; people.push(person); return person },
    update: async ({ where, data }) => Object.assign(people.find(x => x.id === where.id), data),
  },
}
const prisma = { $transaction: async (callback, options) => { calls++; assert.equal(options.isolationLevel, 'Serializable'); if (retry) { retry = false; throw Object.assign(new Error('mock conflict'), { code: 'P2034' }) }; return callback(tx) } }
const load = Module._load
Module._load = function(name, ...rest) {
  if (name === '@/lib/prisma') return { prisma }
  if (name === '@/lib/session') return { sessionOptions: {} }
  if (name === 'iron-session') return { getIronSession: async () => ({ isLoggedIn: authenticated }) }
  if (name === 'next/headers') return { cookies: async () => ({}) }
  return load.call(this, name, ...rest)
}
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename)
const { NextRequest } = require('next/server')
const { POST } = require('../app/api/calculator-intake/route.ts')
const data = { scenarioId: '00000000-0000-4000-8000-000000000000', contact: { name: 'LOCAL TEST ONLY', email: 'local@example.invalid', phone: '970-555-0142' }, contactKey: 'a'.repeat(64), stage: 'estimate_saved', notes: 'LOCAL TEST', loanAmount: 250000, consentVersion: 'chatgpt-estimate-contact-v1' }
const call = body => POST(new NextRequest('http://localhost/api/calculator-intake', { method: 'POST', body: JSON.stringify(body) }))
async function main() {
  authenticated = false; assert.equal((await call(data)).status, 401); authenticated = true
  for (const body of [null, [], { ...data, consentVersion: '' }, { ...data, contact: { ...data.contact, phone: '' } }, { ...data, loanAmount: -1 }, { ...data, stage: 'wrong' }]) assert.equal((await call(body)).status, 400)
  retry = true
  assert.equal((await call(data)).status, 200); assert.equal(calls, 2)
  for (let i = 0; i < 3; i++) assert.equal((await call(data)).status, 200)
  assert.equal(loans.length, 1); assert.equal(people.length, 1)
  let response = await call({ ...data, delivery: { borrower: true } }); assert.equal((await response.json()).delivery.borrower, true)
  response = await call({ ...data, delivery: { borrower: false } }); assert.equal((await response.json()).delivery.borrower, true)
  const letter = { ...data, propertyKey: 'b'.repeat(64), stage: 'prequalification_requested' }
  assert.equal((await call(letter)).status, 200)
  assert.equal((await call({ ...letter, stage: 'project_letter_created', delivery: { letter: true } })).status, 200)
  assert.equal((await call(data)).status, 200); assert.equal(loans[0].calculatorStage, 'project_letter_created')
  assert.equal((await call({ ...letter, propertyKey: 'c'.repeat(64) })).status, 503)
  assert.equal((await call({ ...data, contactKey: 'd'.repeat(64) })).status, 503)
  people[0].stage = 'Existing Pipeline Stage'
  assert.equal((await call({ ...data, scenarioId: '10000000-0000-4000-8000-000000000000' })).status, 200)
  assert.equal(people.length, 1); assert.equal(loans.length, 2); assert.equal(people[0].stage, 'Existing Pipeline Stage')
  assert.equal((await call({ ...letter, scenarioId: '20000000-0000-4000-8000-000000000000' })).status, 503)
  console.log(JSON.stringify({ passed: true, authAndValidation: true, transactionConflictRetried: true, retriesReuseDeal: true, existingContactReused: true, pipelineStagePreserved: true, stageCannotRegress: true, deliveryFlagsMonotonic: true, changedContactOrPropertyRejected: true, realDatabaseWrites: 0 }, null, 2))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
