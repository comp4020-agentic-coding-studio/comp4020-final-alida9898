// Who's here. Crit 10: friends are real accounts now, so a friend's identity is
// no longer ambiguous — their username already says who they are, and the server
// already knows (accountId) who placed what. So the old "pick a name or anonymous,
// every visit" forced card is gone; it's replaced with a quiet, optional toggle in
// the "who" button: appear to the owner as your username, or anonymous. Never
// forced, never a popup on entry — the design-principle exception for that
// ("a friend picks an identity each visit") belonged to the token-link era.
// The owner still gets exactly the old flow: name the town once (asked only
// while it has none), rename any time from the top bar.
const TEXT = {
  zh: {
    titleOwner: "给你的小镇起个名字吧", titleRename: "给小镇换个名字",
    titleGuest: "朋友帮忙时，你想怎么被认出来？",
    save: "保存", cancel: "算了",
    useName: (n) => `显示为 ${n}`, anon: "匿名", go: "好",
    tooLong: "最多 12 个字", fail: "没存上，再试一次",
    you: (n) => `你：${n}`, youAnon: "你：匿名", change: "点一下换一下",
  },
  en: {
    titleOwner: "Name your town", titleRename: "Rename your town",
    titleGuest: "How should the owner see you helped?",
    save: "Save", cancel: "Cancel",
    useName: (n) => `Show as ${n}`, anon: "Anonymous", go: "OK",
    tooLong: "12 characters at most", fail: "Didn't save — try again",
    you: (n) => `You: ${n}`, youAnon: "You: anonymous", change: "Tap to change",
  },
};
export const NAME_MAX = 12;
const cps = (s) => [...s].length;
const anonKey = (world) => `town-identity-anon-v1:${world}`;

/** A friend's remembered choice for this world: { anon } (default not anonymous). */
export function remembered(role, world) {
  if (role !== "guest") return null;
  try { return { anon: localStorage.getItem(anonKey(world)) === "1" }; } catch { return { anon: false }; }
}
function rememberAnon(world, anon) { try { localStorage.setItem(anonKey(world), anon ? "1" : "0"); } catch {} }
// kept for callers that still import it; a friend's identity is their account now,
// so there's nothing to re-ask on re-entry
export function enteredThisVisit() { return true; }

let styled = false;
function addStyle() {
  if (styled) return; styled = true;
  const s = document.createElement("style");
  s.textContent = `
.idcard-scrim { position: fixed; inset: 0; z-index: 60; background: rgba(74, 46, 31, 0.18); display: flex; align-items: flex-start; justify-content: center; padding: 18vh 16px 0; box-sizing: border-box; }
.idcard-scrim[hidden] { display: none; }
.idcard { width: min(20rem, 100%); box-sizing: border-box; background: var(--card); color: var(--ink); border: 2px dashed var(--stitch); border-radius: 18px; padding: 16px 18px 12px; box-shadow: 0 8px 28px rgba(74, 46, 31, 0.22); }
.idcard-title { margin: 0 0 10px; font-size: 1rem; line-height: 1.4; }
.idcard-opt { display: flex; align-items: center; gap: 0.5em; margin: 6px 0; cursor: pointer; font-size: 0.92rem; }
.idcard-opt input[type=radio] { accent-color: var(--stitch); margin: 0; }
.idcard-name { width: 100%; box-sizing: border-box; margin: 2px 0 4px; font: inherit; font-size: 0.95rem; color: var(--ink); background: var(--paper); border: 1.5px solid rgba(138, 90, 59, 0.4); border-radius: 8px; padding: 0.35em 0.5em; }
.idcard-name.off { opacity: 0.5; }
.idcard-msg { margin: 2px 0 0; min-height: 1em; font-size: 0.8rem; color: #b5452e; }
.idcard-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px; }
.idcard-cancel { font: inherit; font-size: 0.9rem; color: var(--ink-soft); background: transparent; border: 1.5px solid rgba(138, 90, 59, 0.35); border-radius: 8px; padding: 0.35em 0.9em; cursor: pointer; }
.idcard.owner .idcard-opt input[type=radio] { display: none; }
.idcard.owner .idcard-opt { cursor: default; }
.idcard-go { font: inherit; font-size: 0.9rem; color: var(--card); background: var(--stitch); border: 0; border-radius: 8px; padding: 0.35em 1.1em; cursor: pointer; }
.idcard-go:disabled { opacity: 0.45; cursor: not-allowed; }
`;
  document.head.append(s);
}

/**
 * opts: { world, role: "owner" | "guest", lang: () => "zh"|"en", ownerName?: () => string,
 *         username?: () => string (a friend's account username, for role "guest"),
 *         save?: (choice) => Promise<void> (throws on failure), onChoose: (choice) => void }
 * Owner: name only (no anonymous); first time no way out, a rename can be cancelled.
 * Friend: a plain two-way choice (show as their username, or anonymous) — never
 * forced open; opened only by tapping the "who" button.
 * Returns { open(), render(), isOpen(), choice() }.
 */
