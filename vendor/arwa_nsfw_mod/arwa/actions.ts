import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getDashboard = createServerFn({ method: "POST" }).handler(async () => {
  const { getConfig, getStats, getBotStatus, listUsers, publicPhotoPath, OWNER_ID } =
    await import("./store");
  const { aiAvailable } = await import("./grok");
  const config = getConfig();
  return {
    config,
    stats: getStats(),
    status: getBotStatus(),
    ai: aiAvailable(),
    ownerId: OWNER_ID,
    users: listUsers().slice(0, 40).map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      subscribed: u.subscribed,
      blocked: u.blocked,
      lastSeen: u.lastSeen,
      facts: u.facts.length,
      messages: u.messages.length,
    })),
    photos: config.photos.map((p) => ({
      ...p,
      url: publicPhotoPath(p.file),
    })),
  };
});

export const getThread = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const { getUser } = await import("./store");
    const user = getUser(data.userId);
    return {
      id: user.id,
      name: user.name,
      facts: user.facts,
      summary: user.summary,
      notes: user.notes,
      subscribed: user.subscribed,
      blocked: user.blocked,
      messages: user.messages.slice(-30),
    };
  });

export const sendArwaMessage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      text: z.string().min(1).max(4000),
      userId: z.string().default("web-preview"),
      imageDataUrl: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { chatWithArwa } = await import("./chat");
    const { OWNER_ID, WEB_USER_ID } = await import("./store");
    return chatWithArwa({
      userId: data.userId || WEB_USER_ID,
      text: data.text,
      name: "المالك",
      isOwner: true,
      telegramId: OWNER_ID,
      imageDataUrl: data.imageDataUrl,
    });
  });

export const saveSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      characterName: z.string().min(1).max(40).optional(),
      characterAge: z.number().min(18).max(80).optional(),
      characterCity: z.string().max(40).optional(),
      characterStatus: z.string().max(80).optional(),
      characterRole: z.string().max(80).optional(),
      telegramName: z.string().max(64).optional(),
      telegramBio: z.string().max(120).optional(),
      lookPrompt: z.string().max(800).optional(),
      personality: z.string().max(8000).optional(),
      dialect: z.string().max(800).optional(),
      emojiStyle: z.string().max(400).optional(),
      instructions: z.string().max(8000).optional(),
      constraints: z.string().max(4000).optional(),
      filters: z.string().max(4000).optional(),
      globalMemory: z.string().max(4000).optional(),
      autoMemory: z.boolean().optional(),
      maxFacts: z.number().min(5).max(80).optional(),
      thinking: z.enum(["fast", "balanced", "deep"]).optional(),
      searchMode: z.enum(["off", "auto", "on"]).optional(),
      welcome: z.string().max(2000).optional(),
      subscriptionPrice: z.number().min(1).max(10000).optional(),
      freeImagesPerDay: z.number().min(0).max(50).optional(),
      freeMessagesPerDay: z.number().min(1).max(500).optional(),
      botEnabled: z.boolean().optional(),
      profilePhoto: z.string().optional(),
      autoSendPhotos: z.boolean().optional(),
      allowUserGenerate: z.boolean().optional(),
      imageStyle: z.string().max(400).optional(),
      replyLength: z.enum(["short", "medium", "long"]).optional(),
      emojiLevel: z.enum(["none", "light", "heavy"]).optional(),
      humor: z.enum(["off", "light", "high"]).optional(),
      warmth: z.enum(["cool", "warm", "very"]).optional(),
      formality: z.enum(["casual", "mixed", "formal"]).optional(),
      curiosity: z.enum(["low", "medium", "high"]).optional(),
      energy: z.enum(["calm", "normal", "lively"]).optional(),
      sarcasm: z.enum(["off", "light", "on"]).optional(),
      photoMode: z.enum(["off", "album", "generate", "both"]).optional(),
      language: z.enum(["ar", "ar-en"]).optional(),
      useName: z.boolean().optional(),
      askQuestions: z.boolean().optional(),
      signOff: z.boolean().optional(),
      signOffText: z.string().max(80).optional(),
      hideAi: z.boolean().optional(),
      allowFlirt: z.boolean().optional(),
      allowPolitics: z.boolean().optional(),
      allowReligion: z.boolean().optional(),
      allowInsults: z.boolean().optional(),
      maintenance: z.boolean().optional(),
      maintenanceMessage: z.string().max(400).optional(),
      fallbackReply: z.string().max(400).optional(),
      quickReplies: z.string().max(500).optional(),
      ownerAlias: z.string().max(40).optional(),
      maxReplyChars: z.number().min(80).max(4000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { assertClean } = await import("./safety");
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "string") assertClean(v, k);
    }
    const { updateConfig } = await import("./store");
    return updateConfig(data);
  });

export const applyTelegramNow = createServerFn({ method: "POST" }).handler(async () => {
  const { applyTelegramProfile } = await import("./telegram-apply");
  return applyTelegramProfile();
});

