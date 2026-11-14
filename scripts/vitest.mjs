/**
 * Launches Vitest with normalised paths.
 *
 * Windows quirk: if the shell opened the project as `d:\...` instead of
 * `D:\...`, Vitest loads its runner module twice under two path spellings and
 * every suite fails with "Cannot read properties of undefined (reading 'config')".
 * Spawning Vitest with an upper-case drive letter (cwd and entry file) avoids that.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const upperDrive = (p) => p.replace(/^[a-z]:/, (d) => d.toUpperCase())

const cwd = upperDrive(process.cwd())
const vitestBin = upperDrive(fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url)))
const result = spawnSync(process.execPath, [vitestBin, ...process.argv.slice(2)], { cwd, stdio: 'inherit' })
process.exit(result.status ?? 1)
