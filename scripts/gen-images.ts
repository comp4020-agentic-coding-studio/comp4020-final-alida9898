// Usage: node scripts/gen-images.ts [--only id,id] [--model flux-schnell] [--out dir] [--force]
import { readFile, writeFile, mkdir, appendFile, access } from "node:fs/promises";

type Sticker = { id: string; w: number; h: number; bg?: boolean; model: string; prompt: string };
type Manifest = { style: string; bgStyle: string; sides: Record<string, Sticker[]>; textures: Sticker[] };

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = flag("only")?.split(",");
const modelOverride = flag("model");
const outDir = flag("out") ?? "assets/raw";
const force = args.includes("--force");

const token = process.env.ANTHROPIC_AUTH_TOKEN;
const base = process.env.ANTHROPIC_BASE_URL ?? "https://strproxy.comp.anu.edu.au";
if (!token) throw new Error("ANTHROPIC_AUTH_TOKEN is not set");

const manifest: Manifest = JSON.parse(await readFile("assets/stickers.json", "utf8"));
const textureIds = new Set(manifest.textures.map((t) => t.id));
const stickers = [...Object.values(manifest.sides).flat().filter((s) => !s.bg), ...manifest.textures].filter((s) => !only || only.includes(s.id));
await mkdir(outDir, { recursive: true });

const sizeFor = (s: Sticker) =>
  s.w / s.h > 1.4 ? "1792x1024" : s.h / s.w > 1.4 ? "1024x1792" : "1024x1024";

await Promise.all(
  stickers.map(async (s) => {
    const file = `${outDir}/${s.id}.png`;
    if (!force && (await access(file).then(() => true, () => false))) return;
    const model = modelOverride ?? s.model;
    const prompt = textureIds.has(s.id) ? s.prompt : `${s.prompt}. ${manifest.style}`;
    const size = sizeFor(s);
    const res = await fetch(`${base}/api/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ model, prompt, size, n: 1 }),
    });
    if (!res.ok) {
      console.error(`${s.id}: HTTP ${res.status} ${await res.text()}`);
      return;
    }
    const url: string = (await res.json()).data[0].url;
    const img = await fetch(url);
    await writeFile(file, Buffer.from(await img.arrayBuffer()));
    await appendFile(
      "assets/generations.jsonl",
      JSON.stringify({ id: s.id, file, model, size, prompt, at: new Date().toISOString() }) + "\n",
    );
    console.log(`${s.id}: ok (${model})`);
  }),
);
