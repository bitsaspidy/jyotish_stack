'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSharedConfig, boolEnv, departmentInbox } = require('../src/services/email.service');

test('parses SMTP boolean flags explicitly', () => {
  assert.equal(boolEnv('true'), true);
  assert.equal(boolEnv('1'), true);
  assert.equal(boolEnv('yes'), true);
  assert.equal(boolEnv('false'), false);
  assert.equal(boolEnv('', true), true);
});

test('builds self-hosted SMTP submission settings', () => {
  const config = buildSharedConfig({
    SMTP_HOST: 'mail.jyotishstack.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_REQUIRE_TLS: 'true',
    SMTP_TLS_REJECT_UNAUTHORIZED: 'true',
    SMTP_TLS_SERVERNAME: 'mail.jyotishstack.com',
  });

  assert.deepEqual(config, {
    host: 'mail.jyotishstack.com',
    port: 587,
    secure: false,
    requireTLS: true,
    tls: {
      rejectUnauthorized: true,
      servername: 'mail.jyotishstack.com',
    },
  });
});

test('routes general inquiries to the support mailbox', () => {
  assert.equal(departmentInbox('sales'), 'sales');
  assert.equal(departmentInbox('account'), 'account');
  assert.equal(departmentInbox('general'), 'team');
  assert.equal(departmentInbox('unknown'), 'team');
});
