/**
 * Writes the team from src/data/team.json (the single source) into every
 * document that names the team, between these markers:
 *   <!-- team:start --> ... <!-- team:end -->
 * Markdown files get a bullet list; HTML files get list items.
 * Usage: npm run sync:team
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const team = JSON.parse(readFileSync('src/data/team.json', 'utf8'))
const md = team.members.map((m) => `- ${m.name}, ${m.role}`).join('\n')
const html = team.members.map((m) => `<li>${m.name}, ${m.role}</li>`).join('')

const targets = ['README.md']
for (const dir of ['docs/submission', 'docs/deck'])
  if (existsSync(dir)) for (const f of readdirSync(dir)) if (/\.(md|html)$/.test(f)) targets.push(join(dir, f))

const re = /(<!-- team:start -->)[\s\S]*?(<!-- team:end -->)/g
let changed = 0
for (const file of targets) {
  const src = readFileSync(file, 'utf8')
  if (!re.test(src)) continue
  const body = file.endsWith('.html') ? html : `\n**${team.name}**\n\n${md}\n`
  const out = src.replace(re, `$1${body}$2`)
  if (out !== src) {
    writeFileSync(file, out)
    changed++
  }
  console.log(`team synced: ${file}`)
}
console.log(`${changed} file(s) updated from src/data/team.json`)
