// Registry of the AI models users can pick in the chat.
// A model only shows up in the picker when its API key exists in the environment,
// so you can add or remove a provider just by editing .env.local / Netlify variables.

export type ModelId = "gemini" | "mistral";

export type ModelConfig = {
  id: ModelId;
  name: string; // provider name shown in Settings
  description: string; // one-line explanation shown in Settings
  label: string;
  kind: "gemini" | "mistral";
  apiKey: string | undefined;
  model: string;
  baseUrl?: string;
};

const IDS: ModelId[] = ["gemini", "mistral"];

export const isModelId = (value: unknown): value is ModelId =>
  typeof value === "string" && (IDS as string[]).includes(value);

export function getModelConfig(id: ModelId): ModelConfig {
  if (id === "mistral") {
    const model = process.env.MISTRAL_MODEL || "ministral-14b-2512";
    return {
      id,
      name: "Mistral AI",
      description:
        "Reads your PDF as a document and uses a map of the form's fields, so your answers land in the right boxes.",
      label: `Mistral · ${model}`,
      kind: "mistral",
      apiKey: process.env.MISTRAL_API_KEY,
      model,
      baseUrl: "https://api.mistral.ai/v1",
    };
  }
  return {
    id: "gemini",
    name: "Google Gemini",
    description: "Reads your PDF file directly, so it sees the form exactly as it is printed.",
    label: "Gemini",
    kind: "gemini",
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  };
}

// What the chat page shows in the picker (never includes keys)
export function availableModels(): { id: ModelId; label: string }[] {
  return IDS.map(getModelConfig)
    .filter((m) => !!m.apiKey)
    .map(({ id, label }) => ({ id, label }));
}

// What the Settings page shows: every model, and whether it is switched on (never includes keys)
export function allModels(): { id: ModelId; name: string; model: string; description: string; available: boolean }[] {
  return IDS.map(getModelConfig).map(({ id, name, model, description, apiKey }) => ({
    id,
    name,
    model,
    description,
    available: !!apiKey,
  }));
}
