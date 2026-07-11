#!/usr/bin/env bun

/**
 * AIGENEV7 Icon Converter (.ico → .png)
 *
 * Extracts the 32bpp BGRA bitmap from icon.ico, flips it right-side-up,
 * and writes a proper PNG file. No external dependencies — uses Bun's
 * built-in Buffer and zlib compression.
 *
 * Usage:
 *   bun freebuff/convert-icon.js                     → freebuff/icon.png
 *   bun freebuff/convert-icon.js --output logo.png   → logo.png
 *   bun freebuff/convert-icon.js --size 128          → upscales to 128×128
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { deflateSync } from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── PNG Helpers ─────────────────────────────────────────────────────────

/** CRC32 computation for PNG chunk integrity */
function crc32(data) {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** Create a PNG chunk: [length(4) + type(4) + data(N) + crc(4)] */
function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcInput = Buffer.concat([typeBytes, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(crcInput))
  return Buffer.concat([len, typeBytes, data, crcBuf])
}

/**
 * Convert raw RGBA pixel buffer (top-down, 4 bytes per pixel) into PNG.
 * Each row starts with filter byte 0 (None), entire set is deflate-compressed.
 */
function rgbaToPng(pixels, width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) // PNG signature

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // IDAT: filtered rows (each prefixed with filter byte 0) → deflate
  const rowSize = width * 4 + 1 // +1 for filter byte
  const raw = Buffer.alloc(rowSize * height)
  for (let y = 0; y < height; y++) {
    const srcStart = y * width * 4
    const dstStart = y * rowSize
    raw[dstStart] = 0 // filter: None
    pixels.copy(raw, dstStart + 1, srcStart, srcStart + width * 4)
  }

  const compressed = deflateSync(raw)
  const idat = pngChunk('IDAT', compressed)
  const iend = pngChunk('IEND')

  return Buffer.concat([sig, pngChunk('IHDR', ihdr), idat, iend])
}

// ── Bilinear interpolation ─────────────────────────────────────────────

/**
 * Write a bilinearly-interpolated pixel into `out` at `offset`.
 * Samples the source image at fractional coordinates (fx, fy).
 */
