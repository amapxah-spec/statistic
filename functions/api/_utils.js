const enc = new TextEncoder();
function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function unb64(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
export async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2", salt:enc.encode(salt), iterations:210000, hash:"SHA-256"}, key, 256);
  return b64(bits);
}
export async function sha256(value) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value)))].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
}
export async function body(request) {
  try { return await request.json(); } catch { return null; }
}
export async function currentUser(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("clinic_session="))?.slice("clinic_session=".length);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > datetime('now')`).bind(tokenHash).first();
  return row || null;
}
export function cookie(token, maxAge=43200) {
  return `clinic_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export function clearCookie() { return "clinic_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"; }
export async function audit(env, user, action, recordId=null, details="") {
  await env.DB.prepare("INSERT INTO audit_log(user_id,action,record_id,details) VALUES(?,?,?,?)").bind(user?.id||null,action,recordId,details.slice(0,500)).run();
}
