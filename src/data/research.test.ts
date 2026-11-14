import { describe, expect, it } from 'vitest'
import { RESEARCH } from './research'

describe('research data', () => {
  it('lists the six HRP investigations with the HRP research URL', () => {
    expect(RESEARCH.map((r) => r.name)).toEqual(['ARCHeR', 'B-Complex', 'Thigh Cuff', 'Zero T2', 'Space Gardening', 'Tempus Pro'])
    for (const r of RESEARCH) expect(r.url).toBe('https://www.nasa.gov/hrp/ongoing-hrp-research/')
  })

  it('labels countermeasures under investigation as NASA research in progress', () => {
    for (const name of ['B-Complex', 'Thigh Cuff']) expect(RESEARCH.find((r) => r.name === name)?.status).toBe('NASA research in progress')
  })

  it('never uses a mission identifier in a displayed name', () => {
    for (const r of RESEARCH) expect(r.name).not.toMatch(/artemis|apollo|expedition/i)
  })
})
