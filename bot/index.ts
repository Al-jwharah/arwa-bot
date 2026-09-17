import { Bot, InlineKeyboard, InputFile, Keyboard } from "grammy";
import type { Context } from "grammy";
import path from "node:path";
import fs from "node:fs";
import { chatWithArwa } from "../src/lib/arwa/chat.ts";
import {
  bumpStat,
  diskPhotoPath,
  getConfig,
  getUser,
  listUsers,
  OWNER_ID,
  photoDir,
  saveConfig,
  saveUser,
  setBotStatus,
  updateConfig,
} from "../src/lib/arwa/store.ts";
import { generateStudioPhoto } from "../src/lib/arwa/chat.ts";
import { assertClean } from "../src/lib/arwa/safety.ts";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "8815380813:AAEXeMVA_M5BrmUPajoHoyK4YLBhLwhYMCY";
export const bot = new Bot(TOKEN);
export { TOKEN };

type OwnerMode =
  | "none"
  | "instructions"
  | "welcome"
  | "broadcast"
  | "photo_caption"
  | "photo_prompt"
  | "block_id"
  | "note"
  | "limits"
  | "image_style"
  | "identity"
  | "mind"
  | "constraints"
  | "filters"
  | "global_memory"
  | "dialect";

const ownerMode = new Map<number, OwnerMode>();
const ownerMeta = new Map<number, string>();

function isOwner(ctx: Context): boolean {
  return ctx.from?.id === OWNER_ID;
}

function userKb() {
  return new Keyboard()
    .text("صورة أروى")
    .text("اشتراك")
    .row()
    .text("وش تتذكرين؟")
    .resized();
}

function ownerKb() {
  return new Keyboard()
    .text("لوحة المالك")
    .text("صورة أروى")
    .text("اشتراك")
    .row()
    .text("وش تتذكرين؟")
    .resized();
}

function adminHome() {
  const cfg = getConfig();
  return new InlineKeyboard()
    .text("الإحصائيات", "a:stats")
    .text("المستخدمون", "a:users")
    .row()
    .text("الهوية", "a:id")
    .text("العقل", "a:mind")
    .row()
    .text("التعليمات", "a:ins")
    .text("التفكير", "a:think")
    .row()
    .text("قيود وفلاتر", "a:rules")
    .text("الذاكرة", "a:memg")
    .row()
    .text("السلوك", "a:beh")
    .text("الصيانة", "a:maint")
    .row()
    .text("البحث", "a:search")
    .text("الترحيب", "a:welcome")
    .row()
    .text("صور أروى", "a:photos")
    .text("توليد صورة", "a:pgen")
    .row()
    .text("أدوات الصور", "a:img")
    .text("الحدود", "a:lim")
    .row()
    .text("الاشتراكات", "a:sub")
    .text("إذاعة", "a:bc")
    .row()
    .text("حظر", "a:block")
    .text(cfg.botEnabled ? "إيقاف البوت" : "تشغيل البوت", "a:toggle")
    .row();
}

function thinkKb() {
  return new InlineKeyboard()
    .text("سريع", "a:t:fast")
    .text("متوازن", "a:t:balanced")
    .text("عميق", "a:t:deep")
    .row()
    .text("رجوع", "a:home");
}

function searchKb() {
  return new InlineKeyboard()
    .text("تلقائي", "a:s:auto")
    .text("دائماً", "a:s:on")
    .text("مغلق", "a:s:off")
    .row()
    .text("رجوع", "a:home");
}

async function sendLocalPhoto(ctx: Context, file: string, caption?: string) {
  const abs = diskPhotoPath(file);
  if (!fs.existsSync(abs)) return false;
  await ctx.replyWithPhoto(new InputFile(abs), { caption });
  return true;
}

