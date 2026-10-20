// The friends button in the header for world pages (town.js, play.js world shops):
// replaces the old "copy this guest link" invite with send/accept friend requests.
// Mutual consent (server/db.ts sendFriendRequest): sending to someone who already
// asked you auto-accepts. No alert()/confirm() — everything inline in the popover,
// same dashed-card language as invite.js's card.
import { api } from "/auth.js";

const PERSON = '<circle cx="9.5" cy="8.5" r="3.6"/><path d="M2.8 19.5c.6-3.6 3.3-5.6 6.7-5.6s6.1 2 6.7 5.6"/>';
const svg = (more) => `<svg viewBox="0 0 24 24" aria-hidden="true">${PERSON}${more}</svg>`;
const PLUS = svg('<path d="M18.5 7v6M15.5 10h6"/>');
const DOT = svg('<circle cx="18" cy="7.5" r="2.6" fill="currentColor" stroke="none"/>');

const TEXT = {
  zh: {
    label: "好友", title: "好友",
    placeholder: "对方的用户名", send: "发送请求",
    friends: "好友", incoming: "待处理的请求", outgoing: "已发送，等待对方同意",
    accept: "同意", remove: "删除", cancel: "取消",
    none: "还没有好友。输入用户名，发一条请求吧。",
    errSelf: "不能加自己为好友", errAlready: "已经发过请求了，或者已经是好友",
    errUnknown: "没有这个用户名", errNetwork: "没连上，再试一次",
    sent: "请求已发送", accepted: "现在是好友啦",
  },
  en: {
    label: "Friends", title: "Friends",
    placeholder: "Their username", send: "Send request",
    friends: "Friends", incoming: "Incoming requests", outgoing: "Sent, waiting for them to accept",
    accept: "Accept", remove: "Remove", cancel: "Cancel",
    none: "No friends yet. Enter a username to send a request.",
    errSelf: "You can't friend-request yourself", errAlready: "Already requested, or already friends",
    errUnknown: "No account with that username", errNetwork: "Couldn't connect — try again",
    sent: "Request sent", accepted: "You're friends now",
  },
};

/**
 * @param {HTMLButtonElement} btn header button
 * @param {{ lang: () => "zh"|"en" }} opts
 * Returns { render(), close(), isOpen() }. `render()` also refreshes the list's
 * "someone wants to be friends" dot; call it after lang changes or on an interval
 * isn't needed — the page itself re-renders on its own events.
 */
