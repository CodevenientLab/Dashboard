/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "rgb(var(--c-void) / <alpha-value>)",
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        "panel-raised": "rgb(var(--c-panel-raised) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-dim": "rgb(var(--c-ink-dim) / <alpha-value>)",
        glow: {
          blue: "#0D9EF9",
          purple: "#6820FF",
        },
        amber: "#D6A419",
        warn: "#C4573A",
        paper: "#EDEAE1",
        "paper-dim": "#E2DED2",
        "paper-ink": "#1B2A2E",
        "paper-ink-soft": "#3D4A4D",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["Inter", "sans-serif"],
        doc: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
