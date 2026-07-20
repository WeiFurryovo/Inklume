export function formatReadingTime(value: unknown, locale: string): string {
  const text = String(value ?? "").trim();
  if (!text || locale !== "zh") return text;

  const minutes = text.match(/\d+(?:\.\d+)?/)?.[0];
  return minutes ? `${minutes} 分钟` : text;
}
