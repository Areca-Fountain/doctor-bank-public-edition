export const MODEL_COOKIE = "db_ai_model";

export type ModelOption = {
  id: string; // "default" means "whatever the site is configured to use"
  label: string;
  description: string;
  proOnly: boolean;
};

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "default",
    label: "Recommended",
    description: "The model Doctor Bank is set up to use. A good balance of speed and accuracy for most forms.",
    proOnly: false,
  },
  {
    id: "gemini-2.5-flash",
    label: "Balanced",
    description: "Gemini 2.5 Flash. Quick replies with solid accuracy on long forms.",
    proOnly: false,
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Fastest",
    description: "Gemini 2.5 Flash-Lite. The quickest replies. Best for short, simple forms.",
    proOnly: false,
  },
  {
    id: "gemini-2.5-pro",
    label: "Most capable",
    description: "Gemini 2.5 Pro. Slower, but careful with complex or multi-page forms.",
    proOnly: true,
  },
];

export const isValidModelId = (id: unknown): id is string =>
  typeof id === "string" && MODEL_OPTIONS.some((o) => o.id === id);

/** Server only. Turns a saved choice into the real model name, falling back safely. */
export function resolveModel(choice: string | undefined, isPro: boolean): string {
  const fallback = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const option = MODEL_OPTIONS.find((o) => o.id === choice);
  if (!option || option.id === "default") return fallback;
  if (option.proOnly && !isPro) return fallback; // a downgraded user can't keep using a Full House model
  return option.id;
}
