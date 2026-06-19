import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Terms of Service — Armstrong",
  description: "The terms that govern your use of Armstrong.",
  alternates: { canonical: absoluteUrl("/terms") },
  robots: { index: true, follow: true },
};

const UPDATED = "June 19, 2026";
const CONTACT = "support@armstrong-fitness.com";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Armstrong
        (the &quot;Service&quot;). By accessing or using the Service, you agree
        to these Terms. If you do not agree, do not use the Service.
      </p>

      <LegalSection heading="1. Eligibility">
        <p>
          You must be at least 13 years old (or the minimum age in your
          jurisdiction) and able to form a binding contract to use the Service.
        </p>
      </LegalSection>

      <LegalSection heading="2. Your account">
        <p>
          You are responsible for activity under your account and for keeping
          your credentials secure. Provide accurate information and notify us of
          any unauthorized use.
        </p>
      </LegalSection>

      <LegalSection heading="3. Health &amp; fitness disclaimer">
        <p>
          Armstrong provides general fitness and nutrition information,
          including AI-generated workout and diet suggestions.{" "}
          <strong>
            It is not medical advice and is not a substitute for professional
            guidance.
          </strong>{" "}
          Consult a qualified physician or professional before starting any
          exercise or nutrition program. You use the Service and follow any
          suggestions at your own risk. AI output may be inaccurate or
          incomplete — use your judgment.
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service unlawfully or to harm others.</li>
          <li>
            Attempt to access other users&apos; data, disrupt, reverse-engineer,
            or abuse the Service or its rate limits.
          </li>
          <li>Upload content you do not have the right to use.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Your content">
        <p>
          You retain ownership of the data you create (workouts, logs, chats).
          You grant us a limited license to store and process it solely to
          operate the Service for you, as described in our{" "}
          <a href="/privacy/">Privacy Policy</a>.
        </p>
      </LegalSection>

      <LegalSection heading="6. Intellectual property">
        <p>
          The Service, including its software, design, and content (excluding
          your data and third-party content), is owned by Armstrong and
          protected by applicable laws. We grant you a personal,
          non-transferable, revocable license to use it.
        </p>
      </LegalSection>

      <LegalSection heading="7. Third-party services">
        <p>
          The Service integrates third parties (e.g. Google, Apple, USDA). Your
          use of those features may be subject to their terms, and we are not
          responsible for them.
        </p>
      </LegalSection>

      <LegalSection heading="8. Disclaimers">
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, express or implied, including
          merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant the Service will be uninterrupted,
          error-free, or secure.
        </p>
      </LegalSection>

      <LegalSection heading="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Armstrong will not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages, or for any loss of data, arising from your use of the
          Service.
        </p>
      </LegalSection>

      <LegalSection heading="10. Termination">
        <p>
          You may stop using the Service and delete your data at any time. We
          may suspend or terminate access if you violate these Terms or to
          protect the Service.
        </p>
      </LegalSection>

      <LegalSection heading="11. Changes">
        <p>
          We may update these Terms. Material changes are indicated by the
          &quot;Last updated&quot; date above; continued use means you accept
          the updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="12. Contact">
        <p>
          Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
