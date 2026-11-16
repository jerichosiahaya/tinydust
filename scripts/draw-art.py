"""Original 8-bit-inspired scenery: deterministic SVG, no dependencies or game assets."""
from pathlib import Path
import random

ROOT = Path(__file__).resolve().parents[1]
random.seed(7)
parts = []
# Rose and lilac accents balanced by sage, denim blue, and warm wood.
TONES = {
    '#adc7a0':'#d7c4cf', '#88a780':'#b1b8b7', '#779875':'#9caea4', '#73926d':'#96a79f',
    '#d3dcc0':'#f0dedc', '#7f9b59':'#8eaa83', '#8da663':'#a3b991', '#718b4e':'#7a9572', '#a3ad67':'#bac392',
    '#c58453':'#b8818e', '#8f523c':'#8b606f', '#dd9e68':'#d8a3b0', '#593e31':'#634b56',
    '#576944':'#65735e', '#596d42':'#65755e', '#3e6241':'#4d715b', '#517a47':'#63866a',
    '#628951':'#779978', '#6f954f':'#86a780', '#88a95e':'#a3bd90', '#446e41':'#587b60',
    '#c18751':'#d09a9b', '#e2ac65':'#efc1b9', '#658d87':'#829daa', '#557775':'#607f91',
    '#8fae9a':'#a6bfca', '#bad0b0':'#d8e2dc', '#a8c0a4':'#bdcfdb',
}
def r(x, y, w, h, c):
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{TONES.get(c,c)}"/>')
def p(points, color):
    parts.append(f'<polygon points="{points}" fill="{TONES.get(color,color)}"/>')

r(0, 0, 160, 112, '#adc7a0')
r(0, 24, 160, 16, '#88a780')
p('0,31 16,31 16,23 29,23 29,18 47,18 47,26 65,26 65,35 0,35', '#779875')
p('91,35 91,25 106,25 106,20 120,20 120,27 146,27 146,21 160,21 160,40', '#73926d')
r(128, 8, 12, 12, '#edd395'); r(131, 8, 9, 9, '#f8e4b1')
r(12, 11, 20, 3, '#d3dcc0'); r(18, 8, 9, 3, '#d3dcc0')
r(0, 38, 160, 74, '#7f9b59')
for _ in range(160):
    x, y = random.randrange(160), random.randrange(39,112)
    r(x, y, 2, 1, random.choice(['#8da663','#718b4e','#a3ad67']))
# Path and offset cast shadow, light comes from top left.
p('46,67 58,67 58,79 72,79 72,88 94,88 94,97 160,97 160,111 85,111 85,101 63,101 63,91 46,91', '#c3ad77')
for x, y in [(53,84),(67,94),(95,103),(116,100),(137,106),(147,102)]:
    r(x,y,4,2,'#a89566'); r(x,y,3,1,'#deca94')
p('16,61 62,55 81,75 81,86 41,87 20,73', '#576944')
# House, shaded right face and eaves.
r(15,42,46,29,'#513f30'); r(18,44,39,25,'#d8b985'); r(49,44,10,25,'#b48c59')
for y in [47,54,61]:
    r(18,y,31,1,'#bf9a66'); r(49,y,10,1,'#95744b')
r(23,25,6,13,'#674c3b'); r(23,24,7,3,'#997352')
p('11,43 11,39 15,39 15,35 19,35 19,31 23,31 23,27 53,27 53,31 57,31 57,35 61,35 61,39 65,39 65,44', '#593e31')
p('14,40 18,36 22,32 26,28 51,28 55,32 59,36 63,40', '#c58453')
for y,x,w in [(31,23,31),(35,19,39),(39,15,47)]:
    r(x,y,w,1,'#8f523c')
    for xx in range(x+3,x+w-2,7): r(xx,y-2,1,2,'#dd9e68')
r(17,43,44,3,'#79583b')
for x in [23,45]:
    r(x,49,9,10,'#674f35');r(x+1,50,7,7,'#edc774');r(x+2,50,2,6,'#f8dda0');r(x+4,50,1,7,'#997448');r(x+1,54,7,1,'#997448')
