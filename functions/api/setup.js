import {json, body, hashPassword} from "./_utils.js";
export async function onRequestPost({request, env}) {
  if (!env.DB || !env.SETUP_KEY) return json({error:"DB эсвэл SETUP_KEY тохируулаагүй байна."},500);
  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
  if (count.n > 0) return json({error:"Админ аль хэдийн тохируулагдсан."},409);
  const data = await body(request);
  if (!data || data.setupKey !== env.SETUP_KEY) return json({error:"Setup key буруу."},403);
  const username = String(data.username||"").trim();
  const password = String(data.password||"");
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) return json({error:"Хэрэглэгчийн нэр 3–40 тэмдэгт, латин үсэг/тоо ашиглана."},400);
  if (password.length < 12) return json({error:"Нууц үг дор хаяж 12 тэмдэгт байна."},400);
  const salt = crypto.randomUUID()+crypto.randomUUID();
  const hash = await hashPassword(password,salt);
  await env.DB.prepare("INSERT INTO users(username,password_hash,salt,role) VALUES(?,?,?,'admin')").bind(username,hash,salt).run();
  return json({ok:true,message:"Анхны админ үүслээ. Одоо нэвтэрнэ үү."},201);
}
