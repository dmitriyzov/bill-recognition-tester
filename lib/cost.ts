const MODEL_PRICING_USD_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-pro": { input: 1.25, output: 10 },
  "gemini-3.5-flash": { input: 1.5, output: 9 }
};

export function estimateCostUsd(modelName: string, inputTokens: number | null, outputTokens: number | null) {
  const pricing = MODEL_PRICING_USD_PER_1M_TOKENS[modelName];
  if (!pricing || inputTokens === null || outputTokens === null) return null;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

export function formatUsd(value: number | null) {
  if (value === null) return "Not available";
  if (value > 0 && value < 0.0001) return "<$0.0001";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(value);
}