async function maybeSubscribeCta(ctx: Context) {
  const cfg = getConfig();
  await ctx.reply(
    `أروى بريميوم — ${cfg.subscriptionPrice} نجمة / 30 يوم\nصور أسرع وذاكرة أعمق بدون حد يومي.`,
    {
      reply_markup: new InlineKeyboard().text("اشترك الآن", "sub:buy"),
    },
  );
}

bot.catch((err) => {
  console.error("[arwa]", err.error);
  setBotStatus({ lastError: String(err.error) });
});

bot.command("start", async (ctx) => {
  const cfg = getConfig();
  const name = ctx.from?.first_name ?? "";
  await sendLocalPhoto(ctx, cfg.profilePhoto);
  await ctx.reply(cfg.welcome.replace("{name}", name), {
    reply_markup: isOwner(ctx) ? ownerKb() : userKb(),
  });
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "أنا أروى. اكتب لي أي شي.\n\nصورة أروى — أرسل لك من ألبومي\nاشتراك — بريميوم بنجوم تلجرام\nوش تتذكرين؟ — اللي أعرفه عنك",
  );
});

bot.command("admin", async (ctx) => {
  if (!isOwner(ctx)) return;
  ownerMode.set(OWNER_ID, "none");
  await ctx.reply("لوحة المالك", { reply_markup: adminHome() });
});

bot.hears("لوحة المالك", async (ctx) => {
  if (!isOwner(ctx)) return;
  ownerMode.set(OWNER_ID, "none");
  await ctx.reply("لوحة المالك", { reply_markup: adminHome() });
});

bot.hears("صورة أروى", async (ctx) => {
  const cfg = getConfig();
  if (cfg.photos.length === 0) {
    await ctx.reply("المجلد فاضي. ارفع صور من اللوحة.");
    return;
  }
  const photo = cfg.photos[Math.floor(Math.random() * cfg.photos.length)];
  await sendLocalPhoto(ctx, photo.file, photo.caption || undefined);
});

bot.hears("اشتراك", async (ctx) => maybeSubscribeCta(ctx));
bot.command("subscribe", async (ctx) => maybeSubscribeCta(ctx));

