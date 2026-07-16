'use strict';
/**
 * Kundli tab coverage.
 *
 * MAIN_TABS is shared by the user view and the admin view, so adding a tab renders
 * a BUTTON in both — whether or not either view has content behind it. A tab with
 * no matching render block fails silently: the button is there, it highlights when
 * clicked, and the page below it is simply blank. Nothing throws, nothing logs, no
 * test notices.
 *
 * That is exactly how the admin "Ask a Question" tab shipped empty. This makes the
 * next one a test failure instead of a bug report.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (p) => fs.readFileSync(path.resolve(__dirname, '..', '..', p), 'utf8');

function tabKeys() {
  const src = read('ui-main/src/components/kundli/kundliConstants.js');
  const start = src.indexOf('MAIN_TABS = [');
  assert.ok(start > -1, 'MAIN_TABS should exist in kundliConstants');
  const block = src.slice(start, src.indexOf('];', start));
  const keys = [...block.matchAll(/key\s*:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(keys.length > 5, `expected the full tab list, found ${keys.length}`);
  return keys;
}

const VIEWS = [
  ['user',  'ui-main/src/views/KundliDetail.jsx'],
  ['admin', 'ui-main/src/admin-views/KundliAdminDetail.jsx'],
];

for (const [label, file] of VIEWS) {
  test(`${label} Kundli view renders every tab it offers`, () => {
    const src = read(file);
    const missing = tabKeys().filter((k) => !src.includes(`activeTab === '${k}'`));
    assert.deepStrictEqual(missing, [],
      `${file} shows tab button(s) with no content behind them: ${missing.join(', ')}. `
      + 'Either render the tab or remove it from MAIN_TABS — a button that does nothing '
      + 'is indistinguishable from a broken page.');
  });
}

test('the admin Ask-a-Question tab is wired to the admin-scoped endpoints', () => {
  const src = read('ui-main/src/admin-views/KundliAdminDetail.jsx');
  assert.ok(src.includes("activeTab === 'ask-question'"), 'admin must render the ask-question tab');
  // The user-facing answer route is ownership-scoped and 404s for an admin reading
  // someone else's chart, so the admin view must not point at it.
  assert.ok(!/\/kundli\/\$\{kundliUuid\}\/qa\/deterministic/.test(src),
    'admin must not call the ownership-scoped user answer route');
  assert.ok(/\/admin\/kundlis\/\$\{kundliUuid\}\/qa/.test(src),
    'admin must call the admin-scoped answer route');
});

test('the question panel keeps its endpoints injectable so both views share one copy', () => {
  const src = read('ui-main/src/components/KundliQuestionPanel.jsx');
  assert.ok(/client\s*=\s*api/.test(src), 'client must be injectable (admin passes adminApi)');
  assert.ok(/catalogueUrl\s*=/.test(src), 'catalogueUrl must be injectable');
  assert.ok(/answerUrl/.test(src), 'answerUrl must be injectable');
});
