// The friends button in the header and the small card under it: who's here, the invite link,
// copy, and the phone's share sheet where there is one. Shared by the town and shop pages.
// Opens only when the button is pressed; a click anywhere else, or Esc, closes it.
const PERSON = '<circle cx="9.5" cy="8.5" r="3.6"/><path d="M2.8 19.5c.6-3.6 3.3-5.6 6.7-5.6s6.1 2 6.7 5.6"/>';
const svg = (more) => `<svg viewBox="0 0 24 24" aria-hidden="true">${PERSON}${more}</svg>`;
// with a link to give out: a person and a plus. Without one (a friend visiting): two people, since it only says who's here
const AVATAR = svg('<path d="M18.5 7v6M15.5 10h6"/>');
const PEOPLE = svg('<path d="M15.6 5.2a3.6 3.6 0 0 1 0 6.6M18.2 14.6c1.7.9 2.8 2.6 3.1 4.9"/>');

/**
 * @param {HTMLButtonElement} btn the header button (its icon and label are filled in here)
 * @param {{ link: string | null, words: () => { label: string, title: string, note: string, copy: string, copied: string, share: string, presence?: string }, shareText: () => string }} o
 */
export function createInvite(btn, { link, words, shareText }) {
  btn.classList.add("tool");
  btn.innerHTML = `<span class="tool-ico">${link ? AVATAR : PEOPLE}</span><span class="tool-label"></span>`;
  btn.setAttribute("aria-expanded", "false");
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const card = el("div", "invite-pop");
  card.hidden = true;
  card.setAttribute("role", "dialog");
  card.classList.toggle("only-here", !link); // a friend visiting: just the one line saying who's here
  const here = el("p", "invite-here small"), title = el("p", "invite-title"), note = el("p", "invite-note small");
  const row = el("div", "invite-row");
  const input = Object.assign(el("input", "invite-link"), { type: "text", readOnly: true, value: link || "" });
  const copy = Object.assign(el("button", "invite-copy"), { type: "button" });
  const share = Object.assign(el("button", "invite-copy invite-share"), { type: "button" });
  share.hidden = typeof navigator.share !== "function";
  row.append(input, copy, share);
  card.append(here, title, note, row);
  // right after the button, so Tab goes from the button straight into the card (it is positioned against the bar)
  btn.after(card);

  let copiedAt = 0;
  function render() {
    const w = words();
    btn.querySelector(".tool-label").textContent = w.label;
    btn.title = btn.ariaLabel = [w.presence, link ? w.title : ""].filter(Boolean).join(" · ") || w.label;
    btn.classList.toggle("has-dot", !!w.presence);
    btn.hidden = !link && !w.presence;
    if (btn.hidden) close();
    here.hidden = !w.presence; here.textContent = w.presence || "";
    title.hidden = note.hidden = row.hidden = !link;
    title.textContent = w.title; note.textContent = w.note;
    card.ariaLabel = input.ariaLabel = link ? w.title : w.presence || w.label;
    copy.textContent = performance.now() - copiedAt < 1400 ? w.copied : w.copy;
    share.textContent = w.share;
  }
  const isOpen = () => !card.hidden;
  function close() { card.hidden = true; btn.setAttribute("aria-expanded", "false"); }
  function open() { render(); card.hidden = false; btn.setAttribute("aria-expanded", "true"); }
  btn.addEventListener("click", () => (isOpen() ? close() : open()));
  addEventListener("pointerdown", (e) => { if (isOpen() && !card.contains(e.target) && !btn.contains(e.target)) close(); }, true);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { e.stopImmediatePropagation(); close(); btn.focus(); } }, true);
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(shareText()); }
    catch { input.select(); try { document.execCommand("copy"); } catch {} }
    copiedAt = performance.now();
    render();
    setTimeout(render, 1450);
  });
  share.addEventListener("click", async () => { try { await navigator.share({ text: shareText() }); } catch {} });
  input.addEventListener("focus", () => input.select());
  render();
  return { render, close, isOpen };
}