bot.hears("وش تتذكرين؟", async (ctx) => {
  if (!ctx.from) return;
  const user = getUser(String(ctx.from.id));
  if (user.facts.length === 0) {
    await ctx.reply("لسة ما حفظت عنك شي واضح. كلمني أكثر 🤍");
    return;
  }
  await ctx.reply(user.facts.map((f) => `• ${f}`).join("\n"));
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  if (data === "sub:buy") {
    const cfg = getConfig();
    const link = await ctx.api.createInvoiceLink(
      "أروى بريميوم",
      "اشتراك 30 يوم: صور فورية وذاكرة أعمق",
      `sub:${ctx.from.id}:${Date.now()}`,
      "",
      "XTR",
      [{ label: "اشتراك 30 يوم", amount: cfg.subscriptionPrice }],
      { subscription_period: 2592000 },
    );
    await ctx.reply("اضغط للدفع بالنجوم:", {
      reply_markup: new InlineKeyboard().url("ادفع ⭐", link),
    });
    return;
  }

  if (!isOwner(ctx)) return;

  if (data === "a:home") {
    await ctx.editMessageText("لوحة المالك", { reply_markup: adminHome() }).catch(async () => {
      await ctx.reply("لوحة المالك", { reply_markup: adminHome() });
    });
    return;
  }

  if (data === "a:stats") {
    const { getStats } = await import("../src/lib/arwa/store.ts");
    const s = getStats();
    const u = listUsers();
    await ctx.reply(
      `الرسائل: ${s.messagesTotal}\nالمستخدمون: ${s.usersTotal}\nالصور: ${s.imagesTotal}\nالنجوم: ${s.starsTotal}\nالمشتركين الآن: ${u.filter((x) => x.subscribed).length}`,
      { reply_markup: adminHome() },
    );
    return;
  }

  if (data === "a:users") {
    const users = listUsers().slice(0, 20);
    if (users.length === 0) {
      await ctx.reply("ما فيه مستخدمين بعد.");
      return;
    }
    const kb = new InlineKeyboard();
    for (const u of users) {
      kb.text(`${u.name || u.id}${u.subscribed ? " ★" : ""}`, `a:u:${u.id}`).row();
    }
    kb.text("رجوع", "a:home");
    await ctx.reply("المستخدمون", { reply_markup: kb });
    return;
  }

  if (data.startsWith("a:u:")) {
    const id = data.slice(4);
    const u = getUser(id);
    await ctx.reply(
      `${u.name || id}\n@${u.username || "—"}\nحقائق: ${u.facts.length}\nرسائل محفوظة: ${u.messages.length}\nمشترك: ${u.subscribed ? "نعم" : "لا"}\nمحظور: ${u.blocked ? "نعم" : "لا"}\n${u.summary || ""}`,
      {
        reply_markup: new InlineKeyboard()
          .text(u.blocked ? "فك الحظر" : "حظر", `a:ban:${id}`)
          .text("مسح ذاكرة", `a:wipe:${id}`)
          .row()
          .text("رجوع", "a:users"),
      },
    );
    return;
  }

  if (data.startsWith("a:ban:")) {
    const id = data.slice(6);
    const u = getUser(id);
    u.blocked = !u.blocked;
    saveUser(u);
    await ctx.reply(u.blocked ? "انحظر." : "انفك الحظر.");
    return;
  }

  if (data.startsWith("a:wipe:")) {
    const id = data.slice(7);
    const u = getUser(id);
    u.facts = [];
    u.summary = "";
    u.messages = [];
    saveUser(u);
    await ctx.reply("انمسحت الذاكرة.");
    return;
  }

  if (data === "a:ins") {
    ownerMode.set(OWNER_ID, "instructions");
    await ctx.reply(`التعليمات الحالية:\n\n${getConfig().instructions || "—"}\n\nأرسل التعليمات الجديدة الآن.`);
    return;
  }

  if (data === "a:welcome") {
    ownerMode.set(OWNER_ID, "welcome");
    await ctx.reply(`الترحيب الحالي:\n\n${getConfig().welcome}\n\nأرسل رسالة ترحيب جديدة.`);
    return;
  }

  if (data === "a:think") {
    await ctx.reply(`الوضع: ${getConfig().thinking}`, { reply_markup: thinkKb() });
    return;
  }

  if (data.startsWith("a:t:")) {
    const thinking = data.slice(4) as "fast" | "balanced" | "deep";
    updateConfig({ thinking });
    await ctx.reply(`تم ضبط التفكير على: ${thinking}`, { reply_markup: adminHome() });
    return;
  }

  if (data === "a:search") {
    await ctx.reply(`البحث: ${getConfig().searchMode}`, { reply_markup: searchKb() });
    return;
  }

  if (data.startsWith("a:s:")) {
    const searchMode = data.slice(4) as "off" | "auto" | "on";
    updateConfig({ searchMode });
    await ctx.reply(`تم ضبط البحث على: ${searchMode}`, { reply_markup: adminHome() });
    return;
  }

  if (data === "a:photos") {
    const cfg = getConfig();
    if (cfg.photos.length === 0) {
      await ctx.reply("المجلد فاضي. أرسل صورة الآن لتنحفظ في ألبوم أروى.");
      ownerMode.set(OWNER_ID, "photo_caption");
      return;
    }
    const kb = new InlineKeyboard();
    for (const p of cfg.photos.slice(0, 20)) {
      kb.text(p.id, `a:ph:${p.id}`).row();
    }
    kb.text("رفع صورة جديدة", "a:padd").row().text("رجوع", "a:home");
    await ctx.reply("ألبوم أروى — اختر أو أرسل صورة جديدة من جوالك.", { reply_markup: kb });
    return;
  }

  if (data === "a:padd") {
    ownerMode.set(OWNER_ID, "photo_caption");
    await ctx.reply("أرسل الصورة الحين. تروح مباشرة لمجلد أروى.");
    return;
  }

  if (data.startsWith("a:ph:")) {
    const id = data.slice(5);
    const photo = getConfig().photos.find((p) => p.id === id);
    if (!photo) return;
    await sendLocalPhoto(ctx, photo.file, photo.caption || photo.id);
    await ctx.reply("خيارات الصورة", {
      reply_markup: new InlineKeyboard()
        .text("اجعلها صورة الملف", `a:pset:${id}`)
        .row()
        .text("حذف", `a:pdel:${id}`)
        .text("رجوع", "a:photos"),
    });
    return;
  }

  if (data.startsWith("a:pset:")) {
    const id = data.slice(7);
    const photo = getConfig().photos.find((p) => p.id === id);
    if (!photo) return;
    updateConfig({ profilePhoto: photo.file });
    try {
      await bot.api.setMyProfilePhoto({
        type: "static",
        photo: new InputFile(diskPhotoPath(photo.file)),
      });
    } catch (err) {
      console.error("profile photo", err);
    }
    await ctx.reply("صارت صورة الملف.");
    return;
  }

  if (data.startsWith("a:pdel:")) {
    const id = data.slice(7);
    const cfg = getConfig();
    const photo = cfg.photos.find((p) => p.id === id);
    if (photo) {
      try {
        fs.unlinkSync(diskPhotoPath(photo.file));
      } catch {
        /* */
      }
      cfg.photos = cfg.photos.filter((p) => p.id !== id);
      saveConfig(cfg);
    }
    await ctx.reply("انحذفت.");
    return;
  }

  if (data === "a:pgen") {
    ownerMode.set(OWNER_ID, "photo_prompt");
    await ctx.reply("اكتب وصف المشهد بالعربي أو الإنجليزي. أطلع صورة لأروى بنفس ملامحها.");
    return;
  }



  if (data === "a:id") {
    const cfg = getConfig();
    ownerMode.set(OWNER_ID, "identity");
    await ctx.reply(
      `الهوية الحالية:\n${cfg.characterName} · ${cfg.characterAge} · ${cfg.characterCity}\n${cfg.characterStatus} · ${cfg.characterRole}\n\nأرسل سطر واحد بهذا الشكل:\nاسم | عمر | مدينة | وضع | دور`,
    );
    return;
  }

  if (data === "a:mind") {
    ownerMode.set(OWNER_ID, "mind");
    await ctx.reply(`العقل الحالي:\n\n${getConfig().personality}\n\nأرسل نص العقل الجديد كاملاً.`);
    return;
  }

  if (data === "a:rules") {
    ownerMode.set(OWNER_ID, "constraints");
    await ctx.reply(`القيود الحالية:\n\n${getConfig().constraints}\n\nأرسل القيود الجديدة. بعدها أرسلك الفلاتر.`);
    return;
  }

  if (data === "a:memg") {
    ownerMode.set(OWNER_ID, "global_memory");
    await ctx.reply(`الذاكرة العامة:\n\n${getConfig().globalMemory || "—"}\n\nأرسل الذاكرة العامة الجديدة.`);
    return;
  }


  if (data === "a:maint") {
    const cfg = getConfig();
    updateConfig({ maintenance: !cfg.maintenance });
    await ctx.reply(getConfig().maintenance ? "وضع الصيانة شغال." : "الصيانة اتقفلت.", { reply_markup: adminHome() });
    return;
  }

  if (data === "a:beh") {
    const cfg = getConfig();
    await ctx.reply("سلوك الرد — اضغط لتغيير فوري.", {
      reply_markup: new InlineKeyboard()
        .text("قصير", "a:len:short").text("متوسط", "a:len:medium").text("طويل", "a:len:long").row()
        .text("دفء هادي", "a:w:cool").text("دافية", "a:w:warm").text("قريبة", "a:w:very").row()
        .text("بدون رموز", "a:e:none").text("رموز خفيف", "a:e:light").text("رموز كثير", "a:e:heavy").row()
        .text("مزح مقفل", "a:h:off").text("مزح خفيف", "a:h:light").text("مزح واضح", "a:h:high").row()
        .text("عفوية", "a:f:casual").text("وسط", "a:f:mixed").text("مهذبة", "a:f:formal").row()
        .text("هدوء", "a:en:calm").text("عادي", "a:en:normal").text("حيوية", "a:en:lively").row()
        .text(cfg.askQuestions === false ? "تشغيل الأسئلة" : "قفل الأسئلة", "a:tog:askQuestions").row()
        .text(cfg.useName === false ? "تشغيل الاسم" : "قفل الاسم", "a:tog:useName").row()
        .text(cfg.allowFlirt ? "قفل المجاملات" : "مجاملات لطيفة", "a:tog:allowFlirt").row()
        .text(cfg.allowInsults ? "قفل الحدة" : "حدة مسموحة", "a:tog:allowInsults").row()
        .text("رجوع", "a:home"),
    });
    return;
  }

  if (data.startsWith("a:len:")) {
    updateConfig({ replyLength: data.slice(6) as "short" | "medium" | "long" });
    await ctx.reply("تم طول الرد.", { reply_markup: adminHome() });
    return;
  }
  if (data.startsWith("a:w:")) {
    updateConfig({ warmth: data.slice(4) as "cool" | "warm" | "very" });
    await ctx.reply("تم الدفء.", { reply_markup: adminHome() });
    return;
  }
  if (data.startsWith("a:e:")) {
    updateConfig({ emojiLevel: data.slice(4) as "none" | "light" | "heavy" });
    await ctx.reply("تم الرموز.", { reply_markup: adminHome() });
    return;
  }
  if (data.startsWith("a:h:")) {
    updateConfig({ humor: data.slice(4) as "off" | "light" | "high" });
    await ctx.reply("تم المزح.", { reply_markup: adminHome() });
    return;
  }
  if (data.startsWith("a:f:")) {
    updateConfig({ formality: data.slice(4) as "casual" | "mixed" | "formal" });
    await ctx.reply("تم الرسمية.", { reply_markup: adminHome() });
    return;
  }
  if (data.startsWith("a:en:")) {
    updateConfig({ energy: data.slice(5) as "calm" | "normal" | "lively" });
    await ctx.reply("تم الطاقة.", { reply_markup: adminHome() });
    return;
  }
  if (data.startsWith("a:tog:")) {
    const key = data.slice(6) as "askQuestions" | "useName" | "allowFlirt" | "allowInsults";
    const cfg = getConfig();
    updateConfig({ [key]: !cfg[key] });
    await ctx.reply("تم.", { reply_markup: adminHome() });
    return;
  }

  if (data === "a:img") {
    const cfg = getConfig();
    await ctx.reply(
      `أدوات الصور\nإرسال الألبوم: ${cfg.autoSendPhotos === false ? "مقفل" : "شغال"}\nتوليد للمستخدم: ${cfg.allowUserGenerate === false ? "مقفل" : "شغال"}\nالستايل: ${cfg.imageStyle || "—"}`,
      {
        reply_markup: new InlineKeyboard()
          .text("توليد صورة", "a:pgen")
          .text("رفع صورة", "a:padd")
          .row()
          .text(cfg.autoSendPhotos === false ? "تشغيل الألبوم" : "قفل الألبوم", "a:auto")
          .row()
          .text(cfg.allowUserGenerate === false ? "تشغيل التوليد" : "قفل التوليد", "a:ugen")
          .row()
          .text("ستايل الصور", "a:istyle")
          .text("رجوع", "a:home"),
      },
    );
    return;
  }

  if (data === "a:auto") {
    const cfg = getConfig();
    updateConfig({ autoSendPhotos: cfg.autoSendPhotos === false });
    await ctx.reply("تم.", { reply_markup: adminHome() });
    return;
  }

  if (data === "a:ugen") {
    const cfg = getConfig();
    updateConfig({ allowUserGenerate: cfg.allowUserGenerate === false });
    await ctx.reply("تم.", { reply_markup: adminHome() });
    return;
  }

  if (data === "a:istyle") {
    ownerMode.set(OWNER_ID, "image_style");
    await ctx.reply(`الستايل الحالي:\n${getConfig().imageStyle || "—"}\n\nأرسل ستايل جديد بالإنجليزي.`);
    return;
  }

  if (data === "a:lim") {
    const cfg = getConfig();
    ownerMode.set(OWNER_ID, "limits");
    await ctx.reply(
      `السعر: ${cfg.subscriptionPrice} نجمة\nرسائل مجانية/يوم: ${cfg.freeMessagesPerDay}\nصور مجانية/يوم: ${cfg.freeImagesPerDay}\n\nأرسل ثلاثة أرقام في سطر: السعر الرسائل الصور\nمثال: 2500 80 2`,
    );
    return;
  }

  if (data === "a:sub") {
    const cfg = getConfig();
    const n = listUsers().filter((u) => u.subscribed).length;
    await ctx.reply(
      `السعر: ${cfg.subscriptionPrice} نجمة / 30 يوم\nالمشتركين: ${n}\nالنجوم المحصّلة: ${(await import("../src/lib/arwa/store.ts")).getStats().starsTotal}`,
      { reply_markup: adminHome() },
    );
    return;
  }

  if (data === "a:bc") {
    ownerMode.set(OWNER_ID, "broadcast");
    await ctx.reply("أرسل نص الإذاعة الآن. توصل لكل المستخدمين.");
    return;
  }

  if (data === "a:block") {
    ownerMode.set(OWNER_ID, "block_id");
    await ctx.reply("أرسل آيدي المستخدم للحظر.");
    return;
  }

  if (data === "a:toggle") {
    const cfg = getConfig();
    updateConfig({ botEnabled: !cfg.botEnabled });
    await ctx.reply(cfg.botEnabled ? "البوت توقف للمستخدمين. أنت ما زلت تقدر تجرب." : "البوت اشتغل.", {
      reply_markup: adminHome(),
    });
  }
});

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on("message:successful_payment", async (ctx) => {
  if (!ctx.from || !ctx.message.successful_payment) return;
  const pay = ctx.message.successful_payment;
  const user = getUser(String(ctx.from.id));
  user.subscribed = true;
  user.subscribedUntil = Date.now() + 30 * 24 * 3600 * 1000;
  user.starsSpent += pay.total_amount;
  saveUser(user);
  bumpStat("stars", pay.total_amount);
  await ctx.reply("تم الاشتراك. هلا فيك في أروى بريميوم 🤍");
});

