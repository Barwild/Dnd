from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
}
root = Path('android/app/src/main/res')
root.mkdir(parents=True, exist_ok=True)

for density, size in sizes.items():
    target_dir = root / f'mipmap-{density}'
    target_dir.mkdir(parents=True, exist_ok=True)

    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # radial gradient background
    for y in range(size):
        for x in range(size):
            dx = (x - size / 2) / (size / 2)
            dy = (y - size / 2) / (size / 2)
            d = min((dx * dx + dy * dy) ** 0.5, 1)
            r = int(220 - 120 * d)
            g = int(40 - 30 * d)
            b = int(20 - 20 * d)
            draw.point((x, y), (max(0, r), max(0, g), max(0, b)))

    margin = int(size * 0.12)
    p = [
        (margin, size * 0.25),
        (size * 0.5, margin),
        (size - margin, size * 0.25),
        (size - margin, size * 0.70),
        (size * 0.5, size - margin),
        (margin, size * 0.70),
    ]
    draw.polygon(p, fill=(20, 20, 20, 240))
    draw.line([*p, p[0]], fill=(255, 185, 70, 255), width=max(1, size // 30))

    txt = 'DnD'
    fsize = int(size * 0.4)
    try:
        font = ImageFont.truetype('arial.ttf', fsize)
    except Exception:
        font = ImageFont.load_default()
    w, h = draw.textsize(txt, font=font)
    draw.text(((size - w) / 2, (size - h) / 2), txt, font=font, fill=(255, 215, 100, 255))

    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse((size * 0.20, size * 0.10, size * 0.80, size * 0.60), fill=(255, 210, 140, 50))
    im = Image.alpha_composite(im, glow)

    for name in ['ic_launcher_foreground.png', 'ic_launcher.png', 'ic_launcher_round.png']:
        path = target_dir / name
        im.save(path)

print('Generated Android icon assets for DnD-nexus.')
