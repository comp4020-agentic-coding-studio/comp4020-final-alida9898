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
  expect((await (await api(`/api/s/${token}`)).json())).toMatchObject({ side, step: 0 });

  expect((await post(`/api/s/${token}/step`, { step: 1 })).status).toBe(200);
  expect((await post(`/api/s/${token}/step`, { step: 2 })).status).toBe(200);
  expect((await (await api(`/api/s/${token}`)).json()).step).toBe(2);
});

it("steps only advance one at a time", async () => {
  const { token } = await (await post("/api/join")).json();
  expect((await post(`/api/s/${token}/step`, { step: 3 })).status).toBe(409);
  expect((await (await api(`/api/s/${token}`)).json()).step).toBe(0);
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
