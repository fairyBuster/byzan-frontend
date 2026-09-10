// For Vite: files in public/image/ are served at /image/...
// PNG/JPG punya kembaran .webp hasil optimize-images.sh
const USE_WEBP = true

export const getAssetUrl = (fileName) => {
  const file = USE_WEBP ? fileName.replace(/\.(png|jpe?g)$/i, '.webp') : fileName
  return `/image/${file}`
}