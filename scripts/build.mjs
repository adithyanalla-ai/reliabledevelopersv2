// Static prerender build. Usage: node scripts/build.mjs   (Vercel runs this via buildCommand)
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'dist');const E=process.env;
const rd=(p)=>fs.readFileSync(path.join(ROOT,p),'utf8');
const readJSON=(p,fb)=>{try{return JSON.parse(rd(p))}catch(e){return fb}};
/* ---- config: data/site.json, overridden by env vars. Nothing here is invented: blanks stay blank. ---- */
const site=readJSON('data/site.json',{});
const pick=(k,env)=>E[env]!==undefined&&E[env]!==''?E[env]:(site[k]||'');
const cfg={siteUrl:(pick('siteUrl','SITE_URL')||'https://reliabledevelopers.vercel.app').replace(/\/$/,''),
phone:pick('phone','CONTACT_PHONE'),whatsapp:pick('whatsapp','CONTACT_WHATSAPP'),email:pick('email','CONTACT_EMAIL'),address:pick('address','CONTACT_ADDRESS'),
instagram:pick('instagram','SOCIAL_INSTAGRAM'),facebook:pick('facebook','SOCIAL_FACEBOOK'),linkedin:pick('linkedin','SOCIAL_LINKEDIN'),youtube:pick('youtube','SOCIAL_YOUTUBE'),
rera:pick('rera','RERA_NUMBER'),ga4:pick('ga4','GA4_ID'),gtm:pick('gtm','GTM_ID'),pixel:pick('pixel','META_PIXEL_ID'),ads:pick('ads','GOOGLE_ADS_ID'),adsLabel:pick('adsLabel','GOOGLE_ADS_LABEL'),gsc:pick('gsc','GSC_VERIFICATION'),
showDemo:E.SHOW_DEMO==='1'||E.SHOW_DEMO==='true',leadEndpoint:'/api/lead'};
let props=readJSON('data/properties.json',[]);
if(cfg.showDemo)props=props.concat(readJSON('data/properties.demo.json',[]).map(p=>Object.assign({},p,{demo:true})));
/* ---- load the pure view code into a sandbox ---- */
const ctx=vm.createContext({console,URLSearchParams,Date,Math,JSON,encodeURIComponent,decodeURIComponent,Intl,Number,String,Array,Object,RegExp,Set,Map,parseFloat,parseInt,isNaN});ctx.globalThis=ctx;
ctx.RD={cfg,props};
for(const f of ['content','lib','i18n','views-core','views-home','views-pages','routes'])vm.runInContext(rd(`assets/js/${f}.js`),ctx,{filename:f});
const RD=ctx.RD;
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const cp=(a,b)=>fs.cpSync(path.join(ROOT,a),path.join(OUT,b||a),{recursive:true});
cp('assets');if(fs.existsSync(path.join(ROOT,'favicon.ico')))cp('favicon.ico');
/* boot.js: public config + published inventory for the client */
const pub=props.filter(RD.isLive);
fs.writeFileSync(path.join(OUT,'assets/js/boot.js'),`window.RD=window.RD||{};RD.cfg=${JSON.stringify(cfg)};RD.props=${JSON.stringify(pub)};`);
const esc=RD.esc;const SCRIPTS=['boot','content','lib','i18n','views-core','views-home','views-pages','routes','app'];
const ver=Date.now().toString(36);
const page=(r,p)=>{const url=cfg.siteUrl+(r.path==='/'?'/':r.path);const img=cfg.siteUrl+'/assets/img/social.jpg';
const ni=r.noindex||(p&&p.demo);
const ld=(r.ld||[]).map(x=>`<script type="application/ld+json">${JSON.stringify(x).replace(/</g,'\\u003c')}</script>`).join('');
const hero=r.path==='/'?`<link rel="preload" as="image" href="/assets/img/apts-1200.webp" imagesrcset="/assets/img/apts-480.webp 480w, /assets/img/apts-800.webp 800w, /assets/img/apts-1200.webp 1200w" imagesizes="(max-width:980px) 100vw,55vw" fetchpriority="high">`:'';
return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(r.title)}</title>${r.desc?`<meta name="description" content="${esc(r.desc)}">`:''}
<meta name="robots" content="${ni?'noindex,nofollow':'index,follow,max-image-preview:large'}">${ni?'':`<link rel="canonical" href="${esc(url)}">`}
<meta property="og:type" content="website"><meta property="og:site_name" content="Reliable Developers"><meta property="og:title" content="${esc(r.title)}"><meta property="og:description" content="${esc(r.desc||'')}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${img}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#102D26">${cfg.gsc?`<meta name="google-site-verification" content="${esc(cfg.gsc)}">`:''}
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png"><link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Noto+Sans+Telugu:wght@400;600&display=swap">
${hero}<link rel="stylesheet" href="/assets/css/main.css?v=${ver}">
<script>document.documentElement.className+=' js';if(location.hash.indexOf('#/')===0){location.replace(location.hash.slice(1))}</script>
${ld}</head><body><div id="app" data-path="${esc(r.path)}">${r.html}</div><div id="overlay-root"></div>
${SCRIPTS.map(s=>`<script src="/assets/js/${s}.js?v=${ver}" defer></script>`).join('')}</body></html>`};
const write=(rel,html)=>{const f=path.join(OUT,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,html)};
const sm=[];let n=0;
for(const p of RD.allPaths()){const r=RD.route(p,'');const prop=p.startsWith('/property/')?RD.byId(p.slice(10)):null;
write(p==='/'?'index.html':p.slice(1)+'/index.html',page(r,prop));n++;
if(!(prop&&prop.demo)&&!r.noindex&&r.status===200)sm.push([p,prop&&prop.updated]);}
for(const p of ['/saved','/compare','/admin'])write(p.slice(1)+'/index.html',page(RD.route(p,''),null));
write('404.html',page(RD.route('/__404','') ,null));
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sm.map(([p,u])=>`<url><loc>${cfg.siteUrl}${p==='/'?'/':p}</loc>${u?`<lastmod>${u}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`);
write('robots.txt',`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /saved\nDisallow: /compare\nDisallow: /api/\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
console.log(`built ${n} pages, ${pub.length} live properties, ${sm.length} in sitemap${cfg.showDemo?' (SHOW_DEMO on)':''} -> dist/`);
