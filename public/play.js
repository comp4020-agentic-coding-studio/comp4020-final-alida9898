// Shared placement page: zoom building → storey → zone → focus item,
// drag each thing from the tray onto its one faint outline. No score, no timer.
// Everyone holding the shop link builds the same café; progress lives on the
// server (contract: server/SHOPS.md, client side: cafe/net.js).
// Items contract: public/cafe/README.md. Building + lights: cafe/build.js.
import * as THREE from "three";
import { STOREY_H, levelY } from "./cafe/zones.js";
import { addLights, buildShop, wallAttached } from "./cafe/build.js";
import { collectItems, devTagIfEmpty } from "./cafe/items.js";
import { LAST_SHOP_KEY, clientId, connect, loadShop, shopFromUrl, shopUrl, worldFromUrl, loadWorldShop } from "./cafe/net.js";
import { loadShopType, typeFromUrl } from "./shops/index.js";
import { currentSeason, SEASON_NAME, SEEN_KEY } from "./shops/season.js";
import { createWeather, pickWeather } from "./shops/weather.js";
import { createIdentityCard, whoLabel } from "./identity.js";
import { createInvite } from "./invite.js";
import { createFriendsBar } from "./friendsbar.js";
import { createAccountMenu } from "./accountmenu.js";
import { createBarMenu } from "./barmenu.js";
import { api, createAuthCard } from "./auth.js";

const $ = (id) => document.getElementById(id);
const debug = new URLSearchParams(location.search).has("debug");
// ?editor (local dev): hand-tune positions / sizes / views, see editor.js. Never sends place requests.
const editMode = new URLSearchParams(location.search).has("editor");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// ---- copy ------------------------------------------------------------------
const STOREY_NAME = { zh: ["一楼", "二楼", "三楼", "四楼"], en: ["Ground floor", "Upstairs", "Second floor", "Third floor"] };
const LAYER = {
  zh: ["", "① 大件", "② 放在上面", "③ 再放上去的小东西"],
  en: ["", "① Big pieces", "② On top", "③ Small things on those"],
};
const TEXT = {
  zh: {
    brand: "小镇一角", toggle: "EN", toggleAria: "切换到英文", menu: "菜单", crumbsAria: "当前位置", cafe: "咖啡馆", back: "‹ 返回", loading: "正在把咖啡馆捏出来……",
    hintBuilding: "点一层楼，走近一点。", hintStorey: "点一块地方，走近一点。",
    hintZone: "把东西拖到淡淡发光的轮廓上，放手就好。同一层里先放哪个都行。",
    hintEmpty: "这里暂时没有要放的东西。",
    closer: "走近看看", closerHint: "放好后点它，摆上面的小东西",
    unlocks: (p) => `放好${p}后解锁`, zoomTo: (p) => `点进${p}再放`, unlocksAfter: (p) => `放好${p}后能走近`,
    zoneDone: "这一块都放好了。", allDone: "整间咖啡馆都放好了。慢慢看一圈吧。",
    pageTitle: "小镇一角 · 摆一摆",
    closerShort: "走近看看", mute: "关掉声音", unmute: "打开声音", help: "怎么玩",
    hintTitle: "怎么玩",
    hintItems: ["点击：走近", "Esc 或 返回：后退", "手机上滑：后退", "把东西拖到发光的轮廓上"],
    hintClose: "点一下就关上",
    present: (n) => `店里现在有 ${n} 个人`, presentShort: (n) => `${n} 人在`,
    invite: "邀请一个人一起拼", inviteNote: "把这个链接发给一个人，你们拼的是同一家店。",
    copy: "复制链接", copied: "已复制", inviteShort: "邀请", share: "分享",
    soundLabel: "声音", helpLabel: "帮助", leftShort: (n) => `剩 ${n} 件`,
    holding: "有人在拿",
    noShop: "没有找到这家店。", home: "回到小镇",
    newTag: "新",
    seasonCard: (s, n) => `${s}到了，店里多了 ${n} 件${s}的小东西`,
    seasonClose: "点一下就关上",
    town: "我的小镇", friendTown: "朋友的小镇",
    leftToday: (n) => `今天还能帮 ${n} 件`, enough: "今天帮够啦，明天再来",
    townsDone: "今天已经帮了 3 个小镇啦，明天再来",
    inviteTown: "邀请朋友来帮忙", inviteTownNote: "把这个链接发给朋友：他们每天最多能帮你放 8 件东西。",
    askBtn: "请朋友帮忙", askBtnOn: "已请朋友帮忙",
    askHere: "请朋友帮这一块", askOn: "已请朋友帮这一块（再点取消）",
    askedLabel: "朋友想请你帮忙", reqHint: "右键点一件，单独请朋友帮忙",
    reqDoneGuest: (x) => `帮朋友摆好了${x}`, reqDoneOwner: (x) => `朋友帮你摆好了${x}`,
    namedTown: (n) => `${n} 的小镇`, helperPlaced: (n, x) => `${n || "一位匿名朋友"} 帮你放了${x}`,
    shareText: (n, l) => n ? `${n} 请你来帮忙摆小镇：${l}` : `来帮我摆小镇吧：${l}`,
    viewOnly: "只能看看：先加对方为好友，才能一起摆。", addFriend: "加好友",
    loginNeeded: "登录之后才能来帮忙摆。",
  },
  en: {
    brand: "A Corner of Town", toggle: "中文", toggleAria: "Switch to Chinese", menu: "Menu", crumbsAria: "Where you are", cafe: "Café", back: "‹ Back", loading: "Shaping the café out of clay…",
    hintBuilding: "Tap a floor to step closer.", hintStorey: "Tap an area to step closer.",
    hintZone: "Drag each thing onto its faint glowing outline and let go. Within a layer, any order is fine.",
    hintEmpty: "Nothing to place here for now.",
    closer: "Take a closer look", closerHint: "Once it's in, tap it to place what goes on it",
    unlocks: (p) => `Unlocks after: ${p}`, zoomTo: (p) => `Zoom into ${p} to place`, unlocksAfter: (p) => `Open after: ${p}`,
    zoneDone: "This corner's all in place.", allDone: "The whole café is in place. Have a slow look around.",
    pageTitle: "A Corner of Town · Place things",
    closerShort: "Take a closer look", mute: "Mute", unmute: "Unmute", help: "How to play",
    hintTitle: "How to play",
    hintItems: ["Click: zoom in", "Esc or Back: step back", "Swipe up (phone): back", "Drag things onto the glowing outline"],
    hintClose: "Tap to close",
    present: (n) => `${n} here now`, presentShort: (n) => `${n} here`,
    invite: "Invite someone", inviteNote: "Send this link to someone: you'll both be building the same café.",
    copy: "Copy link", copied: "Copied", inviteShort: "Invite", share: "Share",
    soundLabel: "Sound", helpLabel: "Help", leftShort: (n) => `${n} left`,
    holding: "Someone's holding this",
    noShop: "This café couldn't be found.", home: "Back to town",
    newTag: "new",
    seasonCard: (s, n) => `${s} is here — ${n} ${s.toLowerCase()} thing${n === 1 ? "" : "s"} to place`,
    seasonClose: "Tap to close",
    town: "My town", friendTown: "Friend's town",
    leftToday: (n) => `${n} left today`, enough: "That's enough for today — come back tomorrow",
    townsDone: "You've helped 3 towns today — come back tomorrow",
    inviteTown: "Invite a friend to help", inviteTownNote: "Send this link to a friend: they can place up to 8 things a day for you.",
    askBtn: "Ask friends", askBtnOn: "Friends asked",
    askHere: "Ask friends to help here", askOn: "Friends asked to help here (tap to undo)",
    askedLabel: "Your friend asked for help", reqHint: "Right-click a thing to ask for help with just that one",
    reqDoneGuest: (x) => `You finished the ${x} for your friend`, reqDoneOwner: (x) => `A friend finished the ${x}`,
    namedTown: (n) => `${n}'s Town`, helperPlaced: (n, x) => `${n || "An anonymous friend"} placed the ${x} for you`,
    shareText: (n, l) => n ? `${n} invites you to help set up their town: ${l}` : `Come help set up my town: ${l}`,
    viewOnly: "View only — once you're friends, you can help place things.", addFriend: "Add as friend",
    loginNeeded: "Log in to help place things here.",
  },
};
const LANG_KEY = "lang";
let lang = "zh";
try { lang = localStorage.getItem(LANG_KEY) === "en" ? "en" : "zh"; } catch {}
const T = () => TEXT[lang];
const L = (label) => label[lang] || label.zh || label.en;

// ---- the shop (server) -----------------------------------------------------
// `/shop/<id>` (open shop) or `/w/<world>/<type>` (a shop in a world — who you are
// comes from the session cookie now, server/accounts.ts; no more `?t=` token)
const world = worldFromUrl();
const me = clientId();
let account = null; // the signed-in account, or null (world shops require one)
let loginFailure = false; // world shop + not logged in: show a login gate, not a 404
let worldShop = null;
if (world) {
  const who = await api.me();
  account = who.account;
  if (account) worldShop = await loadWorldShop(world).catch(() => null);
  else loginFailure = true;
}
const shop = world ? worldShop && worldShop.shop : shopFromUrl();
// not logged in, trying to open a world's shop: a quiet login card, not a 404 and
// not a silent bounce — the link is fine, you just need to sign in to use it
if (loginFailure) {
  const card = document.createElement("div");
  card.className = "hint-card"; card.style.cursor = "default";
  const authCard = createAuthCard({ lang: () => lang, modal: false, onAuthed: () => location.reload() });
  const p = document.createElement("p"); p.className = "hint-title"; p.textContent = T().loginNeeded;
  card.append(p, authCard.el);
  $("loading").replaceWith(card);
  await new Promise(() => {});
}
if (!shop) { location.replace(world ? `/w/${world.world}` : "/"); await new Promise(() => {}); }
// role is "owner" or "guest" (server/db.ts worldPermission); a guest who isn't an
// accepted friend can only look — canPlace tells the two apart
const isOwner = !!worldShop && worldShop.role === "owner";
const canPlace = !!worldShop && (isOwner || worldShop.canPlace);
const guest = !!worldShop && !isOwner && canPlace; // an accepted friend, helping with a daily quota
const viewOnly = !!worldShop && !canPlace; // logged in, but not a friend of the owner: look only
let idCard = null; // the identity card (set up once the net extras exist)
let ownerName = worldShop?.ownerName || ""; // the town owner's name ("" = unnamed); live via SSE `name`
// `worldShop.ownerUsername`: the owner's account username — distinct from
// `ownerName` above (their free-text town nickname) — used to prefill "Add as friend".
const ownerUsername = worldShop?.ownerUsername || "";
let quota = guest ? worldShop.quota : null;
const townUrl = world ? `/w/${world.world}` : null;
let helpedHere = false; // placed here this visit (so a 0 means "enough", not "3 towns")
const spent = () => guest && !!quota && quota.left <= 0;
const placed = new Set();
const shopLoad = (async () => {
  for (let i = 0; ; i++) {
    try { return await loadShop(shop); } catch { await new Promise((r) => setTimeout(r, Math.min(8000, 800 * 2 ** i))); }
  }
})();
// the shop type (a definition in public/shops/) and the season it's in
const def = await loadShopType(typeFromUrl());
// views the developer saved with ?editor (assets/editor/<type>.json): a saved camera beats the computed one
const savedViews = await fetch(`/api/editor/${String(typeFromUrl()).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "x"}`)
  .then((r) => (r.ok ? r.json() : null)).then((j) => (j && j.views) || {}).catch(() => ({}));
const season = await currentSeason();
const { room: ROOM, levels: LEVELS, tube: TUBE } = def;
const YARD = def.yard || null;

