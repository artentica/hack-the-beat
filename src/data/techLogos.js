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

export const TECH_LOGOS = [
  { letter: 'A', name: 'Angular', svg: angularSvg },
  { letter: 'B', name: 'Bootstrap', svg: bootstrapSvg },
  { letter: 'C', name: 'C++', svg: cppSvg },
  { letter: 'D', name: 'Docker', svg: dockerSvg },
  { letter: 'G', name: 'GitHub', svg: githubSvg },
  { letter: 'H', name: 'HTML5', svg: html5Svg },
  { letter: 'J', name: 'Java', svg: javaSvg },
  { letter: 'K', name: 'Kotlin', svg: kotlinSvg },
  { letter: 'N', name: 'Node.js', svg: nodejsSvg },
  { letter: 'P', name: 'Python', svg: pythonSvg },
  { letter: 'R', name: 'React', svg: reactSvg },
  { letter: 'S', name: 'Swift', svg: swiftSvg },
  { letter: 'T', name: 'TypeScript', svg: typescriptSvg },
  { letter: 'V', name: 'Vue.js', svg: vuejsSvg },
]

export const LETTERS = TECH_LOGOS.map(t => t.letter)
