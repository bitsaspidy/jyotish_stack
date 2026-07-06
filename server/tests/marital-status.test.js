'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeMaritalStatus,
  isValidMaritalStatusInput,
  hasMarriageOccurred,
} = require('../src/utils/marital-status');

test('normalizes supported marital-status values safely', () => {
  assert.equal(normalizeMaritalStatus(' Married '), 'married');
  assert.equal(normalizeMaritalStatus('not_specified'), null);
  assert.equal(normalizeMaritalStatus(''), null);
  assert.equal(normalizeMaritalStatus('invalid'), undefined);
});

test('accepts only allow-listed marital-status input', () => {
  for (const value of [undefined, null, '', 'not_specified', 'unmarried', 'married', 'divorced', 'widowed']) {
    assert.equal(isValidMaritalStatusInput(value), true, `${value} should be valid`);
  }
  assert.equal(isValidMaritalStatusInput('engaged'), false);
});

test('recognizes that marriage has occurred for married, divorced or widowed profiles', () => {
  assert.equal(hasMarriageOccurred({ marital_status:'married' }), true);
  assert.equal(hasMarriageOccurred({ marital_status:'divorced' }), true);
  assert.equal(hasMarriageOccurred({ marital_status:'widowed' }), true);
  assert.equal(hasMarriageOccurred({ marital_status:'unmarried' }), false);
  assert.equal(hasMarriageOccurred({}), false);
});
