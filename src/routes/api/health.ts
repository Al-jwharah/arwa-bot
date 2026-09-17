import { createFileRoute } from "@tanstack/react-router";

async function ensureWebhook() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (!process.env.VERCEL || !host) return null;
  const { TOKEN } = await import("../../../bot/index.ts");
  const url = `https://${host}/api/telegram`;
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, allowed_updates: ["message", "callback_query", "pre_checkout_query"] }),
  });
  return { url, telegram: await res.json() };
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const { getConfig, getBotStatus } = await import("@/lib/arwa/store");
        const { aiAvailable } = await import("@/lib/arwa/grok");
        const cfg = getConfig();
        const hook = await ensureWebhook().catch((err) => ({ error: String(err) }));
        return Response.json({
          ok: true,
          ai: aiAvailable(),
          updatedAt: cfg.updatedAt,
          name: cfg.characterName,
          bot: getBotStatus().username,
          hook,
        });
      },
    },
  },
});
