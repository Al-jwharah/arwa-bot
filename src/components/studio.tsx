import { useEffect, useRef, useState, type ReactNode } from "react";
import { readLastView, writeLastView, type StudioView } from "@/lib/arwa/view";
import {
  Camera,
  ImagePlus,
  MessageCircle,
  PanelRight,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  Wifi,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import {
  clearUserMemory,
  deletePhoto,
  generatePhoto,
  getDashboard,
  getThread,
  saveSettings,
  saveUserNotes,
  sendArwaMessage,
  updatePhotoCaption,
  uploadPhoto,
} from "@/lib/arwa/actions";
import { PanelView } from "@/components/panel";
import { cn } from "@/lib/utils";

type View = StudioView;

type Dash = Awaited<ReturnType<typeof getDashboard>>;
type Thread = Awaited<ReturnType<typeof getThread>>;

const WEB_ID = "web-preview";

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  });
}

export function Studio() {
  const [view, setViewState] = useState<View | null>(null);

  function setView(next: View) {
    writeLastView(next);
    setViewState(next);
  }

  useEffect(() => {
    setViewState(readLastView());
  }, []);

  const [dash, setDash] = useState<Dash | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [d, t] = await Promise.all([getDashboard(), getThread({ data: { userId: WEB_ID } })]);
    setDash(d);
    setThread(t);
  }

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : "تعذر التحميل");
    });
  }, []);

  const avatar = dash?.photos.find((p) => p.file === dash.config.profilePhoto) ?? dash?.photos[0];
  const live = Boolean(dash?.status.running && Date.now() - dash.status.lastHeartbeat < 45_000);

  if (!view) {
    return <div className="min-h-dvh bg-bg" />;
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Toaster theme="dark" dir="rtl" position="top-center" />
      <div className="mx-auto flex min-h-dvh max-w-7xl">
        <aside className="hidden w-72 shrink-0 flex-col border-l border-line bg-surface md:flex">
          <div className="border-b border-line p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">Studio</p>
            <div className="mt-4 flex items-center gap-3">
            <img
              src={avatar?.url ?? "/arwa/avatar.jpg"}
              alt="أروى"
              className="size-12 rounded-full object-cover ring-1 ring-line"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight">{dash?.config.characterName || "أروى"}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn("size-1.5 rounded-full", live ? "bg-ok" : "bg-faint")} />
                {live ? "متصلة على تلجرام" : "تتجهز"}
              </p>
            </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            <NavBtn active={view === "chat"} onClick={() => setView("chat")} icon={<MessageCircle className="size-4" />}>
              الدردشة
            </NavBtn>
            <NavBtn active={view === "photos"} onClick={() => setView("photos")} icon={<Camera className="size-4" />}>
              مجلد الصور
            </NavBtn>
            <NavBtn active={view === "panel"} onClick={() => setView("panel")} icon={<Settings2 className="size-4" />}>
              لوحة المالك
            </NavBtn>
            <NavBtn active={view === "people"} onClick={() => setView("people")} icon={<Users className="size-4" />}>
              المستخدمون
            </NavBtn>
          </nav>
          <div className="space-y-2 p-5 text-xs text-faint">
            <p>@{dash?.status.username ?? "Arwa_bitch_bot"}</p>
            <p>المالك {dash?.ownerId}</p>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-line bg-surface/70 px-4 py-4 backdrop-blur md:px-8">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                {view === "chat" && `دردشة ${dash?.config.characterName || "أروى"}`}
                {view === "photos" && "مجلد الصور"}
                {view === "panel" && "لوحة المالك"}
                {view === "people" && "المستخدمون والذاكرة"}
              </h1>
              <p className="text-xs text-muted">
                {dash?.ai ? "Grok متصل" : "الذكاء غير متاح"} · {dash?.stats.messagesTotal ?? 0} رسالة
              </p>
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
              <Wifi className="size-3.5" />
              بحث {dash?.config.searchMode === "on" ? "دائم" : dash?.config.searchMode === "off" ? "مغلق" : "تلقائي"}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pb-32 md:pb-0">
            <div className={view === "chat" ? "block" : "hidden"}>
              <ChatView
                thread={thread}
                photos={dash?.photos ?? []}
                busy={busy}
                setBusy={setBusy}
                onSent={refresh}
                chips={(dash?.config.quickReplies || "ارسلي صورتك\nكيفك اليوم؟\nسوي صورة لك في الكافيه")
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)}
              />
            </div>
            {dash ? (
              <>
                <div className={view === "photos" ? "block" : "hidden"}>
                  <PhotosView dash={dash} onChange={refresh} />
                </div>
                <div className={view === "panel" ? "block" : "hidden"}>
                  <PanelView dash={dash} onChange={refresh} />
                </div>
                <div className={view === "people" ? "block" : "hidden"}>
                  <PeopleView dash={dash} onChange={refresh} />
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface/95 backdrop-blur md:hidden">
        {(
          [
            ["chat", "دردشة", MessageCircle],
            ["photos", "صور", Camera],
            ["panel", "لوحة", PanelRight],
            ["people", "ناس", Users],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-xs",
              view === id ? "text-fg" : "text-muted",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150",
        active ? "bg-raised text-fg" : "text-muted hover:bg-raised/60 hover:text-fg",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function ChatView({
  thread,
  photos,
  busy,
  setBusy,
  onSent,
  chips,
}: {
  thread: Thread | null;
  photos: Dash["photos"];
  busy: boolean;
  setBusy: (v: boolean) => void;
  onSent: () => Promise<void>;
  chips: string[];
}) {
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const messages = thread?.messages ?? [];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  async function send(next = text) {
    const value = next.trim();
    if (!value || busy) return;
    setText("");
    setBusy(true);
    try {
      await sendArwaMessage({ data: { text: value, userId: WEB_ID } });
      await onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الإرسال");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-dvh flex-col">
      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-8">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md pt-10 text-center">
            <img
              src={photos[0]?.url ?? "/arwa/portrait.jpg"}
              alt=""
              className="mx-auto mb-5 aspect-portrait w-36 rounded-xl object-cover ring-1 ring-line"
            />
            <p className="text-lg font-medium">أروى</p>
            <p className="mt-2 text-sm text-muted">٢٣ سنة، صاحبة قريبة. اكتب لها من هنا أو من تلجرام.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={`${m.ts}-${i}`} className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}>
            <div
              className={cn(
                "max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft",
                m.role === "user" ? "rounded-br-md bg-raised text-fg" : "rounded-bl-md bg-accent text-accent-fg",
              )}
            >
              {m.photo ? (
                <img src={m.photo} alt="" className="mb-2 max-h-64 w-full rounded-md object-cover" />
              ) : null}
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className={cn("mt-1 text-xs", m.role === "user" ? "text-faint" : "text-accent-fg/60")}>
                {timeLabel(m.ts)}
              </p>
            </div>
          </div>
        ))}
        {busy && <p className="text-center text-xs text-muted">أروى تكتب…</p>}
      </div>
      <div className="border-t border-line bg-surface p-3 md:p-4">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {chips.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void send(q)}
              className="h-9 shrink-0 rounded-full border border-line px-3 text-xs text-muted hover:text-fg"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <TextInput
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب لأروى…"
            disabled={busy}
          />
          <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="إرسال">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function PhotosView({ dash, onChange }: { dash: Dash; onChange: () => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [prompt, setPrompt] = useState("");
  const [uploading, setUploading] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await fileToDataUrl(file);
        await uploadPhoto({ data: { filename: file.name, dataUrl, caption } });
      }
      setCaption("");
      toast.success("انحفظت الصور في المجلد");
      await onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus className="size-6 text-muted" />
        <div>
          <p className="text-sm font-medium">حط صور أروى هنا</p>
          <p className="mt-1 max-w-md text-xs text-muted">
            اسحب الملفات أو ارفعها. البوت يرسلها فوراً من هذا المجلد. تقدر بعد تضيف صور من لوحة تلجرام كمالك.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <TextInput
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="تعليق الصورة (اختياري)"
            className="w-56"
          />
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
            رفع صور
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-medium">توليد صورة بنفس ملامح أروى</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextInput
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: في المطبخ الصباح، قهوة وهدوء"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!prompt.trim() || uploading}
            onClick={async () => {
              setUploading(true);
              try {
                await generatePhoto({ data: { prompt, caption: prompt } });
                setPrompt("");
                toast.success("انضافت الصورة للمجلد");
                await onChange();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "فشل التوليد");
              } finally {
                setUploading(false);
              }
            }}
          >
            <Sparkles className="size-4" />
            توليد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {dash.photos.map((p) => (
          <figure key={p.id} className="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
            <img src={p.url} alt={p.caption || p.id} className="aspect-portrait w-full object-cover" />
            <figcaption className="space-y-2 p-3">
              <TextInput
                defaultValue={p.caption}
                placeholder="تعليق"
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v === p.caption) return;
                  void updatePhotoCaption({ data: { id: p.id, caption: v } }).then(onChange);
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={dash.config.profilePhoto === p.file ? "primary" : "secondary"}
                  className="flex-1"
                  onClick={() => void saveSettings({ data: { profilePhoto: p.file } }).then(onChange)}
                >
                  صورة الملف
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="danger"
                  aria-label="حذف"
                  onClick={() =>
                    void deletePhoto({ data: { id: p.id } })
                      .then(onChange)
                      .then(() => toast.success("انحذفت"))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function PeopleView({ dash, onChange }: { dash: Dash; onChange: () => Promise<void> }) {
  const [selected, setSelected] = useState<string | null>(dash.users[0]?.id ?? WEB_ID);
  const [detail, setDetail] = useState<Thread | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!selected) return;
    void getThread({ data: { userId: selected } }).then((t) => {
      setDetail(t);
      setNotes(t.notes);
    });
  }, [selected]);

  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row md:p-8">
      <div className="w-full shrink-0 rounded-xl border border-line bg-surface md:w-72">
        {dash.users.length === 0 ? (
          <p className="p-4 text-sm text-muted">ما فيه أحد بعد. أول دردشة تنشئ الذاكرة.</p>
        ) : (
          dash.users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u.id)}
              className={cn(
                "flex w-full items-center justify-between border-b border-line px-4 py-3 text-right last:border-0",
                selected === u.id ? "bg-raised" : "hover:bg-raised/50",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">{u.name || u.id}</span>
                <span className="text-xs text-faint">{u.messages} رسالة · {u.facts} حقائق</span>
              </span>
              {u.subscribed ? <span className="text-xs text-ok">بريميوم</span> : null}
            </button>
          ))
        )}
      </div>
      {detail ? (
        <div className="min-w-0 flex-1 space-y-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{detail.name || detail.id}</p>
              <p className="text-xs text-muted">{detail.summary || "بدون ملخص بعد"}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void saveUserNotes({
                    data: { userId: detail.id, blocked: !detail.blocked },
                  }).then(onChange)
                }
              >
                {detail.blocked ? "فك الحظر" : "حظر"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void saveUserNotes({
                    data: { userId: detail.id, subscribed: !detail.subscribed },
                  }).then(onChange)
                }
              >
                {detail.subscribed ? "إلغاء بريميوم" : "بريميوم"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => void clearUserMemory({ data: { userId: detail.id } }).then(onChange)}
              >
                مسح الذاكرة
              </Button>
            </div>
          </div>
          <Field label="حقائق محفوظة">
            <ul className="space-y-1 text-sm text-muted">
              {detail.facts.length === 0 ? <li>لا يوجد</li> : detail.facts.map((f) => <li key={f}>— {f}</li>)}
            </ul>
          </Field>
          <Field label="ملاحظات المالك">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </Field>
          <Button
            type="button"
            onClick={() =>
              void saveUserNotes({ data: { userId: detail.id, notes } })
                .then(onChange)
                .then(() => toast.success("انحفظت الملاحظات"))
            }
          >
            حفظ الملاحظات
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">اختر مستخدماً.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium tabular-nums text-xl">{value}</p>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
