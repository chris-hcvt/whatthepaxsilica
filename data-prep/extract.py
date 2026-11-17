import sys, re, html
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.out=[]; s.skip=0
    def handle_starttag(s,t,a):
        if t in('script','style','noscript','svg','nav','footer','header','form'): s.skip+=1
        if t in('p','br','li','h1','h2','h3','h4','tr','div','figcaption'): s.out.append('\n')
        if t=='img':
            d=dict(a)
            if d.get('alt'): s.out.append(f"\n[IMG alt: {d.get('alt')}]\n")
    def handle_endtag(s,t):
        if t in('script','style','noscript','svg','nav','footer','header','form') and s.skip: s.skip-=1
    def handle_data(s,d):
        if not s.skip: s.out.append(d)
p=P(); p.feed(open(sys.argv[1],encoding='utf-8',errors='replace').read())
t=''.join(p.out); t=re.sub(r'[ \t]+',' ',t); t=re.sub(r'\n\s*\n+','\n\n',t)
print(t.strip())
