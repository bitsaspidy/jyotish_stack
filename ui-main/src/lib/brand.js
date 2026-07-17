/**
 * Brand and intellectual-property constants — the ONE place these live.
 *
 * ⚖️ READ BEFORE CHANGING TRADEMARK_SYMBOL
 *
 * `™` may be used by anyone claiming a mark. No registration is required, and it
 * carries no false statement — it simply asserts a claim.
 *
 * `®` may ONLY be used once the trademark registration has actually been GRANTED
 * and the certificate issued. It is NOT a function of elapsed time. Under the
 * Indian Trade Marks Act 1999, s.107, representing an unregistered mark as
 * registered is a criminal offence (imprisonment up to 3 years and/or a fine).
 *
 * Current status (2026-07-17, per the owner): copyright in the logo artwork is
 * REGISTERED; the trademark application is FILED and PENDING. So: ™ now, © for the
 * artwork, and nothing anywhere may describe the mark as "registered".
 *
 * When the registration certificate arrives:
 *   1. set TRADEMARK_SYMBOL = '®'
 *   2. set TRADEMARK_STATUS = 'registered'
 *   3. set TRADEMARK_REG_NO  = '<number from the certificate>'
 * The Terms page reads all three and its wording follows automatically. Do not
 * flip any of them on a date — flip them on the certificate.
 *
 * This is engineering scaffolding, not legal advice; the owner's IP counsel is the
 * authority on what may be claimed and when.
 */

export const BRAND_NAME = 'Jyotish Stack AI';
export const BRAND_NAME_SHORT = 'Jyotish Stack';

/** '™' while the application is pending · '®' only once granted. */
export const TRADEMARK_SYMBOL = '™';

/** 'unregistered' | 'pending' | 'registered' — drives the Terms wording. */
export const TRADEMARK_STATUS = 'pending';

/** Fill in from the certificate when the registration is granted. */
export const TRADEMARK_REG_NO = null;

/** Copyright in the logo artwork and site content. */
export const COPYRIGHT_HOLDER = 'Jyotish Stack AI';
export const COPYRIGHT_START_YEAR = 2026;

/** "© 2026 Jyotish Stack AI" — collapses to one year until the range is real. */
export function copyrightLine(year = new Date().getFullYear()) {
  const span = year > COPYRIGHT_START_YEAR ? `${COPYRIGHT_START_YEAR}–${year}` : `${COPYRIGHT_START_YEAR}`;
  return `© ${span} ${COPYRIGHT_HOLDER}`;
}

/**
 * The wordmark with its trademark symbol.
 *
 * Deliberately NOT used in <title> or meta descriptions: a ™ in every search
 * result is noise, and the symbol's job is brand presentation, not SERP copy.
 */
export const BRAND_TM = `${BRAND_NAME}${TRADEMARK_SYMBOL}`;
export const BRAND_SHORT_TM = `${BRAND_NAME_SHORT}${TRADEMARK_SYMBOL}`;
