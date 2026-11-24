// Vercel serverless function: POST /api/lead
// Success is returned ONLY after the lead row is stored in Supabase.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server only, never exposed to the browser),
//      RESEND_API_KEY, LEAD_NOTIFY_EMAIL, LEAD_FROM_EMAIL (optional), META_PIXEL_ID + META_CAPI_TOKEN (optional)
const hits=new Map();
const limited=(ip)=>{const now=Date.now(),w=hits.get(ip)||[];const r=w.filter(x=>now-x<10*60*1000);r.push(now);hits.set(ip,r);if(hits.size>5000)hits.clear();return r.length>8};
const clean=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
const TYPES=['enquiry','callback','visit','virtual','owner','requirements','contact','finder','whatsapp'];
const sha=async(s)=>{const {createHash}=await import('node:crypto');return createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex')};
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'method'})}
  const ip=String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||'unknown';
  if(limited(ip))return res.status(429).json({ok:false,error:'rate'});
  let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch(e){b=null}}
  if(!b||typeof b!=='object')return res.status(400).json({ok:false,error:'bad_request'});
  if(b.website)return res.status(200).json({ok:true,ref:'RD-IGNORED'}); // honeypot: pretend success, store nothing
  const type=TYPES.includes(b.type)?b.type:'enquiry';
  const name=clean(b.name,120),cc=clean(b.cc,6),mobile=clean(b.mobile,16).replace(/\D/g,'');
  if(name.length<2||!/^\+\d{1,4}$/.test(cc)||mobile.length<6||mobile.length>14||b.consent!==true)return res.status(422).json({ok:false,error:'invalid'});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return res.status(503).json({ok:false,error:'not_configured'});
  const d=new Date();const ref='RD-'+String(d.getUTCFullYear()).slice(2)+String(d.getUTCMonth()+1).padStart(2,'0')+String(d.getUTCDate()).padStart(2,'0')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  const a=b.attr&&typeof b.attr==='object'?b.attr:{};
  const row={ref,type,name,phone_cc:cc,phone:mobile,message:clean(b.message,2000),property_ref:clean(b.property_id,80),
    preferred_date:clean(b.date,10)||null,preferred_slot:clean(b.slot,20),property_type:clean(b.ptype,80),location:clean(b.ploc,200),budget:clean(b.budget,40),contact_method:clean(b.method,20),
    finder:b.finder&&typeof b.finder==='object'?b.finder:null,consent:true,consent_text:clean(b.consent_text,200),consent_at:d.toISOString(),
    lang:clean(b.lang,5),page:clean(b.page,200),landing_page:clean(a.landing,200),referrer:clean(a.referrer,300),
    utm_source:clean(a.utm_source,120),utm_medium:clean(a.utm_medium,120),utm_campaign:clean(a.utm_campaign,120),utm_term:clean(a.utm_term,120),utm_content:clean(a.utm_content,120),gclid:clean(a.gclid,200),fbclid:clean(a.fbclid,200),
    event_id:clean(b.event_id,60),status:'new'};
  let stored=false;
  try{const r=await fetch(url.replace(/\/$/,'')+'/rest/v1/leads',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)});stored=r.ok}catch(e){stored=false}
  if(!stored)return res.status(502).json({ok:false,error:'storage'});
  // Team notification. A failure here must not hide the fact that the lead is stored.
  const rk=process.env.RESEND_API_KEY,to=process.env.LEAD_NOTIFY_EMAIL;
  if(rk&&to){try{await fetch((process.env.RESEND_API_URL||'https://api.resend.com')+'/emails',{method:'POST',headers:{Authorization:'Bearer '+rk,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.LEAD_FROM_EMAIL||'Reliable Developers <onboarding@resend.dev>',to:to.split(',').map(s=>s.trim()),subject:`New ${type} lead ${ref}`,text:`Reference: ${ref}\nType: ${type}\nName: ${name}\nPhone: ${cc} ${mobile}\nProperty: ${row.property_ref||'-'}\nLocation: ${row.location||'-'}\nBudget: ${row.budget||'-'}\nMessage: ${row.message||'-'}\nSource: ${row.utm_source||row.referrer||'direct'} ${row.utm_campaign||''}\nPage: ${row.page}\n`})})}catch(e){}}
  // Meta Conversions API (server side, hashed identifiers, same event_id as the browser event for de-duplication)
  const px=process.env.META_PIXEL_ID,tok=process.env.META_CAPI_TOKEN;
  if(px&&tok&&String(process.env.META_CAPI_ENABLED||'1')!=='0'){try{await fetch(`${process.env.META_GRAPH_URL||'https://graph.facebook.com/v19.0'}/${px}/events?access_token=${encodeURIComponent(tok)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:[{event_name:'Lead',event_time:Math.floor(Date.now()/1000),event_id:row.event_id,action_source:'website',event_source_url:(process.env.SITE_URL||'')+row.page,user_data:{ph:[await sha(cc.replace('+','')+mobile)],client_user_agent:clean(req.headers['user-agent'],300)}}]})})}catch(e){}}
  return res.status(200).json({ok:true,ref});
};
