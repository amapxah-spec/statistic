import {json,currentUser} from "./_utils.js";
export async function onRequestGet({request,env}) {
 const user=await currentUser(request,env); if(!user) return json({error:"Нэвтэрнэ үү."},401);
 const url=new URL(request.url), from=url.searchParams.get("from")||"0001-01-01", to=url.searchParams.get("to")||"9999-12-31";
 const totals=await env.DB.prepare("SELECT report_type,COUNT(*) AS entries,COALESCE(SUM(value),0) AS total FROM records WHERE report_date BETWEEN ? AND ? GROUP BY report_type").bind(from,to).all();
 const categories=await env.DB.prepare("SELECT report_type,category,metric,COALESCE(SUM(value),0) AS total,COUNT(*) AS entries FROM records WHERE report_date BETWEEN ? AND ? GROUP BY report_type,category,metric ORDER BY report_type,total DESC LIMIT 100").bind(from,to).all();
 const daily=await env.DB.prepare("SELECT report_date,report_type,COALESCE(SUM(value),0) AS total FROM records WHERE report_date BETWEEN ? AND ? GROUP BY report_date,report_type ORDER BY report_date").bind(from,to).all();
 return json({totals:totals.results,categories:categories.results,daily:daily.results});
}
