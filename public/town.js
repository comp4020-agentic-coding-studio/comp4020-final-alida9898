// The town: one person's street of four shops (contract: server/SHOPS.md, Worlds).
// `/w/<world>?t=<token>` — the owner token places freely and can invite; a guest
// token helps with a daily quota. Click a shop to go into it.
import { createStreet } from "./town/street.js";
import { SEASONS, SEASON_NAME, SEEN_KEY, currentSeason } from "./shops/season.js";

const TEXT = {
  zh: {
    brand: "小镇一角", toggle: "EN", pageTitle: "小镇一角 · 我的小镇",
    loading: "正在把小镇捏出来……",
    owner: "这是你的小镇", guestTitle: "你在帮朋友拼小镇",
    leftToday: (n) => `今天还能帮 ${n} 件`, townsDone: "今天已经帮了 3 个小镇啦，明天再来",
    invite: "邀请朋友来帮忙", inviteNote: "把这个链接发给朋友：他们每天最多能帮你放 8 件东西。",
    copy: "复制链接", copied: "已复制",
    preview: "预览", placed: (n) => `已放 ${n} 件 / ${n} placed`,
    names: { cafe: "咖啡馆", flower: "花店", book: "书店", bakery: "面包房" },
    bad: "这个小镇的链接好像不对，", badHome: "回到首页", missing: "没有找到这个小镇，",
    trouble: "小镇暂时没打开，过一会儿刷新试试。",
    seasonCard: (s) => `${s}到了，小镇换了颜色`, seasonClose: "点一下就关上",
    boardTitle: "留言板", boardDefault: "欢迎来我的小镇，随便帮我摆几件吧～", boardEmptyOwner: "点这里给朋友留句话",
    boardEdit: "写一句给朋友的话", boardSave: "贴上去", boardClear: "撕掉", boardCancel: "算了",
    boardSaving: "正在贴……", boardFail: "没贴上，再试一次", boardTooLong: "最多 40 个字",
    presets: ["想请你帮我把甜点柜摆满～", "二楼读书角还空着，来坐坐吧", "院子里的花还没种，帮我一把？", "随便摆，摆哪件都好 ☕", "今天有点忙，谢谢你来帮忙！"],
    flagGuest: "朋友想请你帮这家店", flagOwner: "你请朋友帮这家店",
  },
  en: {
    brand: "A Corner of Town", toggle: "中文", pageTitle: "A Corner of Town · My town",
    loading: "Shaping the town out of clay…",
    owner: "This is your town", guestTitle: "You're helping a friend's town",
    leftToday: (n) => `${n} left today`, townsDone: "You've helped 3 towns today — come back tomorrow",
    invite: "Invite a friend to help", inviteNote: "Send this link to a friend: they can place up to 8 things a day for you.",
    copy: "Copy link", copied: "Copied",
    preview: "Preview", placed: (n) => `${n} placed / 已放 ${n} 件`,
    names: { cafe: "Café", flower: "Flower shop", book: "Bookshop", bakery: "Bakery" },
    bad: "This town link doesn't look right — ", badHome: "go home", missing: "This town couldn't be found — ",
    trouble: "The town didn't open just now. Try refreshing in a moment.",
    seasonCard: (s) => `${s} is here — the town has new colours`, seasonClose: "Tap to close",
    boardTitle: "Noticeboard", boardDefault: "Welcome to my town — place anything you like!", boardEmptyOwner: "Tap to leave your friends a note",
    boardEdit: "A note for your friends", boardSave: "Pin it", boardClear: "Take down", boardCancel: "Cancel",
    boardSaving: "Pinning…", boardFail: "Didn't pin — try again", boardTooLong: "40 characters at most",
    presets: ["Could you help fill my pastry case?", "The upstairs reading nook is still empty — come sit", "The yard's flowers aren't planted yet — help me out?", "Place anything you like ☕", "Busy day — thanks for dropping by!"],
    flagGuest: "Your friend asked for help here", flagOwner: "You asked friends to help here",
  },
};
const LANG_KEY = "lang", HELPER_KEY = "town-helper-v1";
let lang = "zh";
try { lang = localStorage.getItem(LANG_KEY) === "en" ? "en" : "zh"; } catch {}
const T = () => TEXT[lang];
const $ = (id) => document.getElementById(id);

