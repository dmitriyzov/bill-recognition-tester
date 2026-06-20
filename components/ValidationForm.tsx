"use client";

import { useState } from "react";
import { validateAction } from "../lib/actions";

export function ValidationForm({ recognitionId }: { recognitionId: number }) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <form action={validateAction}>
      <input type="hidden" name="recognitionId" value={recognitionId} />
      <p className="muted">
        Mark successful if denomination, serial number, and series/year are correct.
      </p>
      {showNotes && (
        <div className="field">
          <label htmlFor="notes">Optional notes</label>
          <textarea id="notes" name="notes" rows={3} placeholder="Example: serial read B as 8; glare over series year." />
        </div>
      )}
      <div className="actions">
        <button type="submit" name="decision" value="accurate">Everything looks good</button>
        {!showNotes && (
          <button className="danger" type="button" onClick={() => setShowNotes(true)}>
            Some errors
          </button>
        )}
        {showNotes && (
          <button className="danger" type="submit" name="decision" value="inaccurate">
            Submit as inaccurate
          </button>
        )}
      </div>
    </form>
  );
}
