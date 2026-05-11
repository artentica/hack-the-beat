import angularSvg from '../assets/logos/angular.svg'
import bootstrapSvg from '../assets/logos/bootstrap.svg'
import cppSvg from '../assets/logos/cpp.svg'
import dockerSvg from '../assets/logos/docker.svg'
import githubSvg from '../assets/logos/github.svg'
import html5Svg from '../assets/logos/html5.svg'
import javaSvg from '../assets/logos/java.svg'
import kotlinSvg from '../assets/logos/kotlin.svg'
import nodejsSvg from '../assets/logos/nodejs.svg'
import pythonSvg from '../assets/logos/python.svg'
import reactSvg from '../assets/logos/react.svg'
import swiftSvg from '../assets/logos/swift.svg'
import typescriptSvg from '../assets/logos/typescript.svg'
import vuejsSvg from '../assets/logos/vuejs.svg'

// Pool of all tech logos (used for decorative rotation per level)
export const TECH_POOL = [
  { name: 'Angular', svg: angularSvg },
  { name: 'Bootstrap', svg: bootstrapSvg },
  { name: 'C++', svg: cppSvg },
  { name: 'Docker', svg: dockerSvg },
  { name: 'GitHub', svg: githubSvg },
  { name: 'HTML5', svg: html5Svg },
  { name: 'Java', svg: javaSvg },
  { name: 'Kotlin', svg: kotlinSvg },
  { name: 'Node.js', svg: nodejsSvg },
  { name: 'Python', svg: pythonSvg },
  { name: 'React', svg: reactSvg },
  { name: 'Swift', svg: swiftSvg },
  { name: 'TypeScript', svg: typescriptSvg },
  { name: 'Vue.js', svg: vuejsSvg },
]

// 4-lane system: fixed keys, colors, and shapes
export const LANE_KEYS = ['D', 'F', 'J', 'K']

export const LANE_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f']

export const LANE_SHAPES = ['circle', 'square', 'triangle', 'diamond']

export const LANES = LANE_KEYS.map((key, i) => ({
  key,
  laneIndex: i,
  color: LANE_COLORS[i],
  shape: LANE_SHAPES[i],
}))

// Pick 4 tech logos for the current level (decorative only)
export function pickLevelTechs(level) {
  const offset = ((level - 1) * 4) % TECH_POOL.length
  const techs = []
  for (let i = 0; i < 4; i++) {
    techs.push(TECH_POOL[(offset + i) % TECH_POOL.length])
  }
  return techs
}
