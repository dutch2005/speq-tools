import { test, expect, describe } from 'bun:test';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parse } from '../src/parser.js';
import { generate } from '../src/context.js';

let counter = 0;
function contextOf(content: string): string {
  const p = join(tmpdir(), `speq_ctx_${Date.now()}_${counter++}.speq`);
  writeFileSync(p, content);
  try {
    return generate(parse(p));
  } finally {
    try { unlinkSync(p); } catch { /* ignore */ }
  }
}

const V03 = [
  'VERSION 0.3.0',
  'ENTITY order, payment',
  'CONTRACTS',
  '  order.checkout AUDIT actor, timestamp, target, outcome',
  '  FLOW checkout',
  '    1. order.start',
  '    2. payment.charge',
  'TESTING',
  '  flow checkout',
  '    coverage: 95%',
  '    categories: positive, rollback',
  '    performance: p99:3s, throughput:50rps',
  '    fixtures: valid_cart, declined_card',
].join('\n');

describe('context — AUDIT section', () => {
  test('emits an AUDIT section listing subject and fields', () => {
    const out = contextOf(V03);
    expect(out).toContain('=== AUDIT ===');
    expect(out).toMatch(/order\.checkout\s+actor, timestamp, target, outcome/);
  });
});

describe('context — TESTING section', () => {
  test('emits categories, performance, and fixtures (not just coverage)', () => {
    const out = contextOf(V03);
    const testingSection = out.slice(out.indexOf('=== TESTING ==='));
    expect(testingSection).toMatch(/coverage:\s+95%/);
    expect(testingSection).toMatch(/categories:\s+positive, rollback/);
    expect(testingSection).toMatch(/performance:\s+p99:3s, throughput:50rps/);
    expect(testingSection).toMatch(/fixtures:\s+valid_cart, declined_card/);
  });
});

describe('context — preamble RULES', () => {
  test('documents AUDIT and TESTING semantics for the agent', () => {
    const out = contextOf(V03);
    const preamble = out.slice(0, out.indexOf('=== PROJECT SPEC ==='));
    expect(preamble).toMatch(/AUDIT\s+—.*non-repudiation/i);
    expect(preamble).toMatch(/TESTING\s+—/);
  });
});
