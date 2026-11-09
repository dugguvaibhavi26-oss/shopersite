import "server-only";

/**
 * Talks to the AI providers, both on their free tiers, through their OpenAI-style chat API:
 * Gemini first, then Groq. A provider is skipped for a while when it says its limit is reached
 * (429), is down (5xx) or is too slow, so the next request goes straight to the one that works.
 *
 * No card is attached to either account, so going over a free limit just blocks requests; it can
 * never cost money.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}
export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}
export interface ToolDef {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}
export interface ChatResult {
  message: ChatMessage;
  tokens: number;
  provider: string;
  model: string;
}

interface Provider {
  id: "gemini" | "groq";
  url: string;
  key: () => string;
  /** tried in order; a model the provider doesn't know (404) is skipped and remembered */
  models: () => string[];
}

const list = (env: string | undefined, fallback: string[]) =>
  env
    ? env
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;

const PROVIDERS: Provider[] = [
  {
    id: "gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    key: () => (process.env.GEMINI_API_KEY || "").trim(),
    models: () => list(process.env.GEMINI_MODELS, ["gemini-3.1-flash-lite", "gemini-3-flash-lite", "gemini-2.5-flash-lite", "gemini-flash-lite-latest"]),
  },
  {
    id: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: () => (process.env.GROQ_API_KEY || "").trim(),
    models: () => list(process.env.GROQ_MODELS, ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]),
  },
];

// per server instance: which provider is resting until when, and which models don't exist
const restingUntil = new Map<string, number>();
const missingModels = new Set<string>();

export class AiUnavailable extends Error {}

export function aiConfigured(): boolean {
  return PROVIDERS.some((p) => p.key());
}

export async function chat(messages: ChatMessage[], tools: ToolDef[], opts: { maxTokens?: number; toolChoice?: "auto" | "none" } = {}): Promise<ChatResult> {
  const now = Date.now();
  for (const p of PROVIDERS) {
    const key = p.key();
    if (!key || (restingUntil.get(p.id) || 0) > now) continue;
    for (const model of p.models()) {
      if (missingModels.has(`${p.id}:${model}`)) continue;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      try {
        const r = await fetch(p.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages,
            ...(tools.length ? { tools, tool_choice: opts.toolChoice ?? "auto" } : {}),
            temperature: 0.3,
            // generous: reasoning models spend part of this on thinking before they write the answer
            max_tokens: opts.maxTokens ?? 3000,
            // Groq's GPT-OSS: think briefly so the budget goes to the answer (its thinking comes back separately)
            ...(p.id === "groq" ? { reasoning_effort: "low" } : {}),
          }),
          signal: ctrl.signal,
        });
        if (r.status === 404 || r.status === 400) {
          const text = await r.text().catch(() => "");
          // an unknown model: try the next one; any other bad request: give up on this provider
          if (r.status === 404 || /model/i.test(text) && /(not found|does not exist|unknown|not supported)/i.test(text)) {
            missingModels.add(`${p.id}:${model}`);
            continue;
          }
          console.warn(`[assistant] ${p.id} ${model} 400`, text.slice(0, 300));
          break;
        }
        if (r.status === 429) {
          restingUntil.set(p.id, Date.now() + 60_000);
          break;
        }
        if (r.status === 401 || r.status === 403) {
          console.warn(`[assistant] ${p.id} key rejected (${r.status})`);
          restingUntil.set(p.id, Date.now() + 10 * 60_000);
          break;
        }
        if (!r.ok) {
          restingUntil.set(p.id, Date.now() + 30_000);
          break;
        }
        const body = (await r.json()) as {
          choices?: { message?: ChatMessage }[];
          usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
        };
        const message = body.choices?.[0]?.message;
        if (!message) break;
        const u = body.usage || {};
        const tokens = u.total_tokens || (u.prompt_tokens || 0) + (u.completion_tokens || 0) || estimateTokens(messages);
        return { message: { role: "assistant", content: message.content ?? null, tool_calls: message.tool_calls }, tokens, provider: p.id, model };
      } catch {
        // timeout or network: rest this provider briefly and try the next
        restingUntil.set(p.id, Date.now() + 30_000);
        break;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw new AiUnavailable("AI is busy right now.");
}

/** Rough size when a provider doesn't report usage (about 4 characters per token). */
export function estimateTokens(messages: ChatMessage[]): number {
  return Math.ceil(messages.reduce((n, m) => n + (m.content?.length || 0) + JSON.stringify(m.tool_calls || "").length, 0) / 4);
}
