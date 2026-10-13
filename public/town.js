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
    preview: "预览", placed: (n) => `已放 ${n} 件`,
    names: { cafe: "咖啡馆", flower: "花店", book: "书店", bakery: "面包房" },
    bad: "这个小镇的链接好像不对，", badHome: "回到首页", missing: "没有找到这个小镇，",
    trouble: "小镇暂时没打开，过一会儿刷新试试。",
    seasonCard: (s) => `${s}到了，小镇换了颜色`, seasonClose: "点一下就关上",
  },
  en: {
    brand: "A Corner of Town", toggle: "中文", pageTitle: "A Corner of Town · My town",
    loading: "Shaping the town out of clay…",
    owner: "This is your town", guestTitle: "You're helping a friend's town",
    leftToday: (n) => `${n} left today`, townsDone: "You've helped 3 towns today — come back tomorrow",
    invite: "Invite a friend to help", inviteNote: "Send this link to a friend: they can place up to 8 things a day for you.",
    copy: "Copy link", copied: "Copied",
    preview: "Preview", placed: (n) => `${n} placed`,
    names: { cafe: "Café", flower: "Flower shop", book: "Bookshop", bakery: "Bakery" },
    bad: "This town link doesn't look right — ", badHome: "go home", missing: "This town couldn't be found — ",
    trouble: "The town didn't open just now. Try refreshing in a moment.",
    seasonCard: (s) => `${s} is here — the town has new colours`, seasonClose: "Tap to close",
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
    return { type, label: t.names[type], tag: type === "cafe" ? "" : t.preview, meta: s ? t.placed(s.placed) : "" };
  });
}
const street = await createStreet($("street"), {
  season, lang, shops: streetShops(),
  // keep the shops clear of the invite / guest card along the top
  padTop: () => Math.max(...["invite-card", "guest-card"].map((id) => { const el = $(id); return el.hidden ? 0 : el.offsetTop + el.offsetHeight; })),
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