// ---- sound: a soft wooden "tock", synthesised; starts only after a first gesture
const MUTE_KEY = "cafe-mute-v1";
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch {}
let actx = null;
function wakeAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
  } catch { actx = null; }
}
addEventListener("pointerdown", wakeAudio, { capture: true });
addEventListener("keydown", wakeAudio, { capture: true });
/** `soft` = the quieter, lower note when a thing floats back to the tray. */
function tock(soft = false) {
  if (muted || !actx || actx.state !== "running") return;
  const t = actx.currentTime, vol = soft ? 0.07 : 0.22, f = soft ? 300 : 440;
  const out = actx.createBiquadFilter(); out.type = "lowpass"; out.frequency.value = soft ? 1100 : 1800;
  out.connect(actx.destination);
  const body = actx.createOscillator(); body.type = "sine";
  body.frequency.setValueAtTime(f, t); body.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.14);
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  body.connect(g).connect(out);
  // a tiny higher knock on top gives it the "wood" in tock
  const knock = actx.createOscillator(); knock.type = "triangle"; knock.frequency.setValueAtTime(f * 2.6, t);
  const kg = actx.createGain();
  kg.gain.setValueAtTime(0.0001, t); kg.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.003); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  knock.connect(kg).connect(out);
  body.start(t); body.stop(t + 0.3); knock.start(t); knock.stop(t + 0.08);
}

// ---- renderer / scene ------------------------------------------------------
const canvas = $("house");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;

const BG = 0xf6eee2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
addLights(scene);
const camera = new THREE.PerspectiveCamera(38, 1, 10, 6000);

$("loading").textContent = def.loading ? L(def.loading) : T().loading;
const [{ storeys, tube, yard }, data] = await Promise.all([buildShop(scene, def, season), shopLoad]);
// the same season sky, grass and drifting petals/leaves/snow as the town street,
// plus a weather condition (clear/rain/cloudy) picked client-side — independent of
// season, cosmetic only, so it doesn't need to match between two people in the same shop
const weather = createWeather(scene, {
  season,
  weather: pickWeather(),
  bounds: { x: [ROOM.x[0] - 12, YARD ? YARD.box.x[1] : ROOM.x[1] + 12], z: [ROOM.z[0] - 12, Math.max(ROOM.z[1], YARD ? YARD.box.z[1] : 0)] },
  groundY: 0,
  keepOut: { x: [ROOM.x[0] - 15, ROOM.x[1] + 15], z: [ROOM.z[0] - 15, ROOM.z[1] + 15] },
});
/** storeys + the yard: everything that holds zones */
const areas = yard ? [...storeys, yard] : storeys;
if (!data) {
  const p = document.createElement("p"); p.className = "loading";
  const a = document.createElement("a"); a.href = "/"; a.textContent = T().home;
  p.append(T().noShop + " ", a);
  $("loading").replaceWith(p);
  await new Promise(() => {});
}
for (const id of data.placed) placed.add(id);
let edit = null; // the editor, once loaded (editMode only)
let present = data.present || 1;
try { localStorage.setItem(LAST_SHOP_KEY, shop); } catch {}
$("loading").remove();
const N = LEVELS.length, TOP = N * STOREY_H;

// the tube spans every storey: clip it at the cut instead of hiding it
const cut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6);
tube?.traverse((o) => {
  if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [cut]; }
});

// ---- items -----------------------------------------------------------------
const devTags = devTagIfEmpty(areas);
const items = collectItems(areas);
for (const id of [...placed]) if (!items.has(id)) placed.delete(id);
// a child can't be placed without its parent (older saves, changed zones)
let pruned = true;
while (pruned) {
  pruned = false;
  for (const id of placed) { const p = items.get(id).parent; if (p && !placed.has(p)) { placed.delete(id); pruned = true; } }
}
// editor: everything shows as placed, locally only, so it can be adjusted
if (editMode) for (const id of items.keys()) placed.add(id);
for (const it of items.values()) {
  it.base = { y: it.obj.position.y, scale: it.obj.scale.clone() };
  it.obj.visible = placed.has(it.id);
}
const zoneItems = (level, zone) => [...items.values()].filter((it) => it.level === level && it.zone === zone);
const descendants = (id) => {
  const out = [];
  const walk = (i) => { for (const c of items.get(i).children) { out.push(items.get(c)); walk(c); } };
  walk(id);
  return out;
};
const count = (list) => ({ done: list.filter((it) => placed.has(it.id)).length, total: list.length });
const levelItems = (level) => [...items.values()].filter((it) => it.level === level);

// ---- views -----------------------------------------------------------------
// (request targets are built once items + zones are known: see buildReqTargets())
// path[0] = building; then { kind: "storey", level } → { kind: "zone", level, zone } → { kind: "item", id } …
let path = [{ kind: "building" }];
const view = () => path[path.length - 1];
const viewLevel = (v = view()) => (v.kind === "building" ? null : v.kind === "item" ? items.get(v.id).level : v.level);
const viewZone = (v = view()) => (v.kind === "zone" ? v.zone : v.kind === "item" ? items.get(v.id).zone : null);

/** The zones of a storey (number) or of the yard ("yard"). */
const areaZones = (level) => (level === "yard" ? YARD.zones : LEVELS[level].zones);
const isYard = (level) => level === "yard";
function zoneBoxes(level, zone) {
  const y0 = isYard(level) ? 0 : levelY(level);
  return areaZones(level)[zone].boxes.map((b) =>
    new THREE.Box3(new THREE.Vector3(b.x[0], y0 + b.y[0], b.z[0]), new THREE.Vector3(b.x[1], y0 + b.y[1], b.z[1])));
}
const storeyBox = (level) => isYard(level)
  ? new THREE.Box3(new THREE.Vector3(YARD.box.x[0], 0, YARD.box.z[0]), new THREE.Vector3(YARD.box.x[1], 230, YARD.box.z[1]))
  : new THREE.Box3(new THREE.Vector3(ROOM.x[0], levelY(level), ROOM.z[0]), new THREE.Vector3(ROOM.x[1], levelY(level) + 270, ROOM.z[1]));
// ---- help requests (world shops): the owner marks parts for friends to help with
// ids (server/SHOPS.md, `^[a-z0-9-]{1,64}$`), all built from the play page's own names:
//   zone  → `<area>-<zone>`         area = `l<level>` or `yard`   e.g. l0-bar, l1-reading, yard-garden
//   piece → the focus piece's item id: it + everything on it, e.g. l0-bar-pastry-case
//   item  → the item's id: one thing, e.g. l0-bar-croissant
// (item ids are unique in a shop and already carry their level + zone, and the scope
// tells a piece mark from an item mark on the same id)
// Requests are hints only: nothing here ever stops a placement.
const reqOn = !!worldShop; // open shops (no role) get no request UI at all
const owner = isOwner; // kept as a short local alias; used throughout below
const rid = (x) => String(x).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "x";
const areaId = (level) => (isYard(level) ? "yard" : `l${level}`);
const zoneReqId = (level, zone) => rid(`${areaId(level)}-${zone}`);
const pieceReqId = (it) => rid(it.id);
const itemReqId = (it) => rid(it.id);
const rkey = (scope, id) => `${scope}:${id}`;
/** "scope:id" → { scope, id, label, level, zone, piece?, item?, covered: items } */
const reqTargets = new Map();
function buildReqTargets() {
  for (const a of areas) for (const [zone, z] of Object.entries(areaZones(a.level))) {
    const id = zoneReqId(a.level, zone);
    reqTargets.set(rkey("zone", id), { scope: "zone", id, label: z.label, level: a.level, zone, covered: zoneItems(a.level, zone) });
  }
  for (const it of items.values()) {
    if (it.focus && it.children.length) {
      const id = pieceReqId(it);
      reqTargets.set(rkey("piece", id), { scope: "piece", id, label: it.label, level: it.level, zone: it.zone, piece: it.id, covered: [it, ...descendants(it.id)] });
    }
    const id = itemReqId(it);
    reqTargets.set(rkey("item", id), { scope: "item", id, label: it.label, level: it.level, zone: it.zone, item: it.id, covered: [it] });
  }
}
let requests = []; // [{ scope, id }] as the server has them
let note = null;
const reqDone = new Map(); // "scope:id" → done, to notice the moment one completes
const reqComplete = (r) => r.covered.length > 0 && r.covered.every((it) => placed.has(it.id));
/** Known requests that still matter: the owner sees every mark; a guest only what's left to do. */
const liveReqs = () => requests.map((r) => reqTargets.get(rkey(r.scope, r.id))).filter((r) => r && (owner || !reqComplete(r)));
const hasReq = (scope, id) => requests.some((r) => r.scope === scope && r.id === id);
const reqCovers = (r, it) => r.covered.includes(it);
const itemAsked = (it) => liveReqs().some((r) => reqCovers(r, it));
const zoneAsked = (level, zone) => liveReqs().some((r) => r.level === level && r.zone === zone);
const areaAsked = (level) => liveReqs().some((r) => r.level === level);
function setRequests(list) {
  requests = Array.isArray(list) ? list.filter((r) => r && typeof r.id === "string") : [];
  checkReqDone(false);
}
/** Compare each request against last time; `announce` shows the note for one that just completed. */
function checkReqDone(announce) {
  const seen = new Set();
  for (const r of requests) {
    const k = rkey(r.scope, r.id), t = reqTargets.get(k);
    if (!t) continue;
    seen.add(k);
    const done = reqComplete(t);
    if (announce && done && reqDone.get(k) === false) showReqNote((owner ? T().reqDoneOwner : T().reqDoneGuest)(L(t.label)));
    reqDone.set(k, done);
  }
  for (const k of [...reqDone.keys()]) if (!seen.has(k)) reqDone.delete(k);
}
let reqNoteTimer = 0;
function showReqNote(text) {
  const el = $("req-note");
  el.textContent = text; el.hidden = false; el.classList.remove("fading");
  clearTimeout(reqNoteTimer);
  reqNoteTimer = setTimeout(() => { el.classList.add("fading"); reqNoteTimer = setTimeout(() => { el.hidden = true; }, reduced.matches ? 0 : 800); }, 5000);
}
async function toggleReq(scope, id) {
  if (!owner) return;
  const on = !hasReq(scope, id);
  // show it at once; the server's answer (and its SSE) is the truth
  setRequests(on ? [...requests, { scope, id }] : requests.filter((r) => !(r.scope === scope && r.id === id)));
  renderUI();
  const list = await net.setRequest(scope, id, on);
  if (list) setRequests(list);
  renderUI();
}
function itemBox(id) {
  const b = new THREE.Box3().setFromObject(items.get(id).obj);
  const indoor = !isYard(items.get(id).level);
  // indoors, seasonal things never move the camera
  for (const d of descendants(id)) if (!(indoor && d.season)) b.union(new THREE.Box3().setFromObject(d.obj));
  // never zoom in so far that a small thing fills the screen
  const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
  return new THREE.Box3().setFromCenterAndSize(c, s.max(new THREE.Vector3(110, 70, 90)).multiplyScalar(1.08));
}
function viewBox(v) {
  if (v.kind === "building") {
    const b = new THREE.Box3(new THREE.Vector3(ROOM.x[0] - 12, 0, 0), new THREE.Vector3(ROOM.x[1] + 12, TOP, ROOM.z[1]));
    return YARD ? b.union(storeyBox("yard")) : b;
  }
  if (v.kind === "storey") return storeyBox(v.level);
  if (v.kind === "zone") {
    // frame what the zone actually holds (all its items, placed or not), kept inside its boxes
    const zb = zoneBoxes(v.level, v.zone).reduce((a, b) => a.union(b));
    // indoors, seasonal things never move the camera: frame the base items only
    const list = zoneItems(v.level, v.zone).filter((it) => isYard(v.level) || !it.season);
    // the yard is small and open: show all of it, not just the few pieces in it
    if (!list.length || isYard(v.level)) return zb;
    const b = new THREE.Box3();
    for (const it of list) b.union(new THREE.Box3().setFromObject(it.obj));
    b.min.y = Math.min(b.min.y, zb.min.y);
    b.expandByScalar(15);
    b.intersect(zb);
    return b.isEmpty() ? zb : b;
  }
  return topOf(v.id)?.box ?? itemBox(v.id);
}
/** The piece's own box, without the items that sit on / in it. */
function ownBox(id) {
  const b = new THREE.Box3(), o = items.get(id).obj;
  o.updateWorldMatrix(true, true);
  const walk = (n) => {
    if (n !== o && n.userData.item) return;
    if (n.isMesh) {
      if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
      b.union(n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld));
    }
    for (const c of n.children) walk(c);
  };
  walk(o);
  return b;
}
/**
 * If a focus piece holds its things on one horizontal surface above 40 cm (a counter, a table, a sideboard, a case),
 * all within about one level (not tiers of a bookcase, not decals spread up a board),
 * the box to frame (the top + what's on it) — else null (things hung on a face or on several tiers).
 */
