import { defineConfig, presetMini, type Rule } from "unocss";

const rules: Rule<object>[] = [
  [
    "sr-only",
    {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0,0,0,0)",
      "white-space": "nowrap",
      "border-width": "0",
    },
  ],
  ["object-cover", { "object-fit": "cover" }],
  [
    /^line-clamp-(\d+)$/,
    ([, lines]) => ({
      overflow: "hidden",
      display: "-webkit-box",
      "-webkit-box-orient": "vertical",
      "-webkit-line-clamp": lines,
    }),
  ],
];

export default defineConfig({
  presets: [presetMini()],
  rules,
  theme: {
    colors: {
      primary: "hsl(var(--primary) / <alpha-value>)",
      foreground: "hsl(var(--foreground) / <alpha-value>)",
      background: "hsl(var(--background) / <alpha-value>)",
      muted: {
        DEFAULT: "hsl(var(--muted) / <alpha-value>)",
        foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
      },
      card: "hsl(var(--card) / <alpha-value>)",
      border: "hsl(var(--border) / <alpha-value>)",
      input: "hsl(var(--input) / <alpha-value>)",
      ring: "hsl(var(--ring) / <alpha-value>)",
    },
  },
  safelist: ["rounded-t-2xl", "rounded-b-2xl"],
});
