import re,os,sys,urllib.request,urllib.error
D='dist';pages=[];
for r,_,f in os.walk(D):
    for x in f:
        if x.endswith('.html'):pages.append(os.path.join(r,x))
seen=set();bad=[];ext=set();imgs=set();noalt=[];nolabel=[];h1bad=[]
for pth in pages:
    h=open(pth,encoding='utf8').read()
    if pth!='dist/404.html' and len(re.findall(r'<h1[ >]',h))!=1:h1bad.append((pth,len(re.findall(r'<h1[ >]',h))))
    for m in re.findall(r'<img [^>]*>',h):
        if ' alt=' not in m:noalt.append(pth)
    for u in re.findall(r'(?:href|src)="([^"#]+)',h)+re.findall(r'srcset="([^"]+)"',h):
        for part in (u.split(',') if ' ' in u and 'webp' in u else [u]):
            part=part.strip().split(' ')[0].split('?')[0]
            if part.startswith('http'):ext.add(part);continue
            if part.startswith(('mailto','tel','javascript')) or not part.startswith('/'):continue
            seen.add(part)
def exists(u):
    p=D+u
    return os.path.isfile(p) or os.path.isfile(p+'.html') or os.path.isfile(p+'/index.html') or u=='/'
for u in sorted(seen):
    if not exists(u):bad.append(u)
print('pages',len(pages),'internal targets',len(seen),'broken',bad,'imgs missing alt',len(noalt),'h1 problems',h1bad)