export function createFriendsBar(btn, opts) {
  const T = () => TEXT[opts.lang()] || TEXT.zh;
  btn.classList.add("tool");
  btn.innerHTML = `<span class="tool-ico">${PLUS}</span><span class="tool-label"></span>`;
  btn.setAttribute("aria-expanded", "false");
  btn.hidden = false;
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const card = el("div", "invite-pop acctpop"); card.hidden = true; card.setAttribute("role", "dialog");
  const title = el("p", "invite-title");
  const form = el("form", "freq-row");
  const input = Object.assign(el("input"), { type: "text", autocomplete: "off", maxLength: 24 });
  const sendBtn = Object.assign(el("button"), { type: "submit" });
  form.append(input, sendBtn);
  const msg = el("p", "authcard-msg"); msg.setAttribute("role", "status");
  const hIncoming = el("p", "small"), listIncoming = el("ul", "flist");
  const hOutgoing = el("p", "small"), listOutgoing = el("ul", "flist");
  const hFriends = el("p", "small"), listFriends = el("ul", "flist");
  const empty = el("p", "flist-empty small");
  card.append(title, form, msg, hIncoming, listIncoming, hOutgoing, listOutgoing, hFriends, listFriends, empty);
  // hang the card off the toolbar, not inside ☰'s list, so folding the list away on phones doesn't hide it
  (btn.closest(".bar-tools") || btn.parentNode).append(card);

  let data = { friends: [], incoming: [], outgoing: [] };
  // `background`: a live (SSE) re-fetch. If the lists changed, the last status line
  // ("Request sent", "You're friends now") may no longer be true, so clear it.
  // The input is never touched.
  async function refresh(background) {
    const r = await api.friends();
    if (r) {
      if (background === true && JSON.stringify(r) !== JSON.stringify(data)) say("");
      data = r;
    }
    render();
  }
  function rows(list, kind) {
    return list.map((f) => {
      const li = el("li");
      const name = el("span", "fname"); name.textContent = name.title = f.username;
      li.append(name);
      if (kind === "incoming") {
        const a = Object.assign(el("button"), { type: "button", textContent: T().accept });
        a.addEventListener("click", async () => { await api.friendAccept(f.id); say(T().accepted, true); await refresh(); });
        const d = Object.assign(el("button"), { type: "button", textContent: T().remove });
        d.addEventListener("click", async () => { await api.friendRemove(f.id); await refresh(); });
        li.append(a, d);
      } else if (kind === "outgoing") {
        const p = el("span", "fpending"); p.textContent = "";
        const d = Object.assign(el("button"), { type: "button", textContent: T().cancel });
        d.addEventListener("click", async () => { await api.friendRemove(f.id); await refresh(); });
        li.append(d);
      } else {
        const d = Object.assign(el("button"), { type: "button", textContent: T().remove });
        d.addEventListener("click", async () => { await api.friendRemove(f.id); await refresh(); });
        li.append(d);
      }
      return li;
    });
  }
  function render() {
    const t = T();
    btn.querySelector(".tool-label").textContent = t.label;
    btn.title = btn.ariaLabel = t.title;
    btn.classList.toggle("has-dot", data.incoming.length > 0);
    // phones fold the Friends button into ☰ (barmenu.js); echo the dot there so it still shows
    document.getElementById("menu-btn")?.classList.toggle("has-dot", data.incoming.length > 0);
    title.textContent = t.title;
    input.placeholder = t.placeholder; sendBtn.textContent = t.send;
    hIncoming.textContent = t.incoming; hOutgoing.textContent = t.outgoing; hFriends.textContent = t.friends;
    listIncoming.replaceChildren(...rows(data.incoming, "incoming"));
    listOutgoing.replaceChildren(...rows(data.outgoing, "outgoing"));
    listFriends.replaceChildren(...rows(data.friends, "friends"));
    hIncoming.hidden = listIncoming.hidden = data.incoming.length === 0;
    hOutgoing.hidden = listOutgoing.hidden = data.outgoing.length === 0;
    hFriends.hidden = listFriends.hidden = data.friends.length === 0;
    empty.hidden = data.friends.length + data.incoming.length + data.outgoing.length > 0;
    empty.textContent = t.none;
  }
  // success reads in normal ink; only errors are red (.authcard-msg default)
  function say(text, ok) { msg.textContent = text; msg.classList.toggle("ok", !!ok); }
  const isOpen = () => !card.hidden;
  // closing forgets the half-typed name and the last status line, so the header
  // button always reopens clean (the "Add as friend" prefill sets it again)
  function close() { card.hidden = true; btn.setAttribute("aria-expanded", "false"); input.value = ""; say(""); }
  // `prefillUsername`: only the "Add as friend" view-only shortcut passes this
  // (town.js/play.js), so the header button itself still always opens to an
  // empty input, same as before.
  async function open(prefillUsername) {
    card.hidden = false; btn.setAttribute("aria-expanded", "true");
    if (prefillUsername) input.value = prefillUsername;
    await refresh();
  }
  btn.addEventListener("click", () => { if (!isOpen() && document.querySelector(".idcard-scrim:not([hidden]), .authcard-scrim:not([hidden])")) return; isOpen() ? close() : open(); });
  addEventListener("pointerdown", (e) => { if (isOpen() && !card.contains(e.target) && !btn.contains(e.target)) close(); }, true);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { e.stopImmediatePropagation(); close(); btn.focus(); } }, true);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = input.value.trim();
    if (!username) return;
    const t = T();
    const r = await api.friendRequest(username);
    if (!r.ok) {
      say(r.data?.error === "self" ? t.errSelf : r.data?.error === "already" ? t.errAlready
        : r.status === 404 ? t.errUnknown : t.errNetwork);
      return;
    }
    say(r.data.status === "friends" ? t.accepted : t.sent, true);
    input.value = "";
    await refresh();
  });
  // Live updates: the server pings `friends` on /api/friends/stream whenever a
  // relationship involving this account changes; we just re-fetch. refresh()
  // re-renders the lists and dot, and clears a status line the change made stale; the input is left alone.
  // No toast/sound: the red dot is the whole notification. EventSource reconnects
  // by itself; a 401 (CLOSED) or repeated failures stop it quietly.
  let stream = null;
  function stop() { if (stream) { stream.close(); stream = null; } }
  if (opts.live && typeof EventSource === "function") {
    let fails = 0;
    stream = new EventSource("/api/friends/stream");
    stream.addEventListener("friends", () => { refresh(true); });
    stream.addEventListener("open", () => { fails = 0; });
    stream.addEventListener("error", () => {
      if (!stream) return;
      if (stream.readyState === EventSource.CLOSED || ++fails >= 5) stop();
    });
    addEventListener("pagehide", stop);
  }
  render();
  if (opts.live) refresh();
  return { render, open, close, isOpen, refresh, stop };
}
