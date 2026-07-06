const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const UI_ROOT = path.resolve(__dirname, '../../ui-main/src');
const read = (relativePath) => fs.readFileSync(path.join(UI_ROOT, relativePath), 'utf8');

test('root layout keeps the device-width mobile viewport contract', () => {
  const layout = read('app/layout.jsx');
  assert.match(layout, /width:\s*'device-width'/);
  assert.match(layout, /initialScale:\s*1/);
});

test('global styles prevent page overflow and compact the Admin shell on phones', () => {
  const css = read('app/globals.css');
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /\.admin-sidebar\s*\{\s*width:\s*60px\s*!important/);
  assert.match(css, /\.admin-shell-main\s*\{\s*margin-left:\s*60px\s*!important/);
  assert.match(css, /\.admin-responsive-grid\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)\s*!important/);
});

test('major public layouts expose explicit mobile stacking contracts', () => {
  assert.match(read('views/DailyHoroscope.jsx'), /className="horoscope-main-grid"/);
  assert.match(read('views/ProfilePage.jsx'), /className="profile-tabs"/);
  assert.match(read('views/ProfilePage.jsx'), /className="profile-content-card"/);
  assert.match(read('views/VarshphalPage.jsx'), /className="varshphal-main-grid"/);
  assert.match(read('components/calculators/BirthFields.jsx'), /className="birth-fields-grid"/);
});

test('Admin email manager switches between list and detail panes on mobile', () => {
  const emailManager = read('admin-views/EmailManager.jsx');
  assert.match(emailManager, /email-manager-mobile-toolbar/);
  assert.match(emailManager, /email-manager-list/);
  assert.match(emailManager, /email-manager-detail/);
  assert.match(emailManager, /email-manager-mobile-hidden/);
});
