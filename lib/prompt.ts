import { PROMPT_VERSION, SCHEMA_VERSION } from "./config";

export const BILL_EXTRACTION_PROMPT = `You are extracting visible information from one front-side image of a United States currency bill for an OCR/model evaluation tool.

Rules:
- Process exactly one bill.
- If the image is not a United States currency bill, return status "not_us_currency".
- If more than one bill is visible, return status "multiple_bills".
- If the image shows only the back side of a bill, return status "unsupported_side".
- If a U.S. bill is present but the core fields are not readable, return status "unreadable".
- If the bill is front-side and readable, return status "recognized".
- Do not guess. Use null for any field that is not visible or cannot be read.
- Preserve serial number characters exactly as shown, including any star symbol.
- If left and right serial numbers are both readable, report both and whether they match.
- The MVP success fields are denomination, serial_number, and series_year. Secondary fields are useful but should still be null if unclear.
- For confidence_by_field, provide a value from 0 to 1 for each field you evaluate. Use lower values for uncertain reads and null only when no confidence can be assigned.
- Include confidence keys for: denomination, serial_number, left_serial_number, right_serial_number, serial_numbers_match, series_year, series_label, star_note, side, federal_reserve_district, and note_type.
- Return only JSON matching the requested schema.`;

export const PROMPT_METADATA = {
  promptVersion: PROMPT_VERSION,
  schemaVersion: SCHEMA_VERSION,
  promptText: BILL_EXTRACTION_PROMPT
};
