import { readFileSync, writeFileSync } from 'fs';
import type { SpeqSpec } from './parser.js';

export const STATUS_VALUES = [
  'BUILT', 'PARTIAL', 'PENDING', 'OK', 'FAILED', 'MISSING', 'UNVERIFIED', 'SET', 'UNSET',
] as const;

// Per-section status sets (SPEC v0.3 §7)
const PROGRESS_STATUSES = new Set(['PENDING', 'PARTIAL', 'BUILT']);   // ENTITY / FLOWS / LAYERS
const VERIFY_STATUSES = new Set(['UNVERIFIED', 'OK', 'FAILED']);      // CHECKS / TESTS / AUDIT
const PROGRESS_SECTIONS = new Set(['ENTITY', 'FLOWS', 'LAYERS']);
const VERIFY_SECTIONS = new Set(['CHECKS', 'TESTS', 'AUDIT']);

interface StateRow {
  section: string;
  key: string;
  status: string;
}

function parseRows(content: string): StateRow[] {
  const rows: StateRow[] = [];
  let section = '';
  for (const raw of content.split('\n')) {
    const hashIdx = raw.indexOf('#');
    const code = hashIdx === -1 ? raw : raw.slice(0, hashIdx);
    const trimmed = code.trim();
    if (!trimmed) continue;
    const indent = code.length - code.trimStart().length;
    if (indent === 0) continue;          // "STATE <name>" header
    if (indent < 4) {                    // section header, e.g. "  CHECKS"
      section = trimmed.split(/\s+/)[0];
      continue;
    }
    const parts = trimmed.split(/\s+/);  // row, e.g. "key STATUS"
    if (parts.length >= 2) {
      rows.push({ section, key: parts[0], status: parts[parts.length - 1] });
    }
  }
  return rows;
}

