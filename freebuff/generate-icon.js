#!/usr/bin/env bun
/**
 * AIGENEV7 Icon Generator
 * Creates modern .ico files with a hacker/cyberpunk aesthetic
 * using raw 32-bit BGRA pixel data (no external deps required).
 *
 * Supports:
 *   - Single or multi-size icons (favicon requires 16+32+48)
 *   - Custom output path
 *   - Runtime rendering via drawIcon() for reuse
 *
 * The icon features:
 *   - Dark background with subtle grid pattern
 *   - Stylized "AE" monogram in cyan neon
 *   - Glow/glint effect for depth
 *
 * Usage:
 *   bun freebuff/generate-icon.js                           → freebuff/icon.ico (32×32)
 *   bun freebuff/generate-icon.js --sizes 16,32,48          → multi-size .ico
 *   bun freebuff/generate-icon.js -o web/favicon.ico -s 16,32,48  → custom path
 */

const { writeFileSync, existsSync, mkdirSync } = require('fs')
const { resolve, dirname } = require('path')

// ── Color Palette ──────────────────────────────────────────────────────
const BG_DARK     = [0x0a, 0x0a, 0x12, 0xff]
const BG_MID      = [0x0f, 0x0f, 0x1a, 0xff]
const GRID_LINE   = [0x14, 0x14, 0x24, 0x30]
const NEON_CYAN   = [0x00, 0xd4, 0xff, 0xff]
const NEON_DIM    = [0x00, 0xaa, 0xdd, 0xaa]
const NEON_PULSE  = [0x00, 0xff, 0xcc, 0x40]
const GLOW_CENTER = [0x00, 0xd4, 0xff, 0x15]
const BRACKET     = [0x00, 0xdd, 0xff, 0x60]
const DOT         = [0x00, 0xff, 0xcc, 0x80]

// ── Pixel Drawing ──────────────────────────────────────────────────────

function setPixel(buf, w, x, y, color) {
  if (x < 0 || x >= w || y < 0 || y >= w) return
  const off = (y * w + x) * 4
  buf[off]     = color[2] // B
  buf[off + 1] = color[1] // G
  buf[off + 2] = color[0] // R
  buf[off + 3] = color[3] // A
}

function blendPixel(buf, w, x, y, fg) {
  if (x < 0 || x >= w || y < 0 || y >= w) return
  const off = (y * w + x) * 4
  const alpha = fg[3] / 255
  const inv = 1 - alpha
  buf[off]     = Math.round(fg[2] * alpha + buf[off]     * inv)
  buf[off + 1] = Math.round(fg[1] * alpha + buf[off + 1] * inv)
  buf[off + 2] = Math.round(fg[0] * alpha + buf[off + 2] * inv)
  buf[off + 3] = 0xff
}

function fillBackground(buf, w) {
  const half = w / 2
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const dist = Math.sqrt((x - half) ** 2 + (y - half) ** 2) / half
      const t = Math.min(1, Math.max(0, dist))
      const bg = [
        Math.round(BG_DARK[0] + (BG_MID[0] - BG_DARK[0]) * t),
        Math.round(BG_DARK[1] + (BG_MID[1] - BG_DARK[1]) * t),
        Math.round(BG_DARK[2] + (BG_MID[2] - BG_DARK[2]) * t),
        0xff,
      ]
      setPixel(buf, w, x, y, bg)
    }
  }
}

function drawGrid(buf, w) {
  for (let i = 0; i < w; i += 4) {
    for (let j = 0; j < w; j++) blendPixel(buf, w, i, j, GRID_LINE)
    for (let j = 0; j < w; j++) blendPixel(buf, w, j, i, GRID_LINE)
  }
}

function drawCircle(buf, w, cx, cy, r, color, fill) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (fill ? dist <= r : Math.abs(dist - r) < 0.8) {
        setPixel(buf, w, cx + dx, cy + dy, color)
      }
    }
  }
}