// ---- who we are ------------------------------------------------------------
const world = (location.pathname.match(/^\/w\/([\w-]+)\/?$/) || [])[1];
const token = new URLSearchParams(location.search).get("t") || "";
/** A stable per-browser helper id: quotas are counted per helper. */
function helperId() {
  const make = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
  try {
    let id = localStorage.getItem(HELPER_KEY);
    if (!id || !/^[\w-]{1,64}$/.test(id)) { id = make(); localStorage.setItem(HELPER_KEY, id); }
    return id;
  } catch { return make(); }
}
const helper = helperId(); // the play page reads the same key

let data = null, failure = null;
const seasonP = currentSeason();
if (!world || !token) failure = "bad";
else {
  try {
    const res = await fetch(`/api/worlds/${world}?t=${encodeURIComponent(token)}&helper=${encodeURIComponent(helper)}`);
    if (res.ok) data = await res.json();
    else failure = res.status === 404 ? "missing" : res.status === 403 || res.status === 400 ? "bad" : "trouble";
  } catch { failure = "trouble"; }
}
// `?season=` wins (dev), then the world's own season, then /api/season
const qSeason = new URLSearchParams(location.search).get("season");
const season = SEASONS.includes(qSeason) ? qSeason : SEASONS.includes(data?.season) ? data.season : await seasonP;

// ---- the street (shared with the landing page: town/street.js) ---------------
const TYPES = ["cafe", "flower", "book", "bakery"];
const shopHref = (type) => `/w/${world}/${type}?t=${encodeURIComponent(token)}${qSeason ? `&season=${qSeason}` : ""}`;
function streetShops() {
  if (failure) return [];
  const t = T();
  return TYPES.map((type) => {
    const s = data?.shops?.find((x) => x.type === type);
    const flag = s?.requests?.length ? (data.role === "guest" ? t.flagGuest : t.flagOwner) : "";
    return { type, label: t.names[type], meta: s ? t.placed(s.placed) : "", flag };
  });
}
const street = await createStreet($("street"), {
  season, lang, shops: streetShops(),
  // keep the shops clear of the invite / guest card along the top
  padLeft: () => innerWidth / innerHeight >= 1.2 ? Math.max(...["invite-card", "guest-card"].map((id) => { const el = $(id); return el.hidden ? 0 : el.getBoundingClientRect().right; })) : 0,
  padTop: () => innerWidth / innerHeight >= 1.2 ? 0 : Math.max(...["invite-card", "guest-card", "board"].map((id) => { const el = $(id); return el.hidden ? 0 : el.offsetTop + el.offsetHeight; })),
  onPick: (type) => { if (!failure && world && token) location.href = shopHref(type); },
});

// ---- words ------------------------------------------------------------------
const guest = data?.role === "guest";
const inviteLink = data?.guestToken ? `${location.origin}/w/${world}?t=${data.guestToken}` : "";
function render() {
  const t = T();
  document.documentElement.lang = lang;
  document.title = t.pageTitle;
  $("brand").textContent = t.brand;
  $("lang-toggle").textContent = t.toggle;
  document.querySelector(".tstage").classList.toggle("failed", !!failure);
  const st = $("status");
  st.replaceChildren();
  if (failure) {
    st.append(failure === "trouble" ? t.trouble : t[failure]);
    if (failure !== "trouble") { const a = document.createElement("a"); a.href = "/"; a.textContent = t.badHome; st.append(a); }
  }
  street.setShops(streetShops());
  street.setLang(lang);
  $("role-line").textContent = data ? (guest ? "" : t.owner) : "";
  $("guest-card").hidden = !guest;
  if (guest) {
    const q = data.quota || { left: 0, worldsLeft: 0 };
    $("guest-title").textContent = t.guestTitle;
    $("guest-left").textContent = q.left <= 0 && q.worldsLeft <= 0 ? t.townsDone : t.leftToday(Math.max(0, q.left));
  }
  $("invite-card").hidden = !inviteLink;
  if (inviteLink) {
    $("invite-title").textContent = t.invite;
    $("invite-note").textContent = t.inviteNote;
    $("invite-link").value = inviteLink;
    if ($("invite-copy").textContent !== t.copied) $("invite-copy").textContent = t.copy;
  }
  renderBoard();
  if (!$("season-card").hidden) {
    $("season-title").textContent = t.seasonCard(SEASON_NAME[season][lang]);
    $("season-close").textContent = t.seasonClose;
  }
}
$("lang-toggle").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  render();
});
$("invite-copy").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  try { await navigator.clipboard.writeText(inviteLink); }
  catch { $("invite-link").select(); try { document.execCommand("copy"); } catch {} }
  btn.textContent = T().copied;
  setTimeout(() => { btn.textContent = T().copy; }, 1400);
});
$("invite-link").addEventListener("focus", (e) => e.currentTarget.select());

