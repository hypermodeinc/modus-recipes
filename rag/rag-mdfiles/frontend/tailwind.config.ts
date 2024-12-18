import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Omit<Config, "content"> = {
  darkMode: ["class", "[data-theme='dark']"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        "3xl": "1920px",
      },
      /**
       * Used for deployments, function-runs, inference history, etc
       * To make sure the main content never overflows
       */
      fontFamily: {
        inter: ["Inter", ...fontFamily.sans],
        alliance: ["'Alliance No. 2'", ...fontFamily.sans],
        sans: ["Inter", ...fontFamily.sans],
        mono: ["Geist Mono", ...fontFamily.mono],
        serif: ["Serif", ...fontFamily.serif],
      },
      fontSize: {
        xs: ["13px", "18px"],
        xxs: ["12px", "16px"],
      },
      colors: {
        current: "currentColor",
        primary: {
          DEFAULT: "#6342CB", // 500
          25: "#F1EEF9",
          50: "#E4DEF6",
          100: "#D8CFF3",
          200: "#AE9EE2",
          300: "#9C85E3",
          400: "#785BD4",
          500: "#6342CB",
          600: "#4E32A6",
          700: "#341D7E",
          800: "#2C1C61",
          850: "#2E2254",
          900: "#251F36",
        },
        secondary: {
          DEFAULT: "#1672C6", // 500
          25: "#E3EEF7",
          50: "#D2E2F1",
          100: "#B7D5EF",
          200: "#92C0EA",
          300: "#73B1EA",
          400: "#3F90D9",
          500: "#1672C6",
          600: "#0B5BA3",
          700: "#054781",
          800: "#022F58",
          850: "#01203D",
          900: "#011425",
        },
        neutral: {
          DEFAULT: "#3C3D43", // 600
          0: "#FFFFFF",
          25: "#F2F4FA",
          50: "#EDEEF4",
          100: "#DFE1E7",
          200: "#CACDD6",
          300: "#AEB2BB",
          400: "#82868F",
          500: "#62646B",
          600: "#3C3D43",
          700: "#303037",
          750: "#292A30",
          800: "#23242B",
          850: "#171820",
          900: "#14161F",
          950: "#0B0C14",
          1000: "#000000",
        },
        error: {
          DEFAULT: "#D41951", // 500
          100: "#FBE0E8",
          300: "#E89CB3",
          400: "#F34C7E",
          500: "#D41951",
          600: "#BA0A3F",
          700: "#7D0227",
          900: "#240D14",
        },
        "error-alt": {
          DEFAULT: "#DB30BF", // 500
          100: "#F9D2F3",
          300: "#F58DE5",
          500: "#DB30BF",
          700: "#80056D",
          900: "#37002E",
        },
        warning: {
          DEFAULT: "#EB9516", // 500
          100: "#F5E6D0",
          300: "#F0C584",
          500: "#EB9516",
          700: "#B76E02",
          900: "#342E13",
        },
        success: {
          DEFAULT: "#11D43C", // 500
          100: "#D5F3DB",
          300: "#65D67E",
          500: "#11D43C",
          700: "#035B16",
          900: "#102816",
        },
        info: {
          DEFAULT: "#3E88F5", // 500
          100: "#D7E3F5",
          300: "#7EA4DE",
          500: "#3E88F5",
          700: "#03347E",
          900: "#131D28",
        },
        chart: {
          1: "#1E89AA",
          2: "#8238AF",
          3: "#DE5FAB",
          4: "#F9A03F",
          5: "#1FA79F",
          6: "#D3751E",
        },
        border: {
          primary: "var(--border-primary)",
          secondary: "var(--border-secondary)",
          fair: "var(--border-fair)",
          inverse: "var(--border-inverse)",
          disabled: "var(--border-disabled)",
          action: "var(--border-action)",
          error: "var(--border-error)",
          warning: "var(--border-warning)",
          success: "var(--border-success)",
          info: "var(--border-info)",
        },
        state: {
          hover: "var(--state-hover)",
          select: "var(--state-select)",
          subnav: { select: "var(--state-subnav-select)" },
        },
        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          inverse: "var(--surface-inverse)",
          disabled: "var(--surface-disabled)",
          action: "var(--surface-action)",
          bg: {
            DEFAULT: "var(--surface-bg)",
            modal: "var(--surface-bg-modal)",
          },
          error: "var(--surface-error)",
          warning: "var(--surface-warning)",
          success: "var(--surface-success)",
          info: "var(--surface-info)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          inverse: "var(--text-inverse)",
          disabled: "var(--text-disabled)",
          action: "var(--text-action)",
          button: {
            primary: "var(--text-button-primary)",
            secondary: "var(--text-button-secondary)",
          },
          link: "var(--text-link)",
          error: "var(--text-error)",
          warning: "var(--text-warning)",
          success: "var(--text-success)",
          info: "var(--text-info)",
        },
        icon: {
          primary: "var(--icon-primary)",
          secondary: "var(--icon-secondary)",
          tertiary: "var(--icon-tertiary)",
          inverse: "var(--icon-inverse)",
          button: {
            primary: "var(--icon-button-primary)",
          },
          disabled: "var(--icon-disabled)",
          action: "var(--icon-action)",
          error: "var(--icon-error)",
          warning: "var(--icon-warning)",
          success: "var(--icon-success)",
          info: "var(--icon-info)",
        },
        button: {
          surface: {
            primary: "var(--button-surface-primary)",
            secondary: "var(--button-surface-secondary)",
            disabled: "var(--button-surface-disabled)",
          },
          border: {
            primary: "var(--button-border-primary)",
            secondary: "var(--button-border-secondary)",
            disabled: "var(--button-border-disabled)",
            error: "var(--button-border-error)",
          },
          divider: {
            primary: "var(--button-divider-primary)",
            secondary: "var(--button-divider-secondary)",
            disabled: "var(--button-divider-disabled)",
          },
          text: {
            primary: "var(--button-text-primary)",
            secondary: "var(--button-text-secondary)",
            disabled: "var(--button-text-disabled)",
            error: "var(--button-text-error)",
          },
          icon: {
            primary: "var(--button-icon-primary)",
            secondary: "var(--button-icon-secondary)",
            disabled: "var(--button-icon-disabled)",
            error: "var(--button-icon-error)",
          },
        },
        modal: {
          surface: {
            header: {
              primary: "var(--modal-surface-header-primary)",
            },
            footer: {
              primary: "var(--modal-surface-footer-primary)",
            },
            body: {
              primary: "var(--modal-surface-body-primary)",
            },
            border: {
              primary: "var(--modal-surface-border-primary)",
            },
          },
        },
        nav: {
          surface: {
            primary: "var(--nav-surface-primary)",
            secondary: "var(--nav-surface-secondary)",
          },
          logo: "var(--nav-logo)",
          border: "var(--nav-border)",
          text: "var(--nav-text)",
          icon: {
            DEFAULT: "var(--nav-icon)",
            secondary: "var(--nav-icon-secondary)",
            on: "var(--nav-icon-on)",
            off: "var(--nav-icon-off)",
          },
          bg: {
            on: "var(--nav-bg-on)",
          },
        },
        control: {
          surface: {
            primary: "var(--control-surface-primary)",
            secondary: "var(--control-surface-secondary)",
            active: "var(--control-surface-active)",
            disabled: "var(--control-surface-disabled)",
          },
          border: {
            primary: "var(--control-border-primary)",
            disabled: "var(--control-border-disabled)",
          },
        },
        form: {
          surface: {
            primary: "var(--form-surface-primary)",
            secondary: "var(--form-surface-secondary)",
            disabled: "var(--form-surface-disabled)",
          },
          border: {
            primary: "var(--form-border-primary)",
            disabled: "var(--form-border-disabled)",
          },
        },
      },
      spacing: {
        "dialog-height": "var(--dialog-height)",
        "dialog-width": "var(--dialog-width)",
        "dialog-inner-content-height": "var(--dialog-inner-content-height)",
        18: "72px",
        22: "84px",
      },
      gridTemplateColumns: {
        card: "repeat(auto-fill, minmax(300px, 1fr))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