r(35,54,8,15,'#6c4b32');r(36,55,6,13,'#94613e');r(40,61,1,1,'#efd08a')
r(14,69,48,3,'#674c34');r(32,72,16,3,'#bb9b69');r(33,75,16,2,'#816647')
# Pond: dark bank, stepped reflections.
p('107,80 114,75 135,75 146,81 150,92 145,98 119,98 108,93', '#586843')
p('109,80 117,77 134,77 144,82 147,91 142,95 119,95 111,91', '#658d87')
r(115,82,12,1,'#a8c0a4');r(125,88,16,1,'#8fae9a');r(117,91,6,1,'#bad0b0');r(140,85,4,2,'#557775')
# Orchard. Layered stepped canopy and diagonal shadow.
tree_start=len(parts)
for x,y in [(91,35),(133,32),(8,83)]:
    p(f'{x-4},{y+17} {x+12},{y+13} {x+24},{y+26} {x+20},{y+31} {x+2},{y+28}', '#596d42')
    r(x+2,y+7,5,18,'#634e32');r(x+2,y+9,2,14,'#9b7748')
    for dx,dy,w,h,c in [(-10,0,27,12,'#3e6241'),(-7,-7,21,10,'#517a47'),(-3,-12,14,8,'#628951'),(-9,-2,18,10,'#6f954f'),(-5,-6,12,5,'#88a95e'),(5,4,10,6,'#446e41')]:
        r(x+dx,y+dy,w,h,c)
    for dx,dy in [(-4,-1),(8,0),(1,7)]:
        r(x+dx,y+dy,3,3,'#c18751'); r(x+dx,y+dy,2,1,'#e2ac65')
tree_end=len(parts)
# Vegetable beds with contact shadows and highlights.
for y in [83,98]:
    r(24,y,28,9,'#59462e');r(24,y,27,7,'#8c6440')
    for x in [27,35,43]:
        r(x,y+3,5,2,'#ad7c49');r(x+2,y-3,1,7,'#3f663c');r(x,y-2,3,2,'#b2c576');r(x+3,y,3,2,'#71964c')
# Fence, little flowers and a sleeping cat.
for x in [67,79,91]:
    r(x+2,62,3,15,'#647347');r(x,58,3,15,'#b79761');r(x,58,2,13,'#dfc28a')
r(67,62,27,2,'#d0ae73');r(67,68,27,2,'#a88a53')
for i,(x,y) in enumerate([(7,58),(69,104),(101,64),(153,55),(58,100),(96,77),(78,92),(18,94),(145,65)]):
    petal=['#dca9bb','#c0add6','#f1d49d'][i%3]
    r(x,y,1,4,'#53783e');r(x-1,y-1,3,2,petal);r(x,y-2,1,1,'#fae9d3')
r(62,73,10,3,'#586743');r(63,70,7,4,'#c6a06b');r(62,69,3,3,'#d5b580');r(62,68,1,2,'#8f6b45');r(64,71,1,1,'#5c4934')
svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="448" viewBox="0 0 160 112" shape-rendering="crispEdges">' + ''.join(parts) + '</svg>\n'
(ROOT/'mods/tinydust/farm.svg').write_text(svg)
(ROOT/'layouts/tinydust.svg').write_text(svg)
ground='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="448" viewBox="0 0 160 112" shape-rendering="crispEdges">'+''.join(parts[:tree_start]+parts[tree_end:])+'</svg>\n'
(ROOT/'mods/tinydust/farm-ground.svg').write_text(ground)
(ROOT/'mods/tinydust/tree.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="120" viewBox="0 0 24 30" shape-rendering="crispEdges"><polygon points="6,23 17,21 24,27 24,30 12,28" fill="#46523d55"/><rect x="10" y="14" width="5" height="13" fill="#775745"/><rect x="10" y="15" width="2" height="10" fill="#b09068"/><rect x="3" y="9" width="19" height="10" fill="#50745c"/><rect x="5" y="4" width="15" height="13" fill="#6f9571"/><rect x="8" y="1" width="9" height="8" fill="#8eb28c"/><rect x="4" y="9" width="12" height="5" fill="#a5c19a"/><rect x="15" y="12" width="7" height="6" fill="#587d60"/><rect x="8" y="10" width="3" height="3" fill="#e4a7b6"/><rect x="16" y="8" width="3" height="3" fill="#ecc5bb"/><rect x="12" y="16" width="3" height="3" fill="#d497aa"/></svg>\n''')
print('Rendered farm, tree-free ground, tree sprite, and layout preview')
