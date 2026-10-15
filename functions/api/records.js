import {json,body,currentUser,audit} from "./_utils.js";
const TYPES = new Set(["emergency","ambulance","ward"]);
const clean = d => ({
 report_type:String(d.report_type||""),
 report_date:String(d.report_date||""),
 department:String(d.department||"").trim().slice(0,120),
 category:String(d.category||"").trim().slice(0,160),
 age_group:String(d.age_group||"").trim().slice(0,80),
 metric:String(d.metric||"Тоо").trim().slice(0,100),
 value:Number(d.value),
 notes:String(d.notes||"").trim().slice(0,1000)
});
function valid(d) { return TYPES.has(d.report_type) && /^\d{4}-\d{2}-\d{2}$/.test(d.report_date) && d.category.length>0 && Number.isFinite(d.value) && d.value>=0 && d.value<=1000000000; }
export async function onRequestGet({request,env}) {
 const user=await currentUser(request,env); if(!user) return json({error:"Нэвтэрнэ үү."},401);
 const url=new URL(request.url), type=url.searchParams.get("type"), from=url.searchParams.get("from"), to=url.searchParams.get("to"), q=(url.searchParams.get("q")||"").slice(0,100);
 let sql="SELECT r.*,u.username AS created_by_name FROM records r LEFT JOIN users u ON u.id=r.created_by WHERE 1=1", args=[];
 if(type && TYPES.has(type)){sql+=" AND report_type=?";args.push(type);}
 if(from && /^\d{4}-\d{2}-\d{2}$/.test(from)){sql+=" AND report_date>=?";args.push(from);}
 if(to && /^\d{4}-\d{2}-\d{2}$/.test(to)){sql+=" AND report_date<=?";args.push(to);}
 if(q){sql+=" AND (category LIKE ? OR department LIKE ? OR notes LIKE ? OR metric LIKE ?)";args.push(...Array(4).fill("%"+q+"%"));}
 sql+=" ORDER BY report_date DESC,id DESC LIMIT 1000";
 const result=await env.DB.prepare(sql).bind(...args).all();
 return json({records:result.results,limit:1000});
}
export async function onRequestPost({request,env}) {
 const user=await currentUser(request,env); if(!user) return json({error:"Нэвтэрнэ үү."},401);
 const d=clean(await body(request)||{}); if(!valid(d)) return json({error:"Төрөл, огноо, ангилал болон 0-ээс ихгүй бус утгыг шалгана уу."},400);
 const result=await env.DB.prepare("INSERT INTO records(report_type,report_date,department,category,age_group,metric,value,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?)").bind(d.report_type,d.report_date,d.department,d.category,d.age_group,d.metric,d.value,d.notes,user.id).run();
 await audit(env,user,"create",result.meta.last_row_id,JSON.stringify(d));
 return json({ok:true,id:result.meta.last_row_id},201);
}
export async function onRequestPut({request,env}) {
 const user=await currentUser(request,env); if(!user) return json({error:"Нэвтэрнэ үү."},401);
 if(user.role!=="admin") return json({error:"Зөвхөн админ засварлана."},403);
 const data=await body(request)||{}, id=Number(data.id), d=clean(data);
 if(!Number.isInteger(id)||id<1||!valid(d)) return json({error:"Мэдээллийг шалгана уу."},400);
 await env.DB.prepare("UPDATE records SET report_type=?,report_date=?,department=?,category=?,age_group=?,metric=?,value=?,notes=?,updated_at=datetime('now') WHERE id=?").bind(d.report_type,d.report_date,d.department,d.category,d.age_group,d.metric,d.value,d.notes,id).run();
 await audit(env,user,"update",id,JSON.stringify(d));
 return json({ok:true});
}
export async function onRequestDelete({request,env}) {
 const user=await currentUser(request,env); if(!user) return json({error:"Нэвтэрнэ үү."},401);
 if(user.role!=="admin") return json({error:"Зөвхөн админ устгана."},403);
 const id=Number(new URL(request.url).searchParams.get("id")); if(!Number.isInteger(id)||id<1)return json({error:"ID буруу."},400);
 await env.DB.prepare("DELETE FROM records WHERE id=?").bind(id).run(); await audit(env,user,"delete",id,"");
 return json({ok:true});
}
