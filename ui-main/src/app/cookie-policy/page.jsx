import LegalPage from '../../components/LegalPage';

export const metadata = {
  title: 'Cookie Policy',
  description: 'How Jyotish Stack AI uses cookies and similar technologies.',
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="How we use cookies and similar technologies on the Jyotish Stack AI Platform."
      lastUpdated="June 2026"
      currentHref="/cookie-policy"
    >
      <h2>1. What Are Cookies?</h2>
      <p>Cookies are small text files that are stored on your device (computer, smartphone, or tablet) when you visit a website. They help the website remember information about your visit — such as whether you are logged in, your language preference, and settings you have chosen — to make subsequent visits easier and the site more useful to you.</p>
      <p>Similar technologies include web beacons, local storage, and session storage, which serve comparable purposes. When we refer to "cookies" in this policy, we include these similar technologies.</p>

      <h2>2. How We Use Cookies</h2>
      <p>Jyotish Stack AI uses cookies for the following purposes:</p>

      <h3>2.1 Strictly Necessary Cookies</h3>
      <p>These cookies are essential for the Platform to function. Without them, you cannot log in, navigate securely, or use core features. They cannot be disabled.</p>
      <ul>
        <li><strong>Authentication token:</strong> Keeps you logged in during your browser session and across page navigations. Expires when you log out or after a set session period.</li>
        <li><strong>CSRF protection:</strong> Protects against cross-site request forgery attacks by verifying that form submissions originate from our Platform.</li>
        <li><strong>Session management:</strong> Maintains the state of your current session, including which Kundli profile is currently active.</li>
      </ul>

      <h3>2.2 Functional / Preference Cookies</h3>
      <p>These cookies remember your choices to provide a more personalized experience. They are not strictly necessary, but improve usability.</p>
      <ul>
        <li><strong>Language preference:</strong> Remembers whether you prefer English or Hindi (हिंदी) so you don't have to select it every visit.</li>
        <li><strong>Dashboard state:</strong> Remembers which panels you have expanded or collapsed in the Kundli detail view.</li>
      </ul>

      <h3>2.3 Analytics Cookies (Anonymized)</h3>
      <p>We may use anonymized analytics to understand how users navigate the Platform, which features are most used, and where users experience difficulties. This helps us improve the Platform.</p>
      <ul>
        <li>Analytics data is <strong>anonymized and aggregated</strong> — it is never linked to your personal identity or Kundli data.</li>
        <li>No personally identifiable information (name, email, birth data) is transmitted through analytics cookies.</li>
      </ul>

      <h2>3. What We Do NOT Use</h2>
      <p>We want to be clear about what we do <strong>not</strong> do with cookies:</p>
      <ul>
        <li>We do <strong>not</strong> use advertising or tracking cookies</li>
        <li>We do <strong>not</strong> share cookie data with advertising networks or data brokers</li>
        <li>We do <strong>not</strong> use cross-site tracking technologies to follow you across the internet</li>
        <li>We do <strong>not</strong> build advertising profiles based on your browsing behavior</li>
        <li>We do <strong>not</strong> sell data derived from cookies to any third party</li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>Certain features of the Platform involve third-party services that may set their own cookies on your device:</p>
      <ul>
        <li><strong>Razorpay (Payment Processing):</strong> When you initiate a payment, Razorpay's checkout widget may set cookies to ensure secure payment processing and fraud prevention. These cookies are governed by <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">Razorpay's Privacy Policy</a>.</li>
        <li><strong>Google Fonts:</strong> Our Platform loads web fonts from Google Fonts. Google may set cookies for font delivery optimization. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.</li>
      </ul>
      <p>We have no control over third-party cookies. Please refer to the respective third-party policies for more information.</p>

      <h2>5. Cookie Duration</h2>
      <p>Cookies we set can be classified by duration:</p>
      <ul>
        <li><strong>Session cookies:</strong> Exist only during your browser session and are automatically deleted when you close your browser. Used for CSRF protection and temporary state.</li>
        <li><strong>Persistent cookies:</strong> Remain on your device for a set period or until manually deleted. Used for authentication tokens (typically 30 days) and language preferences (1 year).</li>
      </ul>

      <h2>6. Managing Cookies</h2>
      <p>You can control and manage cookies through your browser settings. Here's how to access cookie settings in popular browsers:</p>
      <ul>
        <li><strong>Google Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
        <li><strong>Mozilla Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
        <li><strong>Apple Safari:</strong> Preferences → Privacy → Manage Website Data</li>
        <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Cookies and data stored</li>
        <li><strong>Opera:</strong> Settings → Advanced → Privacy & security → Site Settings → Cookies</li>
      </ul>
      <div className="notice-box">
        <p><strong>Note:</strong> Disabling or blocking strictly necessary cookies (Section 2.1) will prevent you from logging in and using core Platform features. Disabling functional cookies will mean your preferences are not saved between sessions.</p>
      </div>

      <h2>7. Do Not Track</h2>
      <p>Some browsers offer a "Do Not Track" (DNT) signal. Our Platform currently does not respond to DNT signals, as there is no universally accepted standard for what "tracking" means. However, as described in this policy, we do not engage in cross-site tracking or advertising-related tracking.</p>

      <h2>8. Updates to This Policy</h2>
      <p>We may update this Cookie Policy as our cookie practices evolve or in response to changes in applicable law. We will update the "Last Updated" date at the top of this page when changes are made. We encourage you to review this page periodically.</p>

      <h2>9. Contact</h2>
      <p>If you have questions about our use of cookies or similar technologies, please contact us:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:legal@jyotishstack.com">legal@jyotishstack.com</a></li>
        <li><strong>Website:</strong> <a href="https://jyotishstack.com">jyotishstack.com</a></li>
      </ul>
    </LegalPage>
  );
}