export function generate(spec: SpeqSpec, projectName: string): string {
  const lines: string[] = [`STATE ${projectName}`, ''];

  const checks: [string, string][] = [];
  const lang = spec.project.get('LANG');
  if (lang?.kind === 'str') checks.push([lang.value, 'LANG']);

  const deps = spec.project.get('DEPS');
  if (deps?.kind === 'deps') {
    for (const dep of deps.value['SYSTEM'] ?? []) checks.push([dep, 'DEPS.SYSTEM']);
    for (const dep of deps.value['RUNTIME'] ?? []) checks.push([dep, 'DEPS.RUNTIME']);
  }

  if (checks.length > 0) {
    lines.push('  CHECKS');
    for (const [name, source] of checks) {
      lines.push(`    ${name.padEnd(28)} UNVERIFIED   # ${source}`);
    }
    lines.push('');
  }

  if (spec.entities.length > 0) {
    lines.push('  ENTITY');
    for (const entity of spec.entities) {
      lines.push(`    ${entity.padEnd(28)} PENDING`);
    }
    lines.push('');
  }

  if (spec.flows.size > 0) {
    lines.push('  FLOWS');
    for (const name of spec.flowsOrder) {
      lines.push(`    ${name.padEnd(28)} PENDING`);
    }
    lines.push('');
  }

  if (spec.layers.size > 0) {
    lines.push('  LAYERS');
    for (const name of spec.layersOrder) {
      lines.push(`    ${name.padEnd(28)} PENDING`);
    }
    lines.push('');
  }

  // TESTS — one row per coverage / each declared category / performance / fixtures, per flow (SPEC §7)
  const testRows: string[] = [];
  for (const name of spec.flowsOrder) {
    const t = spec.testing.get(name);
    if (!t) continue;
    if (t.coverage !== undefined) testRows.push(`${name}.coverage`);
    for (const cat of t.categories) testRows.push(`${name}.${cat}`);
    if (t.performance.length > 0) testRows.push(`${name}.performance`);
    if (t.fixtures.length > 0) testRows.push(`${name}.fixtures`);
  }
  if (testRows.length > 0) {
    lines.push('  TESTS');
    for (const key of testRows) {
      lines.push(`    ${key.padEnd(28)} UNVERIFIED`);
    }
    lines.push('');
  }

  // AUDIT — one row per AUDIT contract subject (SPEC §7)
  if (spec.audits.length > 0) {
    lines.push('  AUDIT');
    for (const a of spec.audits) {
      lines.push(`    ${a.subject.padEnd(28)} UNVERIFIED`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function setStatus(path: string, key: string, status: string): void {
  const upperStatus = status.toUpperCase();
  if (!(STATUS_VALUES as readonly string[]).includes(upperStatus)) {
    throw new Error(`Invalid status '${upperStatus}'. Must be: ${STATUS_VALUES.join(', ')}`);
  }

  const content = readFileSync(path, 'utf-8');
  const rows = parseRows(content);
  const target = rows.find(r => r.key === key);
  if (!target) {
    throw new Error(`Key '${key}' not found in state file`);
  }

  // Per-section status validity (SPEC §7): progress sections use PENDING/PARTIAL/BUILT,
  // verification sections use UNVERIFIED/OK/FAILED.
  if (PROGRESS_SECTIONS.has(target.section) && !PROGRESS_STATUSES.has(upperStatus)) {
    throw new Error(`Status '${upperStatus}' is not valid for ${target.section}. Allowed: ${[...PROGRESS_STATUSES].join(', ')}.`);
  }
  if (VERIFY_SECTIONS.has(target.section) && !VERIFY_STATUSES.has(upperStatus)) {
    throw new Error(`Status '${upperStatus}' is not valid for ${target.section}. Allowed: ${[...VERIFY_STATUSES].join(', ')}.`);
  }

  // BUILT gating (SPEC §7): an entity needs all CHECKS OK (and its AUDIT, if any, OK);
  // a flow needs all its TESTS OK. Owner match is a prefix match (the row is the owner
  // itself or one of its dotted children) — not split('.')[0], which breaks on dotted keys.
  const belongsTo = (rowKey: string, owner: string): boolean =>
    rowKey === owner || rowKey.startsWith(owner + '.');
  if (upperStatus === 'BUILT') {
    if (target.section === 'ENTITY') {
      const checksNotOk = rows.filter(r => r.section === 'CHECKS' && r.status !== 'OK');
      if (checksNotOk.length > 0) {
        throw new Error(`Cannot mark entity '${key}' BUILT: all CHECKS must be OK first (pending: ${checksNotOk.map(r => r.key).join(', ')}).`);
      }
      const auditNotOk = rows.filter(r => r.section === 'AUDIT' && belongsTo(r.key, key) && r.status !== 'OK');
      if (auditNotOk.length > 0) {
        throw new Error(`Cannot mark entity '${key}' BUILT: its AUDIT contract must be OK first (pending: ${auditNotOk.map(r => r.key).join(', ')}).`);
      }
    } else if (target.section === 'FLOWS') {
      const testsNotOk = rows.filter(r => r.section === 'TESTS' && belongsTo(r.key, key) && r.status !== 'OK');
      if (testsNotOk.length > 0) {
        throw new Error(`Cannot mark flow '${key}' BUILT: all its TESTS must be OK first (pending: ${testsNotOk.map(r => r.key).join(', ')}).`);
      }
    }
  }

  // Apply the update, preserving any trailing comment on the matched line.
  const result: string[] = [];
  let updated = false;
  for (const line of content.split('\n')) {
    const hashIdx = line.indexOf('#');
    const code = hashIdx === -1 ? line : line.slice(0, hashIdx);
    const comment = hashIdx === -1 ? '' : line.slice(hashIdx);
    const parts = code.trim().split(/\s+/);
    if (!updated && parts.length === 2 && parts[0] === key && (STATUS_VALUES as readonly string[]).includes(parts[1])) {
      const leadingLen = line.length - line.trimStart().length;
      const leading = line.slice(0, leadingLen);
      let newLine = `${leading}${key.padEnd(28)} ${upperStatus}`;
      if (comment) newLine += `   ${comment.trimEnd()}`;
      result.push(newLine);
      updated = true;
    } else {
      result.push(line);
    }
  }

  if (!updated) {
    throw new Error(`Key '${key}' not found in state file`);
  }

  writeFileSync(path, result.join('\n'));
}
