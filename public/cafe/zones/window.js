// Zone `window` (level 0) — the quiet side: a bay seat under the back arched window, the
// chalkboard beside it, and a banquette booth along the stair side. Coords storey-local (cm).
//
// Layout (top view):
//   bay seat     x −265…−135, z 0…60 under the arched window (x −250…−150, sill y 110):
//                three cushions against the wall, a tray with a glass of tea on it.
//   chalkboard   back wall, x −146…−70, right of the window; six chalk decals.
//   banquette    x −210…−155, z 190…350, back against the stair stringer, facing +X.
//                One long table (x −155…−95, z 195…345) in front of it, two backed chairs
//                opposite; on it: half-eaten cake, open book, two cups.
import { FACE } from "../../clay/models/chalkboard.js";
import { baySeat, cushion, tray, banquette, table, backedChair } from "../placeholder.js";

const L = (zh, en) => ({ zh, en });

export async function populate({ kit, group, model, place }) {
  const add = (obj, at, tag) => {
    place(obj, at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  const item = async (name, opts, at, tag) => add(await model(name, { name: tag.id, ...opts }), at, tag);

  // ---------------------------------------------------------------- bay seat
  const BAY = "l0-window-bay-seat", BX = -200, BZ = 30, BH = 45;
  add(baySeat(kit, { name: BAY, w: 130, d: 60, h: BH }), { x: BX, y: 0, z: BZ },
    { id: BAY, label: L("飘窗座", "Bay window seat"), focus: true });
  const cush = [["mustard", -40, -6], ["blue", 0, 0], ["terracotta", 38, 8]];
  for (const [i, [c, dx, t]] of cush.entries()) {
    add(cushion(kit, { name: `l0-window-cushion-${i + 1}`, color: c }), { x: BX + dx, y: BH, z: 10, turn: t },
      { id: `l0-window-cushion-${i + 1}`, parent: BAY, layer: 2, label: L(`靠垫 ${i + 1}`, `Cushion ${i + 1}`) });
  }
  add(tray(kit, { name: "l0-window-tray" }), { x: BX + 20, y: BH, z: 42, turn: 8 },
    { id: "l0-window-tray", parent: BAY, layer: 2, label: L("小托盘", "Little tray") });
  await item("glass-tea", {}, { x: BX + 24, y: BH + 2.5, z: 42 },
    { id: "l0-window-tea", parent: "l0-window-tray", layer: 3, label: L("一杯茶", "Glass of tea") });

  // ---------------------------------------------------------------- chalkboard (back wall)
  const BOARD = "l0-window-chalkboard", CX = -108, CY = 118, W = 76, H = 58, k = W / 84;
  add(await model("chalkboard", { name: BOARD, width: W, height: H }), { x: CX, y: CY, z: 0 },
    { id: BOARD, label: L("小黑板", "Chalkboard"), focus: true });
  // decal centres as offsets from the board's bottom-centre (from the old left-wall layout, scaled)
  const DECALS = [
    { kind: "special", color: "white", dx: 0, dy: 49, zh: "今日特供", en: "Today's special" },
    { kind: "cup", color: "white", dx: -26, dy: 32, zh: "粉笔咖啡杯", en: "Chalk cup" },
    { kind: "heart", color: "pink", dx: -1, dy: 32, zh: "粉笔爱心", en: "Chalk heart" },
    { kind: "croissant", color: "yellow", dx: 25, dy: 33, zh: "粉笔可颂", en: "Chalk croissant" },
    { kind: "price", color: "green", dx: -5, dy: 17, zh: "价签 $4", en: "Price tag $4" },
    { kind: "star", color: "yellow", dx: -29, dy: 17, zh: "粉笔星星", en: "Chalk star" },
  ];
  for (const d of DECALS) {
    const id = `l0-window-chalk-${d.kind}`;
    const obj = await model("chalk-decal", { name: id, kind: d.kind, color: d.color });
    add(obj, { x: CX + d.dx * k, y: CY + d.dy * k, z: FACE + 0.1, scale: 0.9 },
      { id, parent: BOARD, layer: 2, label: L(d.zh, d.en) });
  }

  // ---------------------------------------------------------------- banquette booth
  const BQ = "l0-window-banquette";
  add(banquette(kit, { name: BQ, w: 160, d: 55, color: "terracotta" }), { x: -182, y: 0, z: 270, turn: 90 },
    { id: BQ, label: L("卡座长椅", "Banquette"), focus: true });
  // one long table in front of the banquette, a backed chair opposite each end,
  // as if two guests just stepped away
  const TID = "l0-window-table", TX = -125, TZ = 270, TH = 72;
  add(table(kit, { name: TID, w: 60, d: 150, h: TH }), { x: TX, y: 0, z: TZ },
    { id: TID, label: L("卡座长桌", "Booth long table"), focus: true });
  for (const [i, [z, seat]] of [[230, "mustard"], [310, "blue"]].entries()) {
    const n = i + 1;
    add(backedChair(kit, { name: `l0-window-chair-${n}`, seat }), { x: -72, y: 0, z, turn: -90 },
      { id: `l0-window-chair-${n}`, label: L(`卡座靠背椅 ${n}`, `Booth chair ${n}`) });
  }
  const things = [
    ["cake-plate", { sponge: "brown" }, -6, 222, 10, "吃了一半的蛋糕", "Half-eaten cake", "cake"],
    ["coffee-cup", { colors: ["cream"], count: 1 }, 12, 240, -30, "卡座咖啡杯 1", "Booth cup 1", "cup-1"],
    ["open-book", { cover: "leaf" }, -4, 310, 80, "摊开的书", "Open book", "book"],
    ["coffee-cup", { colors: ["blue"], count: 1 }, 14, 296, 20, "卡座咖啡杯 2", "Booth cup 2", "cup-2"],
  ];
  for (const [m, opts, dx, z, turn, zh, en, slug] of things) {
    await item(m, opts, { x: TX + dx, y: TH, z, turn },
      { id: `l0-window-${slug}`, parent: TID, layer: 2, label: L(zh, en) });
  }
}
