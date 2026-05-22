#!/usr/bin/env python3
"""Generate 6 tabBar PNG icons for WeChat Mini Program (pure stdlib, no PIL needed)."""
import struct, zlib, math, os

W = H = 81
GRAY = (148, 163, 184)   # #94a3b8  未选中
BLUE = (59,  130, 246)   # #3b82f6  选中

# ── PNG writer ────────────────────────────────────────────────────────────────

def write_png(path, canvas):
    raw = bytearray()
    for row in canvas:
        raw += b'\x00'
        for r, g, b, a in row:
            raw += bytes([r, g, b, a])
    comp = zlib.compress(bytes(raw), 9)
    ihdr = struct.pack('>IIBBBBB', W, H, 8, 6, 0, 0, 0)
    def ck(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xFFFFFFFF)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + ck(b'IHDR', ihdr) + ck(b'IDAT', comp) + ck(b'IEND', b''))

# ── Drawing primitives ────────────────────────────────────────────────────────

def new_canvas():
    return [[(0, 0, 0, 0)] * W for _ in range(H)]

def sdf_circle(x, y, cx, cy, r):
    return r - math.hypot(x - cx, y - cy)

def sdf_rrect(x, y, x1, y1, x2, y2, r):
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    hx = max((x2 - x1) / 2 - r, 0)
    hy = max((y2 - y1) / 2 - r, 0)
    qx = max(abs(x - cx) - hx, 0)
    qy = max(abs(y - cy) - hy, 0)
    return r - math.sqrt(qx * qx + qy * qy)

def sdf_to_alpha(d):
    return max(0, min(255, int((d + 0.5) * 255)))

def paint(canvas, color, sdf_fn):
    r3, g3, b3 = color
    for y in range(H):
        for x in range(W):
            a = sdf_to_alpha(sdf_fn(x + 0.5, y + 0.5))
            if a > canvas[y][x][3]:
                canvas[y][x] = (r3, g3, b3, a)

def erase_circle(canvas, cx, cy, r):
    """Hard-erase (punch hole) — anti-aliased edge."""
    for y in range(H):
        for x in range(W):
            d = -sdf_circle(x + 0.5, y + 0.5, cx, cy, r)   # negative = inside hole
            erase = sdf_to_alpha(d)
            if erase > 0:
                old_a = canvas[y][x][3]
                new_a = max(0, old_a - erase)
                canvas[y][x] = (canvas[y][x][0], canvas[y][x][1], canvas[y][x][2], new_a)

# ── Icon shapes ───────────────────────────────────────────────────────────────

def make_schedule(color):
    """Calendar icon: rounded rectangle body + two top hooks."""
    c = new_canvas()
    # Main body
    paint(c, color, lambda x, y: sdf_rrect(x, y, 10, 18, 71, 70, 6))
    # Left hook
    paint(c, color, lambda x, y: sdf_rrect(x, y, 23, 10, 33, 25, 5))
    # Right hook
    paint(c, color, lambda x, y: sdf_rrect(x, y, 48, 10, 58, 25, 5))
    # White stripe separator (header line) — erase a thin band
    for y in range(H):
        for x in range(W):
            if 34 <= y + 0.5 <= 38 and 13 <= x + 0.5 <= 68:
                canvas_a = c[y][x][3]
                if canvas_a > 0:
                    c[y][x] = (0, 0, 0, 0)
    # Three short date-grid lines inside body
    for row_y in [46, 54, 62]:
        for x in range(H):
            px = x + 0.5
            if 16 <= px <= 65 and abs(x + 0.5 - row_y) < 1.5:
                # Use y loop properly
                pass
    for row_y in [46, 54, 62]:
        for y in range(H):
            for x in range(H):
                if abs(y + 0.5 - row_y) < 2 and 16 <= x + 0.5 <= 65:
                    c[y][x] = (0, 0, 0, 0)
    return c


def make_schedule_v2(color):
    """Calendar — solid silhouette (cleaner at small sizes)."""
    c = new_canvas()
    paint(c, color, lambda x, y: sdf_rrect(x, y, 10, 18, 71, 70, 6))
    paint(c, color, lambda x, y: sdf_rrect(x, y, 23, 9, 33, 26, 5))
    paint(c, color, lambda x, y: sdf_rrect(x, y, 48, 9, 58, 26, 5))
    return c


def make_students(color):
    """Person: circle head + wide rounded-rect shoulders."""
    c = new_canvas()
    # Head
    paint(c, color, lambda x, y: sdf_circle(x, y, 40.5, 22, 13))
    # Shoulders / torso — wide arc shape via large-corner rrect
    paint(c, color, lambda x, y: sdf_rrect(x, y, 11, 41, 70, 76, 28))
    return c


def make_settings(color):
    """Gear: thick ring with 8 teeth + center hole."""
    c = new_canvas()
    cx, cy = 40.5, 40.5
    # Outer filled circle
    paint(c, color, lambda x, y: sdf_circle(x, y, cx, cy, 32))
    # 8 tooth circles around perimeter
    for i in range(8):
        angle = i * math.pi / 4
        tx = cx + 27 * math.cos(angle)
        ty = cy + 27 * math.sin(angle)
        paint(c, color, lambda x, y, tx=tx, ty=ty: sdf_circle(x, y, tx, ty, 11))
    # Center hole
    erase_circle(c, cx, cy, 14)
    return c

# ── Generate files ────────────────────────────────────────────────────────────

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)))

entries = [
    ('tab-schedule.png',        make_schedule_v2, GRAY),
    ('tab-schedule-active.png', make_schedule_v2, BLUE),
    ('tab-students.png',        make_students,    GRAY),
    ('tab-students-active.png', make_students,    BLUE),
    ('tab-settings.png',        make_settings,    GRAY),
    ('tab-settings-active.png', make_settings,    BLUE),
]

for filename, fn, color in entries:
    canvas = fn(color)
    path = os.path.join(out_dir, filename)
    write_png(path, canvas)
    print(f'✓  {filename}')

print('\n完成！6 张图标已生成到:', out_dir)