function bilinearWrite(src, srcW, srcH, fx, fy, out, offset) {
  const x = Math.max(0, Math.min(srcW - 1.0001, fx))
  const y = Math.max(0, Math.min(srcH - 1.0001, fy))

  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(x0 + 1, srcW - 1)
  const y1 = Math.min(y0 + 1, srcH - 1)

  const dx = x - x0
  const dy = y - y0

  const row0 = y0 * srcW * 4
  const row1 = y1 * srcW * 4
  const colX0 = x0 * 4
  const colX1 = x1 * 4

  for (let c = 0; c < 4; c++) {
    const top = src[row0 + colX0 + c] * (1 - dx) + src[row0 + colX1 + c] * dx
    const bot = src[row1 + colX0 + c] * (1 - dx) + src[row1 + colX1 + c] * dx
    out[offset + c] = Math.round(top * (1 - dy) + bot * dy)
  }
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2)
  let outputPath = resolve(__dirname, 'icon.png')
  let targetSize = 0 // 0 = native size (32)
  let smooth = false // bilinear vs nearest-neighbor

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      outputPath = resolve(process.cwd(), args[++i])
    } else if (args[i] === '--size' || args[i] === '-s') {
      targetSize = parseInt(args[++i], 10)
      if (isNaN(targetSize) || targetSize < 1) {
        console.error('Invalid size. Must be a positive integer.')
        process.exit(1)
      }
    } else if (args[i] === '--smooth') {
      smooth = true
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
  AIGENEV7 Icon Converter — .ico → .png

  Usage:
    bun freebuff/convert-icon.js                             → icon.png (32×32)
    bun freebuff/convert-icon.js -o logo.png                 → logo.png (32×32)
    bun freebuff/convert-icon.js -o logo.png -s 128          → 128×128 (nearest-neighbor)
    bun freebuff/convert-icon.js -o logo.png -s 128 --smooth → 128×128 (bilinear)

  Options:
    -o, --output <path>   Output file path
    -s, --size <px>       Target size (upscale; default: native 32)
    --smooth              Bilinear interpolation (smoother, better for photos)
                          Default is nearest-neighbor (sharper for pixel art)
    -h, --help            Show this help
      `)
      process.exit(0)
    }
  }

  const icoPath = resolve(__dirname, 'icon.ico')
  const ico = readFileSync(icoPath)

  // Parse ICO directory and find the best entry
  const count = ico.readUInt16LE(4)
  let bestEntry = null
  let bestScore = -1

  for (let i = 0; i < count; i++) {
    const entryOff = 6 + i * 16
    const entryWidth = ico.readUInt8(entryOff) || 256
    const entryHeight = ico.readUInt8(entryOff + 1) || 256
    const entryBpp = ico.readUInt16LE(entryOff + 6)
    // Score: prefer 32bpp, then pick the size closest to (but not exceeding) target
    const bppScore = entryBpp === 32 ? 100 : 10
    // Prefer entries <= target size, then pick the largest available
    let sizeScore
    if (targetSize > 0) {
      // Distance-based: prefer entry closest to target size
      sizeScore = 100 - Math.abs(entryWidth - targetSize)
    } else {
      sizeScore = entryWidth === 32 ? 50 : entryWidth // prefer 32 if no target
    }
    const score = bppScore + sizeScore
    if (score > bestScore) {
      bestScore = score
      bestEntry = { off: entryOff, width: entryWidth, height: entryHeight, bpp: entryBpp }
    }
  }

  if (!bestEntry) throw new Error('No valid icon entries found')
  const imgOff = ico.readUInt32LE(bestEntry.off + 12)
  const imgSize = ico.readUInt32LE(bestEntry.off + 8)

  // Parse BITMAPINFOHEADER (must start with header-size field of 40 bytes)
  const bmpHeaderSize = ico.readUInt32LE(imgOff)
  if (bmpHeaderSize !== 40) {
    throw new Error(`Unsupported ICO entry format: BITMAPINFOHEADER size ${bmpHeaderSize} (expected 40). ` +
      'This script only handles BMP-format icons, not PNG-compressed entries.')
  }
  const icoWidth = ico.readInt32LE(imgOff + 4)
  // Height in ICO is doubled (XOR mask height + AND mask height)
  const icoHeight = ico.readInt32LE(imgOff + 8) / 2
  const bpp = ico.readUInt16LE(imgOff + 14)

  if (bpp !== 32) {
    console.error(`Unsupported bit depth: ${bpp}. Only 32bpp icons are supported.`)
    process.exit(1)
  }

  // Pixel data starts after BITMAPINFOHEADER
  const pixelDataOffset = imgOff + bmpHeaderSize
  const xorSize = icoWidth * icoHeight * 4

  // Read XOR mask (BGRA, bottom-up). Skip AND mask.
  const rawBgra = ico.slice(pixelDataOffset, pixelDataOffset + xorSize)

  // Convert BGRA → RGBA and flip vertically (BMP is bottom-up)
  const rgba = Buffer.alloc(xorSize)
  for (let y = 0; y < icoHeight; y++) {
    const srcRow = y * icoWidth * 4
    const dstRow = (icoHeight - 1 - y) * icoWidth * 4 // flip
    for (let x = 0; x < icoWidth; x++) {
      const src = srcRow + x * 4
      const dst = dstRow + x * 4
      rgba[dst]     = rawBgra[src + 2] // R
      rgba[dst + 1] = rawBgra[src + 1] // G
      rgba[dst + 2] = rawBgra[src]     // B
      rgba[dst + 3] = rawBgra[src + 3] // A
    }
  }

  // Generate PNG
  let outWidth = icoWidth
  let outHeight = icoHeight
  let pixelData = rgba

  // Upscale if --size differs from native
  if (targetSize > 0 && targetSize !== icoWidth) {
    outWidth = targetSize
    outHeight = targetSize
    const scaled = Buffer.alloc(targetSize * targetSize * 4)
    const scaleX = icoWidth / targetSize
    const scaleY = icoHeight / targetSize

    if (smooth) {
      // Bilinear interpolation — smooth, good for photos or gradients
      for (let y = 0; y < targetSize; y++) {
        for (let x = 0; x < targetSize; x++) {
          const dst = (y * targetSize + x) * 4
          bilinearWrite(rgba, icoWidth, icoHeight, x * scaleX, y * scaleY, scaled, dst)
        }
      }
    } else {
      // Nearest-neighbor — sharp edges, best for pixel art icons
      for (let y = 0; y < targetSize; y++) {
        for (let x = 0; x < targetSize; x++) {
          const srcX = Math.floor(x * scaleX)
          const srcY = Math.floor(y * scaleY)
          const src = (srcY * icoWidth + srcX) * 4
          const dst = (y * targetSize + x) * 4
          scaled[dst]     = rgba[src]
          scaled[dst + 1] = rgba[src + 1]
          scaled[dst + 2] = rgba[src + 2]
          scaled[dst + 3] = rgba[src + 3]
        }
      }
    }
    pixelData = scaled
  }

  const png = rgbaToPng(pixelData, outWidth, outHeight)
  writeFileSync(outputPath, png)
  console.log(`✓ Converted: ${icoPath} → ${outputPath}`)
  console.log(`  Size: ${outWidth}×${outHeight}, ${png.length} bytes PNG`)
}

main()
