import type { TypographyOptions } from "@unocss/preset-typography";
import {
  defineConfig,
  presetMini,
  presetTypography,
  type Rule,
} from "unocss";
import pureConfig from "./src/pure.config";

const typographyCustom = pureConfig.integ.typography ?? {};
const foreground = "hsl(var(--foreground) / var(--un-text-opacity, 1))";
const mutedForeground =
  "hsl(var(--muted-foreground) / var(--un-text-opacity, 1))";
const mutedBackground = "hsl(var(--muted) / var(--un-bg-opacity, 1))";
const border = "hsl(var(--border) / var(--un-border-opacity, 1))";

const typography: TypographyOptions = {
  colorScheme: {
    body: mutedForeground,
    headings: foreground,
    links: foreground,
    bold: foreground,
    counters: "hsl(var(--muted-foreground) / 0.6)",
    bullets: "hsl(var(--muted-foreground) / 0.4)",
    hr: "hsl(var(--muted-foreground) / 0.4)",
    quotes: mutedForeground,
    kbd: foreground,
    code: foreground,
    "pre-code": mutedForeground,
    "th-borders": border,
    "td-borders": border,
  },
  cssExtend: {
    "h2,h3,h4,h5,h6": {
      "scroll-margin-top": "4rem",
    },
    "h1>a,h2>a,h3>a,h4>a,h5>a,h6>a": {
      "margin-inline-start": "0.75rem",
      color: mutedForeground,
      transition: "opacity 0.2s ease",
      opacity: "0",
      "user-select": "none",
    },
    "h1>a:focus,h2>a:focus,h3>a:focus,h4>a:focus,h5>a:focus,h6>a:focus": {
      opacity: 1,
    },
    "h1:hover>a,h2:hover>a,h3:hover>a,h4:hover>a,h5:hover>a,h6:hover>a": {
      opacity: 1,
    },
    "h1:target>a,h2:target>a,h3:target>a,h4:target>a,h5:target>a,h6:target>a": {
      opacity: 1,
    },
    a: {
      "word-wrap": "break-word",
      "word-break": "break-word",
      "overflow-wrap": "anywhere",
    },
    ":not(pre)>code": {
      padding: "0.3em 0.5em",
      border: `1px solid ${border}`,
      "border-radius": "var(--radius)",
      "background-color": mutedBackground,
      "white-space": "pre-wrap",
      "word-break": "break-all",
    },
    ":not(pre)>code::before,:not(pre)>code::after": {
      content: "none",
    },
    blockquote: {
      position: "relative",
      overflow: "hidden",
      "border-width": "1px",
      "border-inline-start-color": "inherit",
      "border-radius": "calc(1.5 * var(--radius))",
      "padding-inline": "1.6rem",
      "box-shadow": `0 5px 0 ${mutedBackground}`,
      ...(typographyCustom.blockquoteStyle === "normal" && {
        "font-style": "normal",
      }),
    },
    "blockquote::after": {
      color: mutedForeground,
      position: "absolute",
      content: '"”"',
      top: "2.6rem",
      right: "-1.4rem",
      "font-size": "10rem",
      "font-family":
        '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif',
      transform: "rotate(-15deg)",
      opacity: "0.1",
    },
    table: {
      display: "block",
      "font-size": ".875em",
      "overflow-x": "auto",
    },
    "table tr": { "border-bottom-width": "1px" },
    "tbody tr:last-child": { "border-bottom-width": "0" },
    "thead th": { "font-weight": "500", color: foreground },
    "td,th": { border: "inherit", "text-align": "start", padding: "0.57em" },
    "thead th:first-child,tbody td:first-child,tfoot td:first-child": {
      "padding-inline-start": "0",
    },
    "ol,ul": { "padding-inline-start": "1.625em" },
    "ol>li,ul>li": { "padding-inline-start": ".375em" },
    li: { "margin-top": ".5em", "margin-bottom": ".5em" },
    img: { "border-radius": "var(--radius)", margin: "0 auto" },
    kbd: {
      "border-color": border,
      "box-shadow":
        "0 0 0 1px hsl(var(--card) / 1), 0 3px hsl(var(--card) / 1)",
    },
    "sup>a": { "scroll-margin-top": "4rem" },
  },
};

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
  presets: [presetMini(), presetTypography(typography)],
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
  safelist: ["rounded-t-2xl", "rounded-b-2xl", "text-base", "prose"],
});
