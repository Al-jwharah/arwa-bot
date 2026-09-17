import fs from "node:fs";
import { getConfig, diskPhotoPath } from "./store";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

type TgRes = { ok: boolean; description?: string };

async function tg(method: string, body: Record<string, unknown>): Promise<TgRes> {
  if (!TOKEN) return { ok: false, description: "no token" };
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as TgRes;
}

export async function applyTelegramProfile() {
  const cfg = getConfig();
  const name = (cfg.telegramName || cfg.characterName || "أروى").slice(0, 64);
  const bio = (cfg.telegramBio || `${cfg.characterName} — ${cfg.characterRole}`).slice(0, 120);
  const desc = `${cfg.characterName}، ${cfg.characterAge} سنة، ${cfg.characterStatus}، ${cfg.characterRole}.`.slice(
    0,
    512,
  );
  const results: Record<string, TgRes> = {
    name: await tg("setMyName", { name }),
    short: await tg("setMyShortDescription", { short_description: bio }),
    desc: await tg("setMyDescription", { description: desc }),
    photo: { ok: true },
  };

  const portrait = diskPhotoPath(cfg.profilePhoto);
  if (TOKEN && fs.existsSync(portrait)) {
    const form = new FormData();
    const buf = fs.readFileSync(portrait);
    form.set("photo", new Blob([new Uint8Array(buf)], { type: "image/jpeg" }), cfg.profilePhoto);
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/setMyProfilePhoto`, {
      method: "POST",
      body: form,
    });
    results.photo = (await res.json()) as TgRes;
  }

  const failed = Object.entries(results).filter(([k, v]) => k !== "photo" && !v.ok);
  if (failed.length) {
    const msg = failed.map(([k, v]) => `${k}: ${v.description ?? "fail"}`).join(" · ");
    throw new Error(msg.slice(0, 240));
  }
  return { ok: true };
}