function topOf(id) {
  const it = items.get(id);
  let out = null;
  const kids = it.children.map((c) => items.get(c)).filter((k) => !(k.season && !isYard(it.level)));
  if (kids.length) {
    const own = ownBox(id), floor = isYard(it.level) ? 0 : levelY(it.level);
    const bots = kids.map((k) => { k.obj.updateWorldMatrix(true, false); return new THREE.Box3().setFromObject(k.obj); });
    const lows = bots.map((b) => b.min.y);
    const lo = Math.min(...lows), hi = Math.max(...lows);
    const inside = bots.every((b) => { const c = b.getCenter(new THREE.Vector3()); return c.x > own.min.x - 8 && c.x < own.max.x + 8 && c.z > own.min.z - 8 && c.z < own.max.z + 8; });
    // against a wall, only things on its very top count (a wall shelf holds them on boards under its frame)
    const onTop = lo > own.max.y - 15 || !wallOf(id);
    if (lo - floor > 40 && hi - lo < 25 && inside && onTop) {
      const box = new THREE.Box3(new THREE.Vector3(own.min.x, lo - 6, own.min.z), new THREE.Vector3(own.max.x, lo, own.max.z));
      for (const b of bots) box.union(b);
      const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
      out = { box: new THREE.Box3().setFromCenterAndSize(c, sz.max(new THREE.Vector3(70, 30, 50)).multiplyScalar(1.05)) };
    }
  }
  return out;
}
// a front-ish 3/4 angle that looks a little more down the closer you get
// kept low so the room reads like a stage seen from the front, not a floor plan
const ANGLE = { building: [14, 17], storey: [14, 18], zone: [16, 20], item: [14, 24] };
const deg = THREE.MathUtils.degToRad;
const dirFrom = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
/** Which wall a focus piece hangs on / stands flat against (its back near the wall, facing out), or null. */
function wallOf(id) {
  const it = items.get(id);
  const b = new THREE.Box3().setFromObject(it.obj);
  const f = new THREE.Vector3(0, 0, 1).applyQuaternion(it.obj.getWorldQuaternion(new THREE.Quaternion()));
  // thin along the wall's normal: shelves, boards, frames, a bookcase — not a sofa backed onto a wall
  if (f.z > 0.9 && b.min.z < 35 && b.max.z < 55) return "back";
  if (f.x < -0.9 && b.max.x > ROOM.x[1] - 35 && b.min.x > ROOM.x[1] - 55) return "right";
  if (f.x > 0.9 && b.min.x < ROOM.x[0] + 35 && b.max.x < ROOM.x[0] + 55) return "left";
  return null;
}
const WALL_DIR = { back: new THREE.Vector3(0, 0, 1), right: new THREE.Vector3(-1, 0, 0), left: new THREE.Vector3(1, 0, 0) };
/** Things on the right half are seen from the left (front-on first), so the view never swings out past the right wall. */
const fromLeft = (v, c) => v.kind !== "building" && v.kind !== "storey" && c.x > 60 && c.x < ROOM.x[1];
/** The angle we'd like before checking what's in the way. */
function preferredAngle(v, box) {
  let [az, el] = ANGLE[v.kind].map(deg);
  if (fromLeft(v, box.getCenter(new THREE.Vector3()))) az = -az * 0.5;
  // things against the back wall left of the bean tube are seen from the left, so the tube never stands in front of them
  const c = box.getCenter(new THREE.Vector3());
  // shops without the café's bean tube have nothing here to look past
  if (TUBE && (v.kind === "zone" || v.kind === "item") && c.x < TUBE.x - 40 && c.z < TUBE.keepout.z[1] + 60) az = -az;
  if (v.kind === "item") {
    // a focus piece that faces sideways (a board on a side wall) is looked at face-on
    const f = new THREE.Vector3(0, 0, 1).applyQuaternion(items.get(v.id).obj.getWorldQuaternion(new THREE.Quaternion()));
    const turn = Math.atan2(f.x, f.z);
    if (Math.abs(turn) > deg(20)) az = THREE.MathUtils.clamp(turn, -1.13, 1.13);
  }
  return [az, el];
}

// ---- what can stand between the camera and a target: shell walls, stairs, rail, slabs, the tube
const occluders = [];
for (const s of storeys) {
  for (const w of ["back", "left", "right"]) occluders.push({ obj: s.walls[w], level: s.level, wall: w });
  for (const name of ["stairs", "stairwell-rail", "floor"]) {
    const o = s.group.getObjectByName(name);
    if (o) occluders.push({ obj: o, level: s.level, wall: null });
  }
}
if (tube) occluders.push({ obj: tube, level: -1, wall: null });
const occRay = new THREE.Raycaster();
/** Share of sample rays from the target box to camera position `p` that hit the shell (0 = clear view). */
function blockedShare(p, box, lv, extra = [], big = []) {
  const outside = isYard(lv);
  const cutY = lv === null || outside ? Infinity : levelY(lv) + 282;
  const objs = occluders.filter((o) => {
    if (o.level >= 0 && lv !== null && !outside && o.level > lv) return false; // storeys above are hidden
    // a wall is hidden whenever the camera stands outside it (see tick) — except from the yard
    if (o.wall && outside) return true;
    if (o.wall === "left") return p.x > ROOM.x[0];
    if (o.wall === "right") return p.x < ROOM.x[1];
    if (o.wall === "back") return p.z > 0;
    return true;
  }).map((o) => o.obj);
  const c = box.getCenter(new THREE.Vector3()), half = box.getSize(new THREE.Vector3()).multiplyScalar(0.35);
  const samples = [c];
  for (let i = 0; i < 8; i++) samples.push(c.clone().add(new THREE.Vector3(i & 1 ? half.x : -half.x, i & 2 ? half.y : -half.y, i & 4 ? half.z : -half.z)));
  samples.push(...extra.map((x) => x.clone()));
  let hit = 0;
  for (const s of samples) {
    // keep samples inside the room, so things hung on a wall don't count the wall they hang on
    if (!outside) { s.x = THREE.MathUtils.clamp(s.x, ROOM.x[0] + 6, ROOM.x[1] - 6); s.z = Math.max(s.z, ROOM.z[0] + 6); }
    const to = p.clone().sub(s), far = to.length();
    occRay.set(s, to.normalize()); occRay.near = 4; occRay.far = far;
    const hits = occRay.intersectObjects(objs, true).filter((h) => h.point.y <= cutY);
    if (hits.length || boxBlocks(s, p, big)) hit++;
  }
  return hit / samples.length;
}
// ---- big things that may stand in front of a target: furniture, yard pieces, the yard tree, far trees.
// Boxes are measured once (every piece has one fixed place); per frame we only project them.
const bigOcc = [];
for (const it of items.values()) if (it.layer === 1) bigOcc.push({ it, obj: it.obj, level: it.level, box: new THREE.Box3().setFromObject(it.obj) });
{
  const tree = yard?.scenery?.group?.getObjectByName("yard-tree");
  if (tree) bigOcc.push({ it: null, obj: tree, level: "yard", box: new THREE.Box3().setFromObject(tree) });
}
for (const [i, box] of (weather.treeBoxes || []).entries()) bigOcc.push({ tree: i, level: null, box });
/** Which of bigOcc may count as in the way for view `v` (never the target, its things or what holds it). */
function occCandidates(v = view()) {
  if (v.kind === "building") return bigOcc.filter((o) => o.tree !== undefined);
  const lv = viewLevel(v), zone = viewZone(v);
  const skip = new Set();
  if (v.kind === "item") {
    skip.add(v.id); for (const d of descendants(v.id)) skip.add(d.id);
    for (let p = items.get(v.id).parent; p; p = items.get(p).parent) skip.add(p);
  }
  if (drag?.it) skip.add(drag.it.id);
  return bigOcc.filter((o) => {
    if (o.tree !== undefined) return true;
    if (o.level !== lv) return false;
    if (!o.it) return v.kind === "item"; // the yard tree is part of the yard's own picture
    if (skip.has(o.it.id)) return false;
    if (v.kind === "storey") return false;          // a whole storey / yard is all target
    if (v.kind === "zone") return o.it.zone !== zone; // a zone's own pieces are its picture
    return true;
  });
}
const occBoxRay = new THREE.Ray(), occHit = new THREE.Vector3();
/** Does a big candidate box stand on the segment from sample s to camera p? */
function boxBlocks(s, p, list) {
  const to = p.clone().sub(s), far = to.length();
  occBoxRay.set(s, to.normalize());
  for (const o of list) {
    if (o.box.containsPoint(s)) continue;
    // a little shrink: clay pieces are round, their boxes are not
    const b = o.shrunk ??= o.box.clone().expandByVector(o.box.getSize(new THREE.Vector3()).multiplyScalar(-0.12));
    if (occBoxRay.intersectBox(b, occHit) && occHit.distanceTo(s) < far) return true;
  }
  return false;
}
// fallback: whatever still covers the target from the chosen camera fades away (screen rects from the camera matrix)
const occFaded = new Map(); // bigOcc entry → true while faded
const projM = new THREE.Matrix4(), cornerV = new THREE.Vector3();
function screenRect(box) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, dMin = Infinity, dMax = -Infinity, behind = false;
  for (let i = 0; i < 8; i++) {
    cornerV.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
    cornerV.applyMatrix4(camera.matrixWorldInverse);
    const d = -cornerV.z;
    dMin = Math.min(dMin, d); dMax = Math.max(dMax, d);
    if (d <= camera.near) { behind = true; continue; }
    cornerV.applyMatrix4(camera.projectionMatrix);
    x0 = Math.min(x0, cornerV.x); x1 = Math.max(x1, cornerV.x); y0 = Math.min(y0, cornerV.y); y1 = Math.max(y1, cornerV.y);
  }
  // a box reaching past the camera plane may cover anything
  if (behind) { x0 = -1; y0 = -1; x1 = 1; y1 = 1; }
  return { x0: Math.max(-1, x0), y0: Math.max(-1, y0), x1: Math.min(1, x1), y1: Math.min(1, y1), dMin, dMax };
}
function setFaded(o, on) {
  if (!!occFaded.get(o) === on) return;
  occFaded.set(o, on);
  o.obj.traverse((m) => {
    if (!m.isMesh) return;
    if (on) {
      m.userData.occMat = m.material;
      const f = (mat) => { const c = mat.clone(); c.transparent = true; c.opacity = 0.12; c.depthWrite = false; return c; };
      m.material = Array.isArray(m.material) ? m.material.map(f) : f(m.material);
      m.userData.occCast = m.castShadow; m.castShadow = false;
    } else if (m.userData.occMat) {
      const c = m.material; m.material = m.userData.occMat; delete m.userData.occMat;
      for (const x of Array.isArray(c) ? c : [c]) x.dispose();
      m.castShadow = m.userData.occCast; delete m.userData.occCast;
    }
  });
}
let occKey = "";
function stepOcclusion() {
  camera.updateMatrixWorld();
  const v = view();
  const key = camera.matrixWorld.elements.map((x) => x.toFixed(1)).join() + JSON.stringify(v) + (drag?.it?.id || "");
  if (key === occKey) return;
  occKey = key;
  const list = new Set(v.kind === "building" ? [] : occCandidates(v));
  const t = screenRect(viewBox(v));
  const tArea = Math.max(1e-4, (t.x1 - t.x0) * (t.y1 - t.y0));
  const trees = [];
  for (const o of bigOcc) {
    let hide = false;
    if (list.has(o) && !(o.it && !placed.has(o.it.id) && !editMode)) {
      const r = screenRect(o.box);
      const w = Math.min(r.x1, t.x1) - Math.max(r.x0, t.x0), h = Math.min(r.y1, t.y1) - Math.max(r.y0, t.y0);
      const overlap = w > 0 && h > 0 ? (w * h) / tArea : 0;
      const front = r.dMax < t.dMin || (r.dMin + r.dMax) / 2 < t.dMin;
      hide = overlap > 0.08 && front;
    }
    if (o.tree !== undefined) { if (hide) trees.push(o.tree); } else setFaded(o, hide);
  }
  weather.setBlocked?.(trees);
}

/** Never inside a wall's thickness, behind the back wall, or inside the stairs / tube. */
const solidBoxes = occluders.filter((o) => !o.wall && o.obj.name !== "floor")
  .map((o) => new THREE.Box3().setFromObject(o.obj).expandByScalar(25));