export function createIdentityCard(opts) {
  addStyle();
  const { world, role } = opts;
  const T = () => TEXT[opts.lang()] || TEXT.zh;
  const isOwner = role === "owner";
  let current = isOwner ? null : remembered(role, world);
  let renaming = false;
  const scrim = document.createElement("div"); scrim.className = "idcard-scrim"; scrim.hidden = true;
  const form = document.createElement("form"); form.className = "idcard" + (isOwner ? " owner" : ""); form.setAttribute("role", "dialog"); form.setAttribute("aria-modal", "true");
  const title = document.createElement("p"); title.className = "idcard-title"; title.id = "idcard-title";
  form.setAttribute("aria-labelledby", title.id);
  const radio = (value) => { const r = document.createElement("input"); r.type = "radio"; r.name = "idcard-who"; r.value = value; return r; };
  const rName = radio("name"), rAnon = radio("anon");
  const lName = document.createElement("label"); lName.className = "idcard-opt"; const sName = document.createElement("span"); lName.append(rName, sName);
  const input = document.createElement("input"); input.className = "idcard-name"; input.type = "text"; input.autocomplete = "off"; input.maxLength = 24; input.hidden = true;
  const lAnon = document.createElement("label"); lAnon.className = "idcard-opt"; const sAnon = document.createElement("span"); lAnon.append(rAnon, sAnon);
  const msg = document.createElement("p"); msg.className = "idcard-msg"; msg.setAttribute("role", "status");
  const actions = document.createElement("div"); actions.className = "idcard-actions";
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "idcard-cancel";
  const go = document.createElement("button"); go.type = "submit"; go.className = "idcard-go"; actions.append(cancel, go);
  form.append(title, lName, input, lAnon, msg, actions);
  scrim.append(form);
  document.body.append(scrim);
  // nothing behind the card reacts while it's open (keys included)
  const swallow = (e) => { if (!scrim.hidden && !form.contains(e.target)) { e.stopImmediatePropagation(); if (e.type !== "keydown" || e.key === "Tab") return; e.preventDefault(); } };
  for (const ev of ["keydown", "keyup"]) addEventListener(ev, swallow, true);
  scrim.addEventListener("pointerdown", (e) => { if (e.target === scrim) e.preventDefault(); });

  function sync() {
    if (isOwner) {
      const name = input.value.trim(), over = cps(name) > NAME_MAX;
      go.disabled = !name || over;
      msg.textContent = over ? T().tooLong : msg.dataset.fail ? T().fail : "";
    } else {
      go.disabled = false;
      msg.textContent = msg.dataset.fail ? T().fail : "";
    }
  }
  function render() {
    const t = T();
    title.textContent = isOwner ? (renaming ? t.titleRename : t.titleOwner) : t.titleGuest;
    sName.textContent = isOwner ? "" : t.useName(opts.username?.() || "");
    sAnon.textContent = t.anon;
    go.textContent = isOwner ? t.save : t.go; cancel.textContent = t.cancel;
    lName.hidden = isOwner; input.hidden = !isOwner; lAnon.hidden = isOwner;
    cancel.hidden = !(isOwner && renaming);
    sync();
  }
  function open() {
    if (isOwner) {
      const owned = opts.ownerName?.() || "";
      renaming = !!owned;
      input.value = owned;
    } else {
      const c = current || { anon: false };
      rName.checked = !c.anon; rAnon.checked = c.anon;
    }
    delete msg.dataset.fail;
    scrim.hidden = false; render();
    (isOwner ? input : go).focus();
    if (isOwner) input.select();
  }
  const close = () => { scrim.hidden = true; };
  cancel.addEventListener("click", close);
  form.addEventListener("keydown", (e) => { if (e.key === "Escape" && ((isOwner && renaming) || !isOwner)) close(); });
  input.addEventListener("input", () => { delete msg.dataset.fail; sync(); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); sync();
    if (go.disabled) return;
    const choice = isOwner ? { name: input.value.trim() } : { anon: rAnon.checked };
    go.disabled = true;
    try { if (opts.save) await opts.save(choice); }
    catch { msg.dataset.fail = "1"; sync(); go.disabled = false; return; }
    if (!isOwner) { current = choice; rememberAnon(world, choice.anon); }
    scrim.hidden = true;
    opts.onChoose(choice);
  });
  return { open, render, isOpen: () => !scrim.hidden, choice: () => current };
}

/** A small "You: name" button for the top bar; tapping it reopens the card. */
export function whoLabel(lang, choice, username) {
  const t = TEXT[lang] || TEXT.zh;
  const name = username || "";
  return { text: choice && choice.anon ? t.youAnon : t.you(name), title: t.change };
}
export { addStyle as identityStyle };
