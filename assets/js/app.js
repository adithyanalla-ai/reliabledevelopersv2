/* Browser app: routing, interactions, forms, analytics. Takes over from the prerendered HTML. */
(function(g){const RD=g.RD,V=RD.V,t=RD.t,esc=RD.esc,doc=document;
const $=(s,r)=>(r||doc).querySelector(s),$$=(s,r)=>Array.from((r||doc).querySelectorAll(s));
const store={get(k,d){try{const v=localStorage.getItem('rd_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('rd_'+k,JSON.stringify(v))}catch(e){}}};
const sess={get(k,d){try{const v=sessionStorage.getItem('rd_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{sessionStorage.setItem('rd_'+k,JSON.stringify(v))}catch(e){}}};
/* Only non-personal preferences are kept in the browser: language, saved/compare/recent property ids, consent choice. */
RD.S.lang=store.get('lang','en');RD.S.saved=store.get('saved',[]);RD.S.cmp=store.get('cmp',[]);RD.S.recent=store.get('recent',[]);RD.S.consent=store.get('consent',null);
const app=()=>$('#app');
let lastFocus=null;
/* ---------- analytics (consent-gated, no PII) ---------- */
const A={on:false,
hasIds(){const c=RD.cfg;return !!(c.gtm||c.ga4||c.pixel||c.ads)},
load(){if(A.on||RD.S.consent!=='granted'||!A.hasIds())return;A.on=true;const c=RD.cfg;g.dataLayer=g.dataLayer||[];
const sc=(src)=>{const s=doc.createElement('script');s.async=true;s.src=src;doc.head.appendChild(s)};
if(c.gtm){g.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});sc('https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(c.gtm))}
else{g.gtag=function(){g.dataLayer.push(arguments)};gtag('js',new Date());
if(c.ga4){gtag('config',c.ga4,{send_page_view:false});}
if(c.ads)gtag('config',c.ads);
if(c.ga4||c.ads)sc('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(c.ga4||c.ads));
if(c.pixel&&!g.fbq){const n=g.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.push=n;n.loaded=true;n.version='2.0';n.queue=[];sc('https://connect.facebook.net/en_US/fbevents.js');fbq('init',c.pixel)}}
A.page()},
page(){if(!A.on)return;const p={page_path:location.pathname,page_title:doc.title};
if(RD.cfg.gtm)g.dataLayer.push(Object.assign({event:'page_view'},p));else{if(g.gtag&&(RD.cfg.ga4))gtag('event','page_view',p);if(g.fbq)fbq('track','PageView')}},
ev(name,params,eid){if(!A.on)return;params=params||{};
if(RD.cfg.gtm){g.dataLayer.push(Object.assign({event:name,event_id:eid},params));return}
if(g.gtag&&(RD.cfg.ga4||RD.cfg.ads))gtag('event',name,Object.assign({event_id:eid},params));
if(g.fbq){const m={generate_lead:'Lead',whatsapp_click:'Contact',phone_click:'Contact',view_item:'ViewContent'}[name];if(m)fbq('track',m,params,eid?{eventID:eid}:undefined)}
if(name==='generate_lead'&&RD.cfg.ads&&RD.cfg.adsLabel&&g.gtag)gtag('event','conversion',{send_to:RD.cfg.ads+'/'+RD.cfg.adsLabel,event_id:eid})}};
RD.A=A;
/* ---------- attribution (UTM, click ids, landing page, referrer) ---------- */
(function(){let a=sess.get('attr',null);if(!a){a={landing:location.pathname,referrer:doc.referrer||''};const q=new URLSearchParams(location.search);['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'].forEach(k=>{if(q.get(k))a[k]=q.get(k).slice(0,120)});sess.set('attr',a)}RD.attr=a})();
/* ---------- helpers ---------- */
const toast=(m)=>{const d=doc.createElement('div');d.className='toast';d.setAttribute('role','status');d.textContent=m;doc.body.appendChild(d);setTimeout(()=>d.remove(),2600)};
const focusables=r=>$$('a[href],button:not([disabled]),input:not([disabled]):not(.hp),select,textarea,[tabindex]:not([tabindex="-1"])',r).filter(e=>e.offsetParent!==null||e===doc.activeElement);
const trap=(root,e)=>{if(e.key!=='Tab')return;const f=focusables(root);if(!f.length)return;const a=f[0],b=f[f.length-1];if(e.shiftKey&&doc.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&doc.activeElement===b){e.preventDefault();a.focus()}};
/* ---------- mobile menu ---------- */
let menuOpen=false;
const menu=(open)=>{const m=$('#mnav'),b=$('#menuBtn');if(!m)return;menuOpen=open;m.hidden=!open;doc.body.classList.toggle('lock',open||!!$('.mod-bg.open')||!!$('.drawer.open'));if(b)b.setAttribute('aria-expanded',open);
if(open){lastFocus=doc.activeElement;const f=focusables(m);(f[0]||m).focus()}else if(lastFocus&&b){b.focus()}};
/* ---------- overlay: enquiry modal ---------- */
const closeModal=()=>{const m=$('.mod-bg');if(!m)return;m.remove();doc.body.classList.toggle('lock',menuOpen);if(lastFocus&&lastFocus.focus)lastFocus.focus()};
const openModal=(type,pid)=>{const p=pid?RD.byId(pid):null;const ET=V.ETYPES&&V.ETYPES[type]||['Enquire','Tell us what you need and we will respond.'];
const bg=doc.createElement('div');bg.className='mod-bg open';bg.innerHTML=`<div class="mod" role="dialog" aria-modal="true" aria-labelledby="mod-h"><button type="button" class="icon-btn x" data-act="close" aria-label="Close">${RD.ic('x')}</button><h2 id="mod-h">${esc(t('modal.'+type,ET[0]))}</h2><p class="muted" style="margin-bottom:18px">${esc(p?p.title+' · '+RD.ref(p):t('modal.p',ET[1]||''))}</p>${V.formHTML(type==='whatsapp'?'enquiry':type,{p,uid:'m'+Date.now().toString(36)})}</div>`;
lastFocus=doc.activeElement;$('#overlay-root').appendChild(bg);doc.body.classList.add('lock');const f=focusables(bg.firstChild);(f[1]||f[0]).focus();
bg.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeModal()}else trap(bg.firstChild,e)});bg.addEventListener('mousedown',e=>{if(e.target===bg)closeModal()})};
/* ---------- filter drawer (mobile) ---------- */
const openFilters=()=>{if($('.drawer.open'))return;const f=RD.parseQuery(location.search,catFromPath());const d=doc.createElement('div');d.className='drawer';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label',t('f.filters','Filters'));
d.innerHTML=`<div class="drawer-top"><strong class="fh2">${t('f.filters','Filters')}</strong><button type="button" class="icon-btn" data-act="closedrawer" aria-label="Close">${RD.ic('x')}</button></div>${V.filterPanel(f).replace('id="fil"','id="fil-m"').replace(/<h2 class="fh2">[^<]*<\/h2>/,'').replace(/id="f-/g,'id="m-')}<button type="button" class="btn btn-primary" data-act="closedrawer">${t('f.show','Show results')}</button>`;
const bg=doc.createElement('div');bg.className='drawer-bg open';bg.dataset.act='closedrawer';lastFocus=doc.activeElement;$('#overlay-root').append(bg,d);requestAnimationFrame(()=>d.classList.add('open'));doc.body.classList.add('lock');
d.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();else trap(d,e)});focusables(d)[1].focus()};
const closeDrawer=()=>{$$('.drawer,.drawer-bg').forEach(e=>e.remove());doc.body.classList.toggle('lock',menuOpen);if(lastFocus&&lastFocus.focus)lastFocus.focus()};
/* ---------- routing ---------- */
const catFromPath=()=>{const m=location.pathname.match(/^\/properties\/([a-z-]+)/);const c=m&&RD.CATS.find(x=>x.slug===m[1]);return c?c.k:''};
const setMeta=(r)=>{doc.title=r.title;const set=(sel,attr,val)=>{const e=$(sel);if(e)e.setAttribute(attr,val)};
set('meta[name="robots"]','content',r.noindex?'noindex,nofollow':'index,follow,max-image-preview:large');set('meta[property="og:title"]','content',r.title);doc.documentElement.lang=RD.S.lang==='te'?'te':'en'};
const render=(opts)=>{opts=opts||{};const r=RD.route(location.pathname,location.search);
const prev=doc.activeElement&&doc.activeElement.id;const sy=g.scrollY;
app().innerHTML=r.html;app().dataset.path=r.path;setMeta(r);after(r);
if(opts.keepScroll){g.scrollTo(0,sy);if(prev){const e=doc.getElementById(prev);if(e)e.focus({preventScroll:true})}}
else if(opts.scroll!==false){let he=null;try{he=location.hash&&location.hash.length>1&&!location.hash.startsWith('#/')?doc.getElementById(decodeURIComponent(location.hash.slice(1))):null}catch(x){}if(he)he.scrollIntoView();else{g.scrollTo(0,0);const m=$('#main');if(m&&opts.focus)m.focus({preventScroll:true})}}
A.page()};
const go=(url,opts)=>{opts=opts||{};const u=new URL(url,location.origin);if(u.origin!==location.origin){location.href=url;return}
if(u.pathname+u.search+u.hash===location.pathname+location.search+location.hash&&!opts.force){return}
if(opts.replace)history.replaceState({},'',u.pathname+u.search+u.hash);else history.pushState({},'',u.pathname+u.search+u.hash);menu(false);closeDrawer();render(Object.assign({focus:true},opts))};
g.addEventListener('hashchange',()=>{if(location.hash.indexOf('#/')===0)go(location.hash.slice(1),{replace:true})});
g.addEventListener('popstate',()=>{render({focus:false})});
/* ---------- after render hooks ---------- */
const reveal=()=>{const els=$$('.rv:not(.in)');if(!('IntersectionObserver' in g)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(e=>e.classList.add('in'));return}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});els.forEach(e=>io.observe(e))};
const pushRecent=id=>{RD.S.recent=[id].concat(RD.S.recent.filter(x=>x!==id)).slice(0,6);store.set('recent',RD.S.recent)};
const fillRecent=()=>{const box=$('#recent');if(!box)return;const l=RD.S.recent.map(RD.byId).filter(RD.isLive).slice(0,3);if(l.length)box.innerHTML=`<h2>${t('recent.h','Recently viewed')}</h2><div class="pgrid sm">${l.map(V.pcard).join('')}</div>`};
const W={s:V.wiz0()};
const drawWiz=(focus)=>{const w=$('#wiz');if(!w)return;w.innerHTML=V.wizard(W.s);if(focus){const h=$('#wh');if(h)h.focus()}};
const after=(r)=>{reveal();fillRecent();const p=r.path;
if(/^\/property\//.test(p)&&r.status===200){const id=p.slice(10);pushRecent(id);A.ev('view_item',{item_id:id})}
if(p==='/saved')fillBox('#savedbox',V.savedBody());if(p==='/compare')fillBox('#comparebox',V.compareBody());
if($('#wiz')){drawWiz(false)}updateTray()};
const fillBox=(sel,html)=>{const b=$(sel);if(b)b.innerHTML=html};
const updateTray=()=>{let tr=$('#cmptray');const n=RD.S.cmp.length;if(!n){if(tr)tr.remove();return}
if(!tr){tr=doc.createElement('div');tr.id='cmptray';tr.className='tray open';tr.setAttribute('role','region');tr.setAttribute('aria-label','Compare');doc.body.appendChild(tr)}
tr.innerHTML=`<span>${n} ${t('cmp.sel','selected to compare')}</span><a class="btn btn-gold btn-sm" href="/compare">${t('cta.cmpgo','Compare')}</a>`};
/* ---------- listing filters ---------- */
const readFilters=(root)=>{const f=RD.parseQuery(location.search,catFromPath());$$('[data-f]',root).forEach(e=>{f[e.dataset.f]=e.value});f.page=1;return f};
const applyFilters=(f)=>{const cat=catFromPath();go(location.pathname+RD.buildQuery(f,!!cat),{replace:true,keepScroll:true,scroll:false})};
/* ---------- lead capture ---------- */
const cleanPhone=(cc,m)=>{const d=String(m).replace(/\D/g,'').replace(/^0+/,'');const c=RD.COUNTRIES.find(x=>x[0]===cc);const n=c?c[2]:null;return {d,ok:n?d.length===n:(d.length>=6&&d.length<=14)}};
const setErr=(form,name,msg)=>{const el=form.querySelector('[name="'+name+'"]');if(!el)return;const e=el.closest('.fld,.cons')&&el.closest('.fld,.cons').querySelector('.err');if(e)e.textContent=msg||'';el.setAttribute('aria-invalid',msg?'true':'false')};
const validate=(form)=>{let ok=true;let first=null;$$('.err',form).forEach(e=>e.textContent='');
const bad=(n,m)=>{ok=false;if(n==='consent'){const e=$('.cerr',form);if(e)e.textContent=m}else setErr(form,n,m);if(!first)first=form.querySelector('[name="'+n+'"]')};
const nm=form.elements.name.value.trim();if(nm.length<2)bad('name',t('v.name','Please enter your name.'));
const ph=cleanPhone(form.elements.cc.value,form.elements.mobile.value);if(!ph.ok)bad('mobile',t('v.phone','Enter a valid mobile number for the selected country code.'));
const msg=form.elements.msg;if(msg&&msg.required&&msg.value.trim().length<5)bad('msg',t('v.msg','Please add a few details.'));
if(!form.elements.consent.checked)bad('consent',t('v.consent','Please tick the box so we can contact you.'));
if(first)first.focus();return ok};
const submitLead=async(form,kind)=>{
const status=$('.fstatus',form),btn=form.querySelector('[type=submit]');
if(!validate(form))return;
if(form.elements.website&&form.elements.website.value){return}  /* honeypot */
const eid='ev'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const val=n=>form.elements[n]?form.elements[n].value:'';
const method=form.querySelector('[name=method]:checked');
const body={type:kind,name:val('name').trim(),cc:val('cc'),mobile:cleanPhone(val('cc'),val('mobile')).d,message:val('msg').trim(),date:val('date'),slot:val('slot'),ptype:val('ptype')||val('interest')||(kind==='finder'?W.s.type:''),ploc:val('ploc')||(kind==='finder'?W.s.locs.join(', '):''),budget:val('budget')||(kind==='finder'?W.s.bud:''),
property_id:form.dataset.pid||'',method:method?method.value:'',consent:true,consent_text:'Agreed to be contacted and to the privacy policy',website:'',elapsed:Math.round(performance.now()),lang:RD.S.lang,page:location.pathname,attr:RD.attr,event_id:eid};
if(kind==='finder')body.finder={purpose:W.s.purpose,type:W.s.type,locs:W.s.locs,bud:W.s.bud,area:W.s.area,aunit:W.s.aunit,tl:W.s.tl};
btn.disabled=true;const old=btn.innerHTML;btn.textContent=t('sending','Sending…');status.textContent='';
try{const res=await fetch(RD.cfg.leadEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
let j=null;try{j=await res.json()}catch(e){}
if(!res.ok||!j||!j.ok||!j.ref)throw new Error((j&&j.error)||'failed');
A.ev('generate_lead',{lead_type:kind,property_id:body.property_id},eid);
if(kind==='finder'){W.s.done=true;W.s.ref=j.ref;W.s.matches=V.wizMatches(W.s);drawWiz(true)}
else{const box=form.closest('.mod')||form.parentNode;form.outerHTML=V.successHTML(j.ref,kind);const h=box.querySelector('.ok-box h3');if(h){h.setAttribute('tabindex','-1');h.focus()}}
}catch(err){btn.disabled=false;btn.innerHTML=old;const wa=RD.waHref('Hello Reliable Developers, I tried to send an enquiry on your website.'),tel=RD.telHref();
status.innerHTML=esc(t('err.send','We could not send your details just now. Nothing has been saved.'))+' '+(wa?`<a href="${esc(wa)}" target="_blank" rel="noopener" style="text-decoration:underline">WhatsApp</a> `:'')+(tel?`<a href="${esc(tel)}" style="text-decoration:underline">${esc(RD.cfg.phone)}</a>`:'')}};
/* ---------- calculators ---------- */
const num=(card,k)=>{const e=$('[data-i="'+k+'"]',card);return e?parseFloat(e.value):NaN};
const setO=(card,k,html)=>{const e=$('[data-o="'+k+'"]',card);if(e)e.innerHTML=html};
const calc=(card)=>{const k=card.dataset.calc,C=RD.calc;
if(k==='emi'){const P=num(card,'a'),r=num(card,'r'),y=num(card,'y');if(!(P>0&&y>0&&r>=0)){setO(card,'emi','Enter valid values');setO(card,'int','');return}const e=C.emi(P,r,y);setO(card,'emi',RD.inr(e));setO(card,'int','Total interest about '+RD.inr(e*y*12-P)+'. Total repayment about '+RD.inr(e*y*12))}
if(k==='cost'){const P=num(card,'p'),s=num(card,'s'),gg=num(card,'g'),o=num(card,'o')||0;if(!(P>0)||isNaN(s)||isNaN(gg)){setO(card,'total','Enter price and rates');setO(card,'extra','');return}const ex=P*(s+gg+o)/100;setO(card,'total',RD.inr(P+ex));setO(card,'extra','Charges about '+RD.inr(ex)+' on top of the price. Rates are the ones you entered.')}
if(k==='area'){const v=num(card,'v'),u=$('[data-i="u"]',card).value;const f=(RD.AREA_U.find(x=>x[0]===u)||[0,0,1])[2];const sf=isNaN(v)?0:v*f;setO(card,'conv',RD.AREA_U.map(x=>`<div><dt>${x[1]}</dt><dd>${(sf/x[2]).toLocaleString('en-IN',{maximumFractionDigits:2})}</dd></div>`).join(''))}
if(k==='afford'){const inc=num(card,'inc'),ex=num(card,'ex')||0,r=num(card,'r'),y=num(card,'y'),sh=num(card,'sh');if(!(inc>0&&y>0&&sh>0)){setO(card,'loan','Enter valid values');return}const emi=Math.max(0,inc*sh/100-ex);setO(card,'loan',RD.inr(C.loanFromEmi(emi,r,y)));setO(card,'emi2','Supports an EMI of about '+RD.inr(emi)+' a month')}
if(k==='down'){const P=num(card,'p'),d=num(card,'d'),r=num(card,'r'),y=num(card,'y');if(!(P>0&&d>=0&&d<=100&&y>0)){setO(card,'dp','Enter valid values');return}const dp=P*d/100,L=P-dp;setO(card,'dp',RD.inr(dp));setO(card,'dl','Loan needed '+RD.inr(L)+', EMI about '+RD.inr(C.emi(L,r,y)))}};
/* ---------- misc actions ---------- */
const download=(name,text,mime)=>{const a=doc.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime||'text/plain'}));a.download=name;doc.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
const lbObj=()=>{const f=$('#lb');const v=n=>f.elements[n].value.trim();const o={id:'',ref:v('ref'),title:v('title'),type:v('type'),loc:v('loc'),status:v('status'),published:false,images:[],desc:v('desc'),amen:v('amen').split(',').map(s=>s.trim()).filter(Boolean),landmarks:[],featured:false,updated:new Date().toISOString().slice(0,10),confidence:{}};
o.id=(o.ref||o.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(v('price'))o.price=+v('price');if(v('area')){o.area=+v('area');o.unit=v('unit')}if(v('beds'))o.beds=+v('beds');if(v('lat')&&v('lng')){o.lat=+v('lat');o.lng=+v('lng')};
const c=(k)=>{o.confidence[k]={value:'',source:'owner',note:''}};RD.CONF_FIELDS.forEach(x=>c(x[0]));o.confidence.verified={by:'',on:''};return o};
const act={
menu:()=>menu(!menuOpen),'menu-close':()=>menu(false),
enquire:b=>openModal(b.dataset.type||'enquiry',b.dataset.pid),
close:()=>closeModal(),
drawer:()=>openFilters(),closedrawer:()=>closeDrawer(),
lang:b=>{RD.S.lang=b.dataset.v;store.set('lang',RD.S.lang);menu(false);render({keepScroll:true,scroll:false})},
save:b=>{const id=b.dataset.pid,i=RD.S.saved.indexOf(id);if(i<0)RD.S.saved.push(id);else RD.S.saved.splice(i,1);store.set('saved',RD.S.saved);
$$('[data-act="save"][data-pid="'+id+'"]').forEach(x=>{const on=RD.S.saved.includes(id);x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});if(location.pathname==='/saved')fillBox('#savedbox',V.savedBody());toast(i<0?t('toast.saved','Saved'):t('toast.unsaved','Removed from saved'))},
cmp:b=>{const id=b.dataset.pid,i=RD.S.cmp.indexOf(id);if(i<0){if(RD.S.cmp.length>=3){toast(t('toast.cmpmax','You can compare up to three properties'));return}RD.S.cmp.push(id)}else RD.S.cmp.splice(i,1);store.set('cmp',RD.S.cmp);
$$('[data-act="cmp"][data-pid="'+id+'"]').forEach(x=>x.setAttribute('aria-pressed',RD.S.cmp.includes(id)));if(location.pathname==='/compare')fillBox('#comparebox',V.compareBody());updateTray()},
share:async b=>{const p=RD.byId(b.dataset.pid);const url=location.origin+RD.propUrl(p);try{if(navigator.share){await navigator.share({title:p.title,url})}else{await navigator.clipboard.writeText(url);toast(t('toast.copied','Link copied'))}}catch(e){}},
view:b=>{const f=RD.parseQuery(location.search,catFromPath());f.view=b.dataset.v;applyFilters(f)},
page:(b,e)=>{e.preventDefault();const f=RD.parseQuery(location.search,catFromPath());f.page=+b.dataset.v;const cat=catFromPath();go(location.pathname+RD.buildQuery(f,!!cat),{});},
frm:b=>{const f=RD.parseQuery(location.search,catFromPath());f[b.dataset.k]='';f.page=1;if(b.dataset.k==='type'&&catFromPath()){go('/properties'+RD.buildQuery(f),{});return}applyFilters(f)},
fclear:()=>{const c=catFromPath();go(c?location.pathname:'/properties',{keepScroll:true,scroll:false})},
gth:b=>{const k=b.dataset.k;const m=$('.gal-main');if(m){m.innerHTML=RD.img(k,{alt:b.getAttribute('aria-label')||'',eager:true,sizes:'(max-width:1000px) 100vw,60vw',pos:RD.IPOS[k]||''})+(RD.DIMS[k]?RD.ILLUS():'')}$$('[data-act="gth"]').forEach(x=>x.setAttribute('aria-pressed',x===b))},
locsel:b=>{const L=JSON.parse($('#locdata').textContent)[+b.dataset.i];$$('[data-act="locsel"]').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
const img=$('#locpanel .lp-img');img.innerHTML=RD.img(L.img,{alt:L.n+'. '+t('illus.alt','Illustrative image.'),sizes:'(max-width:900px) 92vw,52vw'})+RD.ILLUS();$('#lpName').textContent=L.n;$('#lpTag').textContent=L.tag;$('#lpLink').href='/locations/'+L.s;$('#lpLinkN').textContent=L.n},
wopt:b=>{W.s[b.dataset.k]=b.dataset.v;drawWiz(false);const n=$('[data-act="wopt"][aria-pressed="true"]');(n||$('#wh')).focus()},
wloc:b=>{const v=b.dataset.v,i=W.s.locs.indexOf(v);if(i<0)W.s.locs.push(v);else W.s.locs.splice(i,1);drawWiz(false);const n=$$('[data-act="wloc"]').find(x=>x.dataset.v===v);if(n)n.focus()},
wnext:()=>{W.s.step=Math.min(7,W.s.step+1);drawWiz(true)},
wback:()=>{W.s.step=Math.max(1,W.s.step-1);drawWiz(true)},
dlchk:()=>download('property-buying-checklist.txt','Property buying checklist\nReliable Developers\n\n'+RD.CHECK.map(c=>'[ ] '+c).join('\n')+'\n\nThis checklist is general guidance and not legal advice. Ask an independent lawyer to review the documents for any property you consider.\n'),
printchk:()=>print(),
cplb:async()=>{const f=$('#lb');if(!f.checkValidity()){f.reportValidity();return}const s=JSON.stringify(lbObj(),null,2);$('#lb-out').value=s;try{await navigator.clipboard.writeText(s);toast('Copied')}catch(e){}},
dllb:()=>{const f=$('#lb');if(!f.checkValidity()){f.reportValidity();return}const o=lbObj();$('#lb-out').value=JSON.stringify(o,null,2);download(o.id+'.json',JSON.stringify(o,null,2),'application/json')},
consent:b=>{RD.S.consent=b.dataset.v;store.set('consent',RD.S.consent);const c=$('#consent');if(c)c.classList.remove('open');if(RD.S.consent==='granted')A.load()}
};
doc.addEventListener('click',e=>{
const b=e.target.closest('[data-act]');
if(b&&act[b.dataset.act]){if(b.tagName==='A'&&b.dataset.act!=='page')e.preventDefault();act[b.dataset.act](b,e);return}
const tr=e.target.closest('[data-track]');if(tr)A.ev(tr.dataset.track,{item_id:tr.dataset.pid||''});
const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
const u=new URL(a.href,location.href);if(u.origin!==location.origin)return;if(/^\/(api|assets)\//.test(u.pathname)||/\.\w{2,4}$/.test(u.pathname))return;
if(u.pathname===location.pathname&&u.hash&&!u.search){return}
e.preventDefault();go(u.pathname+u.search+u.hash)});
doc.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('.mod-bg')){closeModal()}else if($('.drawer.open')){closeDrawer()}else if(menuOpen){menu(false)}}else if(menuOpen&&$('#mnav'))trap($('#mnav'),e)});
doc.addEventListener('change',e=>{const el=e.target;
if(el.matches('[data-f]')){const root=el.closest('form');if(!root){const f=RD.parseQuery(location.search,catFromPath());f[el.dataset.f]=el.value;f.page=1;applyFilters(f);return}applyFilters(readFilters(root));return}
if(el.matches('[data-win]')){W.s[el.dataset.win]=el.value;return}
if(el.closest('.sortl')&&el.name==='sort'||el.id==='sort'){const f=RD.parseQuery(location.search,catFromPath());f.sort=el.value;applyFilters(f)}});
doc.addEventListener('input',e=>{const c=e.target.closest('[data-calc]');if(c)calc(c);if(e.target.matches('[data-win="area"]'))W.s.area=e.target.value});
doc.addEventListener('submit',e=>{const f=e.target;
if(f.id==='hs'){e.preventDefault();const fd=new FormData(f);const q=new URLSearchParams();['type','loc','bud'].forEach(k=>{if(fd.get(k))q.set(k,fd.get(k))});go('/properties'+(q.toString()?'?'+q.toString():''));return}
if(f.id==='fil'||f.id==='fil-m'){e.preventDefault();return}
if(f.id==='lb'){e.preventDefault();return}
if(f.matches('form.lf')){e.preventDefault();submitLead(f,f.dataset.type)}});
/* ---------- consent banner ---------- */
const consentUI=()=>{if(!A.hasIds()||RD.S.consent)return;const c=doc.createElement('div');c.id='consent';c.className='consent open';c.setAttribute('role','region');c.setAttribute('aria-label','Cookies');
c.innerHTML=`<p style="font-size:14px">${t('cons.p','We would like to use analytics and advertising cookies to understand how the site is used. You can say no and still use everything.')} <a href="/privacy" style="text-decoration:underline">${t('legal.privacy','Privacy policy')}</a></p><div class="r"><button type="button" class="btn btn-primary btn-sm" data-act="consent" data-v="granted">${t('cons.y','Accept')}</button><button type="button" class="btn btn-outline btn-sm" data-act="consent" data-v="denied">${t('cons.n','Decline')}</button></div>`;doc.body.appendChild(c)};
/* ---------- boot ---------- */
const boot=()=>{doc.documentElement.lang=RD.S.lang==='te'?'te':'en';
const filtered=/^\/properties/.test(location.pathname)&&location.search.length>1;
if(RD.S.lang!=='en'||filtered){render({scroll:false})}else{after(RD.route(location.pathname,location.search))}
consentUI();A.load()};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
