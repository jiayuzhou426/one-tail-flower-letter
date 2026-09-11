"""Generate editable, continuous water masks for the five exploration maps.

Run explicitly when source artwork changes:
  <bundled-python> scripts/generate_explore_masks.py

White pixels are navigable water; black pixels are collision obstacles. The
runtime never regenerates these files, so subsequent hand painting is safe.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
LEVELS = ROOT / "public" / "assets" / "explore" / "levels"


def make_candidate(rgb: np.ndarray) -> Image.Image:
    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    # The supplied maps consistently distinguish water with a blue lead over
    # both green and red. Closing reconnects the white caustic lines without
    # swallowing the pastel green/pink banks.
    water = (blue > 105) & (blue - green > 12) & (blue - red > 18)
    image = Image.fromarray(np.where(water, 255, 0).astype(np.uint8), "L")
    return image.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.MinFilter(13))


def connected_water(candidate: Image.Image) -> Image.Image:
    width, height = candidate.size
    pixels = candidate.load()
    seed = None
    # Locate water near the central route, avoiding occasional painted islands.
    for y in range(height // 2, height, 8):
        for offset in range(0, width // 3, 4):
            for x in (width // 2 - offset, width // 2 + offset):
                if 0 <= x < width and pixels[x, y] > 0:
                    seed = (x, y)
                    break
            if seed:
                break
        if seed:
            break
    if seed is None:
        raise RuntimeError("No central water seed found")

    flooded = candidate.copy()
    ImageDraw.floodfill(flooded, seed, 128, thresh=0)
    data = np.asarray(flooded)
    result = Image.fromarray(np.where(data == 128, 255, 0).astype(np.uint8), "L")
    # A final close removes sparkle/caustic pinholes that would otherwise feel
    # like invisible collision chatter. Authored islands survive this radius.
    return result.filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.MinFilter(17))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--force', action='store_true', help='overwrite existing hand-edited masks')
    options = parser.parse_args()
    for level in range(1, 6):
        source = LEVELS / f"level-{level}.png"
        target = LEVELS / f"level-{level}-mask.png"
        if target.exists() and not options.force:
            print(f"kept hand-edited {target.relative_to(ROOT)}")
            continue
        rgb = np.asarray(Image.open(source).convert("RGB"))
        mask = connected_water(make_candidate(rgb))
        mask.save(target, optimize=True)
        print(f"wrote {target.relative_to(ROOT)} ({mask.width}x{mask.height})")


if __name__ == "__main__":
    main()
