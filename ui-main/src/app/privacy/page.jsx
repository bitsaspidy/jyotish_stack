import LegalPage from '../../components/LegalPage';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Jyotish Stack AI collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal information."
      lastUpdated="June 2026"
      currentHref="/privacy"
    >
      <div className="notice-box">
        <p>Jyotish Stack AI is committed to protecting your privacy. This Policy is compliant with India's <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and other applicable laws. By using the Platform, you consent to the practices described herein.</p>
      </div>

      <h2>1. Information We Collect</h2>

      <h3>a. Account Information</h3>
      <ul>
        <li>Full name and email address</li>
        <li>Password (stored as a bcrypt hash — never in plain text)</li>
        <li>Preferred language (English / Hindi)</li>
        <li>Account creation date and subscription status</li>
      </ul>

      <h3>b. Kundli (Birth Chart) Data</h3>
      <ul>
        <li>Full name, date of birth, time of birth, place of birth</li>
        <li>Relationship to the person (self, spouse, child, etc.)</li>
      </ul>
      <p>This data is used <strong>exclusively</strong> to generate astrological charts and analysis. We do not share this data with third parties except as necessary to provide the service (e.g., geocoding the birth place to get coordinates).</p>

      <h3>c. Payment Information</h3>
      <ul>
        <li>Transaction ID, Razorpay order ID, subscription plan details</li>
        <li>GST invoice details (if provided: GSTIN, state of supply)</li>
      </ul>
      <p>We do <strong>not</strong> store full card numbers, CVV, or banking credentials. All payment processing is handled by Razorpay (PCI-DSS Level 1 compliant).</p>

      <h3>d. Usage and Technical Data</h3>
      <ul>
        <li>Pages visited, features used, session duration</li>
        <li>Device type, browser type, operating system</li>
        <li>IP address (used for security and fraud prevention; not linked to your profile for marketing)</li>
        <li>Error logs and performance data</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li><strong>Service delivery:</strong> To generate Kundli charts, predictions, matchmaking reports, and all other subscribed services</li>
        <li><strong>Account management:</strong> To manage your account, verify identity, and process subscriptions</li>
        <li><strong>Payments and invoicing:</strong> To process payments via Razorpay and issue GST-compliant tax invoices</li>
        <li><strong>Communication:</strong> To send account verification emails, payment confirmations, subscription reminders, and service updates</li>
        <li><strong>Platform improvement:</strong> To improve our AI models and service quality using anonymized, aggregated usage data — no personally identifiable information is used for model training</li>
        <li><strong>Security:</strong> To detect, prevent, and investigate fraud, abuse, or unauthorized access</li>
        <li><strong>Legal compliance:</strong> To meet our obligations under Indian tax law, consumer protection regulations, and other applicable laws</li>
      </ul>

      <h2>3. Legal Basis for Processing</h2>
      <p>We process your personal data on the following legal grounds under the DPDP Act, 2023:</p>
      <ul>
        <li><strong>Consent:</strong> You provide consent when you register an account and agree to these Terms</li>
        <li><strong>Contract performance:</strong> Processing necessary to deliver the services you have subscribed to</li>
        <li><strong>Legal obligation:</strong> Retaining invoice and transaction data as required by Indian GST laws</li>
        <li><strong>Legitimate interest:</strong> Security monitoring and fraud prevention</li>
      </ul>

      <h2>4. Data Storage and Security</h2>
      <ul>
        <li>Your data is stored on secure servers with industry-standard encryption (AES-256 at rest)</li>
        <li>All data transmission uses HTTPS/TLS 1.2 or higher</li>
        <li>Passwords are hashed using bcrypt with appropriate work factors</li>
        <li>Access to your personal data is restricted to authorized personnel only, on a need-to-know basis</li>
        <li>We conduct periodic security reviews of our systems</li>
      </ul>
      <p>While we take all reasonable steps to protect your data, no system is 100% secure. We encourage you to use a strong, unique password and to enable additional security measures where available.</p>

      <h2>5. Third-Party Services</h2>
      <p>We share limited data with trusted third-party providers solely to operate the Platform:</p>
      <ul>
        <li><strong>Razorpay:</strong> Payment processing. Razorpay receives your payment details and transaction data. Governed by <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">Razorpay's Privacy Policy</a>.</li>
        <li><strong>Email service providers:</strong> For transactional emails (account verification, invoices, notifications). We share only your email address and the content of the specific email.</li>
        <li><strong>Geocoding APIs:</strong> Your birth place name is sent to a geocoding service to obtain coordinates for chart calculation. This is typically a city/district name — no personally identifying information is attached.</li>
        <li><strong>Cloud infrastructure:</strong> Your data is hosted on secure cloud servers. Our hosting provider cannot access the contents of your data.</li>
      </ul>
      <p>We <strong>do not sell</strong> your personal data to any third party. We do not share your data with advertisers, data brokers, or marketing companies.</p>

      <h2>6. Cookies</h2>
      <p>We use cookies for session management and user authentication. For full details, see our <a href="/cookie-policy">Cookie Policy</a>.</p>

      <h2>7. Data Retention</h2>
      <ul>
        <li><strong>Account data:</strong> Retained while your account is active and for 3 years after account closure, for dispute resolution and legal compliance</li>
        <li><strong>Kundli birth data:</strong> Retained as long as your account is active; deleted within 30 days of account deletion</li>
        <li><strong>Payment and invoice records:</strong> Retained for 7 years as required under Indian GST laws</li>
        <li><strong>Usage logs:</strong> Retained for 90 days, then automatically deleted</li>
        <li><strong>Email communication logs:</strong> Retained for 1 year</li>
      </ul>

      <h2>8. Your Rights under the DPDP Act, 2023</h2>
      <p>As a Data Principal, you have the following rights regarding your personal data:</p>
      <ul>
        <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
        <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements — e.g., we cannot delete invoice records required by tax law)</li>
        <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent at any time. This may affect your ability to continue using the Platform.</li>
        <li><strong>Right to Grievance Redressal:</strong> Lodge a complaint with us and, if unresolved, with the Data Protection Board of India</li>
        <li><strong>Right to Nominate:</strong> Nominate an individual to exercise these rights on your behalf in the event of your death or incapacity</li>
      </ul>
      <p>To exercise any of these rights, contact us at <a href="mailto:legal@jyotishstack.com">legal@jyotishstack.com</a>. We will respond within 30 days.</p>

      <h2>9. Children's Privacy</h2>
      <p>Our Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us immediately at <a href="mailto:legal@jyotishstack.com">legal@jyotishstack.com</a> and we will delete it promptly.</p>

      <h2>10. Data Transfers</h2>
      <p>Your data is primarily stored and processed within India. In cases where data is transferred to countries outside India (e.g., through certain cloud services or APIs), we ensure that adequate safeguards — including contractual protections — are in place to protect your data.</p>

      <h2>11. Updates to This Policy</h2>
      <p>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of material changes via email and by updating the "Last Updated" date. Continued use of the Platform after such changes constitutes acceptance.</p>

      <h2>12. Contact and Grievance Officer</h2>
      <div className="notice-box">
        <p><strong>Grievance Officer / Data Protection Contact</strong><br />
        <strong>Email:</strong> <a href="mailto:legal@jyotishstack.com">legal@jyotishstack.com</a><br />
        <strong>General Support:</strong> <a href="mailto:support@jyotishstack.com">support@jyotishstack.com</a><br />
        <strong>Website:</strong> <a href="https://jyotishstack.com">jyotishstack.com</a><br /><br />
        We aim to acknowledge privacy-related requests within <strong>48 hours</strong> and resolve them within <strong>30 days</strong>.</p>
      </div>
    </LegalPage>
  );
}
