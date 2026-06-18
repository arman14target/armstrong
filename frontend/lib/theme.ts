/**
 * Armstrong design theme — dark-mode athletic aesthetic for bodybuilders.
 *
 * All tokens meet WCAG AA contrast on dark backgrounds:
 * - textPrimary on background: ~18.5:1
 * - textSecondary on background: ~5.8:1
 * - primary on background: ~9.5:1
 * - success on background: ~10:1
 * - error on background: ~5.5:1
 */

export const theme = {
  colors: {
    background: "#0A0A0B",
    surface: "#16161A",
    surfaceElevated: "#1E1E24",
    primary: "#F5B800",
    secondary: "#FF6B35",
    textPrimary: "#F4F4F5",
    textSecondary: "#8B8B94",
    border: "#2E2E36",
    success: "#22D97A",
    error: "#FF4757",
    /** Pull-day / rest-timer bronze accent */
    bronze: "#C9A227",
    onAccent: "#0A0A0B",
  },
  typography: {
    headingFont: "Barlow Condensed",
    bodyFont: "DM Sans",
  },
  effects: {
    borderRadius: "6px",
    borderRadiusPanel: "10px",
    boxShadow:
      "0 8px 32px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.04) inset",
    boxShadowModal: "0 12px 48px rgba(0, 0, 0, 0.7)",
    glowEffect:
      "0 0 20px rgba(245, 184, 0, 0.4), 0 0 48px rgba(245, 184, 0, 0.12)",
    glowEffectSecondary:
      "0 0 16px rgba(255, 107, 53, 0.35), 0 0 36px rgba(255, 107, 53, 0.1)",
  },
} as const;

/** Maps legacy workout-day theme keys to semantic accent colors */
export const workoutDayAccentMap = {
  cyan: theme.colors.primary,
  magenta: theme.colors.secondary,
  green: theme.colors.success,
  amber: theme.colors.bronze,
} as const;

export type Theme = typeof theme;
