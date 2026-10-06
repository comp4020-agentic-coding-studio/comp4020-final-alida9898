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
const stickers = [...manifest.sides[state.side]].sort((a, b) => a.step - b.step);
let step = state.step;

$("where").textContent = state.side === "left" ? "你在拼：店门口和柜台" : "你在拼：里屋的座位";

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
const rects = stickers.map((s, i) => {
  const img = images[i];
  const k = Math.min(s.w / img.naturalWidth, s.h / img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  return { x: s.x + (s.w - w) / 2, y: s.y + s.h - h, w, h };
});

const pct = (v) => `${(v / W) * 100}%`;
function placeEl(el, r, z) {
  Object.assign(el.style, { left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h), zIndex: z });
}

function render() {
  scene.replaceChildren();
  stickers.forEach((s, i) => {
    if (i >= step && i !== step) return;
    const el = document.createElement("img");
    el.src = src(s);
    el.alt = "";
    el.draggable = false;
    el.className = i < step ? "placed" : "guide";
    placeEl(el, rects[i], i < step ? s.z : 999);
    scene.append(el);
  });
  $("progress").textContent = `${Math.min(step, stickers.length)} / ${stickers.length}`;
  sheet.replaceChildren();
  if (step >= stickers.length) {
    $("hint").textContent = "拼完啦。隔壁那一半，也有人在慢慢拼。";
    document.body.classList.add("done");
    return;
  }
  const s = stickers[step];
  const peel = document.createElement("div");
  peel.className = "peel";
  peel.innerHTML = `<span class="num">${step + 1}</span>`;
  const img = document.createElement("img");
  img.src = src(s);
  img.alt = `第 ${step + 1} 张贴纸`;
  img.draggable = false;
  peel.append(img);
  peel.addEventListener("pointerdown", (e) => startDrag(e, s, img));
  sheet.append(peel);
}

function startDrag(e, s, fromImg) {
  e.preventDefault();
  const r = rects[step];
  const scale = scene.getBoundingClientRect().width / W;
  const w = r.w * scale;
  const h = r.h * scale;
  const fly = document.createElement("img");
  fly.src = fromImg.src;
  fly.className = "flying";
  Object.assign(fly.style, { width: `${w}px`, height: `${h}px` });
  document.body.append(fly);
  fromImg.style.visibility = "hidden";
  const move = (ev) => {
    fly.style.transform = `translate(${ev.clientX - w / 2}px, ${ev.clientY - h / 2}px) rotate(-3deg)`;
  };
  move(e);
  const up = (ev) => {
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    const box = scene.getBoundingClientRect();
    const cx = (ev.clientX - box.left) / scale;
    const cy = (ev.clientY - box.top) / scale;
    const inside = cx >= 0 && cy >= 0 && cx <= W && cy <= W;
    const hit = s.bg ? inside : Math.hypot(cx - (r.x + r.w / 2), cy - (r.y + r.h / 2)) < SNAP;
    if (hit) {
      fly.classList.add("snap");
      fly.style.transform = `translate(${box.left + r.x * scale}px, ${box.top + r.y * scale}px)`;
      fly.addEventListener("transitionend", () => { fly.remove(); commit(); }, { once: true });
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

async function commit() {
  step += 1;
  render();
  scene.children[step - 1]?.classList.add("pressed");
  const res = await fetch(`/api/s/${token}/step`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ step }),
  });
  if (!res.ok) {
    step = (await fetch(`/api/s/${token}`).then((r) => r.json())).step;
    render();
  }
}

render();
