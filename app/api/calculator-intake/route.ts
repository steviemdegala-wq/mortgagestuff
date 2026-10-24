import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sessionOptions, type SessionData } from '@/lib/session';
import { createHash } from 'node:crypto';

const stages = ['estimate_saved', 'prequalification_requested', 'project_letter_created'];
export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 20000) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  let data;
  try { data = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return NextResponse.json({ error: 'Invalid intake' }, { status: 400 });
  const email = String(data.contact?.email || '').trim().toLowerCase();
  const name = String(data.contact?.name || '').trim();
  const phone = String(data.contact?.phone || '').replace(/\D/g, '');
  if (!/^[0-9a-f]{64}$/.test(data.contactKey || '') || (data.stage !== 'estimate_saved' && !/^[0-9a-f]{64}$/.test(data.propertyKey || '')) || !/^[0-9a-f-]{36}$/i.test(data.scenarioId || '') || !stages.includes(data.stage) || data.consentVersion !== 'chatgpt-estimate-contact-v1' || !name || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{10}$/.test(phone) || typeof data.notes !== 'string' || data.notes.length > 12000 || !Number.isFinite(data.loanAmount) || data.loanAmount < 0) return NextResponse.json({ error: 'Invalid calculator intake' }, { status: 400 });
  const key = createHash('sha256').update(`${data.scenarioId}:${email}`).digest('hex');
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const loan = await prisma.$transaction(async tx => {
        const existing = await tx.loan.findUnique({ where: { calculatorKey: key } });
        const delivery = {
          ...(data.delivery?.borrower === true ? { estimateBorrowerSent: true } : {}),
          ...(data.delivery?.internal === true ? { estimateInternalSent: true } : {}),
          ...(data.delivery?.letter === true ? { projectLetterSent: true } : {}),
        };
        if (existing) {
          if (existing.calculatorContactKey !== data.contactKey || (data.stage !== 'estimate_saved' && existing.calculatorPropertyKey && existing.calculatorPropertyKey !== data.propertyKey)) throw new Error('This saved request has different contact or property details. Start a new estimate.');
          const advancing = stages.indexOf(data.stage) > stages.indexOf(existing.calculatorStage || 'estimate_saved');
          return tx.loan.update({ where: { id: existing.id }, data: { ...delivery, ...(data.stage !== 'estimate_saved' && !existing.calculatorPropertyKey ? { calculatorPropertyKey: data.propertyKey } : {}), ...(advancing ? { calculatorStage: data.stage, notes: data.notes } : {}) } });
        }
        if (data.stage !== 'estimate_saved') throw new Error('Save the estimate before requesting a letter');
        let person = await tx.person.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
        if (await tx.loan.count({ where: { person: { email: { equals: email, mode: 'insensitive' } }, calculatorKey: { not: null }, createdAt: { gte: new Date(Date.now() - 3600000) } } }) >= 5) throw new Error('Too many new calculator deals for this email. Please contact Stevie.');
        const existingPerson = Boolean(person);
        if (!person) person = await tx.person.create({ data: { name, email, phone, role: 'Borrower', stage: 'New Lead', tags: ['ChatGPT', 'Fix and Flip Calculator'], notes: { create: { body: `ChatGPT contact consent: ${data.consentVersion}; ${new Date().toISOString()}. Name: ${name}; phone: ${phone}.` } } } });
        if (existingPerson) await tx.person.update({ where: { id: person.id }, data: { tags: Array.from(new Set([...person.tags, 'ChatGPT', 'Fix and Flip Calculator'])), notes: { create: { body: `ChatGPT contact consent: ${data.consentVersion}; ${new Date().toISOString()}. Name: ${name}; phone: ${phone}.` } } } });
        return tx.loan.create({ data: { personId: person.id, calculatorKey: key, calculatorStage: 'estimate_saved', calculatorContactKey: data.contactKey, name: `${name} - ChatGPT Fix and Flip`, loanAmount: data.loanAmount, loanType: 'Fix and Flip — ChatGPT', notes: data.notes } });
      }, { isolationLevel: 'Serializable' });
      return NextResponse.json({ ok: true, stage: loan.calculatorStage, delivery: { borrower: loan.estimateBorrowerSent, internal: loan.estimateInternalSent, letter: loan.projectLetterSent } });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (['P2002', 'P2034'].includes(code || '') && attempt < 3) continue;
      console.error('Calculator intake failed', { code: code || 'unknown' });
      return NextResponse.json({ error: 'Unable to save calculator request' }, { status: 503 });
    }
  }
  return NextResponse.json({ error: 'Please retry' }, { status: 503 });
}
