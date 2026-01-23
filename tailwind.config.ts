import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          light: "hsl(var(--secondary-light))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Mind Insurance brand colors
        'mi-cyan': '#05c3dd',
        'mi-cyan-dark': '#0099aa',
        'mi-gold': '#fac832',
        'mi-gold-dark': '#e0b52d',
        'mi-navy': '#0A1628',
        'mi-navy-light': '#132337',
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-breakthrough': 'var(--gradient-breakthrough)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-card': 'var(--gradient-card)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
      },
      transitionTimingFunction: {
        'smooth': 'var(--transition-smooth)',
        'bounce': 'var(--transition-bounce)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // Collapsible content animations (for Radix Collapsible)
        "collapsible-down": {
          from: {
            height: "0",
            opacity: "0",
          },
          to: {
            height: "var(--radix-collapsible-content-height)",
            opacity: "1",
          },
        },
        "collapsible-up": {
          from: {
            height: "var(--radix-collapsible-content-height)",
            opacity: "1",
          },
          to: {
            height: "0",
            opacity: "0",
          },
        },
        // MIO Insights one-time reward animations (defined in index.css)
        "pulse-once": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.01)" },
        },
        "bounce-once": {
          "0%, 100%": { transform: "translateY(0)" },
          "20%": { transform: "translateY(-6px)" },
          "40%": { transform: "translateY(0)" },
          "60%": { transform: "translateY(-3px)" },
          "80%": { transform: "translateY(0)" },
        },
        "glow-once": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(250, 204, 21, 0)" },
          "50%": { boxShadow: "0 0 25px rgba(250, 204, 21, 0.5)" },
        },
        // Celebration confetti-like animation
        "celebrate": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Subtle scale on checkbox/button interactions
        "scale-check": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Collapsible animations - smooth expand/collapse
        "collapsible-down": "collapsible-down 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "collapsible-up": "collapsible-up 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        // MIO Insights one-time animations - play once then stop
        "pulse-once": "pulse-once 0.8s ease-in-out 1",
        "bounce-once": "bounce-once 0.6s ease-out 1",
        "glow-once": "glow-once 1.2s ease-in-out 1",
        // Micro-interaction animations
        "celebrate": "celebrate 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-check": "scale-check 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
