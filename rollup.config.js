import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import { readFileSync } from 'fs'

const packageJSON = JSON.parse(readFileSync('./package.json').toString('utf-8'))

const plugins = [
  nodeResolve({
    browser: true,
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }),
  commonjs(),
  replace({
    values: {
      _PACKAGE_VERSION: `"${packageJSON.version}"`,
      _DEVELOPMENT: 'false'
    },
    preventAssignment: true
  }),
  babel({
    babelHelpers: 'bundled',
    presets: ['@babel/preset-typescript', 'solid'],
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }),
  terser()
]

const files = ['popup.tsx', 'content_script.tsx', 'service_worker.ts']

export default files.map(f => ({
  input: `src/${f}`,
  output: {
    file: `output/${f.replace(/\.\w+$/, '.js')}`,
    format: 'es'
  },
  plugins
}))