const insideShell = (p) => p.z < 40 || Math.abs(Math.abs(p.x) - ROOM.x[1]) < ROOM.wall + 20 ||
  solidBoxes.some((b) => b.containsPoint(p));

// screen space left free by the tray (desktop: right panel; phone: bottom sheet)
let free = { w: 1, h: 1, fullW: 1, fullH: 1, offX: 0, offY: 0 };
function measure() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const c = canvas.getBoundingClientRect(), t = $("tray").getBoundingClientRect();
  const bottomSheet = t.width >= c.width - 2;
  if (bottomSheet) {
    const sh = Math.max(0, c.bottom - t.top);
    free = { w, h: h - sh, fullW: w, fullH: h + sh, offX: 0, offY: sh };
  } else {
    const tw = Math.max(0, c.right - t.left);
    free = { w: w - tw, h, fullW: w + tw, fullH: h, offX: tw, offY: 0 };
  }
  camera.aspect = free.fullW / Math.max(1, free.fullH);
  camera.setViewOffset(free.fullW, free.fullH, free.offX, free.offY, w, h);
}
/** Distance along `dir` at which box fits the free part of the screen. */
function fitDistance(v, box, dir) {
  const c = box.getCenter(new THREE.Vector3());
  const fwd = dir.clone().negate();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd);
  const tanV0 = Math.tan(deg(camera.fov / 2));
  const margin = v.kind === "building" ? 0.9 : 0.86;
  const tanV = tanV0 * (free.h / free.fullH) * margin, tanH = tanV0 * (free.w / free.fullH) * margin;
  let d = 50;
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(c);
    const z = p.dot(dir);
    d = Math.max(d, z + Math.abs(p.dot(right)) / tanH, z + Math.abs(p.dot(up)) / tanV);
  }
  return d;
}
// candidate turns around the preferred angle: right-hand side first (the stairs are on the left wall)
const AZ_STEPS = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75].map(deg);
const EL_STEPS = [0, 10, 20].map(deg);
const frameCache = new Map();
/** Camera position + target that fit box `v` into the free part of the screen, with a clear line of sight. */
const viewKey = (v) => Object.values(v.kind === "item" ? { kind: v.kind, id: v.id } : v.kind === "zone" ? { kind: v.kind, level: v.level, zone: v.zone } : v.kind === "storey" ? { kind: v.kind, level: v.level } : { kind: v.kind }).join(":");
function frame(v, zoomOut = 1, at = path.indexOf(v)) {
  const saved = savedViews[viewKey(v)]?.camera;
  if (saved && !(editMode && edit?.freeCam)) {
    const t = new THREE.Vector3(...saved.target), p0 = new THREE.Vector3(...saved.position);
    const d = p0.distanceTo(t);
    return { p: t.clone().addScaledVector(p0.sub(t).normalize(), d * zoomOut), t, d, fov: saved.fov };
  }
  const box = viewBox(v), c = box.getCenter(new THREE.Vector3());
  let [az0, el0] = preferredAngle(v, box);
  const top = v.kind === "item" && topOf(v.id);
  if (top) {
    // a worktop is seen square-on to its front, looking a little down (as the saved bar counter)
    const f = new THREE.Vector3(0, 0, 1).applyQuaternion(items.get(v.id).obj.getWorldQuaternion(new THREE.Quaternion()));
    const turn = Math.atan2(f.x, f.z);
    az0 = Math.abs(turn) > deg(20) ? THREE.MathUtils.clamp(turn, -1.13, 1.13) : 0; el0 = deg(15);
  }
  let parentD = Infinity;
  // each level is closer than the one it came from
  if (v.kind === "item" && at > 0) parentD = frame(path[at - 1], 1, at - 1).d * 0.8;
  const key = `${JSON.stringify(v)}|${free.w}x${free.h}|${Math.round(parentD)}`;
  let best = frameCache.get(key);
  if (!best) {
    const lv = viewLevel(v);
    // in a zone, every big piece should be in sight, not just the middle of the box
    const extra = v.kind === "zone"
      ? zoneItems(v.level, v.zone).filter((it) => it.layer === 1 && (isYard(v.level) || !it.season)).map((it) => new THREE.Box3().setFromObject(it.obj).getCenter(new THREE.Vector3()))
      : [];
    // a wall piece is a front elevation: square to its wall, at its own height, nothing to search
    const wall = v.kind === "item" && !top ? wallOf(v.id) : null;
    if (wall) {
      const dir = WALL_DIR[wall].clone();
      best = { score: 0, dir, d: fitDistance(v, box, dir), occ: 0 };
    }
    const flip = fromLeft(v, c) ? -1 : 1;
    // big pieces / trees in front count as in the way too (only ones actually standing there)
    const big = v.kind === "building" ? [] : occCandidates(v).filter((o) => o.tree === undefined && (!o.it || placed.has(o.it.id) || editMode));
    // far trees never steer the camera: they just step aside (stepOcclusion)
    // a worktop only turns a little, and only if square-on is blocked
    for (const [ei, del] of best ? [] : (top ? [0] : EL_STEPS).entries()) {
      for (const [ai, daz] of (top ? AZ_STEPS.slice(0, 3) : AZ_STEPS).entries()) {
        // a top surface is seen at eye level raised to just above the tabletop: a shallow angle, so its
        // things stand up as they would to someone at the counter, not seen from above
        const az = THREE.MathUtils.clamp(az0 + flip * daz, deg(-80), deg(80)), el = el0 + del;
        const dir = dirFrom(az, el);
        const d = Math.min(fitDistance(v, box, dir), parentD);
        const p = c.clone().addScaledVector(dir, d);
        if (v.kind !== "building" && insideShell(p)) continue;
        const occ = v.kind === "building" ? 0 : blockedShare(p, box, lv, extra, big);
        // a clear view matters most; then staying near the preferred angle; then a lower camera
        const score = occ * 100 + ai * 1.2 + ei * 4;
        if (!best || score < best.score) best = { score, dir, d, occ };
        if (top && occ > 0 && debug) console.debug("[frame] worktop blocked square-on", v.id, `turn ${Math.round(daz * 57.3)}°`, occ.toFixed(2));
        if (occ === 0 && ai === 0 && ei === 0) break;
      }
      if (best && best.occ === 0 && best.score < 5) break;
    }
    if (!best) { const dir = dirFrom(az0, el0); best = { dir, d: Math.min(fitDistance(v, box, dir), parentD), occ: 1 }; }
    frameCache.set(key, best);
    if (debug) console.debug("[frame]", key, `az ${Math.round(Math.atan2(best.dir.x, best.dir.z) * 57.3)}° el ${Math.round(Math.asin(best.dir.y) * 57.3)}° blocked ${best.occ.toFixed(2)}`);
  }
  const d = best.d * zoomOut;
  return { p: c.clone().addScaledVector(best.dir, d), t: c, d: best.d };
}

const look = new THREE.Vector3();
let fly = null, orbit = null, orbitNext = false;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function flyTo(target, dur = 1100) {
  orbit = null; orbitNext = false;
  if (reduced.matches) dur = 0;
  fly = { from: camera.position.clone(), fromT: look.clone(), p: target.p, t: target.t, t0: performance.now(), dur };
}
function go(newPath) {
  path = newPath;
  applyCut();
  flyTo(frame(view()));
  hover(null);
  renderUI();
}
const goInto = (v) => go([...path, v]);
const goBack = () => { if (path.length > 1) go(path.slice(0, -1)); };

// dollhouse cutaway: inside a storey, the ones above vanish and the tube is cut at the ceiling
function applyCut() {
  const lv = viewLevel();
  const all = lv === null || isYard(lv);
  for (const s of storeys) s.group.visible = all || s.level <= lv;
  // inside a storey the yard steps away, so the room looks exactly as it does without one
  if (yard) yard.group.visible = all;
  cut.constant = all ? 1e6 : levelY(lv) + 282;
}

// ---- picking + hover -------------------------------------------------------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pickMat = new THREE.MeshBasicMaterial();
const hoverBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.1, depthWrite: false }));
const hoverEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.6 }));
hoverBox.add(hoverEdges);
hoverBox.visible = false; hoverBox.renderOrder = 5;
scene.add(hoverBox);
function showBox(box, opacity = 0.1) {
  box.getCenter(hoverBox.position); box.getSize(hoverBox.scale);
  hoverBox.material.opacity = opacity; hoverEdges.material.opacity = Math.min(1, opacity * 6);
  hoverBox.visible = true;
}
function pickMesh(box) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), pickMat);
  box.getCenter(m.position); box.getSize(m.scale); m.updateMatrixWorld(true);
  return m;
}
const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
/** What can be clicked at this zoom level: [{ mesh(es), box, go }] */
function targets() {
  const v = view();
  if (v.kind === "building") return areas.map((s) => ({ objs: [pickMesh(storeyBox(s.level))], box: storeyBox(s.level), go: { kind: "storey", level: s.level } }));
  if (v.kind === "storey") {
    return Object.keys(areaZones(v.level)).map((zone) => {
      const boxes = zoneBoxes(v.level, zone);
      return { objs: boxes.map(pickMesh), box: boxes.reduce((a, b) => a.clone().union(b)), go: { kind: "zone", level: v.level, zone } };
    });
  }
  const scope = v.kind === "item" ? v.id : null;
  return [...items.values()]
    .filter((it) => it.focus && it.children.length && placed.has(it.id) && it.scope === scope && it.level === viewLevel() && it.zone === viewZone())
    .map((it) => ({ objs: [it.obj], box: new THREE.Box3().setFromObject(it.obj), go: { kind: "item", id: it.id }, real: true }));
}
function pickAt(x, y) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  let best = null;
  for (const t of targets()) {
    for (const hit of ray.intersectObjects(t.objs, true)) {
      if (t.real && !shown(hit.object)) continue;
      if (!best || hit.distance < best.d) best = { d: hit.distance, t };
      break;
    }
  }
  return best && best.t;
}
let hovered = null;
function hover(t) {
  hovered = t;
  canvas.style.cursor = t ? "pointer" : "";
  if (t) showBox(t.box);
  else if (!glowFx) hoverBox.visible = false;
}
let down = null;
canvas.addEventListener("pointermove", (e) => {
  if (drag || e.pointerType === "touch" || fly || orbit) return;
  const t = pickAt(e.clientX, e.clientY);
  if (t !== hovered && (!t || !hovered || t.go !== hovered.go)) hover(t);
});
canvas.addEventListener("pointerleave", () => hover(null));
canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener("pointercancel", () => { down = null; });
canvas.addEventListener("pointerup", (e) => {
  if (!down || drag || edit?.consumed || edit?.freeCam) { down = null; return; }
  const dx = e.clientX - down.x, dy = e.clientY - down.y, moved = Math.hypot(dx, dy), dt = performance.now() - down.t;
  down = null;
  // phones: a quick swipe up on the scene steps back (mouse/trackpad never does)
  if (e.pointerType === "touch" && dy < -60 && Math.abs(dy) > 1.5 * Math.abs(dx) && dt < 700) { goBack(); return; }
  if (moved > 8) return;
  const t = pickAt(e.clientX, e.clientY);
  if (t) goInto(t.go); // empty space: nothing happens
});
addEventListener("keydown", (e) => { if (e.key === "Escape" && !drag) goBack(); });

// ---- requested parts glow softly for a guest (the hover box's warm style, a little stronger)
const reqGlow = [];
function renderReqGlow() {
  for (const m of reqGlow) scene.remove(m);
  reqGlow.length = 0;
  if (!reqOn || owner) return;
  const v = view(), lv = viewLevel(v), zn = viewZone(v), boxes = [];
  for (const r of liveReqs()) {
    if (v.kind === "building") boxes.push(storeyBox(r.level));
    else if (r.level !== lv) continue;
    else if (v.kind === "storey") boxes.push(zoneBoxes(r.level, r.zone).reduce((a, b) => a.union(b)));
    else if (r.zone !== zn) continue;
    else if (r.scope === "zone") boxes.push(viewBox({ kind: "zone", level: r.level, zone: r.zone }));
    else if (r.scope === "piece") boxes.push(new THREE.Box3().setFromObject(items.get(r.piece).obj));
    else if (!placed.has(r.item)) boxes.push(new THREE.Box3().setFromObject(items.get(r.item).obj).expandByScalar(3));
  }
  const seen = new Set();
  for (const b of boxes) {
    const k = [b.min.toArray(), b.max.toArray()].join();
    if (b.isEmpty() || seen.has(k)) continue;
    seen.add(k);
    const m = new THREE.Mesh(hoverBox.geometry, new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.08, depthWrite: false }));
    m.add(new THREE.LineSegments(hoverEdges.geometry, new THREE.LineBasicMaterial({ color: 0xe8963a, transparent: true, opacity: 0.7 })));
    b.getCenter(m.position); b.getSize(m.scale); m.renderOrder = 4;
    scene.add(m); reqGlow.push(m);
  }
}
function stepReqGlow(now) {
  const k = reduced.matches ? 0.5 : 0.5 + 0.5 * Math.sin(now / 700);
  for (const m of reqGlow) { m.material.opacity = 0.05 + 0.06 * k; m.children[0].material.opacity = 0.45 + 0.35 * k; }
}

