"use client";

import Link from "next/link";
import { Trans, useTranslation } from "react-i18next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export function TermsPageClient() {
  const { t } = useTranslation();
  const contact = t("legal.terms.contact");

  return (
    <LegalPage title={t("legal.terms.title")} updated={t("legal.terms.updated")}>
      <p>{t("legal.terms.intro")}</p>

      <LegalSection heading={t("legal.terms.sections.eligibility.heading")}>
        <p>{t("legal.terms.sections.eligibility.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.account.heading")}>
        <p>{t("legal.terms.sections.account.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.health.heading")}>
        <p>
          <Trans
            i18nKey="legal.terms.sections.health.body"
            components={{ strong: <strong /> }}
          />
        </p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.acceptableUse.heading")}>
        <p>{t("legal.terms.sections.acceptableUse.intro")}</p>
        <ul>
          <li>{t("legal.terms.sections.acceptableUse.itemUnlawful")}</li>
          <li>{t("legal.terms.sections.acceptableUse.itemAbuse")}</li>
          <li>{t("legal.terms.sections.acceptableUse.itemContent")}</li>
        </ul>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.content.heading")}>
        <p>
          <Trans
            i18nKey="legal.terms.sections.content.body"
            components={[<Link key="privacy" href="/privacy/" />]}
          />
        </p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.ip.heading")}>
        <p>{t("legal.terms.sections.ip.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.thirdParty.heading")}>
        <p>{t("legal.terms.sections.thirdParty.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.disclaimers.heading")}>
        <p>{t("legal.terms.sections.disclaimers.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.liability.heading")}>
        <p>{t("legal.terms.sections.liability.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.termination.heading")}>
        <p>{t("legal.terms.sections.termination.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.changes.heading")}>
        <p>{t("legal.terms.sections.changes.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.terms.sections.contact.heading")}>
        <p>
          <Trans
            i18nKey="legal.terms.sections.contact.body"
            values={{ email: contact }}
            components={[<a key="email" href={`mailto:${contact}`} />]}
          />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
