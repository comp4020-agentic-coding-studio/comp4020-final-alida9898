import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join as pathJoin, normalize } from "node:path";
import { marked } from "marked";
import { half, join, joinRoom, place, roomHalves, roomStatus } from "./db.ts";

const STICKERS_PATH = "assets/stickers.json";
const manifest = JSON.parse(await readFile(STICKERS_PATH, "utf8"));
// the layout editor writes straight to assets/stickers.json — a dev-only
// authoring tool, not something to leave reachable on the deployed app
const layoutEditingEnabled = process.env.NODE_ENV !== "production";
const MOUNTS = new Set(["wall", "flat", "floor", "surface"]);
type LayoutUpdate = {
  x: number; y: number; w: number; h: number;
  mount?: string; sit?: boolean; pinHost?: string; top?: number | null; z?: number;
};
const idsPerSide: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(manifest.sides).map(([side, list]) => [
    side,
    new Set((list as Array<{ id: string; bg?: boolean }>).filter((s) => !s.bg).map((s) => s.id)),
  ]),
);

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const send = (res: ServerResponse, status: number, body: string | Buffer, type = "text/plain; charset=utf-8") => {
  res.writeHead(status, { "content-type": type });
  res.end(body);
};
const json = (res: ServerResponse, status: number, body: unknown) => send(res, status, JSON.stringify(body), types[".json"]);

async function file(res: ServerResponse, root: string, rel: string) {
  const path = normalize(pathJoin(root, rel));
  if (!path.startsWith(normalize(root))) return send(res, 404, "not found");
  try {
    const body = await readFile(path);
    res.writeHead(200, {
      "content-type": types[extname(path)] ?? "application/octet-stream",
      "cache-control": "no-cache",
    });
    res.end(body);
  } catch {
    send(res, 404, "not found");
  }
}

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

async function readme(res: ServerResponse) {
  const md = await readFile("README.md", "utf8");
  const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>README</title><link rel="stylesheet" href="/readme.css"></head><body><main>${await marked.parse(md)}</main></body></html>`;
  send(res, 200, html, types[".html"]);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const p = url.pathname;
  let m: RegExpMatchArray | null;
  try {
    if (req.method === "POST" && p === "/api/join") return json(res, 200, join());
    if ((m = p.match(/^\/api\/rooms\/([\w-]+)\/join$/)) && req.method === "POST") {
      const result = joinRoom(m[1]);
      if ("error" in result) {
        return json(res, result.error === "not_found" ? 404 : 409, { error: result.error });
      }
      return json(res, 200, result);
    }
    if ((m = p.match(/^\/api\/rooms\/([\w-]+)\/status$/)) && req.method === "GET") {
      return json(res, 200, roomStatus(m[1]));
    }
    if ((m = p.match(/^\/api\/rooms\/([\w-]+)$/)) && req.method === "GET") {
      const r = roomHalves(m[1]);
      return r ? json(res, 200, r) : json(res, 404, { error: "unknown room" });
    }
    if ((m = p.match(/^\/api\/s\/([\w-]+)$/)) && req.method === "GET") {
      const h = half(m[1]);
      return h ? json(res, 200, { side: h.side, placed: h.placed, room: h.room }) : json(res, 404, { error: "unknown link" });
    }
    if ((m = p.match(/^\/api\/s\/([\w-]+)\/place$/)) && req.method === "POST") {
      const h = half(m[1]);
      if (!h) return json(res, 404, { error: "unknown link" });
      const stickerId = (await body(req)).id;
      if (typeof stickerId !== "string" || !idsPerSide[h.side]?.has(stickerId)) {
        return json(res, 400, { error: "unknown sticker" });
      }
      return json(res, 200, { placed: place(h.token, stickerId) });
    }
    if ((m = p.match(/^\/api\/layout\/([\w-]+)$/)) && req.method === "POST") {
      if (!layoutEditingEnabled) return json(res, 403, { error: "layout editing is disabled in production" });
      const side = m[1];
      const list = manifest.sides[side] as Array<Record<string, unknown>> | undefined;
      if (!list) return json(res, 404, { error: "unknown side" });
      const updates = (await body(req)) as Record<string, LayoutUpdate>;
      for (const s of list) {
        const u = updates[s.id as string];
        if (!u || ![u.x, u.y, u.w, u.h].every((n) => typeof n === "number" && Number.isFinite(n))) continue;
        s.x = Math.round(u.x);
        s.y = Math.round(u.y);
        s.w = Math.round(u.w);
        s.h = Math.round(u.h);
        if ("mount" in u && typeof u.mount === "string" && MOUNTS.has(u.mount)) s.mount = u.mount;
        if ("sit" in u) { if (u.sit) s.sit = true; else delete s.sit; }
        if ("pinHost" in u) { if (typeof u.pinHost === "string" && u.pinHost) s.pinHost = u.pinHost; else delete s.pinHost; }
        if ("top" in u) { if (typeof u.top === "number" && Number.isFinite(u.top)) s.top = Math.round(u.top * 100) / 100; else delete s.top; }
        if ("z" in u && typeof u.z === "number" && Number.isFinite(u.z)) s.z = Math.round(u.z);
      }
      await writeFile(STICKERS_PATH, JSON.stringify(manifest, null, 2) + "\n");
      return json(res, 200, { ok: true });
    }
    // dev-only: clay-test.html saves its rendered sticker drafts here (same guard as layout editing)
    if (p === "/api/clay/draft" && req.method === "POST") {
      if (!layoutEditingEnabled) return json(res, 403, { error: "draft saving is disabled in production" });
      const list = (await body(req)).stickers;
      if (!Array.isArray(list)) return json(res, 400, { error: "expected { stickers: [] }" });
      const dir = "assets/draft/clay";
      await mkdir(dir, { recursive: true });
      const boxes: Record<string, unknown> = {};
      for (const s of list as Array<Record<string, unknown>>) {
        const id = s.id, png = s.png;
        if (typeof id !== "string" || !/^[\w-]+$/.test(id) || typeof png !== "string" || !png.startsWith("data:image/png;base64,")) continue;
        await writeFile(pathJoin(dir, `${id}.png`), Buffer.from(png.slice(png.indexOf(",") + 1), "base64"));
        const { png: _png, ...meta } = s;
        boxes[id] = meta;
      }
      await writeFile(pathJoin(dir, "boxes.json"), JSON.stringify(boxes, null, 2) + "\n");
      return json(res, 200, { ok: true, saved: Object.keys(boxes).length });
    }
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "method not allowed");
    if (p === "/readme" || p === "/readme/") return readme(res);
    if (p.startsWith("/readme/docs/")) return file(res, "docs", p.slice("/readme/docs/".length));
    if (p === "/manifest.json") return json(res, 200, manifest);
    if ((m = p.match(/^\/s\/([\w-]+)$/))) {
      return half(m[1]) ? file(res, "public", "side.html") : send(res, 404, "这条链接不存在");
    }
    if ((m = p.match(/^\/house\/([\w-]+)$/))) {
      return half(m[1]) ? file(res, "public", "house.html") : send(res, 404, "这条链接不存在");
    }
    if (p === "/") return file(res, "public", "index.html");
    return file(res, "public", p.slice(1));
  } catch (e) {
    console.error(e);
    send(res, 500, "server error");
  }
});

const port = Number(process.env.PORT ?? 8080);
server.listen(port, "0.0.0.0", () => console.log(`listening on :${port}`));