// ---- the owner marks one thing: right-click, or a ~500 ms long-press on touch
const REQ_HINT_KEY = "cafe-req-hint-seen-v1";
let reqHintSeen = false;
try { reqHintSeen = localStorage.getItem(REQ_HINT_KEY) === "1"; } catch {}
let pressFired = null; // pointerId whose long-press fired (so it never becomes a drag)
function reqGesture(cell, it) {
  const fire = () => {
    toggleReq("item", itemReqId(it));
    if (!reqHintSeen) { reqHintSeen = true; try { localStorage.setItem(REQ_HINT_KEY, "1"); } catch {} }
  };
  let lastType = "mouse";
  // Android fires contextmenu on a touch long-press: swallow it, but only a mouse right-click asks
  cell.addEventListener("contextmenu", (e) => { e.preventDefault(); if (pressFired !== null || lastType === "touch") return; fire(); });
  cell.addEventListener("pointerdown", (e) => {
    lastType = e.pointerType;
    // touch: a press-and-hold is how people start a drag on a phone, so it never asks for help
    // (the flag button at the top of the tray does that instead)
    if (e.pointerType !== "pen") return;
    const x = e.clientX, y = e.clientY, id = e.pointerId;
    pressFired = null;
    const timer = setTimeout(() => { if (!drag) { pressFired = id; fire(); } }, 500);
    const off = () => { clearTimeout(timer); removeEventListener("pointermove", mv); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); };
    const mv = (ev) => { if (ev.pointerId === id && Math.hypot(ev.clientX - x, ev.clientY - y) > 8) off(); };
    const up = (ev) => { if (ev.pointerId !== id) return; off(); setTimeout(() => { if (pressFired === id) pressFired = null; }, 400); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  });
}

// ---- thumbnails: each item rendered once, through the one renderer ---------
const THUMB = 112;
const thumbs = new Map();
const thumbQueue = [...items.keys()];
const thumbScene = new THREE.Scene();
thumbScene.add(new THREE.HemisphereLight(0xfff4e6, 0xb89a80, 1.6));
const tkey = new THREE.DirectionalLight(0xffe9cc, 2.2); tkey.position.set(-1, 2, 2); thumbScene.add(tkey);
const thumbCam = new THREE.PerspectiveCamera(28, 1, 1, 5000);
const thumbCanvas = document.createElement("canvas");
/** A copy of the item alone (its tagged children removed), sharing geometry/materials. */
function soloClone(it) {
  const c = it.obj.clone(true);
  const strip = (o) => { for (const ch of [...o.children]) { if (ch.userData.item) o.remove(ch); else strip(ch); } };
  strip(c);
  c.visible = true;
  return c;
}
function renderThumb(it) {
  const c = soloClone(it);
  c.position.set(0, 0, 0);
  thumbScene.add(c);
  const box = new THREE.Box3().setFromObject(c), sph = box.getBoundingSphere(new THREE.Sphere());
  const d = sph.radius / Math.sin(THREE.MathUtils.degToRad(thumbCam.fov / 2)) * 1.02;
  thumbCam.position.copy(sph.center).add(new THREE.Vector3(0.45, 0.5, 1).normalize().multiplyScalar(d));
  thumbCam.lookAt(sph.center);
  const pr = renderer.getPixelRatio(), px = Math.round(THUMB * pr);
  renderer.setViewport(0, 0, THUMB, THUMB);
  renderer.setScissor(0, 0, THUMB, THUMB);
  renderer.setScissorTest(true);
  renderer.render(thumbScene, thumbCam);
  thumbCanvas.width = thumbCanvas.height = px;
  const ctx = thumbCanvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, canvas.height - px, px, px, 0, 0, px, px);
  // key out the flat background so the sticker floats on whatever is behind it
  const img = ctx.getImageData(0, 0, px, px), a = img.data, br = a[0], bg = a[1], bb = a[2];
  for (let i = 0; i < a.length; i += 4) {
    const dist = Math.abs(a[i] - br) + Math.abs(a[i + 1] - bg) + Math.abs(a[i + 2] - bb);
    if (dist < 10) a[i + 3] = 0; else if (dist < 30) a[i + 3] = Math.round(255 * (dist - 10) / 20);
  }
  ctx.putImageData(img, 0, 0);
  thumbs.set(it.id, thumbCanvas.toDataURL("image/png"));
  thumbScene.remove(c);
  for (const img of document.querySelectorAll(`img[data-thumb="${CSS.escape(it.id)}"]`)) { img.src = thumbs.get(it.id); img.className = ""; }
}
function pumpThumbs() {
  if (!thumbQueue.length || canvas.height < THUMB * renderer.getPixelRatio()) return;
  const bg = scene.background; thumbScene.background = new THREE.Color(0xfbf7f0);
  for (let n = 0; n < 6 && thumbQueue.length; n++) renderThumb(items.get(thumbQueue.shift()));
  void bg;
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
}

