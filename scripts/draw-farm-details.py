"""Draw TinyDust's original companions and decorations with crisp pixel shapes."""
from pathlib import Path

out = Path(__file__).resolve().parents[1] / 'mods/tinydust'

def sprite(name, draw):
    parts=[]
    def r(x,y,w,h,color):
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>')
    r(3,18,19,2,'#35473b55')
    draw(r)
    svg='<svg xmlns="http://www.w3.org/2000/svg" width="96" height="80" viewBox="0 0 24 20" shape-rendering="crispEdges">'+''.join(parts)+'</svg>\n'
    (out/f'companion-{name}.svg').write_text(svg)

def cat(r):
    ink,base,light='#584959','#b9a9c5','#e7dce4'
    r(17,9,4,7,ink);r(19,7,3,6,ink);r(20,6,2,2,light)
    r(6,10,13,8,ink);r(7,10,11,7,base);r(8,16,4,2,light);r(14,16,4,2,light)
    r(5,3,4,6,ink);r(13,3,4,6,ink);r(6,4,2,3,'#d293a4');r(14,4,2,3,'#d293a4')
    r(4,7,14,7,ink);r(5,6,12,7,base);r(6,9,10,4,light)
    r(7,8,1,2,ink);r(14,8,1,2,ink);r(10,10,2,1,'#a87586')

def rabbit(r):
    ink,base,light='#674e58','#e2c4c7','#f7e5dd'
    r(6,1,4,9,ink);r(13,1,4,9,ink);r(7,2,2,7,'#d897a9');r(14,2,2,7,'#d897a9')
    r(5,10,14,8,ink);r(6,10,12,7,base);r(4,14,3,3,light);r(7,16,4,2,light);r(14,16,4,2,light)
    r(5,7,12,7,ink);r(6,6,10,7,base);r(7,10,8,3,light)
    r(8,8,1,2,ink);r(13,8,1,2,ink);r(10,10,2,1,'#b77d8c')

def chick(r):
    ink,base,light='#806451','#e7c88e','#fae7b8'
    r(7,16,3,3,ink);r(15,16,3,3,ink);r(7,18,3,1,'#c58b64');r(15,18,3,1,'#c58b64')
    r(5,7,14,10,ink);r(6,6,12,10,base);r(8,5,8,3,base);r(7,9,10,6,light)
    r(4,11,4,4,ink);r(5,11,4,3,base);r(16,11,4,4,ink);r(15,11,4,3,base)
    r(9,8,1,2,ink);r(14,8,1,2,ink);r(11,10,3,2,'#d69668');r(10,3,2,3,base);r(12,4,2,2,base)

for name,draw in [('cat',cat),('rabbit',rabbit),('chick',chick)]:sprite(name,draw)

def decoration(name,width,height,draw):
    parts=[]
    def r(x,y,w,h,color):
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>')
    draw(r)
    (out/f'decor-{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width*4}" height="{height*4}" viewBox="0 0 {width} {height}" shape-rendering="crispEdges">'+''.join(parts)+'</svg>\n')

def flowers(r):
    r(0,10,29,2,'#536c56');r(1,9,27,1,'#65805f')
    for x,y,color in [(3,3,'#edb8c6'),(9,1,'#cdb8d9'),(15,4,'#f3d8a5'),(21,2,'#efb9c0'),(26,5,'#e6d6e4')]:
        r(x,y+2,1,7-y,'#557957');r(x-1,y+4,2,1,'#7c9e74');r(x+1,y+5,2,1,'#779a72')
        r(x-1,y,3,3,color);r(x,y-1,1,5,color);r(x,y+1,1,1,'#fff0cf')

def garland(r):
    r(0,1,32,1,'#f0d9b3')
    for x,color in [(2,'#e4a7b6'),(7,'#d0bddb'),(12,'#d6e0bd'),(17,'#f3d7a6'),(22,'#e9b4bf'),(27,'#a9c9c0')]:
        r(x,2,4,2,color);r(x+1,4,2,2,color);r(x+2,6,1,1,color)

def lily(r):
    r(1,4,8,3,'#547e69');r(2,3,7,3,'#91af82');r(4,2,4,2,'#b5ca9b')
    r(11,6,5,2,'#648d70');r(12,5,4,2,'#a1bd92')
    r(4,1,3,2,'#efc0cd');r(5,0,1,4,'#f7d5db');r(5,2,1,1,'#ffe7b4')

for name,width,height,draw in [('flowers',30,12,flowers),('garland',32,8,garland),('lily',16,9,lily)]:decoration(name,width,height,draw)
print('Drew Pip, Dot, Pippin and three garden details.')
