// Accounts: register/login/logout against /api/auth/*, plus the small bilingual
// login card used wherever a page needs someone signed in (index.html, town.js,
// play.js). No alert()/confirm() — errors show inline in the card, same pattern
// as identity.js. Sessions are an HttpOnly cookie; fetch() already sends it
// same-origin, so nothing here touches localStorage for identity.
const TEXT = {
  zh: {
    tabLogin: "登录", tabRegister: "注册",
    titleLogin: "登录小镇一角", titleRegister: "注册一个账号",
    username: "用户名", password: "密码",
    usernameHint: "3–24 位，字母、数字、- 或 _", passwordHint: "至少 8 位",
    go: "进去", goRegister: "注册并登录",
    errBadUsername: "用户名要 3–24 位，只能用字母、数字、- 或 _",
    errBadPassword: "密码至少要 8 位",
    errTaken: "这个用户名已经有人用了",
    errBadCredentials: "用户名或密码不对",
    errNetwork: "没连上，再试一次",
  },
  en: {
    tabLogin: "Log in", tabRegister: "Register",
    titleLogin: "Log in to A Corner of Town", titleRegister: "Create an account",
    username: "Username", password: "Password",
    usernameHint: "3–24 characters: letters, digits, - or _", passwordHint: "8 characters minimum",
    go: "Go in", goRegister: "Register and log in",
    errBadUsername: "Username must be 3–24 characters: letters, digits, - or _",
    errBadPassword: "Password must be at least 8 characters",
    errTaken: "That username is already taken",
    errBadCredentials: "Wrong username or password",
    errNetwork: "Couldn't connect — try again",
  },
};

// ---- raw API -----------------------------------------------------------------
async function postJson(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let data = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}
export const api = {
  me: async () => { try { const r = await fetch("/api/auth/me"); return r.ok ? r.json() : { account: null }; } catch { return { account: null }; } },
  register: (username, password) => postJson("/api/auth/register", { username, password }),
  login: (username, password) => postJson("/api/auth/login", { username, password }),
  logout: () => postJson("/api/auth/logout", {}),
  friends: async () => { try { const r = await fetch("/api/friends"); return r.ok ? r.json() : null; } catch { return null; } },
  friendRequest: (username) => postJson("/api/friends/request", { username }),
  friendAccept: (id) => postJson(`/api/friends/${id}/accept`, {}),
  friendRemove: async (id) => { try { const r = await fetch(`/api/friends/${id}`, { method: "DELETE" }); return r.ok; } catch { return false; } },
  friendStatus: async (id) => { try { const r = await fetch(`/api/friends/${id}/status`); return r.ok ? (await r.json()).status : "none"; } catch { return "none"; } },
};

function errText(t, path, status, data) {
  const err = data?.error;
  if (path === "register") {
    if (err === "bad_username") return t.errBadUsername;
    if (err === "bad_password") return t.errBadPassword;
    if (status === 409 || err === "taken") return t.errTaken;
  }
  if (path === "login" && (status === 401 || err === "bad_credentials")) return t.errBadCredentials;
  return t.errNetwork;
}

let styled = false;
function addStyle() {
  if (styled) return; styled = true;
  if (document.querySelector('link[href="/auth.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet"; link.href = "/auth.css";
  document.head.append(link);
}

/**
 * A login/register card, styled like identity.js's idcard, with a tab to switch.
 * opts: { lang: () => "zh"|"en", onAuthed: (account) => void, mode?: "login"|"register" }
 * Returns { open(), close(), render(), isOpen() }. Not modal-locking (no scrim swallow)
 * unless `modal: true` is passed — index.html embeds it inline, town.js/play.js pop it.
 */
export function createAuthCard(opts) {
  addStyle();
  const T = () => TEXT[opts.lang()] || TEXT.zh;
  let mode = opts.mode === "register" ? "register" : "login";
  const modal = !!opts.modal;

  const wrap = document.createElement("div"); wrap.className = "authcard";
  const tabs = document.createElement("div"); tabs.className = "authcard-tabs"; tabs.setAttribute("role", "tablist");
  const tabLogin = document.createElement("button"); tabLogin.type = "button"; tabLogin.className = "authcard-tab"; tabLogin.setAttribute("role", "tab");
  const tabRegister = document.createElement("button"); tabRegister.type = "button"; tabRegister.className = "authcard-tab"; tabRegister.setAttribute("role", "tab");
  tabs.append(tabLogin, tabRegister);
  const title = document.createElement("p"); title.className = "authcard-title";
  const form = document.createElement("form");
  const uField = document.createElement("label"); uField.className = "authcard-field";
  const uLabel = document.createElement("span"); const uInput = document.createElement("input");
  uInput.type = "text"; uInput.autocomplete = "username"; uInput.required = true; uInput.maxLength = 24;
  uField.append(uLabel, uInput);
  const pField = document.createElement("label"); pField.className = "authcard-field";
  const pLabel = document.createElement("span"); const pInput = document.createElement("input");
  pInput.type = "password"; pInput.required = true;
  pField.append(pLabel, pInput);
  const msg = document.createElement("p"); msg.className = "authcard-msg"; msg.setAttribute("role", "status");
  const go = document.createElement("button"); go.type = "submit"; go.className = "authcard-go";
  form.append(uField, pField, msg, go);
  wrap.append(tabs, title, form);

  let scrim = null;
  if (modal) {
    scrim = document.createElement("div"); scrim.className = "authcard-scrim"; scrim.hidden = true;
    scrim.append(wrap);
    document.body.append(scrim);
  }

  // The last failed submit, if any (mode/status/data needed to re-translate
  // errText() into the new language on a toggle) — cleared on mode switch and
  // on the next submit. render() re-applies it every call, same as every other
  // string on the page, so toggling language updates a shown error immediately
  // instead of waiting for the next submit.
  let lastError = null;
  function render() {
    const t = T();
    tabLogin.textContent = t.tabLogin; tabRegister.textContent = t.tabRegister;
    tabLogin.setAttribute("aria-selected", String(mode === "login"));
    tabRegister.setAttribute("aria-selected", String(mode === "register"));
    title.textContent = mode === "login" ? t.titleLogin : t.titleRegister;
    uLabel.textContent = t.username; uInput.placeholder = t.usernameHint;
    pLabel.textContent = t.password; pInput.placeholder = mode === "register" ? t.passwordHint : "";
    go.textContent = mode === "login" ? t.go : t.goRegister;
    pInput.autocomplete = mode === "login" ? "current-password" : "new-password";
    if (lastError) msg.textContent = errText(t, lastError.mode, lastError.status, lastError.data);
  }
  function setMode(m) { mode = m; lastError = null; delete msg.dataset.text; msg.textContent = ""; render(); }
  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = uInput.value.trim(), password = pInput.value;
    if (!username || !password) return;
    go.disabled = true; lastError = null; msg.textContent = "";
    const r = mode === "login" ? await api.login(username, password) : await api.register(username, password);
    go.disabled = false;
    if (!r.ok) { lastError = { mode, status: r.status, data: r.data }; msg.textContent = errText(T(), mode, r.status, r.data); return; }
    pInput.value = "";
    if (scrim) scrim.hidden = true;
    opts.onAuthed(r.data.account);
  });

  function open() { render(); if (scrim) scrim.hidden = false; uInput.focus(); }
  function close() { if (scrim) scrim.hidden = true; }
  render();
  return { el: wrap, open, close, render, isOpen: () => !scrim || !scrim.hidden, setMode };
}
export { TEXT as AUTH_TEXT, addStyle as authStyle };
