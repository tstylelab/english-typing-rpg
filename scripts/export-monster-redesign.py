"""Technical conversion/QA only: preserve generated artwork; never enlarge it."""
from pathlib import Path
import json, hashlib, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'design/monster-samples'
PREFIX = sys.argv[1] if len(sys.argv) > 1 else 'eiken4-redesign-level1'
plan = json.loads((WORK/(PREFIX+'-plan.json')).read_text(encoding='utf-8'))
report_path = WORK/(PREFIX+'-sizes.json')
previous_hashes = {r['key']:r['sourceHash'] for r in json.loads(report_path.read_text(encoding='utf-8'))['assets']} if report_path.exists() else {}
rows = []
issues = []
for entry in plan['assets']:
    receipt = WORK / (PREFIX+'-receipts') / (entry['monsterId']+'.json')
    if not receipt.exists():
        continue
    row = json.loads(receipt.read_text(encoding='utf-8'))
    assert row['key'] == entry['key'] and row['name'] == entry['name']
    assert row['assignmentHash'] == plan['assignmentHash']
    source = Path(row['source'])
    assert hashlib.sha256(source.read_bytes()).hexdigest() == row['sourceHash']
    with Image.open(source) as original:
        image = original.convert('RGBA')
        alpha = image.getchannel('A')
        assert alpha.getextrema() == (0, 255), entry['key']
        edges = [(0,0,image.width,1),(0,image.height-1,image.width,image.height),(0,0,1,image.height),(image.width-1,0,image.width,image.height)]
        if any(alpha.crop(edge).getextrema()[1] >= 128 for edge in edges):
            issues.append({'key':entry['key'],'name':entry['name'],'issue':'Source edge crop'})
            continue
        sizes = {}
        for size in (256, 384, 1024):
            folder = ROOT / 'public/monsters' / entry['artFolder'] / str(size)
            folder.mkdir(parents=True, exist_ok=True)
            target = folder / (entry['monsterId']+'.webp')
            if not target.exists() or previous_hashes.get(row['key']) != row['sourceHash']:
                sprite = Image.new('RGBA', (size,size), (0,0,0,0))
                small = image.copy()
                small.thumbnail((round(size*.94), round(size*.94)), Image.Resampling.LANCZOS)
                assert small.width <= image.width and small.height <= image.height
                sprite.alpha_composite(small, ((size-small.width)//2, (size-small.height)//2))
                sprite.save(target, 'WEBP', quality=80, method=4, exact=True)
            with Image.open(target) as check:
                assert check.size == (size,size) and not getattr(check,'is_animated',False)
                assert check.getchannel('A').getextrema() == (0,255)
                for edge in [(0,0,size,1),(0,size-1,size,size),(0,0,1,size),(size-1,0,size,size)]:
                    assert check.getchannel('A').crop(edge).getextrema() == (0,0)
            sizes[str(size)] = target.stat().st_size
        rows.append({**entry, 'sourceHash': row['sourceHash'], 'sourceSize': image.size, 'bytes': sizes})
report = {'count':len(rows),'expected':43,'issues':issues,'missing':[e['monsterId'] for e in plan['assets'] if e['key'] not in {r['key'] for r in rows}],
          'totalBytes':{str(n):sum(r['bytes'][str(n)] for r in rows) for n in (256,384,1024)}, 'assets':rows}
(WORK/(PREFIX+'-sizes.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
font = ImageFont.truetype('C:/Windows/Fonts/meiryo.ttc', 16)
for page in range((len(rows)+19)//20):
    subset = rows[page*20:(page+1)*20]
    board = Image.new('RGB',(1300,240*((len(subset)+4)//5)), '#152039')
    draw = ImageDraw.Draw(board)
    for i,row in enumerate(subset):
        x,y = (i%5)*260,(i//5)*240
        with Image.open(ROOT/'public/monsters'/row['artFolder']/'384'/(row['monsterId']+'.webp')) as sprite:
            sprite.thumbnail((185,185),Image.Resampling.LANCZOS)
            board.paste(sprite,(x+(260-sprite.width)//2,y),sprite)
        draw.text((x+10,y+185),row['name'],font=font,fill='white')
        draw.text((x+10,y+209),row['monsterId']+' / '+row['mood'],font=font,fill='#aaccee')
    board.save(WORK/f'{PREFIX}-contact-{page+1}.png')
print(json.dumps({k:v for k,v in report.items() if k!='assets'},ensure_ascii=False))
if issues:
    sys.exit(1)