function drawLine(buf, w, x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx - dy, x = x0, y = y0
  while (true) {
    setPixel(buf, w, x, y, color)
    if (x === x1 && y === y1) break
    const e2 = err * 2
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx) { err += dx; y += sy }
  }
}

/** Draw the AE monogram and decorative elements at the given size */
function drawAESymbol(buf, size) {
  const s = size / 32 // scale factor relative to 32px base

  // Glow rings
  drawCircle(buf, size, size/2, size/2, Math.round(14 * s), NEON_PULSE, false)
  drawCircle(buf, size, size/2, size/2, Math.round(13 * s), NEON_PULSE, false)
  drawCircle(buf, size, size/2, size/2, Math.round(8 * s), GLOW_CENTER, true)

  const r = (v) => Math.round(v * s)

  // Letter A
  drawLine(buf, size, r(7), r(24), r(12), r(7), NEON_CYAN)
  drawLine(buf, size, r(7), r(24), r(13), r(7), NEON_CYAN)
  drawLine(buf, size, r(8), r(24), r(12), r(8), NEON_DIM)
  drawLine(buf, size, r(15), r(24), r(12), r(7), NEON_CYAN)
  drawLine(buf, size, r(15), r(24), r(13), r(7), NEON_CYAN)
  drawLine(buf, size, r(14), r(24), r(12), r(8), NEON_DIM)
  drawLine(buf, size, r(9), r(16), r(14), r(16), NEON_CYAN)
  drawLine(buf, size, r(9), r(15), r(14), r(15), NEON_CYAN)

  // Letter E
  drawLine(buf, size, r(18), r(7), r(18), r(24), NEON_CYAN)
  drawLine(buf, size, r(19), r(7), r(19), r(24), NEON_CYAN)
  drawLine(buf, size, r(19), r(7), r(25), r(7), NEON_CYAN)
  drawLine(buf, size, r(19), r(8), r(25), r(8), NEON_CYAN)
  drawLine(buf, size, r(19), r(14), r(25), r(14), NEON_CYAN)
  drawLine(buf, size, r(19), r(15), r(25), r(15), NEON_CYAN)
  drawLine(buf, size, r(19), r(23), r(25), r(23), NEON_CYAN)
  drawLine(buf, size, r(19), r(24), r(25), r(24), NEON_CYAN)

  // Cursor underscore
  drawLine(buf, size, r(10), r(27), r(24), r(27), NEON_DIM)

  // Corner brackets
  const b = BRACKET
  setPixel(buf, size, r(1), r(1), b); setPixel(buf, size, r(2), r(1), b); setPixel(buf, size, r(1), r(2), b)
  setPixel(buf, size, size - r(2), r(1), b); setPixel(buf, size, size - r(3), r(1), b); setPixel(buf, size, size - r(2), r(2), b)
  setPixel(buf, size, r(1), size - r(2), b); setPixel(buf, size, r(2), size - r(2), b); setPixel(buf, size, r(1), size - r(3), b)
  setPixel(buf, size, size - r(2), size - r(2), b); setPixel(buf, size, size - r(3), size - r(2), b); setPixel(buf, size, size - r(2), size - r(3), b)

  // Accent dots
  const d = DOT
  setPixel(buf, size, r(3), r(3), d)
  setPixel(buf, size, size - r(4), r(3), d)
  setPixel(buf, size, r(3), size - r(4), d)
  setPixel(buf, size, size - r(4), size - r(4), d)
}

/** Render one icon size into a BGRA pixel buffer (top-down order) */
function renderIcon(size) {
  const buf = Buffer.alloc(size * size * 4)
  fillBackground(buf, size)
  if (size >= 16) drawGrid(buf, size)
  drawAESymbol(buf, size)
  return buf
}

/**
 * Build a .ico file with multiple sizes.
 * Each size is a BITMAPINFOHEADER + XOR mask (no compression).
 */
