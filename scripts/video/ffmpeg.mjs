/** Locate ffmpeg / ffprobe: FFMPEG_PATH, then PATH, then the winget install folder (Windows). */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

function onPath(name) {
  try {
    execFileSync(name, ['-version'], { stdio: 'ignore' })
    return name
  } catch {
    return null
  }
}

function fromWinget(name) {
  const root = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages')
  if (!root || !existsSync(root)) return null
  for (const pkg of readdirSync(root).filter((d) => d.startsWith('Gyan.FFmpeg'))) {
    const pkgDir = join(root, pkg)
    for (const build of readdirSync(pkgDir)) {
      const exe = join(pkgDir, build, 'bin', `${name}.exe`)
      if (existsSync(exe)) return exe
    }
  }
  return null
}

export function findTool(name) {
  if (process.env.FFMPEG_PATH) {
    const p = name === 'ffmpeg' ? process.env.FFMPEG_PATH : join(dirname(process.env.FFMPEG_PATH), `${name}${process.platform === 'win32' ? '.exe' : ''}`)
    if (existsSync(p)) return p
  }
  const found = onPath(name) ?? fromWinget(name)
  if (!found) throw new Error(`${name} not found. Install it (Windows: winget install --id Gyan.FFmpeg -e) or set FFMPEG_PATH.`)
  return found
}
