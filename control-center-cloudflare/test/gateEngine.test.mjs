import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGate } from '../src/gateEngine.js';

test('Gate Engine passes only when all required checks pass', () => {
  const result = evaluateGate(['tests','build'], [{name:'tests',status:'PASS'},{name:'build',status:'PASS'}]);
  assert.equal(result.status, 'PASS');
  assert.deepEqual(result.reasons, []);
});

test('Gate Engine blocks missing or non-PASS required checks', () => {
  const result = evaluateGate(['tests','security'], [{name:'tests',status:'PASS'}]);
  assert.equal(result.status, 'BLOCK');
  assert.deepEqual(result.reasons, ['security: TODO']);
});
