import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "skeleton-pulse":
          "skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "skeleton-pulse": {
          "0%, 100%": { backgroundColor: "#e5e5e5" },
          "50%": { backgroundColor: "#f5f5f5" },
        },
      },
      fontFamily: {
        sans: [
          "SF Compact Display",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      textColor: {
        "primary-primary": "var(--text-primary-primary)",
        "primary-secondary": "var(--text-primary-secondary)",
        "primary-tertiary": "var(--text-primary-tertiary)",
        "primary-disabled": "var(--text-primary-disabled)",
        "primary-link": "var(--text-primary-link)",
        "on-color-heading": "var(--text-on-color-heading)",
        "on-color-body": "var(--text-on-color-body)",
        "on-color-placeholder": "var(--text-on-color-placeholder)",
        "error-default": "var(--text-error-default)",
        "error-default-hover": "var(--text-error-default-hover)",
        "error-on-color": "var(--text-error-on-color)",
        "error-on-color-hover": "var(--text-error-on-color-hover)",
        "warning-default": "var(--text-warning-default)",
        "warning-hover": "var(--text-warning-hover)",
        "success-default": "var(--text-success-default)",
        "success-default-hover": "var(--text-success-default-hover)",
        "success-on-color": "var(--text-success-on-color)",
        "success-on-color-hover": "var(--text-success-on-color-hover)",
      },
      backgroundColor: {
        "surface-page-background": "var(--surface-page-background)",
        "surface-page-on-background": "var(--surface-page-on-background)",
        "surface-page-primary": "var(--surface-page-primary)",
        "surface-page-on-primary": "var(--surface-page-on-primary)",
        "surface-page-secondary": "var(--surface-page-secondary)",
        "surface-page-on-secondary": "var(--surface-page-on-secondary)",
        "surface-page-tertiary": "var(--surface-page-tertiary)",
        "surface-page-on-tertiary": "var(--surface-page-on-tertiary)",
      },
    },
  },
  plugins: [],
} satisfies Config;
