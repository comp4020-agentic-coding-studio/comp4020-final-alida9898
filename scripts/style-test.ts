// Sample-only style comparison. Writes to assets/draft/style-test/<style>/ ; never touches the manifest.
// Usage: node scripts/style-test.ts <A|B> [model]
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";

const STYLES: Record<string, string> = {
  A: "soft 3D render, the object itself is crafted entirely from knitted wool and needle felt with visible fuzzy yarn fibres and stitches, softly stuffed rounded chunky proportions, no animals, no characters, no toys, no props, matte soft materials, warm brown cream and mustard palette with muted blue accents, soft diffuse studio light from the upper left, orthographic straight-on front elevation, camera exactly level and centered, not isometric, no three-quarter angle, no room, no props, ONLY this single object and nothing else, object centered, isolated on a pure white background, solid pure white #FFFFFF background, no cast shadow, no floor, no wall, no text",
  B: "soft 3D clay render, smooth matte clay material like a Dribbble clay 3D icon, rounded soft edges, simplified chunky proportions, warm brown cream and mustard palette with muted blue accents, soft diffuse studio light from the upper left, orthographic straight-on front elevation, camera exactly level and centered, not isometric, no three-quarter angle, no room, no props, ONLY this single object and nothing else, object centered, isolated on a pure white background, solid pure white #FFFFFF background, no cast shadow, no floor, no wall, no text",
};
const PROMPTS: Record<string, string> = {
  "l-machine": "a symmetrical front view of a vintage espresso machine in cream and copper, viewed exactly head-on, a plain flat top surface with nothing on it, no coffee beans, no steam, centered and symmetrical left-to-right",
  "r-chairs": "two blue armchairs side by side with an empty gap between them, front view, wide horizontal shape, no table",
  "l-plant": "a leafy green potted plant in a terracotta pot",
};
const [key, model = "recraft-v3", ...ids] = process.argv.slice(2);
const token = process.env.ANTHROPIC_AUTH_TOKEN;
const base = process.env.ANTHROPIC_BASE_URL ?? "https://strproxy.comp.anu.edu.au";
if (!token || !STYLES[key]) throw new Error("need token and style A|B");
const dir = `assets/draft/style-test/raw/${key}`;
await mkdir(dir, { recursive: true });
await Promise.all((ids.length ? ids : Object.keys(PROMPTS)).map(async (id) => {
  const prompt = `${PROMPTS[id]}. ${STYLES[key]}`;
  const size = id === "r-chairs" ? "1792x1024" : "1024x1024";
  const res = await fetch(`${base}/api/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ model, prompt, size, n: 1 }),
  });
  if (!res.ok) return console.error(`${id}: HTTP ${res.status} ${await res.text()}`);
  const url: string = (await res.json()).data[0].url;
  const file = `${dir}/${id}.png`;
  await writeFile(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
  await appendFile("assets/generations.jsonl", JSON.stringify({ id, file, model, size, prompt, draft: `style-${key}`, at: new Date().toISOString() }) + "\n");
  console.log(`${id}: ok ${model}`);
}));
