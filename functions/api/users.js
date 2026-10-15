import {json,body,currentUser,hashPassword,audit} from "./_utils.js";
export async function onRequestGet({request,env}) {
 const u=await currentUser(request,env); if(!u)return json({error:"Нэвтэрнэ үү."},401); if(u.role!=="admin")return json({error:"Админы эрх шаардлагатай."},403);
 const r=await env.DB.prepare("SELECT id,username,role,created_at FROM users ORDER BY id").all(); return json({users:r.results});
}
export async function onRequestPost({request,env}) {
 const u=await currentUser(request,env); if(!u)return json({error:"Нэвтэрнэ үү."},401); if(u.role!=="admin")return json({error:"Админы эрх шаардлагатай."},403);
 const d=await body(request)||{}, username=String(d.username||"").trim(), password=String(d.password||""), role=d.role==="admin"?"admin":"user";
 if(!/^[a-zA-Z0-9._-]{3,40}$/.test(username)||password.length<12)return json({error:"Нэр 3–40 тэмдэгт; нууц үг 12-оос доошгүй тэмдэгт байна."},400);
 const salt=crypto.randomUUID()+crypto.randomUUID(), hash=await hashPassword(password,salt);
 try {await env.DB.prepare("INSERT INTO users(username,password_hash,salt,role) VALUES(?,?,?,?)").bind(username,hash,salt,role).run();}
 catch{return json({error:"Хэрэглэгчийн нэр давхардсан байж болзошгүй."},409);}
 await audit(env,u,"create_user",null,username+":"+role); return json({ok:true},201);
}
