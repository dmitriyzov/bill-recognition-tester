import type { BillRecognitionResult } from "../types";
import { recognizeWithGemini } from "./gemini";

export type RecognitionProviderInput = {
  provider: "gemini";
  modelName: string;
  imagePath: string;
};

export type RecognitionProviderOutput = {
  result: BillRecognitionResult;
  rawResponse: unknown;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    raw: unknown | null;
  };
};

export async function recognizeBill(input: RecognitionProviderInput): Promise<RecognitionProviderOutput> {
  switch (input.provider) {
    case "gemini":
      return recognizeWithGemini(input);
    default:
      throw new Error(`Unsupported provider: ${input.provider}`);
  }
}

