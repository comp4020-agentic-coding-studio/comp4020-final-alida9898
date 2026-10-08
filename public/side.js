const token = location.pathname.split("/").pop();
const SNAP = 130; // scene units (canvas is 1000 wide)

const $ = (id) => document.getElementById(id);
const scene = $("scene");
const sheet = $("sheet");

const [state, manifest] = await Promise.all([
  fetch(`/api/s/${token}`).then((r) => r.json()),
  fetch("/manifest.json").then((r) => r.json()),
]);
try { localStorage.setItem("my-half", token); } catch {}

const W = manifest.canvas.w;
const all = manifest.sides[state.side];
const bg = all.find((s) => s.bg);
const stickers = all.filter((s) => !s.bg).sort((a, b) => a.step - b.step);
const placedSet = new Set(state.placed);

const TEXT = {
  zh: {
    where: { left: "你在拼：店门口和柜台", right: "你在拼：里屋的座位" },
    hintDrag: "把贴纸揭下来，对准淡淡的轮廓贴上去；想先拼哪个都行，数字只是建议顺序",
    hintDone: "拼完啦。隔壁那一半，也有人在慢慢拼。",
    house: "走进这间屋子看看 →",
    stickerAlt: (n) => `第 ${n} 张贴纸`,
    inviteLine: "对面还没人 —— 把这条链接发给搭子，邀请对方来拼另一半：",
    copy: "复制",
    footer: "这条链接就是你的那一半，收藏好它就能回来继续。",
    toggle: "EN",
    brand: "小镇一角",
  },
  en: {
    where: { left: "You're building: the shop front and counter", right: "You're building: the seating inside" },
    hintDrag: "Peel a sticker off and line it up with the faint outline — pick any one, the numbers are just a suggested order",
    hintDone: "All done. Someone's slowly building the other half too.",
    house: "Step into the room →",
    stickerAlt: (n) => `Sticker ${n}`,
    inviteLine: "No one on the other side yet — send this link to a friend to invite them:",
    copy: "Copy",
    footer: "This link is your half — save it to come back and keep going.",
    toggle: "中文",
    brand: "A Corner of Town",
  },
};
const LANG_KEY = "lang";
let lang = "zh";
try { lang = localStorage.getItem(LANG_KEY) || "zh"; } catch {}

function applyStaticLang() {
  const t = TEXT[lang];
  document.documentElement.lang = lang === "zh" ? "zh" : "en";
  $("brand").textContent = t.brand;
  $("where").textContent = t.where[state.side];
  $("invite-line").textContent = t.inviteLine;
  $("copy-invite").textContent = t.copy;
  $("footer-caption").textContent = t.footer;
  $("lang-toggle").textContent = t.toggle;
}
applyStaticLang();
$("lang-toggle").addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  applyStaticLang();
  render();
});

const inviteLink = `${location.origin}/?invite=${state.room}`;
const banner = $("invite-banner");
$("invite-link").href = inviteLink;
$("invite-link").textContent = inviteLink;
$("copy-invite").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(inviteLink); } catch {}
});
(async function pollPartner() {
  try {
    const s = await fetch(`/api/rooms/${state.room}/status`).then((r) => r.json());
    banner.hidden = s.full;
    if (s.full) return;
  } catch {}
  setTimeout(pollPartner, 4000);
})();

const src = (s) => `/stickers/${s.id}.webp`;

// Fit each sticker inside its box, bottom-centred, so it stands on its baseline.
const images = await Promise.all(
  stickers.map(
    (s) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src(s);
      }),
  ),
);
const rectById = new Map(
  stickers.map((s, i) => {
    const img = images[i];
    const k = Math.min(s.w / img.naturalWidth, s.h / img.naturalHeight);
    const w = img.naturalWidth * k;
    const h = img.naturalHeight * k;
    return [s.id, { x: s.x + (s.w - w) / 2, y: s.y + s.h - h, w, h }];
  }),
);

const pct = (v) => `${(v / W) * 100}%`;
function placeEl(el, r, z) {
  Object.assign(el.style, { left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h), zIndex: z });
}

