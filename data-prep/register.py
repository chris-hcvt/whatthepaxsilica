import cv2, numpy as np, math, json, sys, urllib.request
S=sys.argv[1]
R=6378137.0
def merc(lon,lat): return (math.radians(lon)*R, math.log(math.tan(math.pi/4+math.radians(lat)/2))*R)
def unmerc(x,y): return (math.degrees(x/R), math.degrees(2*math.atan(math.exp(y/R))-math.pi/2))
x0,y0=merc(120.30,15.15); x1,y1=merc(120.65,15.42)
W=1600; H=int(W*(y1-y0)/(x1-x0))
url=f"https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox={x0},{y0},{x1},{y1}&bboxSR=3857&imageSR=3857&size={W},{H}&format=png&f=image"
urllib.request.urlretrieve(url, f"{S}/dl/ref/esri3857.png")
ref=cv2.imread(f"{S}/dl/ref/esri3857.png"); print('ref',ref.shape, (x1-x0)/W,'m/px')
src=cv2.imread(f"{S}/dl/hrwmap/Layer_1_copy.png"); print('src',src.shape)
mask=np.full(src.shape[:2],255,np.uint8); mask[0:325,0:265]=0
# suppress red/green overlays & white labels in mask
hsv=cv2.cvtColor(src,cv2.COLOR_BGR2HSV)
over=((hsv[...,1]>120)&(((hsv[...,0]<10)|(hsv[...,0]>170))|((hsv[...,0]>45)&(hsv[...,0]<75))))|(src.min(axis=2)>225)
over=cv2.dilate(over.astype(np.uint8),np.ones((7,7),np.uint8))>0
mask[over]=0
sift=cv2.SIFT_create(nfeatures=8000)
g1=cv2.cvtColor(src,cv2.COLOR_BGR2GRAY); g2=cv2.cvtColor(ref,cv2.COLOR_BGR2GRAY)
k1,d1=sift.detectAndCompute(g1,mask); k2,d2=sift.detectAndCompute(g2,None)
print('kp',len(k1),len(k2))
m=cv2.BFMatcher().knnMatch(d1,d2,k=2)
good=[a for a,b in m if a.distance<0.8*b.distance]
print('good',len(good))
p1=np.float32([k1[a.queryIdx].pt for a in good]); p2=np.float32([k2[a.trainIdx].pt for a in good])
A,inl=cv2.estimateAffinePartial2D(p1,p2,method=cv2.RANSAC,ransacReprojThreshold=3,maxIters=20000,confidence=0.999)
print('similarity inliers',int(inl.sum()),'\n',A)
A2,inl2=cv2.estimateAffine2D(p1,p2,method=cv2.RANSAC,ransacReprojThreshold=3,maxIters=20000,confidence=0.999)
print('affine inliers',int(inl2.sum()),'\n',A2)
sc=math.hypot(A[0,0],A[1,0]); rot=math.degrees(math.atan2(A[1,0],A[0,0]))
print('scale ref px per src px',sc,'rotation deg',rot)
mpp=(x1-x0)/W
print('src m/px (mercator)',sc*mpp,' ground m/px ~',sc*mpp*math.cos(math.radians(15.3)))
res=p2[inl.ravel()==1]-(p1[inl.ravel()==1]@A[:,:2].T+A[:,2]); print('resid px rms',float(np.sqrt((res**2).sum(1).mean())))
json.dump({'A':A.tolist(),'A2':A2.tolist(),'ref_bbox':[x0,y0,x1,y1],'W':W,'H':H},open(f"{S}/dl/ref/reg.json",'w'))
# overlay check image: warp src onto ref
warp=cv2.warpAffine(src,A,(ref.shape[1],ref.shape[0]))
blend=cv2.addWeighted(ref,0.5,warp,0.5,0); cv2.imwrite(f"{S}/dl/ref/blend.jpg",blend,[cv2.IMWRITE_JPEG_QUALITY,80])
