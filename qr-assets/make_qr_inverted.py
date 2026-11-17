import segno, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
URL="https://sas-wpssession.com/"; out="/home/claude/qr-assets/"
qr=segno.make(URL, error='h')
scale=40; border=4
m=np.array([[1 if v else 0 for v in row] for row in qr.matrix],dtype=np.uint8)
n=m.shape[0]; S=(n+2*border)*scale
im=Image.new("RGBA",(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
for y in range(n):
    for x in range(n):
        if m[y,x]: d.rectangle([(x+border)*scale,(y+border)*scale,(x+border+1)*scale-1,(y+border+1)*scale-1],fill=(255,255,255,255))
im.save(out+"mission-possible-qr-white-on-blue.png")
qr.save(out+"mission-possible-qr-white-on-blue.svg", scale=10, border=4, dark="#FFFFFF", light=None)
# caption
F=ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf",int(S*0.06))
cap=int(S*0.16); c=Image.new("RGBA",(S,S+cap),(0,0,0,0)); c.paste(im,(0,0))
dd=ImageDraw.Draw(c); txt="SCAN TO CONNECT"; sp=int(S*0.008)
w=[dd.textlength(ch,font=F) for ch in txt]; tw=sum(w)+sp*(len(txt)-1); x=(S-tw)/2; y=S-int(S*0.02)
for ch,ww in zip(txt,w): dd.text((x,y),ch,font=F,fill=(255,255,255,255)); x+=ww+sp
c.save(out+"mission-possible-qr-white-on-blue-scan-to-connect.png")
# verify on navy slide background
det=cv2.QRCodeDetector()
for f in ["mission-possible-qr-white-on-blue.png","mission-possible-qr-white-on-blue-scan-to-connect.png"]:
    img=Image.open(out+f); bg=Image.new("RGBA",img.size,(6,43,85,255)); bg.alpha_composite(img)
    for sz in [img.size[0],200]:
        a=np.array(bg.convert("RGB").resize((sz,int(sz*img.size[1]/img.size[0]))))
        g=cv2.cvtColor(a,cv2.COLOR_RGB2GRAY)
        v1,_,_=det.detectAndDecode(g); v2,_,_=det.detectAndDecode(255-g)
        print(f,sz,"normal:",v1==URL,"inverted-read:",v2==URL)
# preview on navy
p=Image.open(out+"mission-possible-qr-white-on-blue-scan-to-connect.png"); bg=Image.new("RGBA",(p.size[0]+200,p.size[1]+200),(6,43,85,255)); bg.alpha_composite(p,(100,100)); bg.convert("RGB").resize((500,int(500*bg.size[1]/bg.size[0]))).save("/home/claude/inv_preview.png")