// id of the sticker that just landed, so it gets one soft "press" bounce
let justPlaced = null;

function render() {
  scene.replaceChildren();
  const base = document.createElement("img");
  base.src = src(bg);
  base.alt = "";
  Object.assign(base.style, { left: 0, top: 0, width: "100%", height: "100%", zIndex: 0 });
  scene.append(base);
  for (const s of stickers) {
    if (!placedSet.has(s.id)) continue;
    const el = document.createElement("img");
    el.src = src(s);
    el.alt = "";
    el.draggable = false;
    el.className = "placed" + (s.id === justPlaced ? " pressed" : "");
    placeEl(el, rectById.get(s.id), s.z);
    scene.append(el);
  }
  justPlaced = null;

  $("progress").textContent = `${placedSet.size} / ${stickers.length}`;
  const done = placedSet.size >= stickers.length;
  $("hint").textContent = TEXT[lang][done ? "hintDone" : "hintDrag"];
  document.body.classList.toggle("done", done);
  // the 3D room is the reward, so it only appears once this half is finished
  $("house-link").hidden = !done;
  $("house-link").href = `/house/${token}`;
  $("house-link").textContent = TEXT[lang].house;

  sheet.replaceChildren();
  stickers.forEach((s, i) => {
    const cell = document.createElement("div");
    cell.className = "peel mini";
    if (placedSet.has(s.id)) {
      cell.classList.add("empty");
      sheet.append(cell);
      return;
    }
    cell.innerHTML = `<span class="num">${i + 1}</span>`;
    const img = document.createElement("img");
    img.src = src(s);
    img.alt = TEXT[lang].stickerAlt(i + 1);
    img.draggable = false;
    cell.append(img);
    cell.addEventListener("pointerdown", (e) => startDrag(e, s, img));
    sheet.append(cell);
  });
}

function startDrag(e, s, fromImg) {
  e.preventDefault();
  const r = rectById.get(s.id);
  const scale = scene.getBoundingClientRect().width / W;
  const w = r.w * scale;
  const h = r.h * scale;
  const fly = document.createElement("img");
  fly.src = fromImg.src;
  fly.className = "flying";
  Object.assign(fly.style, { width: `${w}px`, height: `${h}px` });
  document.body.append(fly);
  fromImg.style.visibility = "hidden";
  // only shown while this sticker is actually being dragged, so the scene
  // stays uncluttered the rest of the time
  const ghost = document.createElement("img");
  ghost.src = fromImg.src;
  ghost.className = "guide";
  placeEl(ghost, r, 999);
  scene.append(ghost);
  const move = (ev) => {
    fly.style.transform = `translate(${ev.clientX - w / 2}px, ${ev.clientY - h / 2}px) rotate(-3deg)`;
  };
  move(e);
  const up = (ev) => {
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    ghost.remove();
    const box = scene.getBoundingClientRect();
    const cx = (ev.clientX - box.left) / scale;
    const cy = (ev.clientY - box.top) / scale;
    const hit = Math.hypot(cx - (r.x + r.w / 2), cy - (r.y + r.h / 2)) < SNAP;
    if (hit) {
      fly.classList.add("snap");
      fly.style.transform = `translate(${box.left + r.x * scale}px, ${box.top + r.y * scale}px)`;
      fly.addEventListener("transitionend", () => { fly.remove(); commit(s); }, { once: true });
    } else {
      const home = fromImg.getBoundingClientRect();
      fly.classList.add("back");
      fly.style.transform = `translate(${home.left + home.width / 2 - w / 2}px, ${home.top + home.height / 2 - h / 2}px) scale(.4)`;
      fly.addEventListener("transitionend", () => { fly.remove(); fromImg.style.visibility = ""; }, { once: true });
    }
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
}

async function commit(s) {
  placedSet.add(s.id);
  justPlaced = s.id;
  render();
  const res = await fetch(`/api/s/${token}/place`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: s.id }),
  });
  if (!res.ok) {
    const fresh = await fetch(`/api/s/${token}`).then((r) => r.json());
    placedSet.clear();
    for (const id of fresh.placed) placedSet.add(id);
    render();
  }
}

render();
