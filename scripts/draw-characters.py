"""Draw eight original pixel characters and a README lineup. Standard library only."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'mods/tinydust'
CAST = [
    ('cat', 'Miso the cat', '#c5bdce', '#ece5ea', '#ad96c4', '#3e3945'),
    ('rabbit', 'Clover the rabbit', '#e7cccb', '#fae5df', '#bb8296', '#413840'),
    ('fox', 'Maple the fox', '#ce9677', '#f3d5aa', '#86a7ac', '#423832'),
    ('bear', 'Cocoa the bear', '#aa8b77', '#d8b896', '#b4a2cd', '#413737'),
    ('frog', 'Fern the frog', '#8faa83', '#c4d5a8', '#829ab7', '#34443f'),
    ('duck', 'Sunny the duck', '#e3c58c', '#fae5b7', '#b395b9', '#4b4140'),
    ('farmer', 'Rowan the farmer', '#b88769', '#dca887', '#93af9c', '#443836'),
    ('gardener', 'Sage the gardener', '#deb18e', '#f5cfac', '#9f97c3', '#493a3a'),
]

def sprite(kind, base, light, coat, ink, pose='stand', frame=0):
    pieces=[]
    def r(x,y,w,h,c):
        if pose=='rest' and y>=13:
            y=13+round((y-13)*0.65);h=max(1,round(h*0.65))
        pieces.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>')
    # Ground/contact shadow, boots and shaded overalls.
    r(4,24,17,2,'#292c303b');r(7,23,10,2,'#292c3044')
    r(7,19,4,5,ink);r(13,19,4,5,ink);r(6,23,5,2,ink);r(13,23,5,2,ink)
    r(6,13,12,8,coat);r(6,13,3,7,light);r(16,14,2,7,ink)
    if pose=='cheer':
        r(3,9,3,8,base);r(18,9,3,8,base);r(3,8,3,2,light);r(18,8,3,2,light)
    elif pose=='work':
        r(4,14,2,5,base);r(18,14+frame*2,5,2,base)
        r(18,16+frame*2,5,4,'#7faeb3');r(18,16+frame*2,4,1,'#c6e1d6')
        r(22,15+frame*2,2,2,'#527f91')
    else:
        r(4,14,2,5,base);r(18,14,2,5,base)
    r(10,17,5,3,light);r(11,18,3,1,coat)
    # Every species has a separate silhouette, not just a recolored human.
    if kind == 'rabbit':
        r(6,0,3,9,base);r(14,0,3,9,base);r(7,1,1,6,'#bd8a9d');r(15,1,1,6,'#bd8a9d')
    elif kind in ('cat','fox'):
        r(5,3,4,7,base);r(15,3,4,7,base);r(6,4,2,3,'#c58e9d');r(16,4,2,3,'#c58e9d')
        r(19,15,3,6,base);r(20,13,3,4,base);r(20,12,3,2,light)
    elif kind == 'bear':
        r(4,4,5,5,base);r(15,4,5,5,base);r(5,5,3,3,light);r(16,5,3,3,light)
    elif kind == 'frog':
        r(5,4,5,5,base);r(14,4,5,5,base);r(6,4,3,3,light);r(15,4,3,3,light)
    elif kind == 'duck':
        r(10,3,2,4,base);r(12,4,2,3,light);r(18,17,4,3,light)
    r(5,7,14,6,base);r(7,6,10,9,base);r(6,8,3,4,light);r(8,13,8,2,light)
    if kind in ('farmer','gardener'):
        hair='#5e4651' if kind=='gardener' else '#624b3f'
        r(5,6,14,3,hair);r(5,8,2,5,hair)
        if kind=='gardener':
            r(17,8,2,9,hair);r(18,13,2,6,hair);r(15,6,5,2,'#d8a3b6')
        else:
            r(6,3,12,4,'#d5b984');r(3,6,18,2,'#f0d7a6');r(6,5,12,1,'#9c8074')
    if kind == 'frog':
        r(7,6,1,2,ink);r(16,6,1,2,ink);r(10,12,5,1,ink)
    elif pose=='rest':
        r(8,11,2,1,ink);r(14,11,2,1,ink)
    else:
        r(8,10,1,2,ink);r(15,10,1,2,ink)
    if kind=='duck': r(9,12,7,2,'#d99867')
    elif kind not in ('farmer','gardener','frog'):
        r(10,12,4,2,light);r(11,12,2,1,ink)
    r(6,12,2,1,'#d8a0a444');r(16,12,2,1,'#d8a0a444')
    return ''.join(pieces)

gallery=[]
for i,(kind,name,base,light,coat,ink) in enumerate(CAST):
    art=sprite(kind,base,light,coat,ink)
    (OUT/f'{kind}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="112" viewBox="0 0 24 28" shape-rendering="crispEdges"><title>{name}</title>{art}</svg>\n')
    for suffix,pose,frame in [('work-0','work',0),('work-1','work',1),('rest','rest',0),('cheer','cheer',0)]:
        action=sprite(kind,base,light,coat,ink,pose,frame)
        (OUT/f'{kind}-{suffix}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="112" viewBox="0 0 24 28" shape-rendering="crispEdges"><title>{name}: {pose}</title>{action}</svg>\n')
    gallery.append(f'<g transform="translate({i*80+12},10) scale(2)">{art}</g><text x="{i*80+36}" y="78" text-anchor="middle" fill="#e8dce5" font-family="sans-serif" font-size="10">{name.split()[0]}</text>')
(OUT/'characters.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="92" viewBox="0 0 640 92" shape-rendering="crispEdges"><rect width="640" height="92" rx="6" fill="#302c33"/>'+''.join(gallery)+'</svg>\n')
print('Drew eight characters, work/rest/cheer poses, and lineup')