// ---- ghost: the real model, translucent and glowing at its one spot -------
const ghostMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false,
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xffb84d) } },
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
    void main() { float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
      float pulse = 0.72 + 0.28 * sin(uTime * 2.1);
      gl_FragColor = vec4(uColor * (1.0 + 0.35 * rim), min(1.0, (0.24 + 1.1 * pow(rim, 1.8)) * pulse)); }`,
});
let ghost = null;
function showGhost(it) {
  ghost = soloClone(it);
  ghost.traverse((o) => { if (o.isMesh) { o.material = ghostMat; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 10; } });
  ghost.position.y = it.base.y;
  ghost.scale.copy(it.base.scale);
  it.obj.parent.add(ghost);
  const b = new THREE.Box3().setFromObject(it.obj);
  markerAt = new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2);
  marker.visible = true;
}
function hideGhost() { if (ghost) { ghost.parent.remove(ghost); ghost = null; } marker.visible = false; }

// a soft glowing dot with a little arrow, floating above the spot at a fixed screen size,
// drawn over everything so a small or half-hidden spot is still easy to find
const marker = (() => {
  const c = document.createElement("canvas"); c.width = 64; c.height = 96;
  const g = c.getContext("2d");
  const halo = g.createRadialGradient(32, 30, 2, 32, 30, 30);
  halo.addColorStop(0, "rgba(255,214,140,0.95)"); halo.addColorStop(0.45, "rgba(255,184,77,0.55)"); halo.addColorStop(1, "rgba(255,184,77,0)");
  g.fillStyle = halo; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#fff6e6"; g.beginPath(); g.arc(32, 30, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(217,140,40,0.9)";
  g.beginPath(); g.moveTo(18, 64); g.lineTo(46, 64); g.lineTo(32, 88); g.closePath(); g.fill();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false }));
  m.center.set(0.5, 0.1); m.renderOrder = 12; m.visible = false;
  scene.add(m);
  return m;
})();
let markerAt = null;
function stepMarker(now) {
  if (!marker.visible || !markerAt) return;
  const t = now / 1000, bob = reduced.matches ? 0 : Math.sin(t * 2.1);
  const h = 0.1 * (free.h / Math.max(1, free.fullH));
  marker.scale.set(h * 0.667, h, 1);
  // a few pixels above the top of the spot, bobbing slowly
  const dist = camera.position.distanceTo(markerAt);
  marker.position.copy(markerAt).add(new THREE.Vector3(0, dist * (0.012 + 0.006 * bob), 0));
  marker.material.opacity = 0.9 + 0.1 * bob;
}

// ---- drag from tray --------------------------------------------------------
let drag = null;
function startPending(e, it, cell) {
  if (e.button !== 0 || drag || fly || editMode) return;
  // touch pointers are captured by the tile they start on; the tray redraws mid-drag (holds echo
  // back over the network) and a detached tile would swallow the rest of the gesture, so let go
  try { if (cell.hasPointerCapture?.(e.pointerId)) cell.releasePointerCapture(e.pointerId); } catch {}
  const pend = { x: e.clientX, y: e.clientY, id: e.pointerId, verdict: null, timer: 0 };
  const sheet = getComputedStyle(cell).touchAction === "pan-x";
  const touch = e.pointerType === "touch";
  // touch: the tray scrolls along one axis and things are dragged out across it. Decided once, at
  // the first move past the slop, and shared with the touchmove guard so both agree.
  pend.decide = (x, y) => {
    if (pend.verdict) return pend.verdict;
    const dx = x - pend.x, dy = y - pend.y;
    if (Math.hypot(dx, dy) < DRAG_SLOP) return null;
    const along = Math.abs(sheet ? dx : dy), across = Math.abs(sheet ? dy : dx), out = sheet ? -dy : -dx;
    // mostly across the scroll axis, or slanting towards the scene (up from the bottom sheet, left
    // from the side tray) by more than about 27 degrees: a drag. Anything flatter scrolls the tray.
    pend.verdict = across > along || out > along * 0.5 ? "drag" : "scroll";
    return pend.verdict;
  };
  const move = (ev) => {
    if (ev.pointerId !== pend.id) return;
    if (pressFired === pend.id) return stop(); // a long-press asked for help: no drag
    if (ev.pointerType === "mouse") {
      if (Math.hypot(ev.clientX - pend.x, ev.clientY - pend.y) < 4) return;
    } else {
      const v = pend.decide(ev.clientX, ev.clientY);
      if (!v) return;
      if (v === "scroll") return stop();
    }
    stop();
    beginDrag(ev, it, cell);
  };
  const stop = () => {
    clearTimeout(pend.timer);
    if (touchPend === pend) touchPend = null;
    removeEventListener("pointermove", move); removeEventListener("pointerup", stop); removeEventListener("pointercancel", stop);
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", stop);
  addEventListener("pointercancel", stop);
  if (touch) {
    touchPend = pend;
    // the touch stream keeps going to the tile it started on, even after a redraw detaches it
    if (!guarded.has(cell)) { guarded.add(cell); cell.addEventListener("touchmove", guardTouch, { passive: false }); }
    // press and hold still for a moment: the thing is picked up, and from then on any direction
    // (even straight sideways) is a drag — the usual long-press-to-drag of phone home screens
    pend.timer = setTimeout(() => {
      if (touchPend !== pend || pend.verdict || drag || fly || editMode) return;
      stop();
      beginDrag({ clientX: pend.x, clientY: pend.y, pointerId: pend.id }, it, cell);
    }, HOLD_MS);
  }
}
// ---- touch: keep the browser from scrolling the tray under a drag -------------
const DRAG_SLOP = 8, HOLD_MS = 220;
let touchPend = null; // the touch press on a tile that hasn't yet become a drag or a scroll
const guarded = new WeakSet();
function guardTouch(e) {
  if (!e.cancelable) return;
  if (drag) return e.preventDefault();
  const p = touchPend, t = e.touches.length === 1 && e.touches[0];
  if (p && t && p.decide(t.clientX, t.clientY) === "drag") e.preventDefault();
}
// registered up front and not passive: iOS Safari ignores a touchmove listener added mid-gesture
document.addEventListener("touchmove", guardTouch, { passive: false });
// a long press on a tile, or while carrying something, never opens the browser's own menu
addEventListener("contextmenu", (e) => { if (drag || touchPend) e.preventDefault(); });
function beginDrag(e, it, cell) {
  hover(null);
  net.hold(it.id, true);
  const el = document.createElement(thumbs.has(it.id) ? "img" : "div");
  if (thumbs.has(it.id)) el.src = thumbs.get(it.id);
  el.className = "dragging-thumb";
  document.body.append(el);
  cell.classList.add("lifted");
  showGhost(it);
  drag = { it, el, cell, id: e.pointerId, unlisten: () => { removeEventListener("pointermove", move); removeEventListener("pointerup", end); removeEventListener("pointercancel", end); } };
  const pos = (ev) => { el.style.transform = `translate(${ev.clientX - 42}px, ${ev.clientY - 42}px) rotate(-4deg) scale(1.06)`; };
  pos(e);
  const move = (ev) => { if (ev.pointerId === drag.id) pos(ev); };
  const end = (ev) => {
    if (ev.pointerId !== drag.id) return;
    drag.unlisten();
    finishDrag(ev, ev.type === "pointerup");
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", end);
  addEventListener("pointercancel", end);
}
/** Screen-space centre + snap radius of an item's spot. */
function spotOnScreen(it) {
  const box = new THREE.Box3().setFromObject(it.obj);
  const r = canvas.getBoundingClientRect();
  const toScreen = (v) => { const p = v.clone().project(camera); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; };
  const c = toScreen(box.getCenter(new THREE.Vector3()));
  let ext = 0;
  for (let i = 0; i < 8; i++) {
    const s = toScreen(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
    ext = Math.max(ext, Math.hypot(s.x - c.x, s.y - c.y));
  }
  // a spot that's tiny on screen (a cup seen from the zone view) still takes a generous drop
  return { ...c, radius: THREE.MathUtils.clamp(ext * 0.8, ext < 40 ? 90 : 60, 160) };
}
/** The tray tile for an item as it is now (the tray may have been redrawn mid-drag). */
const liveCell = (id, fallback) => document.querySelector(`.cell[data-item="${CSS.escape(id)}"]`) || fallback;
function finishDrag(ev, dropped) {
  const { it, el } = drag;
  const cell = liveCell(it.id, drag.cell);
  const spot = spotOnScreen(it);
  hideGhost();
  net.hold(it.id, false);
  const tray = $("tray").getBoundingClientRect();
  const overTray = ev.clientX >= tray.left && ev.clientX <= tray.right && ev.clientY >= tray.top && ev.clientY <= tray.bottom;
  if (dropped && !overTray && Math.hypot(ev.clientX - spot.x, ev.clientY - spot.y) <= spot.radius) {
    el.classList.add("in");
    el.style.transform = `translate(${spot.x - 42}px, ${spot.y - 42}px) scale(0.6)`;
    setTimeout(() => el.remove(), 200);
    drag = null;
    land(it);
    sendPlace(it);
    return;
  }
  // not there yet: the thumbnail floats home, nothing else happens
  drag = null;
  floatHome(el, it.id, cell, dropped);
}
/** A thumbnail drifts back to its tile in the tray, then disappears. */
function floatHome(el, id, cell, soundIt) {
  cell = liveCell(id, cell);
  const home = cell.getBoundingClientRect();
  el.classList.add("back");
  requestAnimationFrame(() => {
    el.style.transform = `translate(${home.left + home.width / 2 - 42}px, ${home.top + home.height / 2 - 42}px) scale(0.7)`;
  });
  let home_ = false;
  const done = () => { if (home_) return; home_ = true; el.remove(); liveCell(id, cell).classList.remove("lifted"); if (soundIt) tock(true); };
  if (reduced.matches) done(); else { el.addEventListener("transitionend", done, { once: true }); setTimeout(done, 450); }
}
/** Someone else's drop beat ours: the drag ends quietly and the thumbnail goes home. */
function cancelDrag() {
  if (!drag) return;
  const { it, el, cell } = drag;
  drag.unlisten();
  hideGhost();
  net.hold(it.id, false);
  drag = null;
  floatHome(el, it.id, cell, false);
}

// ---- landing: drop, squash, settle ----------------------------------------
const anims = [];
function land(it) {
  placed.add(it.id);
  if (reqOn) checkReqDone(true);
  it.obj.visible = true;
  if (!reduced.matches) {
    const h = new THREE.Box3().setFromObject(it.obj).getSize(new THREE.Vector3()).y;
    anims.push({ it, t0: performance.now(), lift: Math.min(60, 12 + h * 0.3) });
    setTimeout(() => tock(), 200); // the moment it touches down
  } else tock();
  renderUI();
  celebrate(it);
}
function stepAnims(now) {
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i], { obj, base } = a.it, k = Math.min(1, (now - a.t0) / 520);
    const fall = Math.min(1, k / 0.4);
    obj.position.y = base.y + a.lift * (1 - fall * fall);
    const s = k < 0.4 ? 0 : Math.sin(((k - 0.4) / 0.6) * Math.PI) * 0.1 * (1 - (k - 0.4) / 0.6 * 0.5);
    obj.scale.set(base.scale.x * (1 + s * 0.5), base.scale.y * (1 - s), base.scale.z * (1 + s * 0.5));
    if (k >= 1) { obj.position.y = base.y; obj.scale.copy(base.scale); anims.splice(i, 1); }
  }
}

// ---- gentle completion moments --------------------------------------------
let glowFx = null;
function celebrate(it) {
  const z = count(zoneItems(it.level, it.zone));
  const all = count([...items.values()]);
  if (all.total && all.done === all.total) {
    glowFx = { box: storeyBox(it.level), t0: performance.now(), dur: 1800 };
    setTimeout(() => {
      go([{ kind: "building" }]);
      orbitNext = !reduced.matches; // one slow circle once the camera has eased out

    }, 1400);
    return;
  }
  if (z.done === z.total) {
    const zb = zoneBoxes(it.level, it.zone).reduce((a, b) => a.union(b));
    glowFx = { box: zb, t0: performance.now(), dur: 1800 };
    if (viewZone() === it.zone) setTimeout(() => { if (!drag) flyTo(frame(view(), 1.15), 1600); }, 500);
  }
}
function stepGlow(now) {
  if (!glowFx) return;
  const k = (now - glowFx.t0) / glowFx.dur;
  if (k >= 1 || reduced.matches) { glowFx = null; if (!hovered) hoverBox.visible = false; else showBox(hovered.box); return; }
  showBox(glowFx.box, 0.16 * Math.sin(k * Math.PI));
}

// ---- tray --------------------------------------------------------------------
function cellFor(it) {
  const cell = document.createElement("div");
  cell.className = "cell";
  const parent = it.parent && items.get(it.parent);
  // at the zone level, things that sit on a focus piece are placed from inside that piece
  const far = it.scope && view().kind === "zone";
  const state = placed.has(it.id) ? "placed" : parent && !placed.has(parent.id) ? "locked" : far ? "far" : "open";
  if (state !== "open") cell.classList.add(state);
  cell.dataset.item = it.id;
  if (drag && drag.it.id === it.id) cell.classList.add("lifted");
  const heldHere = state !== "placed" && heldByOthers(it.id);
  if (heldHere) {
    cell.classList.add("held");
    const dot = document.createElement("span"); dot.className = "held-dot"; dot.setAttribute("aria-label", T().holding);
    cell.append(dot);
  }
  let img;
  if (thumbs.has(it.id)) { img = document.createElement("img"); img.src = thumbs.get(it.id); }
  else { img = document.createElement("img"); img.className = "noimg"; img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; }
  img.alt = ""; img.draggable = false; img.dataset.thumb = it.id;
  const name = document.createElement("span"); name.className = "name"; name.textContent = L(it.label);
  cell.append(img, name);
  if (it.season && state !== "placed") {
    const tag = document.createElement("span"); tag.className = "new-tag"; tag.textContent = T().newTag; cell.append(tag);
  }
  if (state === "locked") {
    const note = document.createElement("span"); note.className = "note"; note.textContent = T().unlocks(L(parent.label));
    cell.append(note);
  } else if (state === "far") {
    const host = items.get(it.scope);
    const note = document.createElement("span"); note.className = "note"; note.textContent = T().zoomTo(L(host.label));
    cell.append(note);
    cell.setAttribute("role", "button"); cell.tabIndex = 0;
    const fly_ = () => goInto({ kind: "item", id: host.id });
    cell.addEventListener("click", fly_);
    cell.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fly_(); } });
  }
  if (!thumbs.has(it.id)) { const q = thumbQueue.indexOf(it.id); if (q > 0) thumbQueue.unshift(...thumbQueue.splice(q, 1)); }
  if (state === "open" && (spent() || viewOnly)) cell.classList.add("spent");
  else if (state === "open") cell.addEventListener("pointerdown", (e) => startPending(e, it, cell));
  cell.title = heldHere ? `${L(it.label)} · ${T().holding}` : L(it.label);
  let asked = false;
  if (owner) {
    // the owner's own marks: this one thing, or this piece (and what's on it)
    if (hasReq("item", itemReqId(it)) || (it.focus && hasReq("piece", pieceReqId(it)))) cell.append(flag());
    reqGesture(cell, it);
  } else if (reqOn && state !== "placed" && itemAsked(it)) {
    asked = true;
    cell.classList.add("asked");
    cell.append(flag());
    const tag = document.createElement("span"); tag.className = "asked-tag"; tag.textContent = T().askedLabel; cell.append(tag);
  }
  return { cell, order: { open: 0, far: 1, locked: 2 }[state] ?? 3, asked };
}
// a little pennant: hollow when nothing is asked, filled once friends are asked
const flagSvg = (filled) => `<svg class="flag-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.5v13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 2.5h8.5l-2.2 3 2.2 3H4z" fill="${filled ? "#d0613f" : "none"}" stroke="${filled ? "#d0613f" : "currentColor"}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const flag = () => { const f = document.createElement("span"); f.className = "req-flag"; f.innerHTML = flagSvg(true); return f; };
function row(label, prog, onClick, disabledNote, asked = false) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "row" + (asked ? " asked" : "");
  const a = document.createElement("span"); a.textContent = label;
  if (asked) a.prepend(flag());
  const c = document.createElement("span"); c.className = "small";
  c.textContent = disabledNote || (prog.total ? `${prog.done} / ${prog.total}` : "");
  if (prog.total && prog.done === prog.total) b.classList.add("done");
  b.append(a, c);
  if (disabledNote) b.disabled = true; else b.addEventListener("click", onClick);
  return b;
}
function crumbLabel(v) {
  if (v.kind === "building") return def.name ? L(def.name) : T().cafe;
  if (v.kind === "storey") return areaName(v.level);
  if (v.kind === "zone") return L(areaZones(v.level)[v.zone].label);
  return L(items.get(v.id).label);
}
const areaName = (level) => (isYard(level) ? L(YARD.label) : STOREY_NAME[lang][level] || `L${level}`);
const layerPref = new Map();
function renderUI() {
  const t = T(), v = view();
  document.documentElement.lang = lang === "en" ? "en" : "zh";
  document.title = t.pageTitle;
  $("brand").textContent = t.brand;
  $("lang-toggle").querySelector(".tool-label").textContent = t.toggle;
  $("lang-toggle").title = $("lang-toggle").ariaLabel = t.toggleAria;
  $("menu-btn").title = $("menu-btn").ariaLabel = t.menu;
  $("crumbs").ariaLabel = t.crumbsAria;
  // wide screens: "‹ Back" beside the breadcrumb. Phones: no breadcrumb, so the button names
  // where it goes ("‹ Counter"), and from the shop's top view it leads back to the town.
  const townLabel = ownerName ? t.namedTown(ownerName) : guest ? t.friendTown : t.town;
  const atTop = path.length < 2;
  $("back").hidden = atTop && !townUrl;
  $("back").classList.toggle("at-top", atTop);
  $("back").querySelector(".wide").textContent = t.back;
  $("back").querySelector(".narrow").textContent = `‹ ${atTop ? townLabel : crumbLabel(path[path.length - 2])}`;
  $("mute").querySelector(".tool-ico").textContent = muted ? "🔇" : "🔈";
  $("mute").querySelector(".tool-label").textContent = t.soundLabel;
  $("mute").setAttribute("aria-pressed", String(muted));
  $("mute").title = $("mute").ariaLabel = muted ? t.unmute : t.mute;
  $("help").querySelector(".tool-label").textContent = t.helpLabel;
  $("help").title = $("help").ariaLabel = t.help;
  friendsBar?.render();
  accountMenu?.render();
  idCard?.render();
  $("who").hidden = !guest;
  if (guest && idCard) {
    const c = idCard.choice() || { anon: false }, uname = account?.username || "", w = whoLabel(lang, c, uname);
    $("who").querySelector(".tool-ico").textContent = c.anon ? "🙂" : [...uname][0] || "🙂";
    $("who").querySelector(".tool-label").textContent = w.text;
    $("who").title = $("who").ariaLabel = `${w.text} · ${w.title}`;
  }
  $("view-only-note").hidden = !viewOnly;
  if (viewOnly) {
    $("view-only-note-text").textContent = T().viewOnly;
    $("view-only-note-add").textContent = T().addFriend;
  }
  if (!$("hint-card").hidden) fillHint();
  // breadcrumb (in a world, its root is the town)
  const crumbs = $("crumbs");
  crumbs.replaceChildren();
  if (townUrl) {
    const a = document.createElement("a"); a.href = townUrl; a.className = "crumb-town"; a.textContent = townLabel;
    const s = document.createElement("span"); s.className = "sep"; s.textContent = "›";
    crumbs.append(a, s);
    $("brand").href = townUrl;
  }
  renderQuota();
  path.forEach((p, i) => {
    if (i) { const s = document.createElement("span"); s.className = "sep"; s.textContent = "›"; crumbs.append(s); }
    if (i === path.length - 1) { const s = document.createElement("span"); s.className = "here"; s.textContent = crumbLabel(p); crumbs.append(s); }
    else { const b = document.createElement("button"); b.type = "button"; b.textContent = crumbLabel(p); b.addEventListener("click", () => go(path.slice(0, i + 1))); crumbs.append(b); }
  });
  $("ask-btn").hidden = true;
  $("req-hint").hidden = true;
  $("note-chip").hidden = !(reqOn && !owner && note);
  if (reqOn && !owner && note) $("note-chip").textContent = `📌 ${note}`;
  renderReqGlow();
  // tray
  const body = $("tray-body");
  body.replaceChildren();
  $("tray-title").textContent = crumbLabel(v);
  const all = count([...items.values()]);
  if (all.total && all.done === all.total) {
    const p = document.createElement("p"); p.className = "done-note small"; p.textContent = t.allDone; body.append(p);
  }
  if (v.kind === "building") {
    $("tray-hint").textContent = t.hintBuilding;
    $("tray-progress").textContent = all.total ? `${all.done} / ${all.total}` : "";
    const rows = document.createElement("div"); rows.className = "rows";
    const list = areas.map((s) => ({ s, asked: reqOn && areaAsked(s.level) }));
    if (!owner) list.sort((a, b) => b.asked - a.asked);
    for (const { s, asked } of list) rows.append(row(areaName(s.level), count(levelItems(s.level)), () => goInto({ kind: "storey", level: s.level }), undefined, asked));
    body.append(rows);
  } else if (v.kind === "storey") {
    $("tray-hint").textContent = t.hintStorey;
    const lp = count(levelItems(v.level));
    $("tray-progress").textContent = lp.total ? `${lp.done} / ${lp.total}` : "";
    const rows = document.createElement("div"); rows.className = "rows";
    const list = Object.entries(areaZones(v.level)).map(([zone, z]) => ({ zone, z, asked: reqOn && zoneAsked(v.level, zone) }));
    if (!owner) list.sort((a, b) => b.asked - a.asked);
    for (const { zone, z, asked } of list) {
      rows.append(row(L(z.label), count(zoneItems(v.level, zone)), () => goInto({ kind: "zone", level: v.level, zone }), undefined, asked));
    }
    body.append(rows);
  } else {
    const level = viewLevel(), zone = viewZone(), scope = v.kind === "item" ? v.id : null;
    const zp = count(zoneItems(level, zone));
    const sp = scope ? count(descendants(scope)) : zp;
    $("tray-progress").textContent = scope ? `${sp.done} / ${sp.total}` : `${zp.done} / ${zp.total}`;
    if (zp.total && zp.done === zp.total) {
      const p = document.createElement("p"); p.className = "done-note small"; p.textContent = t.zoneDone; body.append(p);
    }
    // zone view: everything in the zone, small things included (locked until their parent is in);
    // focus view: just what sits on that piece
    const here = scope ? descendants(scope) : zoneItems(level, zone);
    $("tray-hint").textContent = here.length ? t.hintZone : t.hintEmpty;
    if (owner) {
      const [sc, id] = scope ? ["piece", pieceReqId(items.get(scope))] : ["zone", zoneReqId(level, zone)];
      const on = hasReq(sc, id), b = $("ask-btn");
      b.hidden = false;
      b.innerHTML = `${flagSvg(on)}<span>${on ? t.askBtnOn : t.askBtn}</span>`;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      b.title = b.ariaLabel = on ? t.askOn : t.askHere;
      b.onclick = () => toggleReq(sc, id);
      // only a mouse right-click asks for one thing; a finger's long-press starts a drag, so touch-only screens get no hint
      $("req-hint").hidden = reqHintSeen || !here.length || !matchMedia("(any-hover: hover) and (any-pointer: fine)").matches;
      $("req-hint").textContent = t.reqHint;
    }
    const layers = [...new Set(here.map((it) => it.layer))].sort((a, b) => a - b);
    for (const ly of layers) {
      const list = here.filter((it) => it.layer === ly), lc = count(list), complete = lc.done === lc.total;
      const key = `${scope || `${level}/${zone}`}|${ly}`, pref = layerPref.get(key);
      // a finished layer folds itself away; a choice the player made holds until the layer's state changes
      const collapsed = pref && pref.complete === complete ? pref.collapsed : complete;
      const sec = document.createElement("section");
      sec.className = "layer" + (collapsed ? " collapsed" : "") + (complete ? " complete" : "");
      const h = document.createElement("button"); h.type = "button"; h.className = "layer-head";
      h.setAttribute("aria-expanded", String(!collapsed));
      const name = document.createElement("span");
      name.textContent = LAYER[lang][ly] || (lang === "zh" ? `${"①②③④⑤⑥⑦⑧⑨"[ly - 1] || ly} 第 ${ly} 层` : `${ly}. Layer ${ly}`);
      const cnt = document.createElement("span"); cnt.className = "count"; cnt.textContent = `${lc.done}/${lc.total} ${collapsed ? "▸" : "▾"}`;
      h.append(name, cnt);
      h.addEventListener("click", () => { layerPref.set(key, { complete, collapsed: !collapsed }); renderUI(); });
      const cells = document.createElement("div"); cells.className = "cells";
      // a guest sees what the owner asked for first within each layer
      list.map(cellFor).sort((a, b) => (b.asked - a.asked) || (a.order - b.order)).forEach((c) => cells.append(c.cell));
      sec.append(h, cells);
      body.append(sec);
    }
    const focusHere = [...items.values()].filter((it) => it.level === level && it.zone === zone && it.scope === scope && it.focus && descendants(it.id).length);
    if (focusHere.length) {
      const sec = document.createElement("section"); sec.className = "layer closer";
      const h = document.createElement("h3"); h.textContent = t.closerShort;
      const chips = document.createElement("div"); chips.className = "chips";
      for (const it of focusHere) {
        const c = count(descendants(it.id));
        const b = document.createElement("button"); b.type = "button"; b.className = "chip";
        b.textContent = L(it.label);
        const n = document.createElement("span"); n.className = "n"; n.textContent = `${c.done}/${c.total}`; b.append(n);
        if (c.total && c.done === c.total) b.classList.add("done");
        if (placed.has(it.id)) b.addEventListener("click", () => goInto({ kind: "item", id: it.id }));
        else { b.disabled = true; b.title = t.unlocksAfter(L(it.label)); }
        chips.append(b);
      }
      sec.append(h, chips);
      body.append(sec);
    }
  }
  renderPresence();
}
$("back").addEventListener("click", () => { if (path.length < 2 && townUrl) location.href = townUrl; else goBack(); });
$("mute").addEventListener("click", () => {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch {}
  renderUI();
  if (!muted) { wakeAudio(); setTimeout(() => tock(true), 30); }
});

