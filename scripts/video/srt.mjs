/** SRT writer: captions as { text, start, end } in seconds (video time), wrapped to at most two balanced lines. */

const time = (s) => {
  const ms = Math.max(0, Math.round(s * 1000))
  const p = (n, w = 2) => String(n).padStart(w, '0')
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`
}

/** Split at the space closest to the middle when the text is longer than one comfortable line. */
export function twoLines(text, max = 48) {
  if (text.length <= max) return text
  const mid = text.length / 2
  let best = -1
  for (let i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i
  return best < 0 ? text : `${text.slice(0, best)}\n${text.slice(best + 1)}`
}

export function toSrt(captions) {
  return [...captions]
    .sort((a, b) => a.start - b.start)
    .map((c, i) => `${i + 1}\n${time(c.start)} --> ${time(c.end ?? c.start + 4)}\n${twoLines(c.text)}\n`)
    .join('\n')
}
