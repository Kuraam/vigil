/**
 * Checks the walkthrough: duration (must be <= 3:00), size, and one still per scene
 * into .tmp/video-check/ for a visual review. Run after npm run video.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { findTool } from './ffmpeg.mjs'

const MP4 = 'docs/video/VIGIL walkthrough.mp4'
const OUT = '.tmp/video-check'
const ffmpeg = findTool('ffmpeg')
const ffprobe = findTool('ffprobe')

const probe = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height,avg_frame_rate,codec_type', '-of', 'json', MP4]).toString())
const duration = Number(probe.format.duration)
const v = probe.streams.find((s) => s.codec_type === 'video')
const hasAudio = probe.streams.some((s) => s.codec_type === 'audio')
const mb = statSync(MP4).size / 1024 / 1024
const mmss = `${Math.floor(duration / 60)}:${String(Math.round(duration % 60)).padStart(2, '0')}`
console.log(`duration ${duration.toFixed(2)} s (${mmss}); ${v.codec_name} ${v.width}x${v.height} @ ${v.avg_frame_rate}; audio: ${hasAudio ? 'yes' : 'none'}; ${mb.toFixed(1)} MB`)

const { scenes, captions } = JSON.parse(readFileSync('.tmp/video/scenes.json', 'utf8'))
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
for (const s of scenes) {
  // Inside the scene's first caption (2 s after it appears); cards: past the middle of the scene.
  const cap = captions.find((c) => c.start >= s.start - 0.05 && c.start < s.end && c.end - c.start > 2.5)
  const at = Math.min(cap ? cap.start + 2 : s.start + (s.end - s.start) * 0.6, duration - 0.1)
  const file = `${OUT}/${s.name}.png`
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', at.toFixed(2), '-i', MP4, '-frames:v', '1', file])
  console.log(`${file}  (${at.toFixed(1)} s)`)
}
const ok = duration <= 180 && v.width === 1920 && v.height === 1080 && !hasAudio && mb < 50
console.log(ok ? 'Checks passed: <= 3:00, 1920x1080, no audio, < 50 MB' : 'CHECKS FAILED')
process.exit(ok ? 0 : 1)
