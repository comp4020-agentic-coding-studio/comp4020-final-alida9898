// Zone `lounge` (level 1) — two loveseats facing each other across a low coffee table
// (teapot + two cups, as if a pair just poured), a mixed bookshelf on the right wall, and
// two plants on the right arched window's sill (z 205…315, sill y 90). Coords storey-local (cm).
// Everything stays at z ≤ 420 — the front of the slab is left empty on purpose.
import { SHELF_Y } from "../../clay/models/bookshelf.js";
import { sofa, cushion, table, teapot, recordPlayer, vase } from "../placeholder.js";

const L = (zh, en) => ({ zh, en });

export async function populate({ kit, THREE, group, model, place }) {
  const add = (obj, at, tag) => {
    place(obj, at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  const item = async (name, opts, at, tag) => add(await model(name, { name: tag.id, ...opts }), at, tag);

  // ---------------------------------------------------------------- facing loveseats
  const SZ = 300;
  const seats = [
    { x: 80, turn: 90, color: "leaf", pillow: "cream" },
    { x: 262, turn: -90, color: 0xb98a6a, pillow: "blue" },
  ];
  for (const [i, s] of seats.entries()) {
    const n = i + 1, id = `l1-lounge-sofa-${n}`;
    add(sofa(kit, { name: id, w: 120, d: 70, color: s.color }), { x: s.x, y: 0, z: SZ, turn: s.turn },
      { id, label: L(`双人沙发 ${n}`, `Loveseat ${n}`), focus: true });
    // pillow in one corner, leaning on the back
    const back = s.turn > 0 ? -1 : 1;
    add(cushion(kit, { name: `l1-lounge-pillow-${n}`, color: s.pillow }), { x: s.x + back * 16, y: 50, z: SZ - 28 * back, turn: s.turn },
      { id: `l1-lounge-pillow-${n}`, parent: id, layer: 2, label: L(`抱枕 ${n}`, `Pillow ${n}`) });
  }
  const CT = "l1-lounge-coffee-table", TH = 42;
  add(table(kit, { name: CT, w: 60, d: 90, h: TH, top: "cream", wood: "brown" }), { x: 171, y: 0, z: SZ },
    { id: CT, label: L("矮茶几", "Low coffee table"), focus: true });
  add(teapot(kit, { name: "l1-lounge-teapot" }), { x: 171, y: TH, z: SZ - 12 },
    { id: "l1-lounge-teapot", parent: CT, layer: 2, label: L("茶壶", "Teapot") });
  const cups = [[-14, 16, "terracotta"], [14, 22, "blue"]];
  for (const [i, [dx, dz, c]] of cups.entries()) {
    await item("coffee-cup", { colors: [c], count: 1 }, { x: 171 + dx, y: TH, z: SZ + dz, turn: i ? 60 : -40 },
      { id: `l1-lounge-cup-${i + 1}`, parent: CT, layer: 2, label: L(`茶杯 ${i + 1}`, `Teacup ${i + 1}`) });
  }

  // ---------------------------------------------------------------- mixed bookshelf (right wall)
  const SH = "l1-lounge-bookshelf", SHX = 285, SHZ = 392, W = 56;
  add(await model("bookshelf", { name: SH, width: W }), { x: SHX, y: 0, z: SHZ, turn: -90 },
    { id: SH, label: L("书架", "Bookshelf"), focus: true });
  const on = { parent: SH, layer: 2 };
  const fx = SHX - 2; // a little in front of the back panel
  // row 0: record player · row 1: five books · row 2: plant + vase · row 3: photo frame + plant
  add(recordPlayer(kit, { name: "l1-lounge-record-player" }), { x: fx, y: SHELF_Y[0], z: SHZ, turn: -90 },
    { id: "l1-lounge-record-player", ...on, label: L("唱片机", "Record player") });
  const gen = await model("books", { name: "l1-lounge-books", seed: 11, count: 5 });
  for (let i = 0; i < 5; i++) {
    const p = gen.getObjectByName(`l1-lounge-books-${i}`);
    p.removeFromParent();
    const g = new THREE.Group(); g.name = p.name; g.add(p);
    add(g, { x: fx, y: SHELF_Y[1] - 3, z: SHZ - 4, turn: -90 },
      { id: `l1-lounge-book-${i + 1}`, ...on, label: L(`书 ${i + 1}`, `Book ${i + 1}`) });
  }
  await item("plant", { potScale: 0.5, leafScale: 0.45 }, { x: fx, y: SHELF_Y[2], z: SHZ + 12, turn: -90 },
    { id: "l1-lounge-shelf-plant-1", ...on, label: L("书架小盆栽 1", "Shelf plant 1") });
  add(vase(kit, { name: "l1-lounge-vase" }), { x: fx, y: SHELF_Y[2], z: SHZ - 12, turn: -90 },
    { id: "l1-lounge-vase", ...on, label: L("花瓶", "Vase") });
  await item("picture-frame", { width: 20, height: 24, art: "sun", frame: "mustard", colors: ["mustard", "cream", "terracotta"] },
    { x: fx - 4, y: SHELF_Y[3], z: SHZ - 10, turn: -90 },
    { id: "l1-lounge-photo", ...on, label: L("相框", "Photo frame") });
  await item("plant", { potScale: 0.45, leafScale: 0.4, color: 0x6f8f4e }, { x: fx, y: SHELF_Y[3], z: SHZ + 14, turn: -90 },
    { id: "l1-lounge-shelf-plant-2", ...on, label: L("书架小盆栽 2", "Shelf plant 2") });

  // ---------------------------------------------------------------- window sill plants
  for (const [i, z] of [228, 292].entries()) {
    await item("plant", { potScale: 0.55, leafScale: 0.5, color: i ? 0x8aa868 : "leaf" }, { x: 292, y: 90, z, turn: -90 },
      { id: `l1-lounge-sill-plant-${i + 1}`, layer: 2, label: L(`窗台盆栽 ${i + 1}`, `Sill plant ${i + 1}`) });
  }
}