// ---- first-play hint: a quiet card, gone after ~6 s or a click; "?" brings it back
const HINT_KEY = "cafe-hint-seen-v1";
let hintTimer = 0;
function fillHint() {
  const t = T();
  $("hint-title").textContent = t.hintTitle;
  $("hint-list").replaceChildren(...t.hintItems.map((x) => { const li = document.createElement("li"); li.textContent = x; return li; }));
  $("hint-close").textContent = t.hintClose;
}
function showHint() {
  const card = $("hint-card");
  fillHint();
  card.hidden = false; card.classList.remove("fading");
  clearTimeout(hintTimer);
  hintTimer = setTimeout(hideHint, 6000);
  try { localStorage.setItem(HINT_KEY, "1"); } catch {}
}
function hideHint() {
  const card = $("hint-card");
  if (card.hidden || card.classList.contains("fading")) return;
  clearTimeout(hintTimer);
  card.classList.add("fading");
  setTimeout(() => { if (card.classList.contains("fading")) card.hidden = true; }, reduced.matches ? 0 : 800);
}
$("hint-card").addEventListener("click", hideHint);
// a tap that only closes the hint shouldn't also zoom into whatever is under it
canvas.addEventListener("pointerdown", () => {
  const card = $("hint-card");
  if (card.hidden || card.classList.contains("fading")) return;
  down = null;
  hideHint();
});
$("help").addEventListener("click", () => ($("hint-card").hidden ? showHint() : hideHint()));
let hintSeen = false;
try { hintSeen = localStorage.getItem(HINT_KEY) === "1"; } catch {}
$("lang-toggle").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  renderUI();
});

// ---- together: the shared shop ---------------------------------------------
/** item id → Set of other clients holding it right now */
const held = new Map();
const heldByOthers = (id) => (held.get(id)?.size ?? 0) > 0;
/** drops the server hasn't confirmed because the network failed: retried quietly */
const retry = new Set();
/** drops on their way to the server right now */
const inflight = new Set();
let retryTimer = 0, retryWait = 2000;

/** A placed item arriving from elsewhere (or from a quiet retry): same drop, squash and sound. */
function landRemote(id) {
  const it = items.get(id);
  if (!it || placed.has(id)) return;
  if (drag && drag.it.id === id) cancelDrag(); // first drop wins
  land(it);
}
/** Our drop didn't reach the server: the thing lifts out again and its thumbnail drifts home. */
function revert(it) {
  for (const x of [it, ...descendants(it.id)]) {
    if (!placed.has(x.id)) continue;
    placed.delete(x.id);
    for (let i = anims.length - 1; i >= 0; i--) if (anims[i].it === x) anims.splice(i, 1);
    x.obj.visible = false; x.obj.position.y = x.base.y; x.obj.scale.copy(x.base.scale);
  }
  renderUI();
  const spot = spotOnScreen(it);
  const el = document.createElement(thumbs.has(it.id) ? "img" : "div");
  if (thumbs.has(it.id)) el.src = thumbs.get(it.id);
  el.className = "dragging-thumb";
  el.style.transform = `translate(${spot.x - 42}px, ${spot.y - 42}px) scale(0.6)`;
  document.body.append(el);
  floatHome(el, it.id, null, true);
}
/** A guest's daily help: the header count, and the tray note once it's used up. */
function renderQuota() {
  const t = T();
  $("quota").hidden = !guest || !quota;
  if (!guest || !quota) return;
  $("quota").querySelector(".wide").textContent = t.leftToday(Math.max(0, quota.left));
  $("quota").querySelector(".narrow").textContent = t.leftShort(Math.max(0, quota.left));
  $("quota-note").hidden = !spent();
  $("quota-note").textContent = quota.left <= 0 && quota.worldsLeft <= 0 && !helpedHere ? t.townsDone : t.enough;
}
async function sendPlace(it) {
  inflight.add(it.id);
  const r = await net.place(it.id);
  inflight.delete(it.id);
  if (r === "ok" || r === "taken") { retry.delete(it.id); return; } // taken: the other person put it there first, it's placed either way
  if (r === "full" || r === "quota" || r === "forbidden") { revert(it); return; }
  if (placed.has(it.id) && !retry.has(it.id)) revert(it);
  retry.add(it.id);
  scheduleRetry();
}
function scheduleRetry() {
  clearTimeout(retryTimer);
  if (!retry.size) { retryWait = 2000; return; }
  retryTimer = setTimeout(async () => {
    for (const id of [...retry]) {
      if (placed.has(id)) { retry.delete(id); continue; }
      const it = items.get(id);
      if (it.parent && !placed.has(it.parent)) continue; // wait for what it sits on
      const r = await net.place(id);
      if (r === "ok" || r === "taken") { retry.delete(id); landRemote(id); } // the "placed" event may beat us; landRemote is idempotent
      else if (r === "full" || r === "quota" || r === "forbidden") retry.delete(id);
    }
    retryWait = Math.min(30000, retryWait * 2);
    scheduleRetry();
  }, retryWait);
}