bot.on("message:photo", async (ctx) => {
  if (!ctx.from) return;
  const mode = ownerMode.get(ctx.from.id) ?? "none";

  if (isOwner(ctx) && (mode === "photo_caption" || mode === "none" && ctx.message.caption?.startsWith("/add"))) {
    const photos = ctx.message.photo;
    const best = photos[photos.length - 1];
    const file = await ctx.api.getFile(best.file_id);
    if (!file.file_path) {
      await ctx.reply("ما قدرت أحمل الصورة.");
      return;
    }
    const url = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const id = `tg-${Date.now()}`;
    const name = `${id}.jpg`;
    fs.writeFileSync(path.join(photoDir(), name), buf);
    const cfg = getConfig();
    cfg.photos.push({
      id,
      file: name,
      caption: ctx.message.caption ?? "",
      createdAt: Date.now(),
    });
    saveConfig(cfg);
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظت في مجلد أروى.");
    return;
  }

  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  const file = await ctx.api.getFile(fileId);
  let imageDataUrl: string | undefined;
  if (file.file_path) {
    const url = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    imageDataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
  }
  await handleChat(ctx, ctx.message.caption || "وش تشوفين في الصورة؟", imageDataUrl);
});

const KEYBOARD_KEYS = new Set(["صورة أروى", "اشتراك", "وش تتذكرين؟", "لوحة المالك"]);

