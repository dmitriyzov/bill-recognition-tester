"use server";

import { redirect } from "next/navigation";
import fs from "node:fs";
import { MAX_UPLOAD_BYTES, PROMPT_VERSION, SCHEMA_VERSION } from "./config";
import { getEnabledModel } from "./models";
import { PROMPT_METADATA } from "./prompt";
import { ACCEPTED_MIME_TYPES, storeAndNormalizeImage } from "./storage";
import { recognizeBill } from "./providers";
import { insertRecognition, insertValidation, getRecognition, getValidation } from "./db";
import { clearSessionCookie, passwordMatches, requireAuth, setSessionCookie } from "./auth";

export type ActionState = { error?: string };

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  if (!passwordMatches(password)) {
    return { error: "Invalid password." };
  }
  await setSessionCookie();
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function uploadAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAuth();
  const file = formData.get("image");
  const modelName = String(formData.get("model") || "");
  const model = getEnabledModel(modelName);

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Image is too large. Maximum upload size is 10 MB." };
  }
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return { error: "Unsupported file type. Please upload JPG, PNG, or WebP." };
  }

  const stored = await storeAndNormalizeImage(file);
  const startedAt = Date.now();
  let recognition;
  try {
    recognition = await recognizeBill({
      provider: model.provider,
      modelName: model.model,
      imagePath: stored.normalizedPath
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown recognition error";
    return { error: `Recognition failed: ${message}` };
  }
  const latencyMs = Date.now() - startedAt;

  const id = insertRecognition({
    original_image_path: stored.originalPath,
    normalized_image_path: stored.normalizedPath,
    normalization_version: stored.normalizationVersion,
    provider: model.provider,
    model_name: model.model,
    prompt_version: PROMPT_VERSION,
    prompt_text: PROMPT_METADATA.promptText,
    schema_version: SCHEMA_VERSION,
    status: recognition.result.status,
    parsed_result_json: JSON.stringify(recognition.result),
    raw_response_json: JSON.stringify(recognition.rawResponse),
    latency_ms: latencyMs,
    input_tokens: recognition.usage.inputTokens,
    output_tokens: recognition.usage.outputTokens,
    total_tokens: recognition.usage.totalTokens,
    api_usage_json: recognition.usage.raw ? JSON.stringify(recognition.usage.raw) : null
  });

  redirect(`/results/${id}`);
}

export async function validateAction(formData: FormData) {
  await requireAuth();
  const recognitionId = Number(formData.get("recognitionId"));
  const decision = String(formData.get("decision"));
  const notes = String(formData.get("notes") || "").trim();
  const recognition = getRecognition(recognitionId);
  if (!recognition) {
    throw new Error("Recognition not found.");
  }
  if (recognition.status !== "recognized") {
    throw new Error("Only recognized results can be validated.");
  }
  if (getValidation(recognitionId)) {
    redirect(`/results/${recognitionId}`);
  }
  if (decision !== "accurate" && decision !== "inaccurate") {
    throw new Error("Invalid validation decision.");
  }
  insertValidation(recognitionId, decision, decision === "inaccurate" && notes ? notes : null);
  redirect(`/results/${recognitionId}`);
}

export async function imageRouteData(relativePath: string) {
  const buffer = fs.readFileSync(relativePath);
  return buffer;
}
