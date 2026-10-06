# Cut generated stickers out of their plain backgrounds and compose the two empty backdrops.
# Usage: python3 scripts/process-images.py   (reads assets/raw, writes public/stickers)
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

RAW = Path("assets/raw")
OUT = Path("public/stickers")
OUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads(Path("assets/stickers.json").read_text())


def cutout(src: Path, dst: Path, max_side=900, crop_above_widest=False):
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(int)
    h, w, _ = rgb.shape
    corners = np.array([rgb[2, 2], rgb[2, w - 3], rgb[h - 3, 2], rgb[h - 3, w - 3]])
    bg = np.median(corners, axis=0)
    near_bg = np.abs(rgb - bg).sum(axis=2) < 60
    # background = near-bg pixels connected to the image border
    labels, _ = ndimage.label(near_bg)
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    background = np.isin(labels, list(border))
    obj = ~background
    # drop small loose pieces (decorative sprigs) but keep big siblings like a pair of chairs
    olabels, n = ndimage.label(obj)
    if n > 1:
        sizes = ndimage.sum(obj, olabels, range(1, n + 1))
        keep = [i + 1 for i, sz in enumerate(sizes) if sz >= 0.25 * sizes.max()]
        obj = np.isin(olabels, keep)
    obj = ndimage.binary_fill_holes(obj)
    if crop_above_widest:
        # props baked onto a countertop are narrow; the countertop is the first near-full-width row
        cols = np.where(obj.any(axis=0))[0]
        span = cols[-1] - cols[0]
        top = int(np.argmax(obj.sum(axis=1) > 0.85 * span))
        obj[:top] = False
    alpha = Image.fromarray((obj * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.2))
    im = Image.open(src).convert("RGBA")
    im.putalpha(alpha)
    im = im.crop(im.getbbox())
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dst, "WEBP", quality=86, method=6)


def tile(tex: Image.Image, size, scale):
    tex = tex.resize((int(tex.width * scale), int(tex.height * scale)), Image.LANCZOS)
    out = Image.new("RGB", size)
    for x in range(0, size[0], tex.width):
        for y in range(0, size[1], tex.height):
            out.paste(tex, (x, y))
    return out


def backdrop(wall: str, dst: Path, wainscot: bool):
    W = H = 1000
    floor_y = 790
    img = tile(Image.open(RAW / f"{wall}.png").convert("RGB"), (W, floor_y), 0.32)
    d = ImageDraw.Draw(img)
    if wainscot:
        top = 560
        d.rectangle([0, top, W, floor_y], fill=(92, 58, 38))
        d.rectangle([0, top, W, top + 14], fill=(122, 82, 52))
        for x in range(30, W, 140):
            d.rounded_rectangle([x, top + 40, x + 100, floor_y - 30], 8, outline=(70, 42, 26), width=5)
    canvas = Image.new("RGB", (W, H))
    canvas.paste(img, (0, 0))
    floor = Image.open(RAW / "t-floor.png").convert("RGB").resize((W, H - floor_y), Image.LANCZOS)
    canvas.paste(floor, (0, floor_y))
    d = ImageDraw.Draw(canvas)
    d.rectangle([0, floor_y - 10, W, floor_y + 4], fill=(70, 42, 26))
    canvas.save(dst, "WEBP", quality=84, method=6)


for side in manifest["sides"].values():
    for s in side:
        if not s.get("bg"):
            cutout(RAW / f"{s['id']}.png", OUT / f"{s['id']}.webp", crop_above_widest=s.get("cropProps", False))
backdrop("t-wallpaper", OUT / "l-bg.webp", wainscot=True)
backdrop("t-wallpaper", OUT / "r-bg.webp", wainscot=True)
print("done")
