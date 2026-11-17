import re
def parse_path(d):
    toks=re.findall(r'[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?',d)
    i=0; cmd=None; x=y=0; sx=sy=0; rings=[]; cur=[]
    def num():
        nonlocal i
        v=float(toks[i]); i+=1; return v
    while i<len(toks):
        t=toks[i]
        if re.match(r'[A-Za-z]',t): cmd=t; i+=1
        if cmd in 'Mm':
            a,b=num(),num()
            if cur: rings.append(cur)
            x,y=(x+a,y+b) if cmd=='m' else (a,b); sx,sy=x,y; cur=[(x,y)]
            cmd='l' if cmd=='m' else 'L'
        elif cmd in 'Ll':
            a,b=num(),num(); x,y=(x+a,y+b) if cmd=='l' else (a,b); cur.append((x,y))
        elif cmd in 'Hh':
            a=num(); x=x+a if cmd=='h' else a; cur.append((x,y))
        elif cmd in 'Vv':
            a=num(); y=y+a if cmd=='v' else a; cur.append((x,y))
        elif cmd in 'Cc':
            vals=[num() for _ in range(6)]
            x,y=(x+vals[4],y+vals[5]) if cmd=='c' else (vals[4],vals[5]); cur.append((x,y))
        elif cmd in 'Ss' or cmd in 'Qq':
            vals=[num() for _ in range(4)]
            x,y=(x+vals[2],y+vals[3]) if cmd.islower() else (vals[2],vals[3]); cur.append((x,y))
        elif cmd in 'Zz':
            if cur: rings.append(cur); cur=[]
            x,y=sx,sy
            if i<len(toks) and not re.match(r'[A-Za-z]',toks[i]): cmd='l'
        else:
            raise ValueError(cmd)
    if cur: rings.append(cur)
    return rings
def area(r):
    return abs(sum(r[k][0]*r[(k+1)%len(r)][1]-r[(k+1)%len(r)][0]*r[k][1] for k in range(len(r))))/2
