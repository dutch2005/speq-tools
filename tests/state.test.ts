import { test, expect, describe } from 'bun:test';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parse, type SpeqSpec } from '../src/parser.js';
import { generate, setStatus } from '../src/state.js';

let counter = 0;
function tmpPath(): string {
  return join(tmpdir(), `speq_state_${Date.now()}_${counter++}.speq`);
}

function specFrom(content: string): SpeqSpec {
  const p = tmpPath();
  writeFileSync(p, content);
  try {
    return parse(p);
  } finally {
    try { unlinkSync(p); } catch { /* ignore */ }
  }
}

function withState(content: string, fn: (path: string) => void): void {
  const p = tmpPath();
  writeFileSync(p, generate(specFrom(content), 'demo'));
  try {
    fn(p);
  } finally {
    try { unlinkSync(p); } catch { /* ignore */ }
  }
}

const V03 = [
  'VERSION 0.3.0',
  'PROJECT',
  '  NAME "demo"',
  '  LANG python',
  '  DEPS',
  '    SYSTEM libpq',
  'ENTITY user, order',
  'CLASSIFY',
  '  user.password credential',
  'LAYERS',
  '  API',
  '    OWNS routing',
  '    BOUNDARY external',
  'CONTRACTS',
  '  order.checkout AUDIT actor, timestamp',
  '  FLOW checkout',
  '    1. [API] user.start',
  '    2. [API] order.end',
  '    ROLLBACK order.cancel',
  '    ATOMIC true',
  'TESTING',
  '  flow checkout',
  '    coverage: 95%',
  '    categories: positive, rollback',
  '    performance: p99:3s',
  '    fixtures: valid_cart',
].join('\n');

describe('state.generate — TESTS section (v0.3 §7)', () => {
  test('emits a row for coverage, each category, performance, and fixtures', () => {
    const out = generate(specFrom(V03), 'demo');
    expect(out).toContain('TESTS');
    expect(out).toMatch(/checkout\.coverage\s+UNVERIFIED/);
    expect(out).toMatch(/checkout\.positive\s+UNVERIFIED/);
    expect(out).toMatch(/checkout\.rollback\s+UNVERIFIED/);
    expect(out).toMatch(/checkout\.performance\s+UNVERIFIED/);
    expect(out).toMatch(/checkout\.fixtures\s+UNVERIFIED/);
  });
});

describe('state.generate — AUDIT section (v0.3 §7)', () => {
  test('emits a row for each AUDIT subject', () => {
    const out = generate(specFrom(V03), 'demo');
    expect(out).toContain('AUDIT');
    expect(out).toMatch(/order\.checkout\s+UNVERIFIED/);
  });
});

describe('state.setStatus — CHECKS rows and FAILED', () => {
  test('updates a CHECKS row that carries a trailing # comment', () => {
    withState(V03, (p) => {
      setStatus(p, 'python', 'OK');
      expect(readFileSync(p, 'utf-8')).toMatch(/python\s+OK\s+# LANG/);
    });
  });

  test('accepts FAILED as a status for a CHECKS row', () => {
    withState(V03, (p) => {
      setStatus(p, 'libpq', 'FAILED');
      expect(readFileSync(p, 'utf-8')).toMatch(/libpq\s+FAILED/);
    });
  });
});

describe('state.setStatus — BUILT gating (v0.3 §7)', () => {
  test('entity cannot be BUILT while CHECKS are not all OK', () => {
    withState(V03, (p) => {
      expect(() => setStatus(p, 'user', 'BUILT')).toThrow(/CHECKS/);
    });
  });

  test('entity referenced by AUDIT cannot be BUILT while its AUDIT row is not OK', () => {
    withState(V03, (p) => {
      setStatus(p, 'python', 'OK');
      setStatus(p, 'libpq', 'OK');
      expect(() => setStatus(p, 'order', 'BUILT')).toThrow(/AUDIT/);
    });
  });

  test('entity can be BUILT once CHECKS and its AUDIT are OK', () => {
    withState(V03, (p) => {
      setStatus(p, 'python', 'OK');
      setStatus(p, 'libpq', 'OK');
      setStatus(p, 'order.checkout', 'OK');
      setStatus(p, 'order', 'BUILT');
      expect(readFileSync(p, 'utf-8')).toMatch(/order\s+BUILT/);
    });
  });

  test('flow cannot be BUILT while its TESTS are not all OK', () => {
    withState(V03, (p) => {
      expect(() => setStatus(p, 'checkout', 'BUILT')).toThrow(/TESTS/);
    });
  });
});

describe('state.setStatus — per-section status validity (v0.3 §7)', () => {
  test('BUILT is rejected for a CHECKS row', () => {
    withState(V03, (p) => {
      expect(() => setStatus(p, 'python', 'BUILT')).toThrow(/not valid/);
    });
  });
});

describe('state.setStatus — gating uses a robust key match', () => {
  test('gate is not bypassed by a key whose own name contains a dot', () => {
    const p = tmpPath();
    writeFileSync(p, [
      'STATE demo',
      '',
      '  FLOWS',
      '    auth.login                 PENDING',
      '',
      '  TESTS',
      '    auth.login.coverage        UNVERIFIED',
      '',
    ].join('\n'));
    try {
      // A naive split('.')[0] would read the owner as 'auth', miss the test row,
      // and silently let the flow reach BUILT. A prefix match must still gate it.
      expect(() => setStatus(p, 'auth.login', 'BUILT')).toThrow(/TESTS/);
    } finally {
      try { unlinkSync(p); } catch { /* ignore */ }
    }
  });
});
