"use client";

import { useActionState } from "react";
import { uploadAction } from "../lib/actions";
import { MODEL_OPTIONS } from "../lib/models";
import { SubmitButton } from "./SubmitButton";

export function UploadForm() {
  const [state, formAction] = useActionState(uploadAction, {});

  return (
    <form action={formAction}>
      {state.error && <p className="error">{state.error}</p>}
      <div className="field">
        <label htmlFor="model">Model</label>
        <select id="model" name="model" defaultValue="gemini-2.5-flash">
          {MODEL_OPTIONS.map((model) => (
            <option key={model.model} value={model.model} disabled={!model.enabled}>
              {model.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="image">Bill image</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
        <p className="muted">JPG, PNG, or WebP. Max 10 MB. Front side of one U.S. bill only.</p>
      </div>
      <SubmitButton>Upload and analyze</SubmitButton>
    </form>
  );
}

