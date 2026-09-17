import { createFileRoute } from "@tanstack/react-router";
import { webhookCallback } from "grammy";

let handle: ((req: Request) => Promise<Response>) | null = null;

async function telegramHandler() {
  if (!handle) {
    const { bot } = await import("../../../bot/index.ts");
    handle = webhookCallback(bot, "std/http");
  }
  return handle;
}

export const Route = createFileRoute("/api/telegram")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, service: "arwa-telegram" }),
      POST: async ({ request }) => {
        try {
          const h = await telegramHandler();
          return await h(request);
        } catch (err) {
          console.error("[telegram webhook]", err);
          return Response.json({ ok: false }, { status: 200 });
        }
      },
    },
  },
});
