"""Pack whole copies of the business-district outlines (BGC, Makati CBD, Ortigas Center) inside the hub outline.

Districts are large next to the hub's narrow, angled shape, so this tries rotations every 10 degrees and several
fill directions, placing each copy at the first spot (along that direction) where it fits entirely inside the free
area (found with a binary erosion). Writes `placements` ([x_km, z_km, rotY_rad]) and `packed` into
public/data/geo/site.json, the same format as pack_malls.py.
"""
import json, math, sys
import numpy as np
import cv2

P = sys.argv[1] if len(sys.argv) > 1 else 'public/data/geo/site.json'
d=json.load(open(P))
w,s,e,n=d['scene']['bbox']; lon0,lat0=(w+e)/2,(s+n)/2
kx,ky=111.32*math.cos(math.radians(lat0)),110.574
xz=lambda lon,lat:((lon-lon0)*kx,-(lat-lat0)*ky)
RES=0.01
hub=np.array([xz(*p) for p in d['hub']]); x0,z0=hub.min(0)-0.05; x1,z1=hub.max(0)+0.05
W,H=int((x1-x0)/RES)+1,int((z1-z0)/RES)+1
inside=np.zeros((H,W),np.uint8); cv2.fillPoly(inside,[np.round((hub-[x0,z0])/RES).astype(np.int32)],1)
def outer(g): return g['coordinates'][0] if g['type']=='Polygon' else max(g['coordinates'],key=lambda p:len(p[0]))[0]
def masks_for(foot, angles):
    out=[]
    for a in angles:
        c,s_=math.cos(a),math.sin(a); r=np.stack([foot[:,0]*c+foot[:,1]*s_,-foot[:,0]*s_+foot[:,1]*c],1)
        span=np.abs(r).max(0)+0.03; mw,mh=int(2*span[0]/RES)+1,int(2*span[1]/RES)+1
        mk=np.zeros((mh,mw),np.uint8); cv2.fillPoly(mk,[np.round((r+span)/RES).astype(np.int32)],1)
        mk=cv2.dilate(mk,np.ones((3,3),np.uint8)); ys,xs=np.nonzero(mk); out.append((a,ys-mh//2,xs-mw//2))
    return out
# fit test via erosion: positions where the rotated mask fits entirely inside free space
def pack(foot, angles, order_angle):
    ms=masks_for(foot,angles)
    free=inside.copy(); placed=[]
    # candidate cells ordered along a direction
    ca,sa=math.cos(order_angle),math.sin(order_angle)
    while True:
        best=None
        for a,dy,dx in ms:
            # kernel image
            kh=dy.max()-dy.min()+1; kw=dx.max()-dx.min()+1
            k=np.zeros((kh,kw),np.uint8); k[dy-dy.min(),dx-dx.min()]=1
            er=cv2.erode(free,k,anchor=(int(-dx.min()),int(-dy.min())),borderType=cv2.BORDER_CONSTANT,borderValue=0)
            ys,xs=np.nonzero(er)
            if len(ys)==0: continue
            score=xs*ca+ys*sa
            i=np.argmin(score)
            if best is None or score[i]<best[0]: best=(score[i],a,ys[i],xs[i],dy,dx)
        if best is None: break
        _,a,j,i,dy,dx=best
        free[dy+j,dx+i]=0
        placed.append([round(x0+i*RES,4),round(z0+j*RES,4),round(a,4)])
    return placed
for key in ['bgc','makaticbd','ortigas']:
    r=d['refs'][key]; ring=np.array(outer(r['geom'])); clon,clat=ring[:,0].mean(),ring[:,1].mean(); kxm=111.32*math.cos(math.radians(clat))
    foot=np.stack([(ring[:,0]-clon)*kxm,-(ring[:,1]-clat)*ky],1)
    angles=[math.radians(t) for t in range(0,360,10)]
    best=[]
    for oa in [math.radians(t) for t in range(0,360,30)]:
        p=pack(foot,angles,oa)
        if len(p)>len(best): best=p
    print(key, 'old', r['packed'], 'new', len(best), 'area ratio', round(1619/r['area_ha'],1), flush=True)
    if len(best) >= r['packed']:
        r['placements'] = best
        r['packed'] = len(best)

json.dump(d, open(P, 'w'), separators=(',', ':'))
