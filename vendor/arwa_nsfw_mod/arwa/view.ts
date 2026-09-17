export type StudioView = "chat" | "photos" | "panel" | "people";

let memory: StudioView | null = null;

const LAST_KEY = "arwa-view";

export function readLastView(): StudioView {
  if (memory) return memory;
  try {
    const v = sessionStorage.getItem(LAST_KEY);
    if (v === "photos" || v === "panel" || v === "people" || v === "chat") {
      memory = v;
      return v;
    }
  } catch {
    /* */
  }
  return "chat";
}

export function writeLastView(view: StudioView) {
  memory = view;
  try {
    sessionStorage.setItem(LAST_KEY, view);
  } catch {
    /* */
  }
}
