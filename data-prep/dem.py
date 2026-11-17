import sys, json, numpy as np, rasterio
from rasterio.warp import reproject, Resampling
from rasterio.transform import from_bounds
S=sys.argv[1]
BBOX=(120.38,15.20,120.62,15.39)
NX,NY=257,204   # vertices
T=from_bounds(*BBOX,NX,NY)
url="https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N15_00_E120_00_DEM/Copernicus_DSM_COG_10_N15_00_E120_00_DEM.tif"
dem=np.zeros((NY,NX),np.float32)
with rasterio.open(url) as ds:
    print(ds.crs, ds.res)
    reproject(rasterio.band(ds,1),dem,dst_transform=T,dst_crs='EPSG:4326',resampling=Resampling.average)
print('min',dem.min(),'max',dem.max(),'mean',dem.mean())
q=np.clip(np.round(dem*10),0,65535).astype('<u2')
q.tofile(f"{S}/out/site_dem.bin")
json.dump({'bbox':BBOX,'nx':NX,'ny':NY,'scale':0.1,'min':float(dem.min()),'max':float(dem.max()),'source':'Copernicus GLO-30 DEM'},open(f"{S}/out/site_dem_meta.json",'w'))
# also sample elevations at sitios & hub centroid
d=json.load(open(f"{S}/data/derived.json"))
def elev(lon,lat):
    x=(lon-BBOX[0])/(BBOX[2]-BBOX[0])*(NX-1); y=(BBOX[3]-lat)/(BBOX[3]-BBOX[1])*(NY-1)
    return float(dem[int(round(y)),int(round(x))])
for k,v in d['sitios'].items(): print(k, round(elev(*v['lonlat'])))