export const addUserFact = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), fact: z.string().min(1).max(240) }))
  .handler(async ({ data }) => {
    const { getUser, saveUser } = await import("./store");
    const user = getUser(data.userId);
    if (!user.facts.includes(data.fact)) user.facts.push(data.fact);
    saveUser(user);
    return { ok: true };
  });

export const deleteUserFact = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), fact: z.string() }))
  .handler(async ({ data }) => {
    const { getUser, saveUser } = await import("./store");
    const user = getUser(data.userId);
    user.facts = user.facts.filter((f) => f !== data.fact);
    saveUser(user);
    return { ok: true };
  });

export const uploadPhoto = createServerFn({ method: "POST" })
  .validator(
    z.object({
      filename: z.string().min(1).max(80),
      dataUrl: z.string().min(20),
      caption: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { photoDir, getConfig, saveConfig } = await import("./store");
    const extMatch = data.filename.toLowerCase().match(/\.(jpe?g|png|webp)$/);
    const ext = extMatch?.[1] === "png" ? "png" : extMatch?.[1] === "webp" ? "webp" : "jpg";
    const id = `upload-${Date.now()}`;
    const file = `${id}.${ext}`;
    const comma = data.dataUrl.indexOf(",");
    const b64 = comma >= 0 ? data.dataUrl.slice(comma + 1) : data.dataUrl;
    fs.writeFileSync(path.join(photoDir(), file), Buffer.from(b64, "base64"));
    const config = getConfig();
    config.photos.push({
      id,
      file,
      caption: data.caption ?? "",
      createdAt: Date.now(),
    });
    saveConfig(config);
    return { id, file, url: `/arwa/${file}` };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const fs = await import("node:fs");
    const { getConfig, saveConfig, diskPhotoPath } = await import("./store");
    const config = getConfig();
    const photo = config.photos.find((p) => p.id === data.id);
    if (photo) {
      try {
        fs.unlinkSync(diskPhotoPath(photo.file));
      } catch {
        /* gone */
      }
      config.photos = config.photos.filter((p) => p.id !== data.id);
      if (config.profilePhoto === photo.file && config.photos[0]) {
        config.profilePhoto = config.photos[0].file;
      }
      saveConfig(config);
    }
    return { ok: true };
  });

export const updatePhotoCaption = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), caption: z.string().max(200) }))
  .handler(async ({ data }) => {
    const { getConfig, saveConfig } = await import("./store");
    const config = getConfig();
    const photo = config.photos.find((p) => p.id === data.id);
    if (photo) photo.caption = data.caption;
    saveConfig(config);
    return { ok: true };
  });

export const generatePhoto = createServerFn({ method: "POST" })
  .validator(
    z.object({
      prompt: z.string().min(3).max(800),
      caption: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { generateStudioPhoto } = await import("./chat");
    return generateStudioPhoto(data.prompt, data.caption ?? "");
  });

export const saveUserNotes = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string(),
      notes: z.string().max(2000).optional(),
      blocked: z.boolean().optional(),
      subscribed: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { getUser, saveUser } = await import("./store");
    const user = getUser(data.userId);
    if (data.notes !== undefined) user.notes = data.notes;
    if (data.blocked !== undefined) user.blocked = data.blocked;
    if (data.subscribed !== undefined) {
      user.subscribed = data.subscribed;
      user.subscribedUntil = data.subscribed ? Date.now() + 30 * 24 * 3600 * 1000 : null;
    }
    saveUser(user);
    return { ok: true };
  });

export const clearUserMemory = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const { getUser, saveUser } = await import("./store");
    const user = getUser(data.userId);
    user.facts = [];
    user.summary = "";
    user.messages = [];
    saveUser(user);
    return { ok: true };
  });

export const broadcastMessage = createServerFn({ method: "POST" })
  .validator(z.object({ text: z.string().min(1).max(2000) }))
  .handler(async ({ data }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
    const { listUsers } = await import("./store");
    let ok = 0;
    for (const u of listUsers()) {
      const tid = u.telegramId ?? Number(u.id);
      if (!Number.isFinite(tid) || !token) continue;
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: tid, text: data.text }),
        });
        if (res.ok) ok += 1;
      } catch {
        /* skip */
      }
    }
    return { sent: ok };
  });

export const testSearch = createServerFn({ method: "POST" }).handler(async () => {
  const { grokChat } = await import("./grok");
  const { getConfig } = await import("./store");
  const text = await grokChat({
    system: "جاوبي عربي قصير بمعلومة حديثة، بصوت إنساني طبيعي.",
    history: [],
    userText: "وش سعر البيتكوين تقريباً الحين، ومن أي مصدر؟",
    config: { ...getConfig(), searchMode: "on", thinking: "fast" },
  });
  return { text };
});

export const resetSettings = createServerFn({ method: "POST" }).handler(async () => {
  const { resetConfigKeepPhotos } = await import("./store");
  return resetConfigKeepPhotos();
});
