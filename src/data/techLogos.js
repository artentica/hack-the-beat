import angularSvg from '../assets/logos/angular.svg'
import bootstrapSvg from '../assets/logos/bootstrap.svg'
import confluenceSvg from '../assets/logos/confluence.svg'
import cppSvg from '../assets/logos/cpp.svg'
import cypressSvg from '../assets/logos/cypress.svg'
import dockerSvg from '../assets/logos/docker.svg'
import dotnetSvg from '../assets/logos/dotnet.svg'
import gitSvg from '../assets/logos/git.svg'
import githubSvg from '../assets/logos/github.svg'
import html5Svg from '../assets/logos/html5.svg'
import javaSvg from '../assets/logos/java.svg'
import jiraSvg from '../assets/logos/jira.svg'
import kafkaSvg from '../assets/logos/kafka.svg'
import kotlinSvg from '../assets/logos/kotlin.svg'
import mongodbSvg from '../assets/logos/mongodb.svg'
import mysqlSvg from '../assets/logos/mysql.svg'
import nodejsSvg from '../assets/logos/nodejs.svg'
import playwrightSvg from '../assets/logos/playwright.svg'
import pythonSvg from '../assets/logos/python.svg'
import reactSvg from '../assets/logos/react.svg'
import seleniumSvg from '../assets/logos/selenium.svg'
import springSvg from '../assets/logos/spring.svg'
import swiftSvg from '../assets/logos/swift.svg'
import typescriptSvg from '../assets/logos/typescript.svg'
import vuejsSvg from '../assets/logos/vuejs.svg'

// Pool of all tech logos (used for decorative rotation per level)
// lockedKey: if set, this logo can only appear on the lane matching that key (D/F/J/K)
export const TECH_POOL = [
  { name: 'Angular', svg: angularSvg, color: '#DD0031' },
  { name: 'Bootstrap', svg: bootstrapSvg, color: '#7952B3' },
  { name: 'C++', svg: cppSvg, color: '#00599C' },
  { name: 'Confluence', svg: confluenceSvg, color: '#0052CC' },
  { name: 'Cypress', svg: cypressSvg, color: '#4A4A4C' },
  { name: 'Docker', svg: dockerSvg, color: '#2496ED', lockedKey: 'D' },
  { name: 'Git', svg: gitSvg, color: '#F34F29' },
  { name: 'GitHub', svg: githubSvg, color: '#181717' },
  { name: 'HTML5', svg: html5Svg, color: '#E34F26' },
  { name: 'Java', svg: javaSvg, color: '#0173BE', lockedKey: 'J' },
  { name: 'Jira', svg: jiraSvg, color: '#136CE7', lockedKey: 'J' },
  { name: 'Kafka', svg: kafkaSvg, color: '#231F20', lockedKey: 'K' },
  { name: 'Kotlin', svg: kotlinSvg, color: '#7F52FF', lockedKey: 'K' },
  { name: 'MongoDB', svg: mongodbSvg, color: '#439934' },
  { name: 'MySQL', svg: mysqlSvg, color: '#00618A' },
  { name: 'Node.js', svg: nodejsSvg, color: '#339933' },
  { name: 'Playwright', svg: playwrightSvg, color: '#2D4552' },
  { name: 'Python', svg: pythonSvg, color: '#3776AB' },
  { name: 'React', svg: reactSvg, color: '#61DAFB' },
  { name: 'Selenium', svg: seleniumSvg, color: '#CF0A2C' },
  { name: 'Spring', svg: springSvg, color: '#77BC1F' },
  { name: 'Swift', svg: swiftSvg, color: '#F05138' },
  { name: 'TypeScript', svg: typescriptSvg, color: '#3178C6' },
  { name: 'Vue.js', svg: vuejsSvg, color: '#4FC08D' },
  { name: '.NET', svg: dotnetSvg, color: '#127BCA' },
]

// 4-lane system: fixed keys and default colors
export const LANE_KEYS = ['D', 'F', 'J', 'K']

export const LANE_COLORS = ['#EE4823', '#3DA2D6', '#F5ED63', '#FCB912']

export const LANES = LANE_KEYS.map((key, i) => ({
  key,
  laneIndex: i,
  color: LANE_COLORS[i],
}))

export function buildSessionPool() {
  const lockedKeys = [...new Set(
    TECH_POOL.filter(t => t.lockedKey).map(t => t.lockedKey)
  )]

  // Pick one key-letter at random to keep; remove all others' locked logos
  const keptKey = lockedKeys[Math.floor(Math.random() * lockedKeys.length)]

  return TECH_POOL.filter(t => !t.lockedKey || t.lockedKey === keptKey)
}

export function pickLevelTechs(level, sessionPool = TECH_POOL) {
  const pool = sessionPool
  const offset = ((level - 1) * 4) % pool.length

  // Grab a candidate list of 4 (may extend if conflicts arise)
  const picked = []
  let cursor = offset
  const used = new Set()

  while (picked.length < 4) {
    const tech = pool[cursor % pool.length]
    cursor++
    if (used.has(tech.name)) continue
    used.add(tech.name)
    picked.push(tech)
    // Safety: if we looped the whole pool and can't fill 4
    if (cursor - offset > pool.length * 2) break
  }

  // Place into result[4], respecting lockedKey positions
  const result = new Array(4).fill(null)
  const lockedKeyToLaneIndex = Object.fromEntries(
    LANE_KEYS.map((k, i) => [k, i])
  )

  // First pass: place locked logos
  const unplaced = []
  for (const tech of picked) {
    if (tech.lockedKey) {
      const laneIdx = lockedKeyToLaneIndex[tech.lockedKey]
      if (result[laneIdx] === null) {
        result[laneIdx] = tech
      } else {
        // Conflict: another locked logo already occupies this lane — skip this one
        // and fetch a replacement free logo from the pool
        unplaced.push({ replace: true })
      }
    } else {
      unplaced.push(tech)
    }
  }

  // Second pass: fill remaining lanes with free logos
  let freeIdx = 0
  for (let i = 0; i < 4; i++) {
    if (result[i] === null) {
      // Find next free (non-locked) logo not already used
      while (freeIdx < unplaced.length && unplaced[freeIdx].replace) freeIdx++
      if (freeIdx < unplaced.length) {
        result[i] = unplaced[freeIdx++]
      } else {
        // Fallback: pick any unused logo from the full pool
        const fallback = pool.find(t => !used.has(t.name) && !t.lockedKey)
        if (fallback) {
          used.add(fallback.name)
          result[i] = fallback
        } else {
          result[i] = pool[i % pool.length]
        }
      }
    }
  }

  return result
}