// ---- the noticeboard: one owner note (≤ 40 code points); guests read it --------
const MAX_NOTE = 40;
const cps = (str) => [...str].length;
let note = data?.note || "";
function renderBoard() {
  const t = T(), board = $("board");
  board.hidden = !data;
  if (!data) return;
  $("board-title").textContent = t.boardTitle;
  const card = $("board-note");
  card.textContent = note || (guest ? t.boardDefault : t.boardEmptyOwner);
  card.classList.toggle("empty", !note);
  board.classList.toggle("owner", !guest);
  if (guest) { board.removeAttribute("role"); board.removeAttribute("tabindex"); }
  else { board.setAttribute("role", "button"); board.tabIndex = 0; board.setAttribute("aria-label", t.boardEdit); }
  placeBoard();
  const ed = $("board-editor");
  if (!ed.hidden) {
    $("board-edit-title").textContent = t.boardEdit;
    $("board-save").textContent = t.boardSave; $("board-clear").textContent = t.boardClear; $("board-cancel").textContent = t.boardCancel;
    const pre = $("board-presets"); pre.replaceChildren();
    for (const p of t.presets) {
      const b = document.createElement("button"); b.type = "button"; b.className = "nboard-preset"; b.textContent = p;
      b.addEventListener("click", () => { $("board-input").value = [...p].slice(0, MAX_NOTE).join(""); countNote(); $("board-input").focus(); });
      pre.append(b);
    }
    countNote();
  }
}
/** Phone width: the board stacks under whichever top card is showing. */
function placeBoard() {
  const top = ["invite-card", "guest-card"].map($).find((el) => !el.hidden);
  $("board").style.top = innerWidth <= 700 && top ? `${top.offsetTop + top.offsetHeight + 10}px` : "";
}
addEventListener("resize", placeBoard);
function countNote() {
  const n = cps($("board-input").value), over = n > MAX_NOTE;
  $("board-count").textContent = `${n} / ${MAX_NOTE}`;
  $("board-count").classList.toggle("over", over);
  $("board-save").disabled = over;
  $("board-msg").textContent = over ? T().boardTooLong : "";
}
function openEditor() {
  if (guest || !data) return;
  $("board-editor").hidden = false; $("board-input").value = note; renderBoard(); $("board-input").focus();
}
const closeEditor = () => { $("board-editor").hidden = true; $("board-msg").textContent = ""; };
async function saveNote(text) {
  if (cps(text) > MAX_NOTE) return countNote();
  $("board-msg").textContent = T().boardSaving;
  try {
    const res = await fetch(`/api/worlds/${world}/note`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, text }) });
    if (!res.ok) throw new Error(String(res.status));
    note = (await res.json()).note || "";
    closeEditor(); renderBoard();
  } catch { $("board-msg").textContent = T().boardFail; }
}
$("board").addEventListener("click", (e) => { if (!e.target.closest("#board-editor")) openEditor(); });
$("board").addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === $("board")) { e.preventDefault(); openEditor(); } });
$("board-input").addEventListener("input", countNote);
$("board-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); saveNote($("board-input").value.trim()); } if (e.key === "Escape") closeEditor(); });
$("board-save").addEventListener("click", () => saveNote($("board-input").value.trim()));
$("board-clear").addEventListener("click", () => saveNote(""));
$("board-cancel").addEventListener("click", closeEditor);

// ---- a new season: the same "seen" key as the play page. The town only reads it
// (the café's card, with its item count, still shows once inside); here it shows
// once per tab session so it doesn't nag.
let lastSeen = null;
try { lastSeen = localStorage.getItem(SEEN_KEY); } catch {}
let shownHere = false;
try { shownHere = sessionStorage.getItem("town-season-shown") === season; } catch {}
if (data && lastSeen && lastSeen !== season && !shownHere) {
  $("season-card").hidden = false;
  try { sessionStorage.setItem("town-season-shown", season); } catch {}
  const close = () => { $("season-card").classList.add("fading"); setTimeout(() => ($("season-card").hidden = true), 800); };
  $("season-card").addEventListener("click", close);
}
render();
street.reframe();
