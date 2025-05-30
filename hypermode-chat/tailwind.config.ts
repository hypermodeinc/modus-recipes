import type { Config } from "tailwindcss"

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "node_modules/@aichatkit/ui/dist/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          25: "var(--chatkit-primary-25)",
          50: "var(--chatkit-primary-50)",
          100: "var(--chatkit-primary-100)",
          200: "var(--chatkit-primary-200)",
          300: "var(--chatkit-primary-300)",
          400: "var(--chatkit-primary-400)",
          500: "var(--chatkit-primary-500)",
          600: "var(--chatkit-primary-600)",
          700: "var(--chatkit-primary-700)",
          800: "var(--chatkit-primary-800)",
          850: "var(--chatkit-primary-850)",
          900: "var(--chatkit-primary-900)",
        },
        neutral: {
          0: "var(--chatkit-neutral-0)",
          25: "var(--chatkit-neutral-25)",
          50: "var(--chatkit-neutral-50)",
          100: "var(--chatkit-neutral-100)",
          200: "var(--chatkit-neutral-200)",
          300: "var(--chatkit-neutral-300)",
          400: "var(--chatkit-neutral-400)",
          500: "var(--chatkit-neutral-500)",
          600: "var(--chatkit-neutral-600)",
          700: "var(--chatkit-neutral-700)",
          750: "var(--chatkit-neutral-750)",
          800: "var(--chatkit-neutral-800)",
          850: "var(--chatkit-neutral-850)",
          900: "var(--chatkit-neutral-900)",
          950: "var(--chatkit-neutral-950)",
          1000: "var(--chatkit-neutral-1000)",
        },
        error: {
          100: "var(--chatkit-error-100)",
          300: "var(--chatkit-error-300)",
          400: "var(--chatkit-error-400)",
          500: "var(--chatkit-error-500)",
          600: "var(--chatkit-error-600)",
          700: "var(--chatkit-error-700)",
          900: "var(--chatkit-error-900)",
        },
        warning: {
          100: "var(--chatkit-warning-100)",
          300: "var(--chatkit-warning-300)",
          500: "var(--chatkit-warning-500)",
          700: "var(--chatkit-warning-700)",
          900: "var(--chatkit-warning-900)",
        },
        success: {
          100: "var(--chatkit-success-100)",
          300: "var(--chatkit-success-300)",
          500: "var(--chatkit-success-500)",
          700: "var(--chatkit-success-700)",
          900: "var(--chatkit-success-900)",
        },
        // Hypermode theme colors
        hypermode: {
          bg: "var(--hypermode-bg)",
          card: "var(--hypermode-card)",
          border: "var(--hypermode-border)",
          hover: "var(--hypermode-hover)",
          input: "var(--hypermode-input)",
          accent: "var(--hypermode-accent)",
          "accent-light": "var(--hypermode-accent-light)",
          "accent-dark": "var(--hypermode-accent-dark)",
        },
      },
      // Semantic tokens
      textColor: {
        primary: "var(--chatkit-text-primary)",
        secondary: "var(--chatkit-text-secondary)",
        inverse: "var(--chatkit-text-inverse)",
        disabled: "var(--chatkit-text-disabled)",
      },
      borderColor: {
        primary: "var(--chatkit-border-primary)",
        secondary: "var(--chatkit-border-secondary)",
      },
      backgroundColor: {
        "surface-primary": "var(--chatkit-surface-primary)",
        "surface-secondary": "var(--chatkit-surface-secondary)",
        "form-surface": "var(--chatkit-form-surface)",
        "button-primary": "var(--chatkit-button-primary)",
        "button-secondary": "var(--chatkit-button-secondary)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        loadingDotBounce: {
          "0%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "loading-bounce": "loadingDotBounce 0.6s infinite ease-in-out",
      },
    },
  },
  plugins: [],
} satisfies Config
