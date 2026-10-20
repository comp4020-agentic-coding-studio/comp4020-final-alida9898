import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, init?: RequestInit) => fetch(new URL(path, baseUrl), init);
const post = (path: string, body?: unknown, init?: RequestInit) =>
  api(path, { ...init, method: "POST", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, body: JSON.stringify(body ?? {}) });

const uid = () => `u${Math.random().toString(36).slice(2, 10)}`;
const PASSWORD = "correct-horse-battery";

async function register(username = uid(), password = PASSWORD) {
  const res = await post("/api/auth/register", { username, password });
  return { res, cookie: (res.headers.get("set-cookie") ?? "").split(";")[0] };
}
const authed = (cookie: string) => (path: string, init?: RequestInit) => api(path, { ...init, headers: { ...(init?.headers ?? {}), cookie } });
const authedPost = (cookie: string) => (path: string, body?: unknown) => post(path, body, { headers: { cookie } });

it("registers with a hashed password (never plaintext) and starts a session", async () => {
  const username = uid();
  const { res, cookie } = await register(username);
  expect(res.status).toBe(200);
  expect(cookie).toMatch(/^sid=.+/);
  const me = await (await authed(cookie)("/api/auth/me")).json();
  expect(me.account.username).toBe(username);
  expect(me.account).not.toHaveProperty("password_hash");
  expect(me.account).not.toHaveProperty("password");
});

it("a taken username is refused; a short password is refused", async () => {
  const username = uid();
  await register(username);
  const dupe = await post("/api/auth/register", { username, password: PASSWORD });
  expect(dupe.status).toBe(409);
  const shortPw = await post("/api/auth/register", { username: uid(), password: "short" });
  expect(shortPw.status).toBe(400);
});

it("logs in with the right password and rejects the wrong one", async () => {
  const username = uid();
  await register(username);
  const ok = await post("/api/auth/login", { username, password: PASSWORD });
  expect(ok.status).toBe(200);
  const bad = await post("/api/auth/login", { username, password: "totally-wrong" });
  expect(bad.status).toBe(401);
});

it("logging out invalidates the session", async () => {
  const { cookie } = await register();
  expect((await authed(cookie)("/api/auth/me")).status).toBe(200);
  await authedPost(cookie)("/api/auth/logout");
  const me = await (await authed(cookie)("/api/auth/me")).json();
  expect(me.account).toBeNull();
  // the old cookie no longer grants access to protected endpoints either
  expect((await authedPost(cookie)("/api/friends/request", { username: "nobody" })).status).toBe(401);
});

it("/api/auth/me with no cookie reports logged out, not an error", async () => {
  const me = await (await api("/api/auth/me")).json();
  expect(me.account).toBeNull();
});

it("a friend request needs the other side to accept before they're friends", async () => {
  const a = await register();
  const bUsername = uid();
  const b = await register(bUsername);
  const send = await authedPost(a.cookie)("/api/friends/request", { username: bUsername });
  expect(send.status).toBe(200);
  expect((await send.json()).status).toBe("pending_out");

  // not friends yet: a can't place in b's town even though a request is pending
  const bWorld = (await (await authedPost(b.cookie)("/api/worlds")).json()).world;
  const bShops = (await (await authedPost(b.cookie)("/api/worlds")).json()).shops;
  const tooEarly = await authedPost(a.cookie)(`/api/shops/${bShops.cafe}/place`, { item: "x", client: "a" });
  expect(tooEarly.status).toBe(403);

  const list = await (await authed(b.cookie)("/api/friends")).json();
  expect(list.incoming.map((f: { username: string }) => f.username)).toContain((await (await authed(a.cookie)("/api/auth/me")).json()).account.username);

  const aId = (await (await authed(a.cookie)("/api/auth/me")).json()).account.id;
  const accept = await authedPost(b.cookie)(`/api/friends/${aId}/accept`);
  expect(accept.status).toBe(200);

  const now = await authedPost(a.cookie)(`/api/shops/${bShops.cafe}/place`, { item: "y", client: "a" });
  expect(now.status).toBe(200);

  const aFriends = await (await authed(a.cookie)("/api/friends")).json();
  expect(aFriends.friends.map((f: { username: string }) => f.username)).toContain(bUsername);
  void bWorld;
});

it("sending a request to someone who already requested you auto-accepts (mutual)", async () => {
  const a = await register();
  const bUsername = uid();
  const b = await register(bUsername);
  const aUsername = (await (await authed(a.cookie)("/api/auth/me")).json()).account.username;
  await authedPost(a.cookie)("/api/friends/request", { username: bUsername });
  const back = await authedPost(b.cookie)("/api/friends/request", { username: aUsername });
  expect(back.status).toBe(200);
  expect((await back.json()).status).toBe("friends");
  const aFriends = await (await authed(a.cookie)("/api/friends")).json();
  expect(aFriends.friends.map((f: { username: string }) => f.username)).toContain(bUsername);
});

