// The café shop type. Its building data stays where it always lived
// (public/cafe/zones.js + public/cafe/zones/*.js) — this file only points at it,
// and adds the yard and the seasonal decor. Shape: ../README.md.
import { ROOM, LEVELS, TUBE } from "../../cafe/zones.js";
import { YARD } from "./yard/index.js";

export default {
  name: { zh: "咖啡馆", en: "Café" },
  loading: { zh: "正在把咖啡馆捏出来……", en: "Shaping the café out of clay…" },
  room: ROOM,
  levels: LEVELS,
  tube: TUBE, // the copper bean tube through every storey (null for shops without one)
  zone: (id) => import(`../../cafe/zones/${id}.js`),
  yard: YARD,
  seasons: {
    spring: () => import("./seasons/spring.js"),
    // summer / autumn / winter: planned in ../README.md, not built yet
  },
};
