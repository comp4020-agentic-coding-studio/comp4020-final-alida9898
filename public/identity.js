// Who's here. A friend (guest link) entering someone's town chooses each visit: a
// name (≤ 12 code points) or anonymous; the last choice is remembered per world, so
// the next visit is one tap. The owner just has a name: asked once, when the town
// has none, and changeable (never blank) from the top bar. Shared by the town page
// and a shop opened straight from a link. While the card is open the page behind
// is visible but takes no input.
const TEXT = {
  zh: {
    titleOwner: "给你的小镇起个名字吧", titleRename: "给小镇换个名字", titleGuest: "这次用什么身份进来？",
    save: "保存", cancel: "算了",
    useName: "用名字", anon: "匿名", namePh: "你的名字", go: "进去",
    tooLong: "最多 12 个字", fail: "没存上，再试一次",
    you: (n) => `你：${n}`, youAnon: "你：匿名", change: "点一下换身份",
  },
  en: {
    titleOwner: "Name your town", titleRename: "Rename your town", titleGuest: "Who's visiting this time?",
    save: "Save", cancel: "Cancel",
    useName: "Use a name", anon: "Anonymous", namePh: "Your name", go: "Go in",
    tooLong: "12 characters at most", fail: "Didn't save — try again",
    you: (n) => `You: ${n}`, youAnon: "You: anonymous", change: "Tap to change who you are",
  },
};
export const NAME_MAX = 12;
const cps = (s) => [...s].length;
const keyFor = (role, world) => `town-identity-v1:${role}:${world}`; // only friends use it now
const doneKey = (world) => `town-identity-entered-v1:${world}`;

/** The remembered choice: { anon, name } or null. */
export function remembered(role, world) {
  try { const v = JSON.parse(localStorage.getItem(keyFor(role, world)) || "null"); if (v && typeof v.name === "string") return { anon: !!v.anon, name: v.name }; } catch {}
  return null;
}
function remember(role, world, choice) { try { localStorage.setItem(keyFor(role, world), JSON.stringify(choice)); } catch {} }
/** Already chose on this tab's visit (town → shop shouldn't ask twice). */
export function enteredThisVisit(world) { try { return sessionStorage.getItem(doneKey(world)) === "1"; } catch { return false; } }
function markEntered(world) { try { sessionStorage.setItem(doneKey(world), "1"); } catch {} }

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
 *         save?: (choice) => Promise<void> (throws on failure), onChoose: (choice) => void }
 * Owner: name only (no anonymous); first time no way out, a rename can be cancelled.
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
  const input = document.createElement("input"); input.className = "idcard-name"; input.type = "text"; input.autocomplete = "off"; input.maxLength = 24;
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
    input.classList.toggle("off", !rName.checked);
    const name = input.value.trim(), over = cps(name) > NAME_MAX;
    go.disabled = !(rAnon.checked || (rName.checked && name && !over));
    msg.textContent = rName.checked && over ? T().tooLong : msg.dataset.fail ? T().fail : "";
  }
  function render() {
    const t = T();
    title.textContent = isOwner ? (renaming ? t.titleRename : t.titleOwner) : t.titleGuest;
    sName.textContent = t.useName; sAnon.textContent = t.anon; input.placeholder = t.namePh;
    go.textContent = isOwner ? t.save : t.go; cancel.textContent = t.cancel;
    lName.hidden = lAnon.hidden = isOwner; cancel.hidden = !(isOwner && renaming);
    sync();
  }
  function open() {
    const owned = isOwner ? opts.ownerName?.() || "" : "";
    renaming = !!owned;
    const c = isOwner ? { anon: false, name: owned } : current;
    rName.checked = !c || !c.anon; rAnon.checked = !!c && c.anon;
    input.value = c && !c.anon ? c.name : "";
    delete msg.dataset.fail;
    scrim.hidden = false; render();
    (rName.checked ? input : go).focus();
    if (rName.checked) input.select();
  }
  const close = () => { scrim.hidden = true; };
  cancel.addEventListener("click", close);
  form.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOwner && renaming) close(); });
  rName.addEventListener("change", () => { sync(); input.focus(); });
  rAnon.addEventListener("change", sync);
  input.addEventListener("input", () => { delete msg.dataset.fail; sync(); });
  input.addEventListener("focus", () => { if (!rName.checked) { rName.checked = true; sync(); } });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); sync();
    if (go.disabled) return;
    const choice = rAnon.checked ? { anon: true, name: "" } : { anon: false, name: input.value.trim() };
    go.disabled = true;
    try { if (opts.save) await opts.save(choice); }
    catch { msg.dataset.fail = "1"; sync(); return; }
    if (!isOwner) { current = choice; remember(role, world, choice); markEntered(world); }
    scrim.hidden = true;
    opts.onChoose(choice);
  });
  return { open, render, isOpen: () => !scrim.hidden, choice: () => current };
}

/** A small "You: name" button for the top bar; tapping it reopens the card. */
export function whoLabel(lang, choice) {
  const t = TEXT[lang] || TEXT.zh;
  return { text: choice && !choice.anon && choice.name ? t.you(choice.name) : t.youAnon, title: t.change };
}
export { addStyle as identityStyle };
