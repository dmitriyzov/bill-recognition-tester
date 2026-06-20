import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { BILL_EXTRACTION_PROMPT } from "../prompt";
import { requireEnv } from "../config";
import type { BillRecognitionResult } from "../types";
import type { RecognitionProviderInput, RecognitionProviderOutput } from ".";

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["recognized", "not_us_currency", "multiple_bills", "unreadable", "unsupported_side"]
    },
    is_us_currency: { type: ["boolean", "null"] },
    side: { type: ["string", "null"], enum: ["front", "back", "unknown", null] },
    denomination: { type: ["integer", "null"] },
    serial_number: { type: ["string", "null"] },
    left_serial_number: { type: ["string", "null"] },
    right_serial_number: { type: ["string", "null"] },
    serial_numbers_match: { type: ["boolean", "null"] },
    series_year: { type: ["string", "null"] },
    series_label: { type: ["string", "null"] },
    star_note: { type: ["boolean", "null"] },
    federal_reserve_district: { type: ["string", "null"] },
    note_type: { type: ["string", "null"] },
    confidence_by_field: {
      type: "object",
      additionalProperties: { type: ["number", "null"] }
    },
    uncertain_fields: {
      type: "array",
      items: { type: "string" }
    },
    notes: { type: ["string", "null"] }
  },
  required: [
    "status",
    "is_us_currency",
    "side",
    "denomination",
    "serial_number",
    "left_serial_number",
    "right_serial_number",
    "serial_numbers_match",
    "series_year",
    "series_label",
    "star_note",
    "federal_reserve_district",
    "note_type",
    "confidence_by_field",
    "uncertain_fields",
    "notes"
  ]
};

export async function recognizeWithGemini(input: RecognitionProviderInput): Promise<RecognitionProviderOutput> {
  const ai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  const imageBytes = fs.readFileSync(input.imagePath);
  const response = await ai.models.generateContent({
    model: input.modelName,
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBytes.toString("base64")
        }
      },
      { text: BILL_EXTRACTION_PROMPT }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema as never
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  const result = normalizeResult(JSON.parse(text));
  const usage = response.usageMetadata as
    | {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      }
    | undefined;

  return {
    result,
    rawResponse: response,
    usage: {
      inputTokens: usage?.promptTokenCount ?? null,
      outputTokens: usage?.candidatesTokenCount ?? null,
      totalTokens: usage?.totalTokenCount ?? null,
      raw: usage ?? null
    }
  };
}

function normalizeResult(value: BillRecognitionResult): BillRecognitionResult {
  return {
    ...value,
    confidence_by_field: value.confidence_by_field ?? {},
    uncertain_fields: value.uncertain_fields ?? []
  };
}
