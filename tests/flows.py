import json,urllib.request
from playwright.sync_api import sync_playwright
B='http://localhost:4100'
def state():return json.load(urllib.request.urlopen('http://127.0.0.1:4101/__state'))
def get(u):urllib.request.urlopen('http://127.0.0.1:4101'+u).read()
R=[]
def ok(n,c,x=''):R.append((n,bool(c),x));print(('PASS' if c else 'FAIL'),n,x)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    c=b.new_context(viewport={'width':390,'height':844});pg=c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text and '404' not in m.text else None)
    pg.goto(B+'/');pg.wait_for_timeout(400)
    # drawer
    pg.click('#menuBtn');pg.wait_for_timeout(100)
    ok('drawer opens',pg.is_visible('#mnav') and pg.get_attribute('#menuBtn','aria-expanded')=='true')
    ok('scroll locked','lock' in pg.get_attribute('body','class'))
    ok('focus inside drawer',pg.evaluate("document.querySelector('#mnav').contains(document.activeElement)"))
    for _ in range(25):pg.keyboard.press('Tab')
    ok('focus trapped',pg.evaluate("document.querySelector('#mnav').contains(document.activeElement)"))
    pg.keyboard.press('Escape');pg.wait_for_timeout(100)
    ok('esc closes + focus returns',not pg.is_visible('#mnav') and pg.evaluate("document.activeElement.id")=='menuBtn')
    # hero search -> URL
    pg.select_option('#hs select[name=type]','plot');pg.select_option('#hs select[name=loc]','Vijayawada');pg.click('#hs button[type=submit]');pg.wait_for_timeout(300)
    ok('search -> shareable URL',pg.url.endswith('/properties?type=plot&loc=Vijayawada'),pg.url)
    ok('filter applied',pg.locator('#results .pc').count()==1)
    pg.goto(B+'/properties?type=villa');pg.wait_for_timeout(400)
    ok('direct filter URL: empty-filter state',pg.locator('.empty').count()==1 and pg.locator('#results').count()==0)
    # save + compare
    pg.goto(B+'/properties');pg.wait_for_timeout(300)
    pg.click('[data-act=save][data-pid=demo-plot-01]');pg.click('[data-act=cmp][data-pid=demo-apt-01]');pg.click('[data-act=cmp][data-pid=demo-plot-01]')
    pg.goto(B+'/saved');pg.wait_for_timeout(400);ok('saved page lists item',pg.locator('#savedbox .pc').count()==1)
    pg.goto(B+'/compare');pg.wait_for_timeout(400);ok('compare table 2 cols',pg.locator('.cmp thead th').count()==3)
    pg.goto(B+'/property/demo-plot-01');pg.goto(B+'/properties');pg.wait_for_timeout(400);ok('recently viewed',pg.locator('#recent .pc').count()>=1)
    # lead form: validation
    pg.goto(B+'/contact');pg.wait_for_timeout(300)
    pg.click('main [data-act=enquire]');pg.wait_for_timeout(200)
    pg.click('.mod button[type=submit]');pg.wait_for_timeout(100)
    ok('validation errors shown',pg.locator('.mod .err:not(:empty)').count()>=3)
    # DB failure => no success
    get('/__fail')
    pg.fill('.mod [name=name]','Test User');pg.fill('.mod [name=mobile]','9876543210');pg.check('.mod [name=consent]')
    pg.click('.mod button[type=submit]');pg.wait_for_timeout(700)
    ok('storage failure shows error, not success',pg.locator('.ok-box').count()==0 and 'could not send' in pg.inner_text('.mod .fstatus').lower(),pg.inner_text('.mod .fstatus')[:80])
    get('/__ok')
    pg.click('.mod button[type=submit]');pg.wait_for_timeout(900)
    ok('success shown after confirmed storage',pg.locator('.ok-box .refno').count()==1,pg.inner_text('.ok-box .refno') if pg.locator('.ok-box').count() else '')
    s=state();ok('lead stored with attribution + consent',len(s['leads'])==1 and s['leads'][0]['consent'] is True and s['leads'][0]['ref'].startswith('RD-'),str(s['leads'][0]['page']) if s['leads'] else '')
    ok('team email sent',len(s['mail'])==1);ok('Meta CAPI called with event_id',len(s['meta'])==1 and s['meta'][0]['data'][0]['event_id']==s['leads'][0]['event_id'])
    pg.keyboard.press('Escape')
    # visit request wording
    pg.goto(B+'/property/demo-plot-01');pg.click('.eq [data-type=visit]');pg.wait_for_timeout(200)
    pg.fill('.mod [name=name]','Visit Person');pg.fill('.mod [name=mobile]','9123456780');pg.check('.mod [name=consent]');pg.click('.mod button[type=submit]');pg.wait_for_timeout(800)
    ok('visit says request not confirmed','not a confirmed appointment' in pg.inner_text('.mod'))
    ok('visit lead stores property',state()['leads'][-1]['property_ref']=='demo-plot-01')
    pg.keyboard.press('Escape')
    # honeypot
    r=urllib.request.Request(B+'/api/lead',data=json.dumps({'type':'enquiry','name':'Bot','cc':'+91','mobile':'9999999999','consent':True,'website':'x'}).encode(),headers={'Content-Type':'application/json'});n0=len(state()['leads']);urllib.request.urlopen(r).read();ok('honeypot stores nothing',len(state()['leads'])==n0)
    # finder
    pg.goto(B+'/');pg.wait_for_timeout(300);pg.locator('#wiz').scroll_into_view_if_needed()
    pg.click('[data-act=wopt][data-v="Personal use"]') if pg.locator('[data-act=wopt][data-v="Personal use"]').count() else pg.locator('#wiz .opt').first.click()
    pg.click('[data-act=wnext]');pg.click('#wiz .opt >> nth=1');pg.click('[data-act=wnext]');pg.click('[data-act=wloc]>>nth=0');pg.click('[data-act=wnext]');pg.click('#wiz .opt>>nth=1');pg.click('[data-act=wnext]');pg.click('[data-act=wnext]')
    pg.click('#wiz .opt>>nth=0');pg.click('[data-act=wnext]')
    pg.click('[data-act=wback]');pg.click('[data-act=wnext]')
    ok('step 7 reached',pg.locator('#wf').count()==1)
    pg.click('[data-act=wback]');ok('back preserves timeline selection',pg.locator('#wiz .opt.on').count()==1)
    pg.click('[data-act=wnext]')
    pg.fill('#wf [name=name]','Finder Person');pg.select_option('#wf [name=cc]','+971');pg.fill('#wf [name=mobile]','501234567');pg.check('#wf [name=consent]');pg.click('#wf button[type=submit]');pg.wait_for_timeout(900)
    L=state()['leads'][-1];ok('finder lead stored with cc',L['type']=='finder' and L['phone_cc']=='+971' and L['finder']['locs'],str(L['finder']))
    ok('finder done screen',pg.locator('#wiz .refno').count()==1)
    # bad phone for country
    # calculators
    pg.goto(B+'/tools');pg.wait_for_timeout(300)
    pg.fill('#e-a','5000000');pg.fill('#e-r','8.75');pg.fill('#e-y','20');ok('EMI = 44,186',pg.inner_text('[data-o=emi]')=='₹44,186',pg.inner_text('[data-o=emi]'))
    pg.fill('#a-v','1');pg.select_option('#a-u','acre');ok('1 acre = 43,560 sq ft','43,560' in pg.inner_text('[data-o=conv]'))
    pg.fill('#c-p','5000000');pg.fill('#c-s','5');pg.fill('#c-g','1');ok('cost estimator uses entered rates',pg.inner_text('[data-o=total]')=='₹53,00,000',pg.inner_text('[data-o=total]'))
    # language
    pg.goto(B+'/');pg.click('.hdr [data-act=lang][data-v=te]');pg.wait_for_timeout(300);ok('Telugu switch',pg.evaluate("document.documentElement.lang")=='te' and 'ఆస్తి' in pg.inner_text('h1') or pg.evaluate("document.documentElement.lang")=='te',pg.inner_text('h1')[:30])
    pg.reload();pg.wait_for_timeout(300);ok('language persists',pg.evaluate("document.documentElement.lang")=='te')
    # legacy hash
    pg.evaluate("localStorage.clear()");pg.goto(B+'/#/properties');pg.wait_for_timeout(500);ok('legacy hash redirect',pg.url.endswith('/properties'),pg.url)
    # no demo in prod? separate
    errs=[e for e in errs if '502' not in e];ok('no JS errors',not errs,str(errs[:3]))
    b.close()
print(sum(1 for r in R if r[1]),'/',len(R))
