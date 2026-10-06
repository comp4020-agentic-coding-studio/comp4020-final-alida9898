import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const post = (path: string, body?: unknown) =>
  api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });

it("the layout endpoint writes a sticker's position, or is off in production", async () => {
  const before = await (await api("/manifest.json")).json();
  const sticker = before.sides.left.find((s: { bg?: boolean }) => !s.bg);
  const original = { x: sticker.x, y: sticker.y, w: sticker.w, h: sticker.h };
  const moved = { ...original, x: original.x + 1 };

  const res = await post("/api/layout/left", { [sticker.id]: moved });
  if (res.status === 403) {
    // disabled as shipped: the attempt must not have changed anything
    const after = await (await api("/manifest.json")).json();
    expect(after.sides.left.find((s: { id: string }) => s.id === sticker.id).x).toBe(original.x);
    return;
  }

  expect(res.status).toBe(200);
  const after = await (await api("/manifest.json")).json();
  expect(after.sides.left.find((s: { id: string }) => s.id === sticker.id).x).toBe(moved.x);

  // restore, so running the check locally doesn't leave the asset file edited
  expect((await post("/api/layout/left", { [sticker.id]: original })).status).toBe(200);
});

it("an unknown side 404s instead of silently accepting the write (or is off in production)", async () => {
  expect([403, 404]).toContain((await post("/api/layout/middle", {})).status);
});

it("the layout endpoint persists a layer (z) change (or is off in production)", async () => {
  const before = await (await api("/manifest.json")).json();
  const sticker = before.sides.left.find((s: { bg?: boolean }) => !s.bg);
  const original = { x: sticker.x, y: sticker.y, w: sticker.w, h: sticker.h, z: sticker.z };
  const changed = { ...original, z: original.z + 5 };

  const res = await post("/api/layout/left", { [sticker.id]: changed });
  if (res.status === 403) return; // disabled-in-production case already covered above

  expect(res.status).toBe(200);
  const after = await (await api("/manifest.json")).json();
  expect(after.sides.left.find((s: { id: string }) => s.id === sticker.id).z).toBe(changed.z);

  // restore, so running the check locally doesn't leave the asset file edited
  expect((await post("/api/layout/left", { [sticker.id]: original })).status).toBe(200);
  const restored = await (await api("/manifest.json")).json();
  expect(restored.sides.left.find((s: { id: string }) => s.id === sticker.id).z).toBe(original.z);
});

it("the layout endpoint persists mount, sit, and a pinned host (or is off in production)", async () => {
  type Sticker = { id: string; x: number; y: number; w: number; h: number; mount: string; sit?: boolean; pinHost?: string; top?: number };
  const before = await (await api("/manifest.json")).json();
  const list: Sticker[] = before.sides.left;
  const surfaceItem = list.find((s) => s.mount === "surface");
  const host = list.find((s) => typeof s.top === "number" && s.id !== surfaceItem?.id);
  expect(surfaceItem).toBeTruthy();
  expect(host).toBeTruthy();

  const original = {
    x: surfaceItem!.x, y: surfaceItem!.y, w: surfaceItem!.w, h: surfaceItem!.h,
    mount: surfaceItem!.mount, sit: !!surfaceItem!.sit, pinHost: surfaceItem!.pinHost ?? "",
    top: typeof surfaceItem!.top === "number" ? surfaceItem!.top : null,
  };
  const changed = { ...original, mount: "floor", sit: true, pinHost: host!.id };

  const res = await post("/api/layout/left", { [surfaceItem!.id]: changed });
  if (res.status === 403) return; // disabled-in-production case already covered above

  expect(res.status).toBe(200);
  const after = await (await api("/manifest.json")).json();
  const updated = after.sides.left.find((s: Sticker) => s.id === surfaceItem!.id)!;
  expect(updated.mount).toBe("floor");
  expect(updated.sit).toBe(true);
  expect(updated.pinHost).toBe(host!.id);

  // restore, so running the check locally doesn't leave the asset file edited
  expect((await post("/api/layout/left", { [surfaceItem!.id]: original })).status).toBe(200);
  const restored = await (await api("/manifest.json")).json();
  const r = restored.sides.left.find((s: Sticker) => s.id === surfaceItem!.id)!;
  expect(r.mount).toBe(original.mount);
  expect(r.sit).toBeUndefined();
  expect(r.pinHost).toBeUndefined();
});