function buildIco(sizes) {
  const HEADER_SIZE = 6
  const DIR_ENTRY_SIZE = 16
  const BMP_HEADER_SIZE = 40

  // Render all sizes first
  const entries = sizes.map((size) => ({
    size,
    pixels: renderIcon(size),
    xorSize: size * size * 4,
    andSize: Math.ceil(size / 8) * size,
  }))

  let totalSize = HEADER_SIZE + DIR_ENTRY_SIZE * entries.length
  const imgOffsets = []
  for (const entry of entries) {
    imgOffsets.push(totalSize)
    totalSize += BMP_HEADER_SIZE + entry.xorSize + entry.andSize
  }

  const buf = Buffer.alloc(totalSize)
  let off = 0

  // ICO file header
  buf.writeUInt16LE(0, off); off += 2  // reserved
  buf.writeUInt16LE(1, off); off += 2  // type = ICO
  buf.writeUInt16LE(entries.length, off); off += 2  // count

  // Directory entries
  for (let i = 0; i < entries.length; i++) {
    const { size, xorSize, andSize } = entries[i]
    const w = size >= 256 ? 0 : size
    buf.writeUInt8(w, off); off += 1
    buf.writeUInt8(w, off); off += 1
    buf.writeUInt8(0, off); off += 1
    buf.writeUInt8(0, off); off += 1
    buf.writeUInt16LE(1, off); off += 2   // planes
    buf.writeUInt16LE(32, off); off += 2  // bpp
    buf.writeUInt32LE(BMP_HEADER_SIZE + xorSize + andSize, off); off += 4
    buf.writeUInt32LE(imgOffsets[i], off); off += 4
  }

  // Image data for each size
  for (let i = 0; i < entries.length; i++) {
    const { size, pixels, xorSize, andSize } = entries[i]

    // BITMAPINFOHEADER
    buf.writeUInt32LE(BMP_HEADER_SIZE, off); off += 4
    buf.writeInt32LE(size, off); off += 4
    buf.writeInt32LE(size * 2, off); off += 4  // doubled for ICO
    buf.writeUInt16LE(1, off); off += 2
    buf.writeUInt16LE(32, off); off += 2
    buf.writeUInt32LE(0, off); off += 4   // BI_RGB
    buf.writeUInt32LE(xorSize, off); off += 4
    buf.writeInt32LE(0, off); off += 4
    buf.writeInt32LE(0, off); off += 4
    buf.writeUInt32LE(0, off); off += 4
    buf.writeUInt32LE(0, off); off += 4

    // XOR mask (top-down pixels, stored bottom-up in BMP)
    for (let y = size - 1; y >= 0; y--) {
      pixels.copy(buf, off, y * size * 4, (y + 1) * size * 4)
      off += size * 4
    }

    // AND mask (all 0 for 32bpp)
    for (let j = 0; j < andSize; j++) buf[off++] = 0
  }

  return buf
}

// ── CLI Entry Point ────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2)
  let outputPath = resolve(__dirname, 'icon.ico')
  let sizes = [32]

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
      outputPath = resolve(process.cwd(), args[++i])
    } else if ((args[i] === '--sizes' || args[i] === '-s') && args[i + 1]) {
      sizes = args[++i].split(',').map(Number).filter((n) => n > 0)
      if (sizes.length === 0) sizes = [32]
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
  AIGENEV7 Icon Generator

  Usage:
    bun freebuff/generate-icon.js                              → icon.ico (32×32)
    bun freebuff/generate-icon.js -o web/favicon.ico -s 16,32,48  → multi-size
    bun freebuff/generate-icon.js --sizes 16,32,48 --output icon.ico

  Options:
    -o, --output <path>   Output file path (default: freebuff/icon.ico)
    -s, --sizes <list>    Comma-separated sizes (default: 32)
    -h, --help            Show this help
      `)
      process.exit(0)
    }
  }

  // Ensure output directory exists
  const outDir = dirname(outputPath)
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  const buf = buildIco(sizes)
  writeFileSync(outputPath, buf)

  console.log(`✓ Generated icon: ${outputPath} (${buf.length} bytes)`)
  for (const s of sizes) {
    console.log(`  • ${s}×${s} 32bpp`)
  }
}

main()
