#!/usr/bin/env python3
import math, os, sys
sys.path.insert(0, os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages'))

from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

W, H = 1024, 1024
cx, cy = 512, 512

BG         = (13,  40,  24,  255)   # #0d2818
DARK       = (10,  31,  18,  255)   # #0a1f12
GOLD       = (201, 168, 76,  255)   # #c9a84c
GOLD_FAINT = (201, 168, 76,  int(255 * 0.3))

main_r       = 370
border_w     = 13
inner_r      = main_r - border_w   # 357
bead_orbit_r = main_r
bead_r_norm  = 50
bead_r_large = 65

img  = Image.new('RGBA', (W, H), BG)
draw = ImageDraw.Draw(img)

# ── Main dark circle ──────────────────────────────────────────────────────────
draw.ellipse([cx-main_r, cy-main_r, cx+main_r, cy+main_r], fill=DARK)

# ── Gold border ring ──────────────────────────────────────────────────────────
draw.ellipse(
    [cx-main_r, cy-main_r, cx+main_r, cy+main_r],
    outline=GOLD[:3], width=border_w,
)

# ── Faint concentric rings (opacity 0.3) ──────────────────────────────────────
ring_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ring_draw  = ImageDraw.Draw(ring_layer)
for ratio in [0.85, 0.70]:
    r = int(inner_r * ratio)
    ring_draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=GOLD_FAINT, width=2)
img  = Image.alpha_composite(img, ring_layer)
draw = ImageDraw.Draw(img)

# ── Prayer beads ──────────────────────────────────────────────────────────────
for i in range(20):
    angle = -math.pi / 2 + i * (2 * math.pi / 20)
    bx = cx + bead_orbit_r * math.cos(angle)
    by = cy + bead_orbit_r * math.sin(angle)
    br = bead_r_large if i in (0, 10) else bead_r_norm
    draw.ellipse([bx-br, by-br, bx+br, by+br], fill=GOLD[:3])

# ── Tassel (line + rounded rect above top bead) ───────────────────────────────
top_bead_top = int(cy - bead_orbit_r - bead_r_large)   # = 77
line_end_y   = max(top_bead_top - 38, 6)               # = 39
draw.line([(cx, top_bead_top), (cx, line_end_y)], fill=GOLD[:3], width=5)
tw, th = 28, 36
draw.rounded_rectangle(
    [cx - tw//2, line_end_y - th, cx + tw//2, line_end_y],
    radius=7, outline=GOLD[:3], width=3,
)

# ── Fonts ─────────────────────────────────────────────────────────────────────
def font(path, size):
    return ImageFont.truetype(path, size)

arabic_font = font('/System/Library/Fonts/SFArabic.ttf', 112)
title_font  = font('/System/Library/Fonts/SFNS.ttf',     66)
small_font  = font('/System/Library/Fonts/SFNS.ttf',     27)

# ── Arabic text تسبيح ─────────────────────────────────────────────────────────
ar_text = get_display(arabic_reshaper.reshape('تسبيح'))
b = draw.textbbox((0, 0), ar_text, font=arabic_font)
ar_w, ar_h = b[2] - b[0], b[3] - b[1]
ar_x = cx - ar_w // 2 - b[0]
ar_y = cy - 115 - b[1]
draw.text((ar_x, ar_y), ar_text, font=arabic_font, fill=GOLD[:3])

# ── Divider ───────────────────────────────────────────────────────────────────
div_y = ar_y + b[1] + ar_h + 20
div_pad = 55
draw.line([(cx - inner_r + div_pad, div_y), (cx + inner_r - div_pad, div_y)],
          fill=GOLD[:3], width=2)

# ── TASBEEH (letter-spaced) ───────────────────────────────────────────────────
def draw_spaced(draw, text, font, cx, y, spacing, color):
    chars  = list(text)
    bboxes = [draw.textbbox((0, 0), ch, font=font) for ch in chars]
    widths = [b[2] - b[0] for b in bboxes]
    total  = sum(widths) + spacing * (len(chars) - 1)
    x = cx - total // 2
    for ch, bx, cw in zip(chars, bboxes, widths):
        draw.text((x - bx[0], y - bx[1]), ch, font=font, fill=color)
        x += cw + spacing

tasbeeh_y = div_y + 24
draw_spaced(draw, 'TASBEEH', title_font, cx, tasbeeh_y, 12, GOLD[:3])

# ── DIGITAL PRAYER COUNTER ────────────────────────────────────────────────────
dpc = 'DIGITAL PRAYER COUNTER'
b2  = draw.textbbox((0, 0), dpc, font=small_font)
dpc_x = cx - (b2[2] - b2[0]) // 2 - b2[0]
dpc_y = cy + inner_r - 115
draw.text((dpc_x, dpc_y - b2[1]), dpc, font=small_font, fill=GOLD[:3])

# ── Save ──────────────────────────────────────────────────────────────────────
out_path = '/Users/zaakiromarhajee/Desktop/Jazal-main-3/assets/images/icon.png'
img.convert('RGB').save(out_path, 'PNG')
saved = Image.open(out_path)
print(f'Saved {saved.size[0]}x{saved.size[1]} PNG (no alpha) -> {out_path}')
