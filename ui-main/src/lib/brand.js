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

/**
 * The LEGAL ENTITY behind the brand.
 *
 * "Jyotish Stack AI" is a brand; it cannot own a trademark, cannot enter a
 * contract, and cannot be the seller on a GST invoice. The trademark application
 * is filed by M/S. Sat Sai Infocom (proprietor: Devavrat Singh), and that is who
 * the Terms bind, who owns the marks, and who Indian e-commerce disclosure rules
 * require to be named. Everything user-facing must say the entity, not the brand,
 * wherever ownership or obligation is being asserted.
 */
export const LEGAL_ENTITY = 'M/S. Sat Sai Infocom';
export const LEGAL_PROPRIETOR = 'Devavrat Singh';

/** '™' while the application is pending · '®' only once granted. */
export const TRADEMARK_SYMBOL = '™';

/** 'unregistered' | 'pending' | 'registered' — drives the Terms wording. */
export const TRADEMARK_STATUS = 'pending';

/**
 * Trade mark application, filed on Form TM-A.
 *
 * PUBLISHED ON PURPOSE. Indian trade mark applications are public record — anyone
 * can look 7841777 up on the IP India public search and see the mark, class,
 * applicant and status, and the mark is published in the Trade Marks Journal by
 * law. So there is nothing to protect by hiding it, and naming it deters copying,
 * puts the world on notice of the claim (useful in a passing-off action), and is
 * independently verifiable.
 *
 * ⛔ The IP India **Party Code** is deliberately NOT here and must never be added.
 * It identifies the applicant's account in the filing portal, the public has no
 * use for it, and publishing it only creates surface for mischief in future
 * filings. Same for any e-filing credentials.
 */
export const TRADEMARK_APP_NO = '7841777';
export const TRADEMARK_CLASS = 45; // astrological & personal services
export const TRADEMARK_APP_FORM = 'TM-A';

/** Fill in from the certificate when the registration is granted. */
export const TRADEMARK_REG_NO = null;

/** Copyright in the logo artwork and site content — held by the entity. */
export const COPYRIGHT_HOLDER = LEGAL_ENTITY;
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
