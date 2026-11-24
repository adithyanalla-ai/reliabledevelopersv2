import json,sys,re
from playwright.sync_api import sync_playwright
BASE='http://localhost:4100'
W=[360,375,390,768,1024,1440,1920]
PAGES=['/','/properties','/properties/residential-plots','/property/demo-plot-01','/locations','/locations/vijayawada','/services','/about','/insights','/insights/before-buying-a-plot-in-vijayawada','/contact','/tools','/property-confidence','/privacy','/saved','/compare','/admin','/nope']
res={'overflow':[],'console':[],'failed':[],'small_targets':[]}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w in W:
        c=b.new_context(viewport={'width':w,'height':900});pg=c.new_page()
        pg.on('console',lambda m,w=w:res['console'].append((w,m.type,m.text[:160])) if m.type in('error','warning') and 'TUNNEL' not in m.text else None)
        pg.on('pageerror',lambda e,w=w:res['console'].append((w,'pageerror',str(e)[:200])))
        pg.on('requestfailed',lambda r,w=w:res['failed'].append((w,r.url[:120])) if 'fonts.g' not in r.url else None)
        pg.on('response',lambda r,w=w:res['failed'].append((w,r.status,r.url[:120])) if r.status>=400 and 'fonts.g' not in r.url and not r.url.endswith('/nope') else None)
        for u in PAGES:
            pg.goto(BASE+u,wait_until='load');pg.wait_for_timeout(250)
            o=pg.evaluate("()=>{const d=document.documentElement;const bad=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>innerWidth+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('.tablewrap')){bad.push(e.tagName+'.'+e.className)}});return {sw:d.scrollWidth,iw:innerWidth,bad:bad.slice(0,4)}}")
            if o['sw']>o['iw'] or o['bad']:res['overflow'].append((w,u,o))
            if w<=390 and u in('/','/properties','/property/demo-plot-01'):
                t=pg.evaluate("()=>[...document.querySelectorAll('a,button,input,select,textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&e.offsetParent&&(r.height<40||r.width<40)&&!e.classList.contains('hp')&&!e.closest('.sr')&&e.type!=='checkbox'&&e.type!=='radio'&&getComputedStyle(e).position!=='absolute'}).map(e=>e.tagName+' '+(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,25)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).slice(0,8)")
                if t:res['small_targets'].append((w,u,t))
        c.close()
    b.close()
print(json.dumps(res,indent=1)[:6000])