bot.on("message:text", async (ctx) => {
  if (!ctx.from || !ctx.message.text) return;
  if (ctx.message.text.startsWith("/")) return;
  if (KEYBOARD_KEYS.has(ctx.message.text)) return;

  const mode = ownerMode.get(ctx.from.id) ?? "none";
  if (isOwner(ctx) && mode !== "none") {
    await handleOwnerText(ctx, ctx.message.text, mode);
    return;
  }

  await handleChat(ctx, ctx.message.text);
});

async function handleOwnerText(ctx: Context, text: string, mode: OwnerMode) {
  if (mode === "instructions") {
    try { assertClean(text, "التعليمات"); updateConfig({ instructions: text }); }
    catch (err) { await ctx.reply(err instanceof Error ? err.message : "ما انحفظ"); return; }
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظت التعليمات. تشتغل من الرسالة الجاية.", { reply_markup: adminHome() });
    return;
  }
  if (mode === "welcome") {
    updateConfig({ welcome: text });
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظ الترحيب.", { reply_markup: adminHome() });
    return;
  }
  if (mode === "broadcast") {
    ownerMode.set(OWNER_ID, "none");
    const users = listUsers();
    let ok = 0;
    for (const u of users) {
      const tid = u.telegramId ?? Number(u.id);
      if (!Number.isFinite(tid)) continue;
      try {
        await bot.api.sendMessage(tid, text);
        ok += 1;
      } catch {
        /* blocked */
      }
    }
    await ctx.reply(`وصلت لـ ${ok} مستخدم.`);
    return;
  }
  if (mode === "block_id") {
    const u = getUser(text.trim());
    u.blocked = true;
    saveUser(u);
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحظر.");
    return;
  }
  if (mode === "identity") {
    const parts = text.split("|").map((s) => s.trim());
    if (parts.length < 5) {
      await ctx.reply("أرسل: اسم | عمر | مدينة | وضع | دور");
      return;
    }
    updateConfig({
      characterName: parts[0],
      characterAge: Math.min(80, Math.max(18, Number(parts[1]) || 23)),
      characterCity: parts[2],
      characterStatus: parts[3],
      characterRole: parts[4],
      telegramName: parts[0],
    });
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظت الهوية. تشتغل من الرسالة الجاية.", { reply_markup: adminHome() });
    return;
  }
  if (mode === "mind") {
    try { assertClean(text, "العقل"); updateConfig({ personality: text }); }
    catch (err) { await ctx.reply(err instanceof Error ? err.message : "ما انحفظ"); return; }
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظ العقل. تشتغل من الرسالة الجاية.", { reply_markup: adminHome() });
    return;
  }
  if (mode === "constraints") {
    try { assertClean(text, "القيود"); updateConfig({ constraints: text }); }
    catch (err) { await ctx.reply(err instanceof Error ? err.message : "ما انحفظ"); return; }
    ownerMode.set(OWNER_ID, "filters");
    await ctx.reply(`انحفظت القيود.\nالفلاتر الحالية:\n${getConfig().filters}\n\nأرسل الفلاتر الجديدة، أو - للتخطي.`);
    return;
  }
  if (mode === "filters") {
    if (text !== "-") {
      try { assertClean(text, "الفلاتر"); updateConfig({ filters: text }); }
      catch (err) { await ctx.reply(err instanceof Error ? err.message : "ما انحفظ"); return; }
    }
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظت الفلاتر.", { reply_markup: adminHome() });
    return;
  }
  if (mode === "global_memory") {
    updateConfig({ globalMemory: text });
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظت الذاكرة العامة.", { reply_markup: adminHome() });
    return;
  }
  if (mode === "image_style") {
    updateConfig({ imageStyle: text });
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظ الستايل.", { reply_markup: adminHome() });
    return;
  }
  if (mode === "limits") {
    const parts = text.trim().split(/\s+/).map(Number);
    if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) {
      await ctx.reply("أرسل ثلاثة أرقام: السعر الرسائل الصور");
      return;
    }
    updateConfig({
      subscriptionPrice: Math.min(10000, Math.max(1, parts[0])),
      freeMessagesPerDay: Math.min(500, Math.max(1, parts[1])),
      freeImagesPerDay: Math.min(50, Math.max(0, parts[2])),
    });
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("انحفظت الحدود.", { reply_markup: adminHome() });
    return;
  }
  if (mode === "photo_prompt") {
    ownerMode.set(OWNER_ID, "none");
    await ctx.reply("جاري التوليد…");
    try {
      const made = await generateStudioPhoto(text, text);
      await sendLocalPhoto(ctx, made.file, made.caption);
      await ctx.reply("انضافت للمجلد.", { reply_markup: adminHome() });
    } catch (err) {
      await ctx.reply(err instanceof Error ? err.message : "فشل التوليد");
    }
    return;
  }
}

