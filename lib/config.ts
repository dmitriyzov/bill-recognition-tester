import path from "node:path";

export const APP_NAME = "Bill Recognition Tester";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const NORMALIZATION_VERSION = "normalize-v1-max2500-jpeg92";
export const SCHEMA_VERSION = "bill-recognition-schema-v1";
export const PROMPT_VERSION = "bill-extraction-v1";

export function getDataDir() {
  return path.resolve(process.env.DATA_DIR || "./data");
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

