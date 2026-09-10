#!/usr/bin/env bash
#
# optimize-images.sh — optimasi semua gambar di public/image
#
# Yang dilakukan:
#   1. Backup folder asli ke public/image-backup (sekali saja)
#   2. Resize PNG/JPG yang lebarnya > MAX_WIDTH (kualitas tampil tidak berubah)
#   3. Konversi PNG/JPG -> WebP (file asli TETAP ada sebagai fallback)
#   4. Optimasi SVG in-place dengan SVGO
#   5. Laporan sebelum/sesudah
#
# Pakai:
#   chmod +x optimize-images.sh
#   ./optimize-images.sh
#
# Prasyarat (macOS):
#   brew install webp imagemagick
#   npm i -D svgo

set -euo pipefail

# ===== Konfigurasi =====
DIR="public/image"                 # folder gambar
BACKUP="public/image-backup"       # folder backup
MAX_WIDTH=1920                    # lebar maksimum untuk raster
WEBP_QUALITY=82                   # 80-85 = sweet spot, tidak terlihat bedanya
# =======================

# ===== Cek prasyarat =====
need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ '$1' belum terpasang."
    echo "   macOS: brew install $2"
    exit 1
  }
}
need cwebp webp
need magick imagemagick

if [ ! -d "$DIR" ]; then
  echo "❌ Folder '$DIR' tidak ditemukan. Jalankan script ini dari root project."
  exit 1
fi

before_total=$(du -sh "$DIR" | cut -f1)
echo "📦 Ukuran awal $DIR: $before_total"
echo ""

# ===== 1. Backup =====
if [ -d "$BACKUP" ]; then
  echo "ℹ️  Backup sudah ada di $BACKUP (dilewati)."
else
  cp -r "$DIR" "$BACKUP"
  echo "✅ Backup dibuat: $BACKUP"
fi
echo ""

# ===== 2. Resize raster yang kegedean =====
echo "🔧 Resize gambar dengan lebar > ${MAX_WIDTH}px..."
resized=0
while IFS= read -r -d '' f; do
  w=$(magick identify -format "%w" "$f" 2>/dev/null || echo 0)
  if [ "$w" -gt "$MAX_WIDTH" ] 2>/dev/null; then
    magick "$f" -resize "${MAX_WIDTH}x>" -strip "$f"
    echo "   ↓ $(basename "$f") : ${w}px -> ${MAX_WIDTH}px"
    resized=$((resized + 1))
  fi
done < <(find "$DIR" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)
echo "   $resized file di-resize."
echo ""

# ===== 3. Konversi ke WebP =====
echo "🔧 Konversi PNG/JPG -> WebP (quality ${WEBP_QUALITY})..."
converted=0
skipped=0
while IFS= read -r -d '' f; do
  out="${f%.*}.webp"
  if [ -f "$out" ] && [ "$out" -nt "$f" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  # -alpha_q 100 menjaga kualitas channel transparansi (penting untuk logo PNG)
  if cwebp -quiet -q "$WEBP_QUALITY" -alpha_q 100 -metadata none "$f" -o "$out"; then
    old=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
    new=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out")
    pct=$(( 100 - (new * 100 / old) ))
    printf "   ✓ %-46s -%s%%\n" "$(basename "$f")" "$pct"
    converted=$((converted + 1))
  else
    echo "   ✗ gagal: $(basename "$f")"
  fi
done < <(find "$DIR" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)
echo "   $converted dikonversi, $skipped dilewati (sudah up-to-date)."
echo ""

# ===== 4. SVG: deteksi yang berisi raster, lalu optimasi sisanya =====
echo "🔧 Cek SVG yang berisi raster (base64)..."
fat_svg=0
while IFS= read -r -d '' f; do
  if grep -q "base64" "$f" 2>/dev/null; then
    size=$(du -h "$f" | cut -f1)
    echo "   ⚠️  $(basename "$f") ($size) berisi raster base64 — SVGO tidak bisa mengecilkan ini."
    echo "      Export ulang dari Figma sebagai PNG/WebP, lalu ganti referensinya di komponen."
    fat_svg=$((fat_svg + 1))
  fi
done < <(find "$DIR" -maxdepth 1 -type f -iname '*.svg' -print0)
[ "$fat_svg" -eq 0 ] && echo "   Tidak ada. Semua SVG murni vektor."
echo ""

echo "🔧 Optimasi SVG dengan SVGO..."
if npx --no-install svgo --version >/dev/null 2>&1; then
  npx svgo -f "$DIR" --multipass
else
  echo "   ⚠️  SVGO belum terpasang. Jalankan: npm i -D svgo"
fi
echo ""

# ===== 5. Laporan =====
after_total=$(du -sh "$DIR" | cut -f1)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Sebelum : $before_total"
echo "📦 Sesudah : $after_total  (termasuk WebP baru)"
echo ""
echo "10 file terbesar sekarang:"
ls -lhS "$DIR" | head -11 | tail -10 | awk '{printf "   %-8s %s\n", $5, $9}'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Langkah selanjutnya:"
echo "  1. npm run dev, cek semua halaman — pastikan tidak ada gambar rusak."
echo "  2. Update getAssetUrl agar memakai .webp (lihat catatan di chat)."
echo "  3. Kalau ada yang rusak: rm -rf $DIR && mv $BACKUP $DIR"
