import json, sys, urllib.request, numpy as np, rasterio
from rasterio.warp import reproject, Resampling
from rasterio.transform import from_bounds
from PIL import Image
S=sys.argv[1]
BBOX=(120.38,15.20,120.62,15.39)
W=2048; H=int(round(W*(BBOX[3]-BBOX[1])/(BBOX[2]-BBOX[0])))
T=from_bounds(*BBOX,W,H)
dates=['20261015','20260913','20261018','20261102','20260925','20261003','20260312']
mos=np.zeros((3,H,W),np.uint8); filled=np.zeros((H,W),bool); used={}
def item(iid):
    try: return json.load(urllib.request.urlopen(f"https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/{iid}"))
    except Exception: return None
for dt in dates:
    for tile in ['51PTS','51PTT']:
        for sat in ['S2A','S2B','S2C']:
            it=item(f"{sat}_{tile}_{dt}_0_L2A")
            if it: break
        if not it: continue
        tci=np.zeros((3,H,W),np.uint8); scl=np.zeros((H,W),np.uint8)
        with rasterio.open(it['assets']['visual']['href']) as ds:
            for b in range(3): reproject(rasterio.band(ds,b+1),tci[b],dst_transform=T,dst_crs='EPSG:4326',resampling=Resampling.bilinear,src_nodata=0,dst_nodata=0)
        with rasterio.open(it['assets']['scl']['href']) as ds:
            reproject(rasterio.band(ds,1),scl,dst_transform=T,dst_crs='EPSG:4326',resampling=Resampling.nearest,src_nodata=0,dst_nodata=0)
        good=(scl>0)&~np.isin(scl,[1,3,8,9,10])&(tci.sum(0)>0)
        # dilate clouds a bit to avoid halos
        import cv2
        bad=(~good).astype(np.uint8); bad=cv2.dilate(bad,np.ones((9,9),np.uint8))>0
        good=~bad
        m=good&~filled
        mos[:,m]=tci[:,m]; filled|=m; used[it['id']]=int(m.sum())
        print(it['id'],'added',int(m.sum()),'filled%',round(filled.mean()*100,2),flush=True)
    if filled.mean()>0.9995: break
print(used)
img=Image.fromarray(mos.transpose(1,2,0))
img.save(f"{S}/out/site_s2_2048.jpg",quality=80,optimize=True,progressive=True)
img.resize((1024,int(H/2)),Image.LANCZOS).save(f"{S}/out/site_s2_1024.jpg",quality=80,optimize=True,progressive=True)
json.dump({'bbox':BBOX,'W':W,'H':H,'scenes':used},open(f"{S}/out/site_s2_meta.json",'w'))
