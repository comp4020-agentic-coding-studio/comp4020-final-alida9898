import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const post = (path: string, body?: unknown) =>
  api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });

it("joining fills the open half of a room before opening a new one", async () => {
  // the app may already hold a half-empty room; the first join fills that one
  let a = await (await post("/api/join")).json();
  if (!a.opened) a = await (await post("/api/join")).json();
  expect(a.opened).toBe(true);
  const b = await (await post("/api/join")).json();
  expect(a.room).toBe(b.room);
  expect(new Set([a.side, b.side])).toEqual(new Set(["left", "right"]));
  expect(a.token).not.toBe(b.token);
});

it("each half's link is its identity and its progress persists", async () => {
  const { token, side } = await (await post("/api/join")).json();
  expect((await (await api(`/api/s/${token}`)).json())).toMatchObject({ side, placed: [] });

  const manifest = await (await api("/manifest.json")).json();
  const [a, b] = manifest.sides[side].filter((s: { bg?: boolean }) => !s.bg);

  expect((await post(`/api/s/${token}/place`, { id: a.id })).status).toBe(200);
  expect((await post(`/api/s/${token}/place`, { id: b.id })).status).toBe(200);
  expect((await (await api(`/api/s/${token}`)).json()).placed).toEqual([a.id, b.id]);
});

it("stickers can be placed in any order, and re-placing one is a harmless no-op", async () => {
  const { token, side } = await (await post("/api/join")).json();
  const manifest = await (await api("/manifest.json")).json();
  const [a, b] = manifest.sides[side].filter((s: { bg?: boolean }) => !s.bg);

  await post(`/api/s/${token}/place`, { id: b.id });
  await post(`/api/s/${token}/place`, { id: a.id });
  expect((await (await api(`/api/s/${token}`)).json()).placed).toEqual([b.id, a.id]);

  // placing the same id again doesn't duplicate it
  const res = await post(`/api/s/${token}/place`, { id: a.id });
  expect(await res.json()).toEqual({ placed: [b.id, a.id] });
});

it("placing an unknown sticker id is rejected", async () => {
  const { token } = await (await post("/api/join")).json();
  expect((await post(`/api/s/${token}/place`, { id: "not-a-real-sticker" })).status).toBe(400);
  expect((await (await api(`/api/s/${token}`)).json()).placed).toEqual([]);
});

it("an unknown link is a 404, not a fresh half", async () => {
  expect((await api("/api/s/not-a-real-token")).status).toBe(404);
});

it("the side page is served for a half's link", async () => {
  const { token } = await (await post("/api/join")).json();
  const res = await api(`/s/${token}`);
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("<div id=\"scene\"");
});

it("an invite link joins the specific room it names, not a random one", async () => {
  // force a fresh, empty room: fill any already-open half first
  let a = await (await post("/api/join")).json();
  if (!a.opened) a = await (await post("/api/join")).json();
  expect(a.opened).toBe(true);

  expect(await (await api(`/api/rooms/${a.room}/status`)).json()).toEqual({ exists: true, full: false });

  const b = await (await post(`/api/rooms/${a.room}/join`)).json();
  expect(b.room).toBe(a.room);
  expect(new Set([a.side, b.side])).toEqual(new Set(["left", "right"]));

  expect(await (await api(`/api/rooms/${a.room}/status`)).json()).toEqual({ exists: true, full: true });
});

it("an invite link rejects a third person once the room is full", async () => {
  let a = await (await post("/api/join")).json();
  if (!a.opened) a = await (await post("/api/join")).json();
  await post(`/api/rooms/${a.room}/join`);
  expect((await post(`/api/rooms/${a.room}/join`)).status).toBe(409);
});

it("an invite link for an unknown room is a 404", async () => {
  expect((await post("/api/rooms/not-a-real-room/join")).status).toBe(404);
  expect(await (await api("/api/rooms/not-a-real-room/status")).json()).toEqual({ exists: false, full: false });
});

it("a room returns both halves' placed stickers, and an unknown room is a 404", async () => {
  let a = await (await post("/api/join")).json();
  if (!a.opened) a = await (await post("/api/join")).json();
  const b = await (await post("/api/join")).json();
  const manifest = await (await api("/manifest.json")).json();
  const first = manifest.sides[a.side].find((s: { bg?: boolean }) => !s.bg);
  await post(`/api/s/${a.token}/place`, { id: first.id });

  const room = await (await api(`/api/rooms/${a.room}`)).json();
  expect(room[a.side]).toEqual([first.id]);
  expect(room[b.side]).toEqual([]);
  expect((await api("/api/rooms/not-a-real-room")).status).toBe(404);
});

it("the house page is served for a half's link", async () => {
  const { token } = await (await post("/api/join")).json();
  const res = await api(`/house/${token}`);
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("<canvas id=\"house\"");
});
