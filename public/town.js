// The town: one person's street of four shops (contract: server/SHOPS.md, Worlds).
// `/w/<world>?t=<token>` — the owner token places freely and can invite; a guest
// token helps with a daily quota. Click a plot to go into that shop.
import * as THREE from "three";
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

// ---- the street (Three.js, clay blocks) -------------------------------------
const LOOK = {
  // grass matches the yard scenery (shops/cafe/yard/scenery.js)
  spring: { grass: 0xa9c07e, crown: 0x9cbf73, blossom: 0xf2b8c6, sky: "#f6ecdc", light: 0xffe1ea },
  summer: { grass: 0x8fae68, crown: 0x6f9a52, blossom: null, sky: "#f4ecd2", light: 0xfff1c4 },
  autumn: { grass: 0xb5b075, crown: 0xd9822f, blossom: 0xc8694a, sky: "#f3e3cf", light: 0xffc890 },
  winter: { grass: 0xbcc2a8, crown: 0xe9ebe6, blossom: null, sky: "#eef0f2", light: 0xdce8ff },
};
const look = LOOK[season] || LOOK.spring;
const SHOP_LOOK = {
  cafe: { wall: 0xe8c9a0, roof: 0x9b5a3c, awning: 0xc96f4a, w: 3.0, h: 2.6 },
  flower: { wall: 0xf1d6d3, roof: 0x8a9a6a, awning: 0xe39bb0, w: 2.4, h: 2.0 },
  book: { wall: 0xd6c6a6, roof: 0x5e6f8a, awning: 0x7d8fb0, w: 2.6, h: 3.0 },
  bakery: { wall: 0xf3e2bf, roof: 0xb7743f, awning: 0xe0b45a, w: 2.6, h: 2.3 },
};
const TYPES = ["cafe", "flower", "book", "bakery"];
const canvas = $("street");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true;
document.querySelector(".tstage").style.background = look.sky;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7a66, 1.6));
const sun = new THREE.DirectionalLight(look.light, 1.6);
sun.position.set(-6, 12, 9); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10 });
scene.add(sun);
const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92 });
function box(w, h, d, c, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m;
}
// ground, pavement, road
box(26, 0.3, 12, look.grass, 0, -0.3, 0);
box(26, 0.06, 1.6, 0xe6dccb, 0, 0, 2.4);
box(26, 0.04, 2.6, 0xb9ad9c, 0, 0, 4.5);
const SPACING = 4.2, xs = TYPES.map((_, i) => (i - 1.5) * SPACING);
const plotTops = [];
TYPES.forEach((type, i) => {
  const s = SHOP_LOOK[type], x = xs[i];
  box(3.6, 0.08, 3.4, 0xd9cdb5, x, 0, 0); // the plot
  box(s.w, s.h, 2.2, s.wall, x, 0.08, -0.2);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(s.w * 0.78, 1.1, 4, 1), mat(s.roof));
  roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.78);
  roof.position.set(x, 0.08 + s.h + 0.55, -0.2); roof.castShadow = true; scene.add(roof);
  box(0.62, 1.1, 0.06, 0x7a5236, x - s.w * 0.22, 0.08, 0.92); // door
  box(0.8, 0.6, 0.06, 0xcfe0e6, x + s.w * 0.2, 0.7, 0.92); // window
  const aw = box(s.w * 0.9, 0.14, 0.5, s.awning, x, 0.08 + Math.min(1.5, s.h * 0.62), 1.1);
  aw.rotation.x = 0.25;
  plotTops.push(new THREE.Vector3(x, 0, 1.9));
});
// trees between and at the ends, tinted by season
[-2, -1, 0, 1, 2].forEach((k) => {
  const tx = k * SPACING, z = -1.7;
  box(0.22, 1.0, 0.22, 0x8a6446, tx, 0, z);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), mat(look.crown));
  crown.position.set(tx, 1.7, z); crown.castShadow = true; scene.add(crown);
  if (look.blossom) for (let j = 0; j < 6; j++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(look.blossom));
    const a = j * 1.05; b.position.set(tx + Math.cos(a) * 0.7, 1.6 + Math.sin(j) * 0.4, z + Math.sin(a) * 0.7); scene.add(b);
  }
  if (season === "winter") { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), mat(0xfaf8f4)); cap.position.set(tx, 2.05, z); scene.add(cap); }
});
if (season === "winter") for (let i = 0; i < 40; i++) box(0.5 + Math.random(), 0.04, 0.4 + Math.random() * 0.6, 0xf6f4ef, (Math.random() - 0.5) * 24, 0, -5 + Math.random() * 6.5);
if (season === "autumn") for (let i = 0; i < 50; i++) box(0.18, 0.02, 0.14, [0xd9822f, 0xc8694a, 0xe0a23a][i % 3], (Math.random() - 0.5) * 24, 0, -5 + Math.random() * 6.5);

function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / Math.max(1, r.height);
  // fit the whole street across the width; on a phone, step back
  const dist = Math.max(17, 17 * (1.6 / camera.aspect));
  camera.position.set(0, dist * 0.55, dist);
  camera.lookAt(0, 0.6, 0);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  placeLabels(r);
}
addEventListener("resize", resize);

// ---- plots: labels that link into each shop ----------------------------------
const plotEls = TYPES.map((type) => {
  const a = document.createElement("a"); a.className = "plot"; a.dataset.type = type;
  if (world && token) a.href = `/w/${world}/${type}?t=${encodeURIComponent(token)}${qSeason ? `&season=${qSeason}` : ""}`;
  $("plots").append(a); return a;
});
function placeLabels(r) {
  plotEls.forEach((el, i) => {
    const p = plotTops[i].clone().project(camera);
    el.style.left = `${(p.x + 1) / 2 * r.width}px`;
    el.style.top = `${(1 - p.y) / 2 * r.height}px`;
  });
}
// clicking a building also goes in
const ray = new THREE.Raycaster();
canvas.addEventListener("click", (e) => {
  if (failure) return;
  const r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = ray.intersectObjects(scene.children)[0];
  if (!hit || hit.point.z > 1.8 || hit.point.y < 0.05) return;
  const i = xs.findIndex((x) => Math.abs(hit.point.x - x) < 1.8);
  if (i >= 0) location.href = plotEls[i].href;
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
  const st = $("status");
  st.replaceChildren();
  if (failure) {
    st.append(failure === "trouble" ? t.trouble : t[failure]);
    if (failure !== "trouble") { const a = document.createElement("a"); a.href = "/"; a.textContent = t.badHome; st.append(a); }
  }
  plotEls.forEach((el, i) => {
    const type = TYPES[i], s = data?.shops?.find((x) => x.type === type);
    el.hidden = !!failure;
    el.replaceChildren();
    const n = document.createElement("span"); n.className = "pname"; n.textContent = t.names[type];
    if (type !== "cafe") { const tag = document.createElement("span"); tag.className = "ptag"; tag.textContent = t.preview; n.append(tag); }
    el.append(n);
    if (s) { const m = document.createElement("span"); m.className = "pmeta"; m.textContent = t.placed(s.placed); el.append(m); }
  });
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
resize();
