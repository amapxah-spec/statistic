import {json,currentUser} from "./_utils.js";
export async function onRequestGet({request,env}) {
 const user=await currentUser(request,env);
 return user ? json({user}) : json({user:null},401);
}
