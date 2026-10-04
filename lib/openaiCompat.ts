// Tiny client for OpenAI-style chat APIs (used here for Mistral).
// Uses the built-in fetch, so no extra npm package is needed.

export class AIProviderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "document_url"; document_url: string }; // Mistral: PDF as a base64 data URL

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };

export async function chatCompletion(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${opts.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.apiKey}` },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.3, // low = strict, literal data entry
        max_tokens: opts.maxTokens ?? 4096, // room for the final JSON of a big form
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 45_000),
      cache: "no-store",
    });
  } catch (err) {
    throw new AIProviderError(504, `Provider unreachable or timed out: ${String(err)}`);
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new AIProviderError(res.status, detail);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  const raw = data.choices?.[0]?.message?.content;
  // Some reasoning models wrap their thinking in <think> tags - never show that to users
  const text = typeof raw === "string" ? raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() : "";
  if (!text) throw new AIProviderError(502, "Empty response from provider");
  return text;
}