import { readFileSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const pkg = JSON.parse(readFileSync(join(cwd(), 'package.json'), 'utf8'));

export default [
  {
    input: 'guest-js/index.ts',
    output: [
      { file: pkg.exports.import, format: 'es' },
      { file: pkg.exports.require, format: 'cjs' }
    ],
    plugins: [
      nodeResolve({ browser: true }),
      typescript({ tsconfig: './tsconfig.build.json', declaration: true, declarationDir: './dist-js' })
    ]
  },
  {
    input: 'guest-js/inject.ts',
    output: {
      file: 'dist-js/inline-injection.js',
      format: 'iife',
      name: 'TauriPluginSnapLayoutInline'
    },
    plugins: [
      nodeResolve({ browser: true }),
      typescript({ tsconfig: './tsconfig.inject.json', declaration: false })
    ]
  }
];