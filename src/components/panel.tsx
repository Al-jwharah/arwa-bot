import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import {
  addUserFact,
  applyTelegramNow,
  broadcastMessage,
  clearUserMemory,
  deleteUserFact,
  generatePhoto,
  saveSettings,
  testSearch,
  resetSettings,
} from "@/lib/arwa/actions";
import { cn } from "@/lib/utils";

type Dash = Awaited<ReturnType<typeof import("@/lib/arwa/actions").getDashboard>>;
type Tab = "id" | "mind" | "beh" | "orders" | "rules" | "memory" | "run";

const TABS: { id: Tab; label: string }[] = [
  { id: "id", label: "الهوية" },
  { id: "mind", label: "العقل" },
  { id: "beh", label: "السلوك" },
  { id: "orders", label: "التعليمات" },
  { id: "rules", label: "قيود وفلاتر" },
  { id: "memory", label: "الذاكرة" },
  { id: "run", label: "التشغيل" },
];

export function PanelView({
  dash,
  onChange,
}: {
  dash: Dash;
  onChange: () => Promise<void>;
}) {
  const raw = dash.config;
  const c = {
    ...raw,
    characterName: raw.characterName || "أروى",
    characterAge: raw.characterAge || 23,
    characterCity: raw.characterCity || "الرياض",
    characterStatus: raw.characterStatus || "متزوجة",
    characterRole: raw.characterRole || "صاحبة قريبة",
    telegramName: raw.telegramName || "أروى",
    telegramBio: raw.telegramBio || "",
    lookPrompt: raw.lookPrompt || "",
    personality: raw.personality || "",
    dialect: raw.dialect || "",
    emojiStyle: raw.emojiStyle || "",
    instructions: raw.instructions || "",
    constraints: raw.constraints || "",
    filters: raw.filters || "",
    globalMemory: raw.globalMemory || "",
    maxFacts: raw.maxFacts || 40,
    imageStyle: raw.imageStyle || "",
    replyLength: raw.replyLength || "medium",
    emojiLevel: raw.emojiLevel || "light",
    humor: raw.humor || "light",
    warmth: raw.warmth || "warm",
    formality: raw.formality || "casual",
    curiosity: raw.curiosity || "medium",
    energy: raw.energy || "normal",
    sarcasm: raw.sarcasm || "off",
    photoMode: raw.photoMode || "both",
    language: raw.language || "ar",
    useName: raw.useName !== false,
    askQuestions: raw.askQuestions !== false,
    signOff: Boolean(raw.signOff),
    signOffText: raw.signOffText || "",
    hideAi: raw.hideAi !== false,
    allowFlirt: Boolean(raw.allowFlirt),
    allowPolitics: Boolean(raw.allowPolitics),
    allowReligion: Boolean(raw.allowReligion),
    allowInsults: Boolean(raw.allowInsults),
    maintenance: Boolean(raw.maintenance),
    maintenanceMessage: raw.maintenanceMessage || "",
    fallbackReply: raw.fallbackReply || "",
    quickReplies: raw.quickReplies || "",
    ownerAlias: raw.ownerAlias || "المالك",
    maxReplyChars: raw.maxReplyChars || 900,
    autoMemory: raw.autoMemory !== false,
    autoSendPhotos: raw.autoSendPhotos !== false,
    allowUserGenerate: raw.allowUserGenerate !== false,
    botEnabled: raw.botEnabled !== false,
  };
  const [tab, setTab] = useState<Tab>("id");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(c.characterName);
  const [age, setAge] = useState(String(c.characterAge));
  const [city, setCity] = useState(c.characterCity);
  const [status, setStatus] = useState(c.characterStatus);
  const [role, setRole] = useState(c.characterRole);
  const [tgName, setTgName] = useState(c.telegramName);
  const [tgBio, setTgBio] = useState(c.telegramBio);
  const [look, setLook] = useState(c.lookPrompt);
  const [personality, setPersonality] = useState(c.personality);
  const [dialect, setDialect] = useState(c.dialect);
  const [emoji, setEmoji] = useState(c.emojiStyle);
  const [instructions, setInstructions] = useState(c.instructions);
  const [constraints, setConstraints] = useState(c.constraints);
  const [filters, setFilters] = useState(c.filters);
  const [globalMemory, setGlobalMemory] = useState(c.globalMemory);
  const [maxFacts, setMaxFacts] = useState(String(c.maxFacts));
  const [welcome, setWelcome] = useState(c.welcome);
  const [price, setPrice] = useState(String(c.subscriptionPrice));
  const [freeMsg, setFreeMsg] = useState(String(c.freeMessagesPerDay));
  const [freeImg, setFreeImg] = useState(String(c.freeImagesPerDay));
  const [imageStyle, setImageStyle] = useState(c.imageStyle);
  const [prompt, setPrompt] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [searchTest, setSearchTest] = useState("");
  const [factUser, setFactUser] = useState(dash.users[0]?.id ?? "web-preview");
  const [newFact, setNewFact] = useState("");

  useEffect(() => {
    setName(c.characterName);
    setAge(String(c.characterAge));
    setCity(c.characterCity);
    setStatus(c.characterStatus);
    setRole(c.characterRole);
    setTgName(c.telegramName);
    setTgBio(c.telegramBio);
    setLook(c.lookPrompt);
    setPersonality(c.personality);
    setDialect(c.dialect);
    setEmoji(c.emojiStyle);
    setInstructions(c.instructions);
    setConstraints(c.constraints);
    setFilters(c.filters);
    setGlobalMemory(c.globalMemory);
    setMaxFacts(String(c.maxFacts));
    setWelcome(c.welcome);
    setPrice(String(c.subscriptionPrice));
    setFreeMsg(String(c.freeMessagesPerDay));
    setFreeImg(String(c.freeImagesPerDay));
    setImageStyle(c.imageStyle);
  }, [c]);

  async function save(patch: Parameters<typeof saveSettings>[0]["data"], label = "انحفظ ويشتغل من الرسالة الجاية") {
    setSaving(true);
    try {
      await saveSettings({ data: patch });
      toast.success(label);
      await onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="رسائل" value={dash.stats.messagesTotal} />
        <Stat label="مستخدمون" value={dash.stats.usersTotal} />
        <Stat label="صور" value={dash.stats.imagesTotal} />
        <Stat label="نجوم" value={dash.stats.starsTotal} />
      </section>

      <p className="rounded-xl border border-line bg-raised px-4 py-3 text-sm text-muted">
        الحين تشتغل باسم <span className="text-fg">{c.characterName}</span> · {c.characterAge} سنة ·{" "}
        {c.characterRole}. أي حفظ هنا يدخل على الرد الجاي في تلجرام والويب فوراً.
        {c.updatedAt ? (
          <span className="mt-1 block font-mono text-xs text-faint">
            آخر مزامنة مع البوت: {new Date(c.updatedAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}
          </span>
        ) : null}
      </p>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "h-10 rounded-full border px-4 text-sm",
              tab === t.id ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "id" && (
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">الاسم والصورة والهوية</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="العمر">
              <TextInput value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="المدينة">
              <TextInput value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="الوضع" hint="متزوجة، عزباء، مو معلن…">
              <TextInput value={status} onChange={(e) => setStatus(e.target.value)} />
            </Field>
            <Field label="الدور مع الناس">
              <TextInput value={role} onChange={(e) => setRole(e.target.value)} />
            </Field>
            <Field label="اسم تلجرام">
              <TextInput value={tgName} onChange={(e) => setTgName(e.target.value)} />
            </Field>
          </div>
          <Field label="نبذة تلجرام">
            <TextInput value={tgBio} onChange={(e) => setTgBio(e.target.value)} />
          </Field>
          <Field label="وصف ملامحها للصور" hint="بالإنجليزي. يثبت وجهها عند التوليد.">
            <TextArea value={look} onChange={(e) => setLook(e.target.value)} rows={4} />
          </Field>
          <div>
            <p className="mb-2 text-sm text-muted">صورة الحساب</p>
            <div className="flex flex-wrap gap-2">
              {dash.photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void save({ profilePhoto: p.file }, "انحفظت صورة الحساب")}
                  className={cn(
                    "size-16 overflow-hidden rounded-lg ring-2",
                    c.profilePhoto === p.file ? "ring-accent" : "ring-transparent",
                  )}
                >
                  <img src={p.url} alt={p.id} className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={saving}
              onClick={() =>
                void save({
                  characterName: name.trim() || "أروى",
                  characterAge: Math.min(80, Math.max(18, Number(age) || 23)),
                  characterCity: city,
                  characterStatus: status,
                  characterRole: role,
                  telegramName: tgName,
                  telegramBio: tgBio,
                  lookPrompt: look,
                })
              }
            >
              حفظ الهوية
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await applyTelegramNow();
                  toast.success("انطبق الاسم والنبذة على تلجرام");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "تلجرام رفض التطبيق");
                } finally {
                  setSaving(false);
                }
              }}
            >
              تطبيق على تلجرام
            </Button>
          </div>
        </section>
      )}

      {tab === "mind" && (
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">عقلها — هذا اللي ترد فيه</h2>
          <Field label="الشخصية" hint="هذا النص يستبدل عقلها بالكامل في كل رد.">
            <TextArea value={personality} onChange={(e) => setPersonality(e.target.value)} rows={10} />
          </Field>
          <Field label="اللهجة">
            <TextArea value={dialect} onChange={(e) => setDialect(e.target.value)} rows={3} />
          </Field>
          <Field label="الرموز">
            <TextInput value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </Field>
          <h3 className="text-sm font-semibold">طريقة التفكير</h3>
          <div className="grid grid-cols-3 gap-2">
            {([["fast", "سريع"], ["balanced", "متوازن"], ["deep", "عميق"]] as const).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                variant={c.thinking === id ? "primary" : "secondary"}
                onClick={() => void save({ thinking: id })}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button type="button" disabled={saving} onClick={() => void save({ personality, dialect, emojiStyle: emoji }, "العقل وصل للبوت")}>
            حفظ العقل ومزامنة البوت
          </Button>
        </section>
      )}


      {tab === "beh" && (
        <section className="space-y-6 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">سلوك الرد — كل زر ينحفظ فوراً</h2>
          <Group label="طول الرد">
            <Pick value={c.replyLength} onPick={(replyLength) => void save({ replyLength })} items={[["short","قصير"],["medium","متوسط"],["long","طويل"]]} />
          </Group>
          <Group label="الرموز">
            <Pick value={c.emojiLevel} onPick={(emojiLevel) => void save({ emojiLevel })} items={[["none","بدون"],["light","خفيف"],["heavy","كثير"]]} />
          </Group>
          <Group label="المزح">
            <Pick value={c.humor} onPick={(humor) => void save({ humor })} items={[["off","بدون"],["light","خفيف"],["high","واضح"]]} />
          </Group>
          <Group label="الدفء">
            <Pick value={c.warmth} onPick={(warmth) => void save({ warmth })} items={[["cool","هادية"],["warm","دافية"],["very","قريبة جداً"]]} />
          </Group>
          <Group label="الرسمية">
            <Pick value={c.formality} onPick={(formality) => void save({ formality })} items={[["casual","عفوية"],["mixed","وسط"],["formal","مهذبة"]]} />
          </Group>
          <Group label="الفضول">
            <Pick value={c.curiosity} onPick={(curiosity) => void save({ curiosity })} items={[["low","قليل"],["medium","وسط"],["high","تسال كثير"]]} />
          </Group>
          <Group label="الطاقة">
            <Pick value={c.energy} onPick={(energy) => void save({ energy })} items={[["calm","هدوء"],["normal","عادي"],["lively","حيوية"]]} />
          </Group>
          <Group label="السخرية">
            <Pick value={c.sarcasm} onPick={(sarcasm) => void save({ sarcasm })} items={[["off","بدون"],["light","خفيفة"],["on","حاضرة"]]} />
          </Group>
          <Group label="اللغة">
            <Pick value={c.language} onPick={(language) => void save({ language })} items={[["ar","عربي"],["ar-en","عربي/إنجليزي"]]} />
          </Group>
          <Group label="وضع الصور">
            <Pick value={c.photoMode} onPick={(photoMode) => void save({ photoMode })} items={[["off","مقفل"],["album","ألبوم"],["generate","توليد"],["both","الاثنين"]]} />
          </Group>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Flag on={c.useName} label="تناديه باسمه" onClick={() => void save({ useName: !c.useName })} />
            <Flag on={c.askQuestions} label="اسئلة رجعة" onClick={() => void save({ askQuestions: !c.askQuestions })} />
            <Flag on={c.signOff} label="ختمة آخر الرد" onClick={() => void save({ signOff: !c.signOff })} />
            <Flag on={c.hideAi} label="إخفاء أنها ذكاء" onClick={() => void save({ hideAi: !c.hideAi })} />
            <Flag on={c.allowFlirt} label="مجاملات لطيفة" onClick={() => void save({ allowFlirt: !c.allowFlirt })} />
            <Flag on={c.allowPolitics} label="سياسة" onClick={() => void save({ allowPolitics: !c.allowPolitics })} />
            <Flag on={c.allowReligion} label="دين" onClick={() => void save({ allowReligion: !c.allowReligion })} />
            <Flag on={c.allowInsults} label="حدة مسموحة" onClick={() => void save({ allowInsults: !c.allowInsults })} />
            <Flag on={c.autoMemory} label="ذاكرة تلقائية" onClick={() => void save({ autoMemory: !c.autoMemory })} />
            <Flag on={c.autoSendPhotos !== false} label="إرسال الألبوم" onClick={() => void save({ autoSendPhotos: c.autoSendPhotos === false })} />
            <Flag on={c.allowUserGenerate !== false} label="توليد للمستخدم" onClick={() => void save({ allowUserGenerate: c.allowUserGenerate === false })} />
            <Flag on={c.maintenance} label="وضع صيانة" onClick={() => void save({ maintenance: !c.maintenance })} />
          </div>
          <Field label="نص الختمة">
            <TextInput defaultValue={c.signOffText} onBlur={(e) => void save({ signOffText: e.target.value })} />
          </Field>
          <Field label="حد حروف الرد">
            <TextInput defaultValue={String(c.maxReplyChars)} onBlur={(e) => void save({ maxReplyChars: Math.min(4000, Math.max(80, Number(e.target.value) || 900)) })} />
          </Field>
        </section>
      )}

      {tab === "orders" && (
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">تعليمات ملزمة</h2>
          <p className="text-xs text-muted">تنحفظ أول ما تطلعين من الصندوق، وتمشي على تلجرام من الرسالة الجاية.</p>
          <TextArea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            onBlur={() => void save({ instructions }, "التعليمات وصلت للبوت")}
            rows={10}
          />
          <div className="rounded-lg bg-raised px-3 py-2 text-xs text-muted">
            اللي يقرأه البوت الحين:
            <pre className="mt-2 whitespace-pre-wrap font-sans text-fg">{c.instructions || "—"}</pre>
          </div>
          <Field label="رسالة الترحيب">
            <TextArea
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              onBlur={() => void save({ welcome }, "انحفظ الترحيب")}
              rows={4}
            />
          </Field>
          <Button type="button" disabled={saving} onClick={() => void save({ instructions, welcome }, "التعليمات وصلت للبوت")}>
            حفظ ومزامنة البوت
          </Button>
        </section>
      )}

      {tab === "rules" && (
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">القيود والفلاتر</h2>
          <Field label="قيود" hint="أشياء لازم تسويها أو ما تخرقها.">
            <TextArea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={6} />
          </Field>
          <Field label="فلاتر" hint="مواضيع ممنوعة. سطر لكل موضوع.">
            <TextArea value={filters} onChange={(e) => setFilters(e.target.value)} rows={6} />
          </Field>
          <Button type="button" disabled={saving} onClick={() => void save({ constraints, filters })}>
            حفظ القيود والفلاتر
          </Button>
        </section>
      )}

      {tab === "memory" && (
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">الذاكرة</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={c.autoMemory !== false ? "primary" : "secondary"}
              onClick={() => void save({ autoMemory: c.autoMemory === false })}
            >
              {c.autoMemory === false ? "تشغيل استخراج الذاكرة" : "الاستخراج شغال"}
            </Button>
            <Field label="حد الحقائق">
              <TextInput value={maxFacts} onChange={(e) => setMaxFacts(e.target.value)} inputMode="numeric" />
            </Field>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => void save({ maxFacts: Math.min(80, Math.max(5, Number(maxFacts) || 40)) })}
          >
            حفظ حد الحقائق
          </Button>
          <Field label="ذاكرة عامة" hint="حقائق تعرفها عن نفسها أو عن العالم، لكل المستخدمين.">
            <TextArea value={globalMemory} onChange={(e) => setGlobalMemory(e.target.value)} rows={6} />
          </Field>
          <Button type="button" disabled={saving} onClick={() => void save({ globalMemory })}>
            حفظ الذاكرة العامة
          </Button>
          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-sm font-semibold">ذاكرة مستخدم</p>
            <select
              className="h-11 w-full rounded-md border border-line bg-raised px-3 text-sm"
              value={factUser}
              onChange={(e) => setFactUser(e.target.value)}
            >
              {(dash.users.length ? dash.users : [{ id: "web-preview", name: "المعاينة", facts: 0 }]).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.id} · {u.facts} حقائق
                </option>
              ))}
            </select>
            <MemoryEditor userId={factUser} newFact={newFact} setNewFact={setNewFact} onChange={onChange} />
          </div>
        </section>
      )}

      {tab === "run" && (
        <div className="space-y-6">
          <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">البحث</h2>
            <p className="text-xs text-muted">يستخدم أدوات الوكيل. إذا تعثّر ترد بدون ما يطلع خطأ.</p>
            <div className="grid grid-cols-3 gap-2">
              {([["auto", "تلقائي"], ["on", "دائماً"], ["off", "مغلق"]] as const).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  variant={c.searchMode === id ? "primary" : "secondary"}
                  onClick={() => void save({ searchMode: id })}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  const r = await testSearch();
                  setSearchTest(r.text);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "فشل الاختبار");
                } finally {
                  setSaving(false);
                }
              }}
            >
              اختبار البحث
            </Button>
            {searchTest ? <p className="whitespace-pre-wrap text-sm text-muted">{searchTest}</p> : null}
          </section>

          <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">أدوات الصور</h2>
            <div className="flex flex-wrap gap-2">
              {["كافيه الصباح", "في البيت مع كتاب", "شارع الرياض بالليل", "سيلفي هادي"].map((q) => (
                <button
                  key={q}
                  type="button"
                  className="h-9 rounded-full border border-line px-3 text-xs text-muted"
                  onClick={() => setPrompt(q)}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <TextInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="وصف المشهد" />
              <Button
                type="button"
                disabled={!prompt.trim() || saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await generatePhoto({ data: { prompt, caption: prompt } });
                    toast.success("انضافت للمجلد");
                    setPrompt("");
                    await onChange();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "فشل التوليد");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                توليد
              </Button>
            </div>
            <Field label="ستايل الصور">
              <TextInput value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} />
            </Field>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => void save({ imageStyle })}>
              حفظ الستايل
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={c.autoSendPhotos !== false ? "primary" : "secondary"}
                onClick={() => void save({ autoSendPhotos: c.autoSendPhotos === false })}
              >
                {c.autoSendPhotos === false ? "تفعيل الألبوم" : "الألبوم شغال"}
              </Button>
              <Button
                type="button"
                variant={c.allowUserGenerate !== false ? "primary" : "secondary"}
                onClick={() => void save({ allowUserGenerate: c.allowUserGenerate === false })}
              >
                {c.allowUserGenerate === false ? "تفعيل التوليد" : "التوليد شغال"}
              </Button>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">الاشتراك والحدود</h2>
            <Field label="سعر الاشتراك — نجمة / 30 يوم">
              <TextInput value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="رسائل مجانية باليوم">
              <TextInput value={freeMsg} onChange={(e) => setFreeMsg(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="صور مجانية باليوم">
              <TextInput value={freeImg} onChange={(e) => setFreeImg(e.target.value)} inputMode="numeric" />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() =>
                  void save({
                    subscriptionPrice: Number(price) || 2500,
                    freeMessagesPerDay: Number(freeMsg) || 80,
                    freeImagesPerDay: Number(freeImg) || 2,
                  })
                }
              >
                حفظ الحدود
              </Button>
              <Button
                type="button"
                variant={c.botEnabled ? "danger" : "primary"}
                onClick={() => void save({ botEnabled: !c.botEnabled })}
              >
                {c.botEnabled ? "إيقاف البوت للمستخدمين" : "تشغيل البوت"}
              </Button>
            </div>
          </section>


          <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">رسائل النظام</h2>
            <Field label="رسالة الصيانة">
              <TextArea defaultValue={c.maintenanceMessage} rows={3} onBlur={(e) => void save({ maintenanceMessage: e.target.value })} />
            </Field>
            <Field label="رسالة سقوط الشبكة">
              <TextArea defaultValue={c.fallbackReply} rows={3} onBlur={(e) => void save({ fallbackReply: e.target.value })} />
            </Field>
            <Field label="اختصارات الدردشة" hint="سطر لكل زر.">
              <TextArea defaultValue={c.quickReplies} rows={4} onBlur={(e) => void save({ quickReplies: e.target.value })} />
            </Field>
            <Field label="لقب المالك">
              <TextInput defaultValue={c.ownerAlias} onBlur={(e) => void save({ ownerAlias: e.target.value })} />
            </Field>
            <Button
              type="button"
              variant="danger"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await resetSettings();
                  toast.success("رجعت الإعدادات للوضع الافتراضي");
                  await onChange();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "فشل");
                } finally {
                  setSaving(false);
                }
              }}
            >
              إعادة ضبط الإعدادات
            </Button>
          </section>

          <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">إذاعة</h2>
            <TextArea value={broadcast} onChange={(e) => setBroadcast(e.target.value)} rows={4} />
            <Button
              type="button"
              variant="secondary"
              disabled={saving || !broadcast.trim()}
              onClick={async () => {
                setSaving(true);
                try {
                  const r = await broadcastMessage({ data: { text: broadcast.trim() } });
                  toast.success(`وصلت لـ ${r.sent} مستخدم`);
                  setBroadcast("");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "فشلت الإذاعة");
                } finally {
                  setSaving(false);
                }
              }}
            >
              إرسال الإذاعة
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}

