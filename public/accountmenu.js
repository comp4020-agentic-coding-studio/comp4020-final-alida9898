// The small "who's signed in" popover in the header: one line with the username
// and a log-out button. Used on town.js and play.js (world pages only — the
// standalone shop link keeps its own presence-only button, see invite.js).
import { api } from "/auth.js";

const PERSON = '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 19.5c.8-3.6 3.6-5.6 7.2-5.6s6.4 2 7.2 5.6"/>';

const TEXT = {
  zh: { title: "账号", loggedInAs: (n) => `已登录：${n}`, logout: "退出登录" },
  en: { title: "Account", loggedInAs: (n) => `Logged in as ${n}`, logout: "Log out" },
};

/**
 * @param {HTMLButtonElement} btn header button
 * @param {{ lang: () => "zh"|"en", username: () => string, onLogout: () => void }} opts
 */
export function createAccountMenu(btn, opts) {
  const T = () => TEXT[opts.lang()] || TEXT.zh;
  btn.classList.add("tool");
  btn.innerHTML = `<span class="tool-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${PERSON}</svg></span><span class="tool-label"></span>`;
  btn.setAttribute("aria-expanded", "false");
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const card = el("div", "invite-pop acctpop"); card.hidden = true; card.setAttribute("role", "dialog");
  const who = el("p", "acctpop-who");
  const actions = el("div", "acctpop-actions");
  const logout = Object.assign(el("button", "acctpop-btn"), { type: "button" });
  actions.append(logout);
  card.append(who, actions);
  // hang the card off the toolbar, not inside ☰'s list, so folding the list away on phones doesn't hide it
  (btn.closest(".bar-tools") || btn.parentNode).append(card);

  function render() {
    const t = T();
    btn.hidden = !opts.username();
    btn.querySelector(".tool-label").textContent = opts.username();
    btn.title = btn.ariaLabel = t.title;
    who.textContent = t.loggedInAs(opts.username());
    logout.textContent = t.logout;
  }
  const isOpen = () => !card.hidden;
  function close() { card.hidden = true; btn.setAttribute("aria-expanded", "false"); }
  function open() { render(); card.hidden = false; btn.setAttribute("aria-expanded", "true"); }
  btn.addEventListener("click", () => { if (!isOpen() && document.querySelector(".idcard-scrim:not([hidden]), .authcard-scrim:not([hidden])")) return; isOpen() ? close() : open(); });
  addEventListener("pointerdown", (e) => { if (isOpen() && !card.contains(e.target) && !btn.contains(e.target)) close(); }, true);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { e.stopImmediatePropagation(); close(); btn.focus(); } }, true);
  logout.addEventListener("click", async () => { await api.logout(); close(); opts.onLogout(); });
  render();
  return { render, close, isOpen };
}
