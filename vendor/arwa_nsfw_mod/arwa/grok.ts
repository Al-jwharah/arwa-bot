import type { BotConfig, ChatMessage } from "./types";
import { ARWA_LOOK } from "./personality";

const CHAT_URL = "https://api.x.ai/v1/chat/completions";
const RESPONSES_URL = "https://api.x.ai/v1/responses";
const IMAGE_URL = "https://api.x.ai/v1/images/generations";

function apiKey(): string | undefined {
  return process.env.XAI_API_KEY?.trim() || undefined;
}

export function aiAvailable(): boolean {
  return Boolean(apiKey());
}

type GrokContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

function textFromResponses(json: unknown): string {
  const body = json as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
    choices?: Array<{ message?: { content?: string } }>;
  };
  if (body.output_text?.trim()) return body.output_text.trim();
  const parts: string[] = [];
  for (const item of body.output ?? []) {
    for (const c of item.content ?? []) {
      if (c.text) parts.push(c.text);
    }
  }
  if (parts.length) return parts.join("\n").trim();
  return body.choices?.[0]?.message?.content?.trim() || "";
}

async function grokWithSearch(opts: {
  key: string;
  system: string;
  history: ChatMessage[];
  userText: string;
  temperature: number;
  maxTokens: number;
}): Promise<string | null> {
  const input: Array<{ role: string; content: string }> = [
    { role: "system", content: opts.system },
  ];
  for (const m of opts.history.slice(-18)) {
    input.push({ role: m.role, content: m.content });
  }
  input.push({ role: "user", content: opts.userText });

  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.key}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      input,
      tools: [{ type: "web_search" }],
      temperature: opts.temperature,
      max_output_tokens: opts.maxTokens,
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const text = textFromResponses(json);
  return text || null;
}

export async function grokChat(opts: {
  system: string;
  history: ChatMessage[];
  userText: string;
  imageDataUrl?: string;
  config: BotConfig;
}): Promise<string> {
  const key = apiKey();
  if (!key) {
    return "الخدمة مو متاحة الحين، جرب بعد شوي.";
  }

  const messages: { role: string; content: GrokContent }[] = [
    { role: "system", content: opts.system },
  ];

  const recent = opts.history.slice(-18);
  for (const m of recent) {
    messages.push({ role: m.role, content: m.content });
  }

  if (opts.imageDataUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "image_url", image_url: { url: opts.imageDataUrl } },
        { type: "text", text: opts.userText || "وش تشوفين؟" },
      ],
    });
  } else {
    messages.push({ role: "user", content: opts.userText });
  }

  const thinking = opts.config.thinking;
  const maxTokens = thinking === "fast" ? 420 : thinking === "deep" ? 1100 : 700;
  const temperature = thinking === "fast" ? 0.92 : thinking === "deep" ? 0.8 : 0.9;

  if (opts.config.searchMode !== "off" && !opts.imageDataUrl) {
    const searched = await grokWithSearch({
      key,
      system: opts.system,
      history: opts.history,
      userText: opts.userText,
      temperature,
      maxTokens,
    });
    if (searched) return searched;
  }

  const body: Record<string, unknown> = {
    model: "grok-4.5",
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (thinking === "deep") body.reasoning_effort = "high";
  else if (thinking === "fast") body.reasoning_effort = "low";

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`xAI ${res.status}: ${errText.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() || "…";
}

export async function grokImage(prompt: string, selfPortrait: boolean, look?: string): Promise<Buffer> {
  const key = apiKey();
  if (!key) throw new Error("AI is not available");

  const face = look?.trim() || ARWA_LOOK;
  const full = selfPortrait
    ? `Photorealistic photograph of ${face}. Scene: ${prompt}. Natural light, highly erotic, seductive pose, revealing or lingerie, slutty vibe.`
    : prompt;

  const res = await fetch(IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: full,
      n: 1,
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`imagine ${res.status}: ${err.slice(0, 240)}`);
  }

  const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, "base64");

  const url = json.data?.[0]?.url;
  if (!url) throw new Error("empty image");
  const img = await fetch(url);
  if (!img.ok) throw new Error("image download failed");
  return Buffer.from(await img.arrayBuffer());
}
