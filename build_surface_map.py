"""Trace sulcal ribbons from licensed source meshes; never infer a new brain.

Orthographic silhouette thinning finds a centerline in each source sulcus.
The viewer drapes that guide onto the corresponding cortical surface. The
underlying anatomical meshes, coordinates, and segmentation remain unchanged.
"""
from pathlib import Path
import heapq
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / 'tmp/cns/model-review.json'
records = json.loads(SOURCE.read_text(encoding='utf-8'))

def skeleton(mask):
    a = np.pad(mask.astype(np.uint8), 1)
    for _ in range(200):
        changed = False
        for phase in (0, 1):
            p = [a[:-2,1:-1], a[:-2,2:], a[1:-1,2:], a[2:,2:],
                 a[2:,1:-1], a[2:,:-2], a[1:-1,:-2], a[:-2,:-2]]
            count = sum(p)
            transitions = sum(((p[i] == 0) & (p[(i+1)%8] == 1)).astype(np.uint8) for i in range(8))
            drop = (a[1:-1,1:-1] == 1) & (count >= 2) & (count <= 6) & (transitions == 1)
            if phase == 0:
                drop &= (p[0]*p[2]*p[4] == 0) & (p[2]*p[4]*p[6] == 0)
            else:
                drop &= (p[0]*p[2]*p[6] == 0) & (p[0]*p[4]*p[6] == 0)
            if drop.any():
                a[1:-1,1:-1][drop] = 0
                changed = True
        if not changed:
            break
    return a[1:-1,1:-1].astype(bool)

def paths_from_skeleton(mask):
    points = set(zip(*np.where(mask)))
    neighbors = {p: [q for dy in (-1,0,1) for dx in (-1,0,1)
                     if (dy or dx) and (q := (p[0]+dy,p[1]+dx)) in points]
                 for p in points}
    def distances(start):
        cost, prev, queue = {start:0}, {}, [(0,start)]
        while queue:
            distance,p = heapq.heappop(queue)
            if distance != cost[p]:
                continue
            for q in neighbors[p]:
                next_cost = distance + (1.4142 if q[0]!=p[0] and q[1]!=p[1] else 1)
                if next_cost < cost.get(q,float('inf')):
                    cost[q],prev[q] = next_cost,p
                    heapq.heappush(queue,(next_cost,q))
        return cost,prev
    visited, paths = set(), []
    for start in sorted(points):
        if start in visited:
            continue
        costs,_ = distances(start)
        visited.update(costs)
        tip = max(costs,key=costs.get)
        costs,prev = distances(tip)
        end = max(costs,key=costs.get)
        if costs[end] < 14:
            continue
        main = [end]
        while main[-1] != tip:
            main.append(prev[main[-1]])
        paths.append(main)
        used = set(main)
        # Preserve significant branches, including the Y-shaped medial sulci,
        # while pruning pixel-scale silhouette artifacts.
        for leaf in sorted(costs,key=costs.get,reverse=True):
            if len(neighbors[leaf]) != 1 or leaf in used:
                continue
            branch = [leaf]
            while branch[-1] not in used and branch[-1] in prev:
                branch.append(prev[branch[-1]])
            if len(branch) >= max(15,len(main)*.17):
                paths.append(branch)
                used.update(branch)
    return paths

guides = []
review = Image.new('RGB',(1280,900),'#f5f2ec')
draw = ImageDraw.Draw(review)
review_index = 0
for record in records:
    if record['group'] != 'sulci':
        continue
    name = record['name']
    if 'Circular sulcus' in name or 'Jensen' in name:
        continue
    matrix = np.array(record['world']).reshape(4,4).T
    local = np.array(record['positions']).reshape(-1,3)
    world = (np.c_[local,np.ones(len(local))] @ matrix.T)[:,:3]
    medial = any(x in name for x in ('Calcarine','Parieto-occipital','Cingulate','Subparietal'))
    inferior = any(x in name for x in ('Olfactory','Orbital sulci','Collateral','collateral','Occipitotemporal'))
    plane = 'inferior' if inferior else 'medial' if medial else 'lateral'
    axes = (0,2) if inferior else (2,1)
    uv = world[:,axes]
    lo,hi = uv.min(axis=0),uv.max(axis=0)
    scale = 170 / max(hi-lo)
    pixels = (uv-lo)*scale + 8
    size = np.ceil((hi-lo)*scale+17).astype(int)
    mask = Image.new('L',tuple(size),0)
    pen = ImageDraw.Draw(mask)
    for tri in np.array(record['indices']).reshape(-1,3):
        pen.polygon([tuple(pixels[i]) for i in tri],fill=255)
    mask = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    thin = skeleton(np.array(mask)>0)
    paths = paths_from_skeleton(thin)
    curves = []
    for path in paths:
        # Keep every third pixel and both endpoints. Runtime uses straight
        # segments, avoiding spline overshoot beyond a source sulcus.
        keep = path[::3]
        if keep[-1] != path[-1]:
            keep.append(path[-1])
        points = []
        for row,col in keep:
            sample = (np.array([col,row])-8)/scale + lo
            nearest = np.argmin(np.sum((uv-sample)**2,axis=1))
            point = world[nearest].copy()
            point[list(axes)] = sample
            points.append([round(float(x),7) for x in point])
        if len(points) >= 3:
            curves.append(points)
    if curves:
        guides.append({'mesh':name,'plane':plane,'paths':curves})
    if name.endswith('.l') and any(x in name for x in ('Central sulcus','Superior frontal sulcus','Superior temporal sulcus','Intraparietal','Postcentral','Lat_Fis-post','Calcarine','Parieto-occipital')):
        x,y = (review_index%4)*320, (review_index//4)*300
        draw.text((x+12,y+12),name.removesuffix('.l'),fill='#1e3040')
        inset = Image.new('RGB',mask.size,'white')
        inset.paste('#c8b9d8',mask=mask)
        ipen = ImageDraw.Draw(inset)
        for path in paths:
            ipen.line([(p[1],p[0]) for p in path],fill='#cc1540',width=2)
        review.paste(inset,(x+65,y+50))
        review_index += 1
output = ROOT/'public/data/sulcal-map.json'
output.write_text(json.dumps({'source':'Source sulcal ribbon centerline guides; original anatomy unchanged.','guides':guides},separators=(',',':')),encoding='utf-8')
review.save(ROOT.parent/'outputs/cns-sulcal-trace-review.png')
print(f'{len(guides)} source sulci traced; {sum(len(g["paths"]) for g in guides)} paths')
