import { env } from "cloudflare:workers";
import { getRawDb } from "@/db";
const response=(body:object,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return response({error:"Solicitud no permitida."},403);
 if(!request.headers.get("content-type")?.includes("application/json"))return response({error:"Formato no válido."},415);
 try{
  const reader=request.body?.getReader();if(!reader)return response({error:"Falta el correo."},400);let size=0;const chunks:Uint8Array[]=[];
  while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return response({error:"Solicitud demasiado larga."},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return response({error:"Solicitud no válida."},400);}
  if(!body||typeof body!=="object"||Array.isArray(body))return response({error:"Solicitud no válida."},400);
  if(body.company)return response({ok:true});
  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return response({error:"Escribe un correo electrónico válido."},400);
  if(body.consent!==true)return response({error:"Confirma que quieres recibir noticias de la apertura."},400);
  const db=getRawDb(),ip=request.headers.get("cf-connecting-ip");
  if(ip){const windowId=Math.floor(Date.now()/3600000),hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`${ip}:${windowId}:contemplacion`));const key=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");const count=await db.prepare("INSERT INTO request_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(key,Date.now()+3600000).first<{count:number}>();if((count?.count??0)>10)return response({error:"Has hecho varios intentos. Vuelve a intentarlo en una hora."},429);await db.prepare("DELETE FROM request_limits WHERE expires_at < ?").bind(Date.now()).run();}
  await db.prepare("INSERT INTO waitlist (id,email,created_at,consent_version,source,ghl_status) VALUES (?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING").bind(crypto.randomUUID(),email,new Date().toISOString(),"opening-updates-2026-10","Contemplación — Coming soon","pending").run();
  const row=await db.prepare("SELECT id,ghl_status,created_at FROM waitlist WHERE email=?").bind(email).first<{id:string;ghl_status:string;created_at:string}>();
  const webhook=(env as unknown as{GHL_WEBHOOK_URL?:string}).GHL_WEBHOOK_URL;
  if(webhook&&row&&row.ghl_status!=="sent"){
   try{const url=new URL(webhook);if(url.protocol!=="https:")throw new Error("HTTPS required");const result=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":row.id},body:JSON.stringify({email,source:"Contemplación — Coming soon",tags:["contemplacion","lista-espera"],consent:true,consent_version:"opening-updates-2026-10",created_at:row.created_at,event_id:row.id}),signal:AbortSignal.timeout(6000),redirect:"error"});if(!result.ok)throw new Error("GHL rejected delivery");await db.prepare("UPDATE waitlist SET ghl_status='sent',synced_at=? WHERE id=?").bind(new Date().toISOString(),row.id).run();}catch{console.error("GHL delivery pending; contact safely stored in waitlist.");}
  }
  return response({ok:true});
 }catch{console.error("Waitlist save unavailable");return response({error:"No pudimos guardar tu correo. Inténtalo de nuevo en un momento."},503);}
}