async function handleChat(ctx: Context, text: string, imageDataUrl?: string) {
  if (!ctx.from) return;
  if (!getConfig().botEnabled && !isOwner(ctx)) {
    await ctx.reply("أروى مو موجودة الحين.");
    return;
  }

  await ctx.replyWithChatAction("typing");
  const result = await chatWithArwa({
    userId: String(ctx.from.id),
    telegramId: ctx.from.id,
    name: [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" "),
    username: ctx.from.username,
    text,
    imageDataUrl,
    isOwner: isOwner(ctx),
  });

  if (result.blocked) return;

  if (result.needSubscribe) {
    await ctx.reply(result.text);
    await maybeSubscribeCta(ctx);
    return;
  }

  if (result.photoFile) {
    const file = result.photoFile.replace("/arwa/", "");
    await sendLocalPhoto(ctx, file, result.photoCaption);
  }

  if (result.generatedPath) {
    const abs = path.join(process.cwd(), "public", result.generatedPath.replace(/^\//, ""));
    if (fs.existsSync(abs)) {
      await ctx.replyWithPhoto(new InputFile(abs));
    }
  }

  if (result.text) await ctx.reply(result.text);
}

async function setupProfile() {
  try {
    await bot.api.setMyCommands([
      { command: "start", description: "ابدأ" },
      { command: "help", description: "مساعدة" },
      { command: "subscribe", description: "الاشتراك بالنجوم" },
      { command: "admin", description: "لوحة المالك" },
    ]);
  } catch (err) {
    console.error("setup", err);
  }
}

async function main() {
  await bot.api.deleteWebhook({ drop_pending_updates: false });
  const me = await bot.api.getMe();
  setBotStatus({
    running: true,
    username: me.username ?? "",
    firstName: me.first_name,
    lastError: null,
  });
  await setupProfile();
  const beat = setInterval(() => {
    setBotStatus({ running: true });
  }, 15_000);
  console.log(`Arwa bot @${me.username} polling`);
  await bot.start({
    onStart: () => { setBotStatus({ running: true }); },
  });
  clearInterval(beat);
}

export async function startPolling() {
  await main();
}

const startedDirectly = process.argv[1]?.includes("bot/index");
if (startedDirectly && !process.env.VERCEL) {
  main().catch((err) => {
    console.error(err);
    setBotStatus({ running: false, lastError: String(err) });
    process.exit(1);
  });
}
