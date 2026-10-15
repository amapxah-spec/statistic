import {json, clearCookie, currentUser} from "./_utils.js";
export async function onRequestPost({request,env}) {
 const u=await currentUser(request,env);
 const c=request.headers.get("Cookie")||"";
 const token=c.split(";").map(x=>x.trim()).find(x=>x.startsWith("clinic_session="))?.slice(15);
 if(token) { const {sha256}=await import("./_utils.js"); await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(token)).run(); }
 return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Set-Cookie":clearCookie(),"Cache-Control":"no-store"}});
}
