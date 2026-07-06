'use strict';

const VALID_MARITAL_STATUSES = new Set(['unmarried', 'married', 'divorced', 'widowed']);
const MARRIAGE_OCCURRED_STATUSES = new Set(['married', 'divorced', 'widowed']);

function normalizeMaritalStatus(value) {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === '' || value === 'not_specified') return null;
  const normalized = String(value).trim().toLowerCase();
  return VALID_MARITAL_STATUSES.has(normalized) ? normalized : undefined;
}

function isValidMaritalStatusInput(value) {
  if (value === undefined || value === null || String(value).trim() === '' || value === 'not_specified') return true;
  return VALID_MARITAL_STATUSES.has(String(value).trim().toLowerCase());
}

function hasMarriageOccurred(profile = {}) {
  const status = normalizeMaritalStatus(profile.marital_status ?? profile.maritalStatus);
  return MARRIAGE_OCCURRED_STATUSES.has(status);
}

module.exports = {
  VALID_MARITAL_STATUSES,
  MARRIAGE_OCCURRED_STATUSES,
  normalizeMaritalStatus,
  isValidMaritalStatusInput,
  hasMarriageOccurred,
};
