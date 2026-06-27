"use client";

import { Trans, useTranslation } from "react-i18next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

function LegalListItem({ i18nKey }: { i18nKey: string }) {
  return (
    <li>
      <Trans i18nKey={i18nKey} components={{ strong: <strong /> }} />
    </li>
  );
}

export function PrivacyPageClient() {
  const { t } = useTranslation();
  const contact = t("legal.privacy.contact");

  return (
    <LegalPage title={t("legal.privacy.title")} updated={t("legal.privacy.updated")}>
      <p>{t("legal.privacy.intro")}</p>

      <LegalSection heading={t("legal.privacy.sections.noAccount.heading")}>
        <p>
          <Trans
            i18nKey="legal.privacy.sections.noAccount.body"
            components={{ strong: <strong />, code: <code /> }}
          />
        </p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.collect.heading")}>
        <ul>
          <LegalListItem i18nKey="legal.privacy.sections.collect.itemAccount" />
          <LegalListItem i18nKey="legal.privacy.sections.collect.itemFitness" />
          <LegalListItem i18nKey="legal.privacy.sections.collect.itemTechnical" />
        </ul>
        <p>{t("legal.privacy.sections.collect.footer")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.use.heading")}>
        <ul>
          <li>{t("legal.privacy.sections.use.itemSync")}</li>
          <li>{t("legal.privacy.sections.use.itemAi")}</li>
          <li>{t("legal.privacy.sections.use.itemOperate")}</li>
        </ul>
        <p>{t("legal.privacy.sections.use.footer")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.storage.heading")}>
        <p>{t("legal.privacy.sections.storage.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.thirdParty.heading")}>
        <p>{t("legal.privacy.sections.thirdParty.intro")}</p>
        <ul>
          <LegalListItem i18nKey="legal.privacy.sections.thirdParty.itemSignIn" />
          <LegalListItem i18nKey="legal.privacy.sections.thirdParty.itemGemini" />
          <LegalListItem i18nKey="legal.privacy.sections.thirdParty.itemGeminiMeals" />
          <LegalListItem i18nKey="legal.privacy.sections.thirdParty.itemHosting" />
        </ul>
        <p>{t("legal.privacy.sections.thirdParty.footer")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.cookies.heading")}>
        <p>{t("legal.privacy.sections.cookies.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.choices.heading")}>
        <ul>
          <LegalListItem i18nKey="legal.privacy.sections.choices.itemAccess" />
          <LegalListItem i18nKey="legal.privacy.sections.choices.itemDelete" />
          <li>{t("legal.privacy.sections.choices.itemRights")}</li>
        </ul>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.retention.heading")}>
        <p>{t("legal.privacy.sections.retention.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.children.heading")}>
        <p>{t("legal.privacy.sections.children.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.changes.heading")}>
        <p>{t("legal.privacy.sections.changes.body")}</p>
      </LegalSection>

      <LegalSection heading={t("legal.privacy.sections.contact.heading")}>
        <p>
          <Trans
            i18nKey="legal.privacy.sections.contact.body"
            values={{ email: contact }}
            components={[<a key="email" href={`mailto:${contact}`} />]}
          />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
