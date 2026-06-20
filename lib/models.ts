export type ModelOption = {
  provider: "gemini";
  model: string;
  label: string;
  enabled: boolean;
};

export const MODEL_OPTIONS: ModelOption[] = [
  {
    provider: "gemini",
    model: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    enabled: true
  },
  {
    provider: "gemini",
    model: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro (future)",
    enabled: false
  },
  {
    provider: "gemini",
    model: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash (future)",
    enabled: false
  }
];

export function getEnabledModel(modelName: string) {
  const option = MODEL_OPTIONS.find((model) => model.model === modelName && model.enabled);
  if (!option) {
    throw new Error("Selected model is not enabled.");
  }
  return option;
}