// a friend's display choice (identity.js: show as their username, or anonymous)
// rides along with each placement
const netExtra = {};
// identity card (identity.js): optional, never forced — a friend's username already
// identifies them; this only controls whether the owner sees that name or "anonymous"
idCard = worldShop ? createIdentityCard({
  world: world.world, role: isOwner ? "owner" : "guest", lang: () => lang, ownerName: () => ownerName,
  username: () => account?.username || "",
  save: !isOwner ? null : async ({ name }) => {
    const res = await fetch(`/api/worlds/${world.world}/name`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    if (!res.ok) throw new Error(String(res.status));
    ownerName = (await res.json()).ownerName || "";
  },
  onChoose: (c) => { if (guest) setHelperName(c); renderUI(); },
}) : null;
// anonymous sends "" so a name stored from an earlier visit is cleared on the server;
// otherwise the owner sees the friend's actual account username
function setHelperName(c) { netExtra.helperName = c && !c.anon ? account?.username || "" : ""; }
if (guest) setHelperName(idCard.choice());
if (idCard) $("who").addEventListener("click", () => idCard.open());
if (reqOn) { buildReqTargets(); note = worldShop.note; setRequests(worldShop.requests); }
// editor: no live connection at all, so nothing it does can reach the server
const net = editMode ? { hold() {}, place: async () => "ok", close() {} } : connect(shop, me, {
  hello({ placed: list, present: n }) {
    // the server's list is the truth: add what's missing, take back what it never got
    const server = new Set(list);
    for (const id of list) landRemote(id);
    for (const id of [...placed]) {
      if (server.has(id) || retry.has(id) || inflight.has(id)) continue;
      const it = items.get(id);
      if (it) { placed.delete(id); it.obj.visible = false; }
    }
    held.clear(); // anyone still holding re-announces nothing, so start clean
    present = n;
    retryWait = 2000; scheduleRetry();
    renderUI();
  },
  placed({ item, guest: byGuest, helperName: who }) {
    retry.delete(item); landRemote(item);
    // the owner hears, quietly, which named friend placed what
    if (owner && byGuest && items.has(item)) showReqNote(T().helperPlaced(who, L(items.get(item).label)));
  },
  name({ ownerName: n }) { ownerName = n || ""; renderUI(); },
  hold({ item, client, holding }) {
    if (client === me || !items.has(item)) return;
    const s = held.get(item) || new Set();
    if (holding) s.add(client); else s.delete(client);
    if (s.size) held.set(item, s); else held.delete(item);
    renderUI();
  },
  presence({ present: n }) { present = n; renderPresence(); },
  requests({ requests: list }) { if (!reqOn) return; setRequests(list); renderUI(); },
  note({ note: n }) { if (!reqOn) return; note = n; renderUI(); },
  quota(q) { if (!guest) return; if (q.left < (quota?.left ?? 99)) helpedHere = true; quota = q; renderUI(); },
}, netExtra);

// soft glowing dots where someone else is reaching, only for what's on screen at this zoom
const holdDots = new Map();
const holdDotMat = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  const halo = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  halo.addColorStop(0, "rgba(255,236,200,0.95)"); halo.addColorStop(0.4, "rgba(255,200,120,0.45)"); halo.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = halo; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false });
})();
function stepHoldDots(now) {
  const lv = viewLevel();
  for (const [id, dot] of holdDots) {
    if (!heldByOthers(id) || placed.has(id)) { scene.remove(dot.s); dot.s.material.dispose(); holdDots.delete(id); }
  }
  for (const id of held.keys()) {
    const it = items.get(id);
    const inView = lv !== null && it.level === lv && !placed.has(id);
    let dot = holdDots.get(id);
    if (!dot) {
      if (!inView) continue;
      const s = new THREE.Sprite(holdDotMat.clone()); s.renderOrder = 11; scene.add(s);
      const b = new THREE.Box3().setFromObject(it.obj);
      dot = { s, at: b.getCenter(new THREE.Vector3()) };
      holdDots.set(id, dot);
    }
    dot.s.visible = inView;
    const k = 0.05 * (free.h / Math.max(1, free.fullH)) * (reduced.matches ? 1 : 1 + 0.12 * Math.sin(now / 480));
    dot.s.scale.set(k, k, 1);
    dot.s.position.copy(dot.at);
    dot.s.material.opacity = reduced.matches ? 0.8 : 0.65 + 0.25 * Math.sin(now / 480);
  }
}

// presence + friends: quiet when someone's here, more visible when you're alone.
// Crit 10: a world shop's "invite" is now a real friend request (friendsbar.js),
// not a guest-token link — an open (non-world) shop keeps the old link-sharing
// invite.js button, since that feature (one open café, anyone with the link)
// is unrelated to accounts.
const invite = worldShop ? null : createInvite($("friends"), {
  link: shopUrl(shop),
  words: () => { const t = T(); return { label: t.inviteShort, title: t.invite, note: t.inviteNote, copy: t.copy, copied: t.copied, share: t.share, presence: present > 1 ? t.present(present) : "" }; },
  shareText: () => shopUrl(shop),
});
const friendsBar = worldShop ? createFriendsBar($("friends"), { lang: () => lang, live: !!account }) : null;
$("view-only-note-add").addEventListener("click", () => friendsBar?.open(ownerUsername));
const accountMenu = account ? createAccountMenu($("account"), {
  lang: () => lang, username: () => account.username,
  onLogout: () => { friendsBar?.stop(); location.href = "/"; },
}) : null;
// phones fold the header buttons into one ☰ list (barmenu.js). Made after the invite, so Esc folds the invite card first
createBarMenu($("menu-btn"), $("bar-menu"), ["who", "help", "friends", "account"]);
function renderPresence() {
  invite?.render();
  if (worldShop) $("friends").title = $("friends").ariaLabel = present > 1 ? T().present(present) : "";
}
addEventListener("pagehide", () => { if (drag) net.hold(drag.it.id, false); net.close(); });

// ---- loop --------------------------------------------------------------------
let lastSize = "";
function resize() {
  const t = $("tray").getBoundingClientRect();
  const w = canvas.clientWidth, h = canvas.clientHeight, key = `${w}x${h}|${Math.round(t.left)},${Math.round(t.top)}`;
  if (key === lastSize) return;
  lastSize = key;
  renderer.setSize(w, h, false);
  measure();
  if (!fly && !orbit) { const f = frame(view()); camera.position.copy(f.p); look.copy(f.t); }
}
const [rx0, rx1] = ROOM.x;
// what hangs on / sits against each wall hides with it, or it would float in the air
const onWall = storeys.map((s) => wallAttached(s.group, 35, 60, ROOM));
const itemOf = (o) => [...items.values()].find((it) => it.obj === o);
for (const on of onWall) for (const w of Object.keys(on)) on[w] = on[w].map((o) => ({ o, it: itemOf(o) }));
function tick(now) {
  resize();
  pumpThumbs();
  if (edit?.freeCam) { fly = orbit = null; edit.update(); }
  if (fly) {
    const k = fly.dur ? Math.min(1, (now - fly.t0) / fly.dur) : 1, e = ease(k);
    camera.position.lerpVectors(fly.from, fly.p, e);
    look.lerpVectors(fly.fromT, fly.t, e);
    if (k >= 1) {
      fly = null;
      if (orbitNext) { orbitNext = false; orbit = { t0: now, dur: 24000, from: camera.position.clone(), c: look.clone() }; }
    }
  }
  if (orbit) {
    const k = Math.min(1, (now - orbit.t0) / orbit.dur);
    const a = ease(k) * Math.PI * 2;
    const rel = orbit.from.clone().sub(orbit.c).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    camera.position.copy(orbit.c).add(rel);
    if (k >= 1) orbit = null;
  }
  if (!edit?.freeCam) camera.lookAt(look);
  // looking at the yard, the café stays a closed building seen from outside
  const outside = isYard(viewLevel());
  for (const s of storeys) {
    s.walls.left.visible = outside || camera.position.x > rx0;
    s.walls.right.visible = outside || camera.position.x < rx1;
    // while circling, the back wall hides when the camera is behind it
    s.walls.back.visible = camera.position.z > 0;
    const on = onWall[storeys.indexOf(s)];
    for (const w of ["left", "right", "back"]) {
      for (const { o, it } of on[w]) o.visible = s.walls[w].visible && (!it || placed.has(it.id));
    }
  }
  ghostMat.uniforms.uTime.value = now / 1000;
  stepAnims(now);
  stepGlow(now);
  stepMarker(now);
  stepHoldDots(now);
  stepReqGlow(now);
  stepOcclusion();
  weather.update(Math.min(0.1, (now - (tick.last ?? now)) / 1000), camera.position); tick.last = now;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
resize();
applyCut();
{ const f = frame(view()); camera.position.copy(f.p); look.copy(f.t); }
renderUI();
// read-only handle for poking at the page from devtools, only with ?debug
if (debug) globalThis.__play = { requests: () => requests, toggleReq, held, camera, free: () => free, items, placed, spot: (id) => spotOnScreen(items.get(id)), path: () => path, go, frame, topOf, wallOf };
// ---- a new season: one gentle card the first time this viewer sees it ---------
const seasonItems = [...items.values()].filter((it) => it.season === season);
let lastSeen = null;
try { lastSeen = localStorage.getItem(SEEN_KEY); } catch {}
function showSeasonCard() {
  const card = document.createElement("div");
  card.className = "hint-card season-card"; card.setAttribute("role", "dialog");
  const fill = () => {
    const t = T(), name = L(SEASON_NAME[season]);
    card.replaceChildren();
    const p = document.createElement("p"); p.className = "hint-title"; p.textContent = t.seasonCard(name, seasonItems.length);
    const c = document.createElement("p"); c.className = "small hint-close"; c.textContent = t.seasonClose;
    card.append(p, c);
  };
  fill();
  $("lang-toggle").addEventListener("click", fill);
  const close = () => { card.classList.add("fading"); setTimeout(() => card.remove(), reduced.matches ? 0 : 800); };
  card.addEventListener("click", close);
  canvas.addEventListener("pointerdown", () => { if (card.isConnected) { down = null; close(); } }, { once: true });
  document.querySelector(".stage").append(card);
}
const seasonNews = seasonItems.length > 0 && lastSeen !== season;
try { localStorage.setItem(SEEN_KEY, season); } catch {}
// a friend chooses each visit (once per tab: town → shop doesn't ask again); the owner only while unnamed
// only the owner gets opened automatically (while unnamed); a friend's identity
// toggle is optional and never forced open (see identity.js)
if (idCard && isOwner && !ownerName) idCard.open();
if (seasonNews) showSeasonCard();
else if (!hintSeen) showHint();
if (editMode) {
  const { createEditor } = await import("./editor.js");
  const byObj = new Map([...items.values()].map((it) => [it.obj, it]));
  edit = createEditor({
    name: rid(typeFromUrl()), scene, camera, canvas,
    pickFrom: () => { const v = view(), lv = viewLevel(); if (v.kind === "building" || v.kind === "storey") return []; return [...items.values()].filter((it) => lv === null || it.level === lv).map((it) => it.obj); },
    identify: (o) => { const it = byObj.get(o); return it ? { id: it.id, label: it.label.zh, obj: it.obj } : null; },
    viewId: () => { const v = view(); return v.kind === "item" ? { kind: v.kind, id: v.id } : v.kind === "zone" ? { kind: v.kind, level: v.level, zone: v.zone } : v.kind === "storey" ? { kind: v.kind, level: v.level } : { kind: v.kind }; },
    look: () => look,
    onFreeCam: (on) => { if (!on) go(path); },
    extraButtons: (sel) => {
      const it = sel && items.get(sel.id);
      return it && it.focus && it.children.length ? [["进入这件的视图", () => { edit.select(null); goInto({ kind: "item", id: it.id }); }]] : [];
    },
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && edit.freeCam) { e.stopImmediatePropagation(); edit.setFreeCam(false); } }, true);
  if (debug) globalThis.__edit = edit;
}
if (devTags) console.info("[play] dev fallback tags are active (no zone tags found)");
requestAnimationFrame(tick);
