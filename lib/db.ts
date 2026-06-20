import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getDataDir } from "./config";
import type { RecognitionRow, Stats, ValidationRow } from "./types";

let db: DatabaseSync | null = null;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(getDataDir(), { recursive: true });
  db = new DatabaseSync(path.join(getDataDir(), "app.sqlite"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

function migrate(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS recognitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_image_path TEXT NOT NULL,
      normalized_image_path TEXT NOT NULL,
      normalization_version TEXT NOT NULL,
      provider TEXT NOT NULL,
      model_name TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      status TEXT NOT NULL,
      parsed_result_json TEXT NOT NULL,
      raw_response_json TEXT NOT NULL,
      latency_ms INTEGER,
      input_tokens INTEGER,
      output_tokens INTEGER,
      total_tokens INTEGER,
      api_usage_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recognition_id INTEGER NOT NULL UNIQUE,
      decision TEXT NOT NULL CHECK (decision IN ('accurate', 'inaccurate')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recognition_id) REFERENCES recognitions(id) ON DELETE CASCADE
    );
  `);
}

export function insertRecognition(input: Omit<RecognitionRow, "id" | "created_at">) {
  const database = getDb();
  const statement = database.prepare(`
    INSERT INTO recognitions (
      original_image_path,
      normalized_image_path,
      normalization_version,
      provider,
      model_name,
      prompt_version,
      prompt_text,
      schema_version,
      status,
      parsed_result_json,
      raw_response_json,
      latency_ms,
      input_tokens,
      output_tokens,
      total_tokens,
      api_usage_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = statement.run(
    input.original_image_path,
    input.normalized_image_path,
    input.normalization_version,
    input.provider,
    input.model_name,
    input.prompt_version,
    input.prompt_text,
    input.schema_version,
    input.status,
    input.parsed_result_json,
    input.raw_response_json,
    input.latency_ms,
    input.input_tokens,
    input.output_tokens,
    input.total_tokens,
    input.api_usage_json
  );
  return Number(result.lastInsertRowid);
}

export function getRecognition(id: number) {
  return getDb()
    .prepare("SELECT * FROM recognitions WHERE id = ?")
    .get(id) as RecognitionRow | undefined;
}

export function getValidation(recognitionId: number) {
  return getDb()
    .prepare("SELECT * FROM validations WHERE recognition_id = ?")
    .get(recognitionId) as ValidationRow | undefined;
}

export function insertValidation(recognitionId: number, decision: "accurate" | "inaccurate", notes: string | null) {
  getDb()
    .prepare("INSERT INTO validations (recognition_id, decision, notes) VALUES (?, ?, ?)")
    .run(recognitionId, decision, notes);
}

export function getStats(modelName: string, promptVersion?: string): Stats {
  const database = getDb();
  const filter = promptVersion
    ? "r.model_name = ? AND r.prompt_version = ? AND r.status = 'recognized'"
    : "r.model_name = ? AND r.status = 'recognized'";
  const params = promptVersion ? [modelName, promptVersion] : [modelName];

  const reviewed = database
    .prepare(
      `SELECT
        COUNT(*) AS reviewed,
        SUM(CASE WHEN v.decision = 'accurate' THEN 1 ELSE 0 END) AS accurate,
        SUM(CASE WHEN v.decision = 'inaccurate' THEN 1 ELSE 0 END) AS inaccurate
       FROM recognitions r
       JOIN validations v ON v.recognition_id = r.id
       WHERE ${filter}`
    )
    .get(...params) as { reviewed: number; accurate: number | null; inaccurate: number | null };

  const pending = database
    .prepare(
      `SELECT COUNT(*) AS pending
       FROM recognitions r
       LEFT JOIN validations v ON v.recognition_id = r.id
       WHERE ${filter} AND v.id IS NULL`
    )
    .get(...params) as { pending: number };

  const accurate = reviewed.accurate ?? 0;
  const inaccurate = reviewed.inaccurate ?? 0;
  const reviewedCount = reviewed.reviewed ?? 0;
  return {
    reviewed: reviewedCount,
    accurate,
    inaccurate,
    pending: pending.pending ?? 0,
    successRate: reviewedCount > 0 ? accurate / reviewedCount : null
  };
}

