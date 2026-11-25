"""Generate CLOZVA concept photos with Runware’s Sunburst model."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from getpass import getpass
import json
import os
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

MODEL = 'openai:gpt-image@2.6-sunburst'
OUT = Path(__file__).resolve().parents[1] / 'public' / 'images'

classic = 'classic low-profile EVA foam clog with a generously rounded toe, twelve tidy round ventilation holes on top, a thick but flat sole, and a pivoting back strap in the heel position'
stack = 'sculptural platform EVA foam clog, rounded perforated toe, oversized 5 cm platform sole with three smoothly contoured horizontal bands, and a pivoting heel strap'
trail = 'rugged trail EVA foam clog, closed ventilated toe, deep lug outsole, curb-like contouring along the sides, ankle-height pivoting heel strap, and a grippy utility shape'


def product(shape, color, backdrop):
    return (f'Photorealistic fashion e-commerce catalog photo. A single unbranded {shape}. All parts are {color}. '
            'One shoe only, no other objects. The shoe is centered across the middle, nearly level from left to right, '
            'three-quarter lateral side view and slightly elevated camera, rounded toe at lower left and heel at upper right. '
            f'Seamless solid {backdrop} cyclorama with floor, soft daylight and subtle lower-right contact shadow. '
            'The whole shoe is in frame with 10% padding to left and right. Fine matte foam texture. No text, logo or watermark. Square composition.')


SHOTS = {
    'campaign': (1280, 1280, 'Luxury studio campaign for an independent footwear label. Two vivid electric chartreuse lime (#C6EF53) molded foam clogs with closed smoothly rounded perforated toe boxes, thick flat soles, and pivoting heel straps. Arrange them in a striking diagonally stacked still life: front shoe grounded and horizontal with toe to the left, second matching shoe tilted diagonally with toe up to the right, supported by a sculpted sage green plinth behind. Important: keep both shoes wholly in the central 80% width and central 70% height, filling the image without clipping. Seamless pale muted sage green (#B5C6B0) walls and floor with a sunlit curved architectural backdrop, clean graphical shadows cast down to the right, tactile matte material. Realistic designer footwear photography, direct sunlight meets art direction, playful yet understated. No people, branding, typography or watermark.'),
    'classic-lime': (1024, 1024, product(classic, 'electric chartreuse lime (#C6EF53)', 'light warm ivory')),
    'classic-sage': (1024, 1024, product(classic, 'soft dusty pastel sage (#B5C6B0)', 'light desaturated sage green')),
    'classic-oat': (1024, 1024, product(classic, 'light oatmeal ivory', 'soft muted sand beige')),
    'classic-ink': (1024, 1024, product(classic, 'deep charcoal gray', 'warm ivory')),
    'stack-oat': (1024, 1024, product(stack, 'oat milk cream', 'soft muted sand beige')),
    'stack-ink': (1024, 1024, product(stack, 'deep charcoal gray', 'light cool gray')),
    'trail-ink': (1024, 1024, product(trail, 'deep charcoal gray', 'light cool gray')),
    'trail-sage': (1024, 1024, product(trail, 'soft dusty sage green', 'pale muted sage')),
    'charm-lime': (1024, 1024, product(classic, 'electric chartreuse lime (#C6EF53)', 'soft warm ivory') + ' The perforated upper has exactly five stylish preinstalled raised enamel-look shoe charms pressed into the ventilation holes and facing the camera: a bright pink lightning bolt, a yellow smiley face, a sky blue star, a small white cloud, and a black checkerboard square. Bold playful pop-art palette. Leave the rest of the holes open. Show the entire shoe and all charms clearly.'),
    'charm-oat': (1024, 1024, product(classic, 'light oatmeal ivory', 'warm pale blossom pink') + ' The perforated upper has five distinct tiny colorful pre-installed glossy shoe charms neatly pressed into the holes, pastel pink bow, strawberry, little white daisy, yellow smiley and mint four-point sparkle. Cheerful wearable trinkets, plenty of holes still visible. Show the entire shoe and the clearly visible raised charms.'),
    'charm-sage': (1024, 1024, product(classic, 'muted pastel sage green', 'pale desaturated mint green') + ' Five raised colorful rubber shoe charms are pre-installed in the top ventilation ports, with plenty of holes still open: orange mushroom, ivory daisy, pink butterfly, yellow sun and cream seashell. Clearly show the entire shoe and each colorful charm in sharp focus.'),
    'feature-lightweight': (1024, 1024, 'Square premium editorial footwear feature photograph on seamless pale sage green studio background, showing one clean electric chartreuse perforated EVA clog floating weightlessly in midair in profile, a sharply defined small feather floating independently below LEFT of the shoe, soft natural shadow on the floor, playful minimal gravity-defying composition, beautifully lit tactile foam. Keep outer 10% clear and no lettering, labels, people, watermarks, or logos.'),
    'feature-airflow': (1024, 1024, 'Square luxury editorial macro photograph of a sage green molded EVA clog, detail of the smooth rounded upper with circular ventilation ports and grainy matte foam. Extreme close-up across the top at an oblique angle, hard sun lights one side of each hole, graphical deep shadows, bright warm cream studio backdrop. Fill the square with a tactile, minimalist, geometric visual. No text or graphics, no logos.'),
    'feature-grip': (1024, 1024, 'Square premium studio product feature photo, a single charcoal molded utility foam trail clog held upright invisibly at an angle to showcase the lugged underside, sole large and facing the lens with a series of deep grippy geometric rubber treads, top with perforations glimpsed at the side. Graphic light concrete and warm gray studio, soft shadow, sharp precise tread pattern, minimal contemporary footwear brand. No text or logos.'),
    'feature-charms': (1024, 1024, 'Square overhead editorial still life for premium youth footwear brand: close-up of the front half of a warm ivory perforated EVA clog on a light powder pink seamless surface. Colorful small raised clip-in shoe charms across the top: a pink bow, peach strawberry, white daisy, yellow smiley and mint sparkle. A few spare charms nearby, crisp natural shadows, joyful restrained pop colors. The cropped toe and its ventilation holes are clear, art-directed fashion product photograph, no writing, no logos.'),
    'club': (1280, 1024, 'Footwear campaign on softly sunlit bare concrete steps. Cropped editorial streetwear photograph of a stylish person from the shins down, wearing sage-green rounded molded EVA clogs with a perforated closed toe and heel strap, ivory ribbed slouch socks, and cropped black wide-leg trousers. Both feet naturally placed on the steps. Warm film color grading and crisp long diagonal sunlight shadows, realistic materials, luxury independent fashion label. No logos or text.'),
}


def generate(name, api_key):
    width, height, prompt = SHOTS[name]
    task_id = str(uuid4())
    request = Request('https://api.runware.ai/v1', headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}, data=json.dumps([{
        'taskType': 'imageInference', 'taskUUID': task_id, 'model': MODEL,
        'positivePrompt': prompt, 'width': width, 'height': height, 'numberResults': 1,
        'outputType': 'URL', 'outputFormat': 'WEBP', 'deliveryMethod': 'sync',
    }]).encode())
    print(f'Requesting one image: {name} ({task_id})', flush=True)
    try:
        with urlopen(request, timeout=240) as response:
            data = json.load(response)
        item = next(entry for entry in data.get('data', []) if entry.get('taskUUID') == task_id and entry.get('imageURL'))
        with TemporaryDirectory() as scratch:
            source = Path(scratch) / 'source.webp'
            with urlopen(item['imageURL'], timeout=45) as response:
                source.write_bytes(response.read())
            run(['magick', str(source), '-strip', '-quality', '86', str(OUT / f'{name}.webp')], check=True)
        print(f'Saved {name}.webp', flush=True)
        return True
    except HTTPError as error:
        detail = json.loads(error.read()) if 'application/json' in error.headers.get('Content-Type', '') else {}
        print(f'{name}: HTTP {error.code}; {str(detail.get("errors", ""))[:1200]}', flush=True)
    except StopIteration:
        print(f'{name}: no image; {str(data.get("errors", ""))[:1200]}', flush=True)
    except Exception as error:
        print(f'{name}: {type(error).__name__}: {error}', flush=True)
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('shots', nargs='*', metavar='SHOT', help=', '.join(SHOTS))
    args = parser.parse_args()
    names = list(dict.fromkeys(args.shots or SHOTS))
    if any(name not in SHOTS for name in names):
        parser.error('Invalid shot name')
    api_key = os.environ.get('RUNWARE_API_KEY') or getpass('Runware API key: ')
    OUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda name: generate(name, api_key), names))
    return 0 if all(results) else 1


if __name__ == '__main__':
    raise SystemExit(main())
