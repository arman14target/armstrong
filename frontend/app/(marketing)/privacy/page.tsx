import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Privacy Policy — Armstrong",
  description:
    "How Armstrong collects, uses, stores, and protects your data.",
  alternates: { canonical: absoluteUrl("/privacy") },
  robots: { index: true, follow: true },
};

const UPDATED = "June 19, 2026";
const CONTACT = "privacy@armstrong-fitness.com";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <p>
        This Privacy Policy explains how Armstrong (&quot;Armstrong&quot;,
        &quot;we&quot;, &quot;us&quot;) collects, uses, and protects your
        information when you use our web app, mobile apps, and related services
        (the &quot;Service&quot;). By using the Service you agree to this policy.
      </p>

      <LegalSection heading="1. Data you can use without an account">
        <p>
          Armstrong works without signing in. In that mode your workouts, diet
          logs, and settings are stored <strong>only on your device</strong>{" "}
          (browser <code>localStorage</code> or app storage) and are not sent to
          us.
        </p>
      </LegalSection>

      <LegalSection heading="2. Information we collect">
        <ul>
          <li>
            <strong>Account information:</strong> your email address. If you
            sign in with email/password, we store a securely hashed password
            (bcrypt). If you sign in with Google or Apple, we receive your
            verified email and a stable provider identifier; we never receive
            your provider password.
          </li>
          <li>
            <strong>Fitness data you create:</strong> workouts, exercises, sets,
            weights, reps, sessions, diet/food logs, nutrition profile, and your
            chats with the AI coach.
          </li>
          <li>
            <strong>Technical data:</strong> basic, largely anonymous usage and
            performance metrics to keep the Service reliable.
          </li>
        </ul>
        <p>
          When you are signed in, the fitness data above is synced to your
          account so you can access it across devices.
        </p>
      </LegalSection>

      <LegalSection heading="3. How we use your information">
        <ul>
          <li>Provide, sync, and secure your account and fitness data.</li>
          <li>Generate AI coaching, workout, and diet suggestions you request.</li>
          <li>Operate, maintain, and improve the Service.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection heading="4. Where your data is stored">
        <p>
          Account and synced fitness data are stored in our backend database
          (PostgreSQL) hosted by our infrastructure providers. Data is
          transmitted over encrypted connections (HTTPS) and passwords are
          stored only as one-way hashes.
        </p>
      </LegalSection>

      <LegalSection heading="5. Third-party services">
        <p>
          We share the minimum data needed with service providers that help run
          the Service:
        </p>
        <ul>
          <li>
            <strong>Google &amp; Apple</strong> — &quot;Sign in with&quot;
            authentication.
          </li>
          <li>
            <strong>Google (Gemini)</strong> — when you use the AI coach, your
            chat messages and relevant plan context are sent to Google to
            generate responses.
          </li>
          <li>
            <strong>USDA FoodData Central</strong> — food search queries you
            enter.
          </li>
          <li>
            <strong>Hosting &amp; analytics providers</strong> — to serve the
            app and measure anonymous performance/usage.
          </li>
        </ul>
        <p>
          These providers process data under their own privacy policies. We do
          not control, and are not responsible for, their practices.
        </p>
      </LegalSection>

      <LegalSection heading="6. Cookies and local storage">
        <p>
          We use your browser&apos;s local storage to keep you signed in (an
          authentication token) and to hold your app data. We do not use
          third-party advertising cookies.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your choices and rights">
        <ul>
          <li>
            <strong>Access &amp; update:</strong> view and edit your data
            directly in the app.
          </li>
          <li>
            <strong>Delete:</strong> the &quot;Clear all data&quot; action in
            your profile permanently deletes your data from this device and your
            cloud account. You may also contact us to delete your account.
          </li>
          <li>
            Depending on your location, you may have additional rights (access,
            correction, deletion, portability). Contact us to exercise them.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="8. Data retention">
        <p>
          We keep your account data while your account is active. When you
          delete your data or account, we remove it from our systems, except
          where retention is required by law.
        </p>
      </LegalSection>

      <LegalSection heading="9. Children">
        <p>
          The Service is not directed to children under 13 (or the minimum age
          in your jurisdiction). We do not knowingly collect their data.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to this policy">
        <p>
          We may update this policy. Material changes will be reflected by the
          &quot;Last updated&quot; date above; continued use means you accept
          the updated policy.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact">
        <p>
          Questions or requests: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
