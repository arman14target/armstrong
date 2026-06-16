"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  getDownloadLink,
  isDownloadAvailable,
  type DownloadPlatform,
} from "@/lib/downloadLinks";

interface DownloadOption {
  platform: DownloadPlatform;
  label: string;
  icon: React.ReactNode;
}

const options: DownloadOption[] = [
  {
    platform: "apple",
    label: "Download on Apple App Store",
    icon: <AppleIcon />,
  },
  {
    platform: "android",
    label: "Get it on Android (Google Play)",
    icon: <PlayStoreIcon />,
  },
  {
    platform: "pwa",
    label: "Launch Web Version (PWA)",
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

function DownloadButton({ platform, label, icon }: DownloadOption) {
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
          <span className="download-btn__hint">Coming soon</span>
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
        aria-label={`${label} — coming soon`}
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
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.48-.12-1.06.464-2.21 1.196-3 .664-.71 1.88-1.32 2.977-1.56zM20.37 17.19c-.59 1.34-.87 1.94-1.63 3.13-1.05 1.57-2.53 3.52-4.37 3.53-1.62.01-2.05-1.05-4.27-1.04-2.21.01-2.64 1.06-4.26 1.04-1.84-.01-3.25-1.92-4.3-3.49-2.95-4.41-3.27-9.59-1.44-12.33 1.3-1.96 3.37-3.11 5.31-3.11 1.98 0 3.22 1.05 4.86 1.05 1.58 0 2.54-1.05 4.8-1.05 1.72 0 3.54.93 4.84 2.54-4.26 2.33-3.57 8.39.93 10.37z" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M3.6 1.8c-.3.2-.6.6-.6 1.1v18.2c0 .5.3.9.6 1.1l.1.1 10.2-10.2v-.2L3.7 1.7l-.1.1zm11.4 7.5-2.3 2.3 2.3 2.3 2.5-1.4c.7-.4.7-1.4 0-1.8l-2.5-1.4zm-3.5 3.5-8.9 8.9c.4.2.9.2 1.3 0l7.6-4.4-2.3-2.3v-.2h2.3zm-2.3-2.3 2.3-2.3-7.6-4.4c-.4-.2-.9-.2-1.3 0l8.9 8.9v-.2z" />
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
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 3.8 6.5 3.8 9s-1.3 6.2-3.8 9M12 3c-2.5 2.8-3.8 6.5-3.8 9s1.3 6.2 3.8 9" />
    </svg>
  );
}
