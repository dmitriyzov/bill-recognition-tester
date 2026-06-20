export type RecognitionStatus =
  | "recognized"
  | "not_us_currency"
  | "multiple_bills"
  | "unreadable"
  | "unsupported_side";

export type BillRecognitionResult = {
  status: RecognitionStatus;
  is_us_currency: boolean | null;
  side: "front" | "back" | "unknown" | null;
  denomination: number | null;
  serial_number: string | null;
  left_serial_number: string | null;
  right_serial_number: string | null;
  serial_numbers_match: boolean | null;
  series_year: string | null;
  series_label: string | null;
  star_note: boolean | null;
  federal_reserve_district: string | null;
  note_type: string | null;
  confidence_by_field: Record<string, number | null>;
  uncertain_fields: string[];
  notes: string | null;
};

export type RecognitionRow = {
  id: number;
  original_image_path: string;
  normalized_image_path: string;
  normalization_version: string;
  provider: string;
  model_name: string;
  prompt_version: string;
  prompt_text: string;
  schema_version: string;
  status: RecognitionStatus;
  parsed_result_json: string;
  raw_response_json: string;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  api_usage_json: string | null;
  created_at: string;
};

export type ValidationRow = {
  id: number;
  recognition_id: number;
  decision: "accurate" | "inaccurate";
  notes: string | null;
  created_at: string;
};

export type Stats = {
  reviewed: number;
  accurate: number;
  inaccurate: number;
  pending: number;
  successRate: number | null;
};

export type UsageStats = {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
};
