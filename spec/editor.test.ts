import { readFile, unlink } from "node:fs/promises";
import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const post = (path: string, body: unknown) =>
  fetch(new URL(path, baseUrl), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

it("the editor export endpoint rejects bad names (or is absent in production)", async () => {
  for (const name of ["..%2Fx", "Bad_Name", "a.b", ""]) {
    expect([400, 404]).toContain((await post(`/api/editor/${name}`, { items: {} })).status);
  }
});

it("the editor export endpoint merges into assets/editor/<name>.json (or is absent in production)", async () => {
  const name = "spec-test-editor";
  const first = await post(`/api/editor/${name}`, { items: { a: { scale: 1 }, b: { scale: 2 } } });
  if (first.status === 404) return; // production: endpoint is off
  expect(first.status).toBe(200);
  const path = `assets/editor/${name}.json`;
  try {
    expect((await post(`/api/editor/${name}`, { items: { a: { scale: 3 } } })).status).toBe(200);
    const saved = JSON.parse(await readFile(path, "utf8"));
    expect(saved.items).toEqual({ a: { scale: 3 }, b: { scale: 2 } });
  } finally {
    await unlink(path).catch(() => {});
  }
});
