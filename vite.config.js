import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function optimizePublicImages() {
  return {
    name: 'optimize-public-images',
    apply: 'build',
    async buildStart() {
      const fs = await import('node:fs/promises')
      let sharp
      try {
        sharp = (await import('sharp')).default
      } catch {
        console.warn('[optimize-public-images] sharp not available, skipping image optimization')
        return
      }

      const root = path.resolve(__dirname, 'public', 'image')

      const walk = async (dir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        const files = []
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) files.push(...(await walk(fullPath)))
          else files.push(fullPath)
        }
        return files
      }

      const files = await walk(root).catch(() => [])

      const candidates = files.filter((filePath) => {
        const ext = path.extname(filePath).toLowerCase()
        return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp'
      })

      const concurrency = 4
      let index = 0

      const worker = async () => {
        while (index < candidates.length) {
          const current = candidates[index++]
          try {
            const inputStat = await fs.stat(current)
            if (inputStat.size < 40 * 1024) continue

            const input = await fs.readFile(current)
            const ext = path.extname(current).toLowerCase()
            const pipeline = sharp(input, { failOn: 'none' })

            let output
            if (ext === '.jpg' || ext === '.jpeg') {
              output = await pipeline.jpeg({ quality: 75, mozjpeg: true }).toBuffer()
            } else if (ext === '.png') {
              output = await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
            } else if (ext === '.webp') {
              output = await pipeline.webp({ quality: 75 }).toBuffer()
            } else {
              continue
            }

            if (output.length > 0 && output.length < input.length) {
              await fs.writeFile(current, output)
            }
          } catch {
            continue
          }
        }
      }

      await Promise.all(Array.from({ length: concurrency }, () => worker()))
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [vue(), tailwindcss(), command === 'build' ? optimizePublicImages() : null].filter(Boolean),
  server: {
    port: 5172,
    allowedHosts: ['byzanedu.com','byzan.scagerwebsite.uk'],
    proxy: {
      '/api': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
    },
  },
}))
  
