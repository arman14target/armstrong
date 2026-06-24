"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import {
  getDownloadLink,
  isDownloadAvailable,
  type DownloadPlatform,
} from "@/lib/downloadLinks";

interface DownloadOption {
  platform: DownloadPlatform;
  labelKey: "landing.download.apple" | "landing.download.android" | "landing.download.pwa";
  icon: React.ReactNode;
}

const options: DownloadOption[] = [
  {
    platform: "apple",
    labelKey: "landing.download.apple",
    icon: <AppleIcon />,
  },
  {
    platform: "android",
    labelKey: "landing.download.android",
    icon: <PlayStoreIcon />,
  },
  {
    platform: "pwa",
    labelKey: "landing.download.pwa",
    icon: <WebIcon />,
  },
];

interface DownloadButtonsProps {
  layout?: "stack" | "grid";
  className?: string;
}

export function DownloadButtons({
  layout = "stack",
  className,
}: DownloadButtonsProps) {
  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid gap-3 sm:grid-cols-3 sm:gap-4"
          : "stack-md max-w-xl",
        className,
      )}
    >
      {options.map((option) => (
        <DownloadButton key={option.platform} {...option} />
      ))}
    </div>
  );
}

function DownloadButton({ platform, labelKey, icon }: DownloadOption) {
  const { t } = useTranslation();
  const label = t(labelKey);
  const href = getDownloadLink(platform);
  const available = isDownloadAvailable(platform);
  const isExternal = platform !== "pwa";

  const classes = cn(
    "download-btn group",
    !available && "download-btn--soon",
  );

  const content = (
    <>
      <span className="download-btn__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="download-btn__copy">
        <span className="download-btn__label">{label}</span>
        {!available ? (
          <span className="download-btn__hint">{t("landing.download.comingSoon")}</span>
        ) : null}
      </span>
    </>
  );

  if (!available || !href) {
    return (
      <button
        type="button"
        className={classes}
        disabled
        aria-label={t("landing.download.comingSoonAria", { label })}
      >
        {content}
      </button>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={label}>
      {content}
    </Link>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12 3.84 21.85C3.34 21.6 3 21.09 3 20.5Z"
      />
      <path
        fill="currentColor"
        d="M16.81 15.12 6.05 21.34 14.54 12.85 16.81 15.12Z"
      />
      <path
        fill="currentColor"
        d="M20.16 10.81c.34.27.59.69.59 1.19s-.25.92-.59 1.19l-2.29 1.32L15.39 12l2.29-1.32 2.5-1.58Z"
      />
      <path
        fill="currentColor"
        d="M6.05 2.66 16.81 8.88 14.54 11.15 6.05 2.66Z"
      />
    </svg>
  );
}

function WebIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 6.5 3.8 9s-1.3 6.2-3.8 9M12 3c-2.5 2.8-3.8 6.5-3.8 9s1.3 6.2 3.8 9" />
    </svg>
  );
}
