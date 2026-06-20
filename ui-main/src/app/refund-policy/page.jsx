import LegalPage from '../../components/LegalPage';

export const metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Jyotish Stack AI refund and subscription cancellation policy.',
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      subtitle="Information about subscription refunds and cancellation procedures."
      lastUpdated="June 2026"
      currentHref="/refund-policy"
    >
      <div className="notice-box">
        <p>Jyotish Stack AI provides <strong>purely digital services</strong>. Access to all subscribed features is granted immediately upon successful payment. Please read this policy carefully before making a purchase.</p>
      </div>

      <h2>1. Nature of Our Services</h2>
      <p>All services on the Jyotish Stack AI Platform are digital and delivered electronically. There is no physical product or shipping involved. Upon successful payment verification, your subscription is activated instantly and you gain full access to all features included in your plan.</p>

      <h2>2. Subscription Plans</h2>
      <p>We currently offer the following subscription plans:</p>
      <ul>
        <li><strong>Basic Plan:</strong> ₹200 per month — 1 Kundli profile, full analysis access</li>
        <li><strong>Premium Plan:</strong> ₹499 per month — up to 5 Kundli profiles, PDF download, all features</li>
        <li><strong>Yearly Plan:</strong> ₹3,999 per year — up to 50 Kundli profiles, all features, priority support</li>
      </ul>
      <p>All prices are in Indian Rupees (INR) and are inclusive of applicable GST.</p>

      <h2>3. General Refund Policy</h2>
      <p>Due to the immediate, digital nature of our services, we operate a <strong>no-refund policy</strong> in most circumstances. Refunds are generally not provided once:</p>
      <ul>
        <li>A subscription has been successfully activated</li>
        <li>Kundli charts have been generated or accessed</li>
        <li>AI predictions or analysis have been delivered and viewed</li>
        <li>PDF reports have been downloaded</li>
        <li>Any premium feature has been accessed under the subscription</li>
      </ul>
      <p>We strongly encourage you to review our <a href="/#pricing">Pricing page</a> and ensure the plan suits your needs before purchasing.</p>

      <h2>4. Eligible Refund Cases</h2>
      <p>We will consider refund requests only in the following specific circumstances:</p>

      <h3>4.1 Sustained Technical Failure</h3>
      <p>If the Jyotish Stack AI Platform was entirely inaccessible (not due to scheduled maintenance) for more than <strong>72 consecutive hours</strong> due to our technical error, we may issue a pro-rated refund for the period of verified inaccessibility. Scheduled maintenance periods (announced in advance) are excluded.</p>

      <h3>4.2 Duplicate Payment</h3>
      <p>If our system erroneously charged you twice for the same subscription in the same billing cycle, we will refund the duplicate charge in full. This must be reported within <strong>7 days</strong> of the duplicate transaction with documentary evidence (screenshots, bank statement).</p>

      <h3>4.3 Unauthorized Transaction</h3>
      <p>If you can demonstrate that a payment was made without your authorization (and the matter has been reported to your bank/card issuer), and you report it to us within <strong>7 days</strong> of the transaction, we will cooperate with the investigation and process an appropriate refund if the claim is verified.</p>

      <h2>5. Non-Refundable Items</h2>
      <p>The following are explicitly <strong>non-refundable</strong>:</p>
      <ul>
        <li>Subscription fees where any premium feature has been accessed</li>
        <li>Partial periods of a cancelled subscription</li>
        <li>Fees paid for a plan that was subsequently cancelled voluntarily</li>
        <li>Refund requests made after 7 days of the transaction (except for technical failure)</li>
        <li>Dissatisfaction with astrological predictions or readings (subjective nature of astrology)</li>
        <li>Purchases made in error where the plan has been used</li>
      </ul>

      <h2>6. Cancellation Policy</h2>
      <h3>6.1 How to Cancel</h3>
      <p>You may cancel your subscription at any time through your Account Dashboard under <strong>Settings → Subscription</strong>. Cancellation is effective immediately and stops future billing.</p>

      <h3>6.2 Effect of Cancellation</h3>
      <ul>
        <li>Cancellation halts future billing only — it does <strong>not</strong> entitle you to a refund for the current billing period</li>
        <li>You retain access to all subscribed features until the <strong>end of your current paid period</strong></li>
        <li>After the paid period ends, your account automatically reverts to the Free plan</li>
        <li>Your Kundli profiles and data are retained and remain accessible on the Free plan (without analysis features)</li>
      </ul>

      <h3>6.3 Auto-Renewal</h3>
      <p>Subscriptions auto-renew at the end of each billing period. You will receive a reminder email <strong>3 days before</strong> each renewal. To prevent renewal, cancel your subscription before the renewal date. We are not responsible for charges incurred if you fail to cancel before the renewal date.</p>

      <h2>7. GST on Refunds</h2>
      <p>Where a refund is approved, we will refund the GST component in accordance with applicable Indian GST regulations. A revised/cancelled GST invoice will be issued for the refunded amount. Please allow 5–7 business days for GST-related documentation to be updated.</p>

      <h2>8. Refund Processing Timeline</h2>
      <p>Approved refunds are processed as follows:</p>
      <ul>
        <li><strong>Initiation:</strong> Within 5 business days of refund approval</li>
        <li><strong>Credit to your account:</strong> 7–10 business days from initiation (depending on your bank/card issuer)</li>
        <li><strong>Refund method:</strong> Refunds are credited to the original payment method used for the transaction</li>
      </ul>

      <h2>9. How to Request a Refund</h2>
      <p>If you believe you qualify for a refund under Section 4, follow these steps:</p>
      <ol>
        <li>Email <a href="mailto:support@jyotishstack.com">support@jyotishstack.com</a> within 7 days of the charge</li>
        <li>Include your registered email address, Razorpay Transaction/Order ID, and a clear explanation of the issue</li>
        <li>Attach relevant evidence (screenshots, bank statement, error logs)</li>
        <li>Our support team will review and respond within <strong>5 business days</strong></li>
        <li>If approved, the refund will be processed within the timeline described in Section 8</li>
      </ol>

      <h2>10. Chargebacks</h2>
      <p>Filing a chargeback with your bank without first contacting us may result in the immediate suspension of your account pending investigation. We strongly encourage you to resolve disputes directly with us before initiating a chargeback. We cooperate fully with bank investigations for legitimate unauthorized transaction claims.</p>

      <h2>11. Contact</h2>
      <div className="notice-box">
        <p>For refund or cancellation queries:<br />
        <strong>Email:</strong> <a href="mailto:support@jyotishstack.com">support@jyotishstack.com</a><br />
        <strong>Website:</strong> <a href="https://jyotishstack.com">jyotishstack.com</a><br />
        Business hours: Monday–Saturday, 10:00 AM – 6:00 PM IST</p>
      </div>
    </LegalPage>
  );
}