it("can't friend-request yourself, or twice", async () => {
  const a = await register();
  const me = (await (await authed(a.cookie)("/api/auth/me")).json()).account.username;
  expect((await authedPost(a.cookie)("/api/friends/request", { username: me })).status).toBe(409);
  const bUsername = uid();
  await register(bUsername);
  expect((await authedPost(a.cookie)("/api/friends/request", { username: bUsername })).status).toBe(200);
  expect((await authedPost(a.cookie)("/api/friends/request", { username: bUsername })).status).toBe(409);
});

it("removing a friendship removes write access, but view access stays (anyone logged in can view)", async () => {
  const a = await register();
  const bUsername = uid();
  const b = await register(bUsername);
  const aUsername = (await (await authed(a.cookie)("/api/auth/me")).json()).account.username;
  const aId = (await (await authed(a.cookie)("/api/auth/me")).json()).account.id;
  await authedPost(a.cookie)("/api/friends/request", { username: bUsername });
  await authedPost(b.cookie)(`/api/friends/${aId}/accept`);
  const bWorld = await (await authedPost(b.cookie)("/api/worlds")).json();
  expect((await authedPost(a.cookie)(`/api/shops/${bWorld.shops.cafe}/place`, { item: "z", client: "a" })).status).toBe(200);

  const bId = (await (await authed(b.cookie)("/api/auth/me")).json()).account.id;
  const removeRes = await api(`/api/friends/${bId}`, { method: "DELETE", headers: { cookie: a.cookie } });
  expect(removeRes.status).toBe(200);

  const viewAfter = await authed(a.cookie)(`/api/worlds/${bWorld.world}`);
  expect(viewAfter.status).toBe(200);
  expect((await viewAfter.json()).canPlace).toBe(false);
  const placeAfter = await authedPost(a.cookie)(`/api/shops/${bWorld.shops.cafe}/place`, { item: "z2", client: "a" });
  expect(placeAfter.status).toBe(403);
  void aUsername;
});

it("a logged-in stranger viewing a world gets the owner's login username as ownerUsername", async () => {
  const ownerUsername = uid();
  const owner = await register(ownerUsername);
  const stranger = await register();
  const w = await (await authedPost(owner.cookie)("/api/worlds")).json();
  const res = await authed(stranger.cookie)(`/api/worlds/${w.world}`);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.role).toBe("guest");
  expect(body.ownerUsername).toBe(ownerUsername);
  const own = await (await authed(owner.cookie)(`/api/worlds/${w.world}`)).json();
  expect(own.ownerUsername).toBe(ownerUsername);
});

// ---- live friend notifications: GET /api/friends/stream (SSE) ----
async function openFriendStream(cookie: string) {
  const ctrl = new AbortController();
  const res = await authed(cookie)("/api/friends/stream", { signal: ctrl.signal });
  expect(res.status).toBe(200);
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  const waitFor = async (event: string) => {
    const deadline = Date.now() + 3000;
    for (;;) {
      const hit = buf.match(new RegExp(`event: ${event}\\ndata: (.*)\\n\\n`));
      if (hit) return (buf = buf.slice(hit.index! + hit[0].length)), JSON.parse(hit[1]);
      if (Date.now() > deadline) throw new Error(`timed out waiting for ${event}`);
      const r = await Promise.race([reader.read(), new Promise<null>((ok) => setTimeout(() => ok(null), 200))]);
      if (r && !r.done) buf += r.value;
    }
  };
  // wait for the connect comment so the server has registered the stream
  while (!buf.includes(": connected")) {
    const r = await reader.read();
    if (r.done) throw new Error("stream closed");
    buf += r.value;
  }
  return { waitFor, close: () => ctrl.abort() };
}

it("GET /api/friends/stream without a session cookie is 401", async () => {
  expect((await api("/api/friends/stream")).status).toBe(401);
});

it("the friends stream tells B about A's request, and A when B accepts", async () => {
  const a = await register();
  const bName = uid();
  const b = await register(bName);
  const aId = (await (await authed(a.cookie)("/api/auth/me")).json()).account.id;
  const bStream = await openFriendStream(b.cookie);
  const bStream2 = await openFriendStream(b.cookie); // a second tab gets it too
  const aStream = await openFriendStream(a.cookie);
  expect((await authedPost(a.cookie)("/api/friends/request", { username: bName })).status).toBe(200);
  expect(await bStream.waitFor("friends")).toEqual({});
  expect(await bStream2.waitFor("friends")).toEqual({});
  await aStream.waitFor("friends"); // sender's own tabs also refresh
  expect((await authedPost(b.cookie)(`/api/friends/${aId}/accept`)).status).toBe(200);
  expect(await aStream.waitFor("friends")).toEqual({});
  bStream.close();
  bStream2.close();
  aStream.close();
});
