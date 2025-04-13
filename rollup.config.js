// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // JS + ESM build
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/structive.mjs',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/structive.js',
        format: 'iife',
        name: 'Structive',
        sourcemap: true,
      }
    ],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  // Type declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/structive.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
];
