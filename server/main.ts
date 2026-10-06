import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join as pathJoin, normalize } from "node:path";
import { marked } from "marked";
import { advance, half, join } from "./db.ts";

const manifest = JSON.parse(await readFile("assets/stickers.json", "utf8"));
const stepsPerSide: Record<string, number> = Object.fromEntries(
  Object.entries(manifest.sides).map(([side, list]) => [side, (list as unknown[]).length]),
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
    if ((m = p.match(/^\/api\/s\/([\w-]+)$/)) && req.method === "GET") {
      const h = half(m[1]);
      return h ? json(res, 200, { side: h.side, step: h.step, room: h.room }) : json(res, 404, { error: "unknown link" });
    }
    if ((m = p.match(/^\/api\/s\/([\w-]+)\/step$/)) && req.method === "POST") {
      const h = half(m[1]);
      if (!h) return json(res, 404, { error: "unknown link" });
      const step = Number((await body(req)).step);
      if (!Number.isInteger(step) || !advance(h.token, step, stepsPerSide[h.side])) {
        return json(res, 409, { error: "not the next step", step: half(h.token)?.step });
      }
      return json(res, 200, { step });
    }
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "method not allowed");
    if (p === "/readme" || p === "/readme/") return readme(res);
    if (p.startsWith("/readme/docs/")) return file(res, "docs", p.slice("/readme/docs/".length));
    if (p === "/manifest.json") return json(res, 200, manifest);
    if ((m = p.match(/^\/s\/([\w-]+)$/))) {
      return half(m[1]) ? file(res, "public", "side.html") : send(res, 404, "这条链接不存在");
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
