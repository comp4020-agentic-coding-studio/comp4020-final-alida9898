import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const send = (method: string, path: string, body?: unknown) =>
  api(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
const newWorld = async () => (await (await send("POST", "/api/worlds")).json()) as {
  world: string; owner: string; guest: string; shops: Record<string, string>;
};
const uid = () => `h-${Math.random().toString(36).slice(2, 12)}`;

it("a new town has no name; the owner names it and both roles read it back", async () => {
  const w = await newWorld();
  const owner = async () => (await api(`/api/worlds/${w.world}?t=${w.owner}`)).json();
  expect((await owner()).ownerName).toBe("");
  const r = await send("PUT", `/api/worlds/${w.world}/name`, { t: w.owner, name: "  小美  " });
  expect(r.status).toBe(200);
  expect((await r.json()).ownerName).toBe("小美");
  expect((await owner()).ownerName).toBe("小美");
  const g = await (await api(`/api/worlds/${w.world}?t=${w.guest}&helper=${uid()}`)).json();
  expect(g.ownerName).toBe("小美");
});

it("only the owner may rename; names over 12 code points are refused", async () => {
  const w = await newWorld();
  expect((await send("PUT", `/api/worlds/${w.world}/name`, { t: w.guest, name: "x" })).status).toBe(403);
  expect((await send("PUT", `/api/worlds/${w.world}/name`, { name: "x" })).status).toBe(403);
  expect((await send("PUT", `/api/worlds/${w.world}/name`, { t: w.owner, name: "一二三四五六七八九十一二" })).status).toBe(200);
  const long = await send("PUT", `/api/worlds/${w.world}/name`, { t: w.owner, name: "一二三四五六七八九十一二三" });
  expect(long.status).toBe(400);
  expect((await long.json()).error).toBe("too_long");
});

it("a guest's helperName is recorded and the owner sees it in helpers", async () => {
  const w = await newWorld();
  const helper = uid();
  const p = await send("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-1", client: helper, t: w.guest, helper, helperName: "阿明" });
  expect(p.status).toBe(200);
  await send("POST", `/api/shops/${w.shops.book}/place`, { item: "b-1", client: helper, t: w.guest, helper });
  const o = await (await api(`/api/worlds/${w.world}?t=${w.owner}`)).json();
  expect(o.helpers).toEqual([{ name: "阿明", count: 2 }]);
  const tooLong = await send("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-2", client: helper, t: w.guest, helper, helperName: "x".repeat(13) });
  expect(tooLong.status).toBe(400);
});

it("a friend who switches to anonymous sends an empty helperName and is no longer named", async () => {
  const w = await newWorld();
  const helper = uid();
  await send("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-1", client: helper, t: w.guest, helper, helperName: "阿明" });
  const p = await send("POST", `/api/shops/${w.shops.cafe}/place`, { item: "a-2", client: helper, t: w.guest, helper, helperName: "" });
  expect(p.status).toBe(200);
  const o = await (await api(`/api/worlds/${w.world}?t=${w.owner}`)).json();
  expect(o.helpers.some((h: { name: string }) => h.name === "阿明")).toBe(false);
});

it("the owner can't clear the town's name: a blank name is refused", async () => {
  const w = await newWorld();
  await send("PUT", `/api/worlds/${w.world}/name`, { t: w.owner, name: "Jiayi" });
  const r = await send("PUT", `/api/worlds/${w.world}/name`, { t: w.owner, name: "   " });
  expect(r.status).toBe(400);
  expect((await r.json()).error).toBe("empty");
  expect((await (await api(`/api/worlds/${w.world}?t=${w.owner}`)).json()).ownerName).toBe("Jiayi");
});
