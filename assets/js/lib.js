/* Shared helpers. Pure functions only (no DOM access) so the build script can render pages in Node. */
(function(g){const RD=g.RD;
RD.cfg=Object.assign({siteUrl:'',phone:'',whatsapp:'',email:'',address:'',instagram:'',facebook:'',linkedin:'',youtube:'',rera:'',showDemo:false,ga4:'',gtm:'',pixel:'',ads:'',adsLabel:'',gsc:'',leadEndpoint:'/api/lead'},RD.cfg||{});
RD.S=Object.assign({lang:'en',saved:[],cmp:[],recent:[],consent:null},RD.S||{});
RD.props=RD.props||[];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
RD.esc=esc;
RD.digits=s=>String(s||'').replace(/\D/g,'');
RD.t=(k,fb)=>{const l=RD.S.lang;if(l!=='en'&&RD.I18N&&RD.I18N[l]&&RD.I18N[l][k])return RD.I18N[l][k];return fb};
const t=RD.t;
RD.ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${RD.P[n]||''}"/></svg>`;
RD.arr=()=>RD.ic('arrow','arr');
RD.money=n=>{if(n==null||n==='')return t('price.request','Price on request');n=+n;if(n>=1e7)return '₹'+(+(n/1e7).toFixed(2))+' Cr';if(n>=1e5)return '₹'+(+(n/1e5).toFixed(2))+' L';return '₹'+n.toLocaleString('en-IN')};
RD.inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
RD.fmtArea=p=>p.area?(+p.area).toLocaleString('en-IN')+' '+p.unit:'';
RD.slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
RD.dfmt=d=>{try{return new Date(d+'T00:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}catch(e){return d}};
/* ---------- images ---------- */
RD.IMGW=[480,800,1200];
RD.img=(key,o={})=>{o=Object.assign({alt:'',cls:'',sizes:'100vw',eager:false,w:1200,h:675,pos:'',illus:true},o);
const builtin=RD.DIMS&&RD.DIMS[key];let src,srcset='';
if(builtin){const ws=RD.IMGW.filter(w=>w<=builtin[0]);srcset=ws.map(w=>`assets/img/${key}-${w}.webp ${w}w`).join(', ');src=`/assets/img/${key}-${ws.includes(800)?800:ws[ws.length-1]}.webp`;o.w=builtin[0];o.h=builtin[1]}
else src=/^(https?:|\/)/.test(key)?key:'/assets/img/'+key;
if(srcset)srcset=srcset.replace(/assets\//g,'/assets/');
return `<img ${o.cls?`class="${o.cls}" `:''}src="${esc(src)}" ${srcset?`srcset="${esc(srcset)}" sizes="${esc(o.sizes)}" `:''}width="${o.w}" height="${o.h}" alt="${esc(o.alt)}" ${o.eager?'fetchpriority="high"':'loading="lazy" decoding="async"'}${o.pos?` style="object-position:${esc(o.pos)}"`:''}>`};
RD.ILLUS=()=>`<span class="illus">${t('illus','Illustrative image')}</span>`;
/* ---------- properties ---------- */
RD.isLive=p=>p&&p.published!==false&&!p.archived&&(RD.cfg.showDemo||!p.demo);
RD.live=()=>RD.props.filter(RD.isLive);
RD.byId=id=>RD.props.find(p=>p.id===id);
RD.ref=p=>p.ref||('RD-'+String(RD.props.indexOf(p)+1).padStart(4,'0'));
RD.propUrl=p=>'/property/'+p.id;
RD.catUrl=c=>'/properties/'+c.slug;
RD.STATUS={Available:['Available','ok'],Reserved:['Reserved','warn'],Sold:['Sold','off']};
RD.statusBadge=p=>{const s=RD.STATUS[p.status]||RD.STATUS.Available;return `<span class="stat ${s[1]}"><i></i>${t('status.'+p.status,s[0])}</span>`};
RD.SRC={owner:['Supplied by owner','owner'],team:['Checked by our team','team'],independent:['Independently verified','ind']};
RD.CONF_FIELDS=[['rera','RERA registration'],['layout','Layout or building approval'],['authority','Planning authority'],['landuse','Land-use classification'],['title','Title documentation'],['ec','Encumbrance certificate'],['legal','Other legal documents']];
RD.confOf=(p,k)=>{const c=(p.confidence||{})[k];if(!c||!c.value)return null;let src=c.source in RD.SRC?c.source:'owner';
const v=p.confidence.verified||{};if(src==='independent'&&!(v.by&&v.on))src='team';return {value:c.value,note:c.note||'',src}};
RD.isIndependentlyVerified=p=>{const v=(p.confidence||{}).verified||{};return !!(v.by&&v.on&&RD.CONF_FIELDS.some(f=>{const c=(p.confidence||{})[f[0]];return c&&c.value&&c.source==='independent'}))};
/* ---------- listing query state ---------- */
RD.F0={type:'',loc:'',bud:'',sort:'new',view:'grid',q:'',page:1};
RD.parseQuery=(search,pathCat)=>{const f=Object.assign({},RD.F0);const p=new URLSearchParams(search||'');
['type','loc','bud','sort','view','q'].forEach(k=>{if(p.get(k))f[k]=p.get(k)});if(p.get('page'))f.page=Math.max(1,+p.get('page')||1);
if(pathCat)f.type=pathCat;return f};
RD.buildQuery=(f,skipType)=>{const p=new URLSearchParams();['type','loc','bud','q'].forEach(k=>{if(f[k]&&!(k==='type'&&skipType))p.set(k,f[k])});if(f.sort&&f.sort!=='new')p.set('sort',f.sort);if(f.view&&f.view!=='grid')p.set('view',f.view);if(f.page>1)p.set('page',f.page);const s=p.toString();return s?'?'+s:''};
RD.filterProps=f=>{let l=RD.live().filter(p=>(!f.type||p.type===f.type)&&(!f.loc||p.loc===f.loc));
if(f.bud){const [a,b]=f.bud.split('-');l=l.filter(p=>p.price!=null&&p.price>=(+a||0)&&(!b||p.price<=+b))}
if(f.q){const q=f.q.toLowerCase();l=l.filter(p=>(p.title+' '+p.loc+' '+(p.desc||'')+' '+RD.ref(p)).toLowerCase().includes(q))}
const by={new:(a,b)=>(b.updated||'').localeCompare(a.updated||''),pa:(a,b)=>(a.price??1e15)-(b.price??1e15),pd:(a,b)=>(b.price??-1)-(a.price??-1),ar:(a,b)=>(b.area||0)-(a.area||0)};
return l.sort(by[f.sort]||by.new)};
RD.PER_PAGE=9;
/* ---------- contact helpers ---------- */
RD.waHref=text=>{const n=RD.digits(RD.cfg.whatsapp);return n?`https://wa.me/${n}?text=${encodeURIComponent(text||'Hello Reliable Developers, I would like to know more.')}`:''};
RD.propMsg=p=>`Hello Reliable Developers, I am interested in "${p.title}" (Ref ${RD.ref(p)}), ${p.loc}. ${RD.cfg.siteUrl?RD.cfg.siteUrl.replace(/\/$/,''):''}${RD.propUrl(p)}`;
RD.waBtn=(text,cls,label,p)=>{const h=RD.waHref(text);return h?`<a class="${cls}" href="${esc(h)}" target="_blank" rel="noopener" data-track="whatsapp_click" data-pid="${p?esc(p.id):''}">${RD.ic('wa')}<span>${label}</span></a>`:`<button type="button" class="${cls}" data-act="enquire" data-type="whatsapp" data-pid="${p?esc(p.id):''}">${RD.ic('wa')}<span>${label}</span></button>`};
RD.telHref=()=>{const n=String(RD.cfg.phone||'').replace(/[^\d+]/g,'');return n?'tel:'+n:''};
/* ---------- structured data ---------- */
RD.orgLD=()=>{const c=RD.cfg;const o={'@context':'https://schema.org','@type':'RealEstateAgent',name:'Reliable Developers',slogan:RD.BRAND.tagline,areaServed:RD.LOCS.map(l=>l.n)};
if(c.siteUrl){o.url=c.siteUrl;o.logo=c.siteUrl.replace(/\/$/,'')+'/assets/img/logo.png'}
if(c.phone)o.telephone=c.phone;if(c.email)o.email=c.email;if(c.address)o.address={'@type':'PostalAddress',streetAddress:c.address,addressLocality:'Vijayawada',addressRegion:'Andhra Pradesh',addressCountry:'IN'};
const sa=[c.instagram,c.facebook,c.linkedin,c.youtube].filter(Boolean);if(sa.length)o.sameAs=sa;return o};
RD.crumbLD=(items)=>{const b=(RD.cfg.siteUrl||'').replace(/\/$/,'');return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((it,i)=>({'@type':'ListItem',position:i+1,name:it[0],item:b+it[1]}))}};
})(typeof window!=='undefined'?window:globalThis);
