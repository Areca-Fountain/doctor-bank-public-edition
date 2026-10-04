// Registry of the AI models users can pick in the chat.
// A model only shows up in the picker when its API key exists in the environment,
// so you can add or remove a provider just by editing .env.local / Netlify variables.

export type ModelId = "gemini" | "mistral";

export type ModelConfig = {
  id: ModelId;
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
      label: `Mistral · ${model}`,
      kind: "mistral",
      apiKey: process.env.MISTRAL_API_KEY,
      model,
      baseUrl: "https://api.mistral.ai/v1",
    };
  }
  return {
    id: "gemini",
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