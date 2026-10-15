import {json, body, hashPassword, sha256, cookie} from "./_utils.js";
export async function onRequestPost({request, env}) {
  const data = await body(request);
  const username = String(data?.username||"").trim();
  const password = String(data?.password||"");
  const user = await env.DB.prepare("SELECT id,username,password_hash,salt,role FROM users WHERE username=?").bind(username).first();
  if (!user || await hashPassword(password,user.salt) !== user.password_hash) return json({error:"Нэвтрэх нэр эсвэл нууц үг буруу."},401);
  const token = crypto.randomUUID()+crypto.randomUUID();
  await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+12 hours'))").bind(await sha256(token),user.id).run();
  return new Response(JSON.stringify({ok:true,user:{username:user.username,role:user.role}}),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Set-Cookie":cookie(token)}});
}
