import re, sys, json, math, cv2, numpy as np
S=sys.argv[1]; sys.path.insert(0,S+'/scripts'); from svgpath import parse_path
R=6378137.0
def unmerc(x,y): return (math.degrees(x/R), math.degrees(2*math.atan(math.exp(y/R))-math.pi/2))
reg=json.load(open(S+'/dl/ref/reg.json')); A=np.array(reg['A']); x0,y0,x1,y1=reg['ref_bbox']; W,H=reg['W'],reg['H']
OFF=np.array([-11.162281,746.552287]); SC=0.838448
def svg2px(p): return (np.array(p)-OFF)/SC
def px2ll(p):
    q=A[:,:2]@np.array(p)+A[:,2]
    mx=x0+q[0]*(x1-x0)/W; my=y1-q[1]*(y1-y0)/H
    return unmerc(mx,my)
s=open(S+'/dl/hrwmap/map_noimg.svg').read()
def get(cls): return [m.group(1) for m in re.finditer(r'<path[^>]*class="'+cls+r'"[^>]*d="([^"]+)"',s)]
hub=parse_path(get('cls-12')[0])[0]; ncc=parse_path(get('cls-3')[0])[0]
def ring_ll(r):
    pts=[px2ll(svg2px(p)) for p in r]
    if pts[0]!=pts[-1]: pts.append(pts[0])
    return [[round(a,6),round(b,6)] for a,b in pts]
# geodesic-ish area (local equal-area projection)
def area_ha(ring):
    lat0=sum(p[1] for p in ring)/len(ring)
    xy=[(math.radians(p[0])*R*math.cos(math.radians(lat0)), math.radians(p[1])*R) for p in ring]
    a=sum(xy[i][0]*xy[i+1][1]-xy[i+1][0]*xy[i][1] for i in range(len(xy)-1))/2
    return abs(a)/1e4
H_ll=ring_ll(hub); N_ll=ring_ll(ncc)
print('hub area ha',round(area_ha(H_ll),1),' ncc area ha',round(area_ha(N_ll),1))
# sitio dots in bottom vector map
dots={'Binyayan':(500.291257,895.796093),'Sapang Kawayan':(576.590085,953.649059),'dot_647_967':(647.019712,967.90266),'dot_573_1076':(573.236264,1076.062511),'dot_543_798':(543.052121,798.536083)}
D={k:[round(v,6) for v in px2ll(svg2px(p))] for k,p in dots.items()}
print(json.dumps(D,indent=0))
# draw hub vector on raster for verification
src=cv2.imread(S+'/dl/hrwmap/Layer_1_copy.png')
for r,col in((hub,(255,255,0)),(ncc,(255,0,255))):
    pts=np.int32([svg2px(p) for p in r]); cv2.polylines(src,[pts],True,col,1)
cv2.imwrite(S+'/dl/ref/vec_on_raster.png',src[0:698,250:998])
json.dump({'hub':H_ll,'ncc':N_ll,'dots':D},open(S+'/data/derived.json','w'))
