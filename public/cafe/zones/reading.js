// Zone `reading` (level 1) — FOCAL point upstairs: one armchair in front of the back arched
// window (x 115…225, sill y 90), lamp behind it, side table beside it with an open book and
// a cup, a blanket over the arm. Coords storey-local (cm). The rest of the back wall stays bare.
import { TOP_Y as TABLE_Y } from "../../clay/models/side-table.js";

const L = (zh, en) => ({ zh, en });

export async function populate({ group, model, place }) {
  const add = (obj, at, tag) => {
    place(obj, at);
    obj.userData.item = { parent: null, layer: 1, ...tag };
    group.add(obj);
    return obj;
  };
  const item = async (name, opts, at, tag) => add(await model(name, { name: tag.id, ...opts }), at, tag);

  const chair = { x: 160, z: 110, turn: 18 };
  await item("armchair", { fabric: "blue", pillow: "mustard" }, { ...chair, y: 0 },
    { id: "l1-reading-armchair", label: L("窗边扶手椅", "Window armchair"), focus: true });
  // blanket over the chair's left arm (arm centre local x −33, top y 60)
  const t = (chair.turn * Math.PI) / 180;
  await item("blanket", { color: "terracotta", arm: 14, drop: 18 },
    { x: chair.x - 33 * Math.cos(t), y: 60, z: chair.z + 33 * Math.sin(t), turn: chair.turn },
    { id: "l1-reading-blanket", parent: "l1-reading-armchair", layer: 2, label: L("毛毯", "Blanket") });

  await item("floor-lamp", {}, { x: 85, y: 0, z: 60 },
    { id: "l1-reading-floor-lamp", label: L("落地灯", "Floor lamp") });

  const st = { x: 240, z: 120 };
  await item("side-table", { radius: 26 }, { ...st, y: 0 },
    { id: "l1-reading-side-table", label: L("边桌", "Side table"), focus: true });
  await item("open-book", { cover: "leaf" }, { x: st.x - 6, y: TABLE_Y, z: st.z + 2, turn: 70 },
    { id: "l1-reading-book", parent: "l1-reading-side-table", layer: 2, label: L("读了一半的书", "Book left open") });
  await item("coffee-cup", { colors: ["cream"], count: 1 }, { x: st.x + 12, y: TABLE_Y, z: st.z + 8, turn: -20 },
    { id: "l1-reading-cup", parent: "l1-reading-side-table", layer: 2, label: L("窗边咖啡杯", "Reading cup") });
}