function MemoryEditor({
  userId,
  newFact,
  setNewFact,
  onChange,
}: {
  userId: string;
  newFact: string;
  setNewFact: (v: string) => void;
  onChange: () => Promise<void>;
}) {
  const [facts, setFacts] = useState<string[]>([]);

  useEffect(() => {
    void import("@/lib/arwa/actions").then(({ getThread }) =>
      getThread({ data: { userId } }).then((t) => setFacts(t.facts)),
    );
  }, [userId]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <TextInput value={newFact} onChange={(e) => setNewFact(e.target.value)} placeholder="حقيقة جديدة" />
        <Button
          type="button"
          disabled={!newFact.trim()}
          onClick={async () => {
            await addUserFact({ data: { userId, fact: newFact.trim() } });
            setNewFact("");
            await onChange();
            const { getThread } = await import("@/lib/arwa/actions");
            setFacts((await getThread({ data: { userId } })).facts);
          }}
        >
          إضافة
        </Button>
      </div>
      <ul className="space-y-2 text-sm">
        {facts.length === 0 ? <li className="text-muted">ما فيه حقائق.</li> : null}
        {facts.map((f) => (
          <li key={f} className="flex items-center justify-between gap-2 rounded-md bg-raised px-3 py-2">
            <span>{f}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await deleteUserFact({ data: { userId, fact: f } });
                await onChange();
                setFacts((prev) => prev.filter((x) => x !== f));
              }}
            >
              حذف
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="danger"
        onClick={async () => {
          await clearUserMemory({ data: { userId } });
          setFacts([]);
          await onChange();
          toast.success("انمسحت ذاكرة المستخدم");
        }}
      >
        مسح ذاكرة هذا المستخدم
      </Button>
    </div>
  );
}


function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">{label}</p>
      {children}
    </div>
  );
}

function Pick<T extends string>({
  value,
  items,
  onPick,
}: {
  value: T;
  items: [T, string][];
  onPick: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([id, label]) => (
        <Button key={id} type="button" size="sm" variant={value === id ? "primary" : "secondary"} onClick={() => onPick(id)}>
          {label}
        </Button>
      ))}
    </div>
  );
}

function Flag({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant={on ? "primary" : "secondary"} onClick={onClick}>
      {on ? "● " : "○ "}
      {label}
    </Button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium tabular-nums text-xl">{value}</p>
    </div>
  );
}
