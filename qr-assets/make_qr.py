import segno, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
URL="https://mysmo87.github.io/mission-possible/"
NAVY="#062B55"; out="/home/claude/qr-assets/"
qr=segno.make(URL, error='h', micro=False)
print("version",qr.version,"ecc",qr.error)
# 1) PNG high-res, white bg, quiet zone 4
qr.save(out+"mission-possible-qr.png", scale=40, border=4, dark=NAVY, light="white")
# 2) SVG
qr.save(out+"mission-possible-qr.svg", scale=10, border=4, dark=NAVY, light="white")
# 3) Transparent PPT: rounded white panel incl. quiet zone, transparent outside
base=Image.open(out+"mission-possible-qr.png").convert("RGBA"); s=base.size[0]; pad=60
im=Image.new("RGBA",(s+2*pad,s+2*pad),(0,0,0,0))
mask=Image.new("L",im.size,0); ImageDraw.Draw(mask).rounded_rectangle([pad,pad,pad+s-1,pad+s-1],radius=int(s*0.06),fill=255)
panel=Image.new("RGBA",im.size,(0,0,0,0)); panel.paste(base,(pad,pad))
im.paste(panel,(0,0),mask); im.save(out+"mission-possible-qr-transparent.png")
# 4) Caption version
F=ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf",int(s*0.06))
cap_h=int(s*0.16); W=s; H=s+cap_h
c=Image.new("RGB",(W,H),"white"); c.paste(base.convert("RGB"),(0,0))
d=ImageDraw.Draw(c); txt="SCAN TO CONNECT"
# letter-spaced text
sp=int(s*0.008); widths=[d.textlength(ch,font=F) for ch in txt]; tw=sum(widths)+sp*(len(txt)-1)
x=(W-tw)/2; y=s-int(s*0.02)
for ch,w in zip(txt,widths): d.text((x,y),ch,font=F,fill=NAVY); x+=w+sp
c.save(out+"mission-possible-qr-scan-to-connect.png")
# transparent caption version too
ct=Image.new("RGBA",(W+2*pad,H+2*pad),(0,0,0,0)); m2=Image.new("L",ct.size,0)
ImageDraw.Draw(m2).rounded_rectangle([pad,pad,pad+W-1,pad+H-1],radius=int(s*0.06),fill=255)
p2=Image.new("RGBA",ct.size,(0,0,0,0)); p2.paste(c.convert("RGBA"),(pad,pad)); ct.paste(p2,(0,0),m2)
ct.save(out+"mission-possible-qr-scan-to-connect-transparent.png")
# verify decode at full and small "projected" size
det=cv2.QRCodeDetector()
for f in ["mission-possible-qr.png","mission-possible-qr-transparent.png","mission-possible-qr-scan-to-connect.png"]:
    img=Image.open(out+f).convert("RGBA"); bg=Image.new("RGBA",img.size,(6,43,85,255)); bg.alpha_composite(img)
    for sz in [img.size[0], 200]:
        a=np.array(bg.convert("RGB").resize((sz,int(sz*img.size[1]/img.size[0])))); a=cv2.copyMakeBorder(a,40,40,40,40,cv2.BORDER_CONSTANT,value=(6,43,85))
        val,_,_=det.detectAndDecode(a[:,:,::-1]); print(f,sz,"OK" if val==URL else "FAIL:"+repr(val))
