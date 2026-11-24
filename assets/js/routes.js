/* Shared router: maps a path to {status,title,desc,html,ld,noindex}. Used by the build (prerender) and the browser. */
(function(g){const RD=g.RD,V=RD.V,t=RD.t,esc=RD.esc;
const NAME='Reliable Developers';
RD.shell=(path,body)=>`${V.header(path)}<main id="main" tabindex="-1">${body}</main>${V.footer()}${V.mbar()}${V.drawer(path)}`;
RD.legalTitles={privacy:'Privacy policy',terms:'Terms and conditions',disclaimer:'Property disclaimer'};
RD.allPaths=()=>{const p=['/','/properties','/locations','/services','/about','/insights','/contact','/tools','/property-confidence','/privacy','/terms','/disclaimer'];
RD.CATS.forEach(c=>p.push('/properties/'+c.slug));RD.LOCS.forEach(l=>p.push('/locations/'+l.s));RD.ARTS.forEach(a=>p.push('/insights/'+a.s));
RD.live().forEach(x=>p.push('/property/'+x.id));return p};
RD.route=(path,search)=>{path=(path||'/').replace(/\/+$/,'')||'/';let m;
const R=(title,desc,body,o)=>Object.assign({status:200,title:title,desc:desc,html:RD.shell(path,body),ld:[],noindex:false,path:path},o||{});
const D=RD.BRAND.tagline;
if(path==='/')return R(NAME+' | Property in Vijayawada and the Amaravati Capital Region','Plots, apartments, villas and land across Vijayawada and the Amaravati capital region, presented with clear information about what has and has not been checked.',V.home(),{ld:[RD.orgLD(),V.faqLD()]});
if(path==='/properties'){const f=RD.parseQuery(search);return R('Properties for sale in Vijayawada and Amaravati | '+NAME,'Browse available plots, apartments, villas and land in Vijayawada and the Amaravati region.',V.listing(f),{noindex:!!(search&&search.length>1&&/[?&](q|sort|view|page)=/.test(search))})}
if(m=path.match(/^\/properties\/([a-z-]+)$/)){const c=RD.CATS.find(x=>x.slug===m[1]);if(!c)return R('Page not found | '+NAME,'',V.notFound(),{status:404,noindex:true});const f=RD.parseQuery(search,c.k);return R(c.l+' for sale in Vijayawada and Amaravati | '+NAME,c.d,V.listing(f,c),{ld:[RD.crumbLD([['Home','/'],['Properties','/properties'],[c.l,path]])]})}
if(m=path.match(/^\/property\/([A-Za-z0-9_-]+)$/)){const p=RD.byId(m[1]);if(!p||!RD.isLive(p))return R('Property not available | '+NAME,'',V.notFound(true),{status:404,noindex:true});return R(p.title+', '+p.loc+' | '+NAME,(p.desc||'').slice(0,155),V.detail(p),{ld:V.detailLD(p),ogImage:(p.images||[])[0]})}
if(path==='/locations')return R('Locations: Vijayawada, Amaravati, Guntur, Mangalagiri and more | '+NAME,'Eight locations across the Vijayawada and Amaravati capital region, each with its own guide.',V.locations());
if(m=path.match(/^\/locations\/([a-z0-9-]+)$/)){const l=RD.LOCS.find(x=>x.s===m[1]);if(!l)return R('Page not found | '+NAME,'',V.notFound(),{status:404,noindex:true});return R('Property in '+l.n+' | '+NAME,l.tag+' '+l.ov.slice(0,100),V.location(l.s),{ld:V.locationLD(l).concat([RD.crumbLD([['Home','/'],['Locations','/locations'],[l.n,path]])])})}
if(path==='/services')return R('Services for buyers, investors, NRIs and owners | '+NAME,'How Reliable Developers helps with property search, site visits, documentation guidance, NRI support and owner listings.',V.services());
if(path==='/about')return R('About '+NAME+' | Vijayawada','Our approach to trust, transparency and long-term relationships in property.',V.about());
if(path==='/insights')return R('Insights: guides to buying property in Andhra Pradesh | '+NAME,'Plain-language guides for buyers, NRIs and owners.',V.insights());
if(m=path.match(/^\/insights\/([a-z0-9-]+)$/)){const a=RD.ARTS.find(x=>x.s===m[1]);if(!a)return R('Page not found | '+NAME,'',V.notFound(),{status:404,noindex:true});return R(a.t+' | '+NAME,a.x||a.t,V.article(a.s),{ld:V.articleLD(a)})}
if(path==='/contact')return R('Contact '+NAME,'Speak to the Reliable Developers team about property in Vijayawada and Amaravati.',V.contact(),{ld:[RD.orgLD()]});
if(path==='/tools')return R('Property tools: EMI, costs, area converter, checklist | '+NAME,'Calculators and a document checklist for property buyers in Andhra Pradesh.',V.tools());
if(path==='/property-confidence')return R('Property Confidence Centre | '+NAME,'What owner-supplied, team-checked and independently verified mean on our listings, and how to check for yourself.',V.confidence());
if(m=path.match(/^\/(privacy|terms|disclaimer)$/))return R(RD.legalTitles[m[1]]+' | '+NAME,'',V.legal(m[1]));
if(path==='/saved')return R('Saved properties | '+NAME,'',V.client(t('nav.saved','Saved properties'),'Properties you have saved on this device.','Saved','savedbox'),{noindex:true});
if(path==='/compare')return R('Compare properties | '+NAME,'',V.client(t('nav.compare','Compare properties'),'Side-by-side comparison of up to three properties.','Compare','comparebox'),{noindex:true});
if(path==='/admin')return R('Admin | '+NAME,'',V.admin(),{noindex:true});
return R('Page not found | '+NAME,'',V.notFound(),{status:404,noindex:true})};
})(typeof window!=='undefined'?window:globalThis);
