// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';

export default [
  // JS + ESM build
  {
    input: 'src/exports.ts',
    output: [
      {
        file: 'dist/structive.js',
        format: 'esm',
        sourcemap: true,
      },
      /*
      {
        file: 'dist/structive.js',
        format: 'iife',
        name: 'Structive',
        sourcemap: true,
      }
      */
    ],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  // Type declarations
  /*
  {
    input: 'src/exports.ts',
    output: {
      file: 'dist/structive.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  },
  */
  // Minified JS build
  {
    input: 'src/exports.ts',
    output: {
      file: 'dist/structive.min.js',
      format: 'esm',
      name: 'Structive',
      sourcemap: true,
    },
    plugins: [
      terser({
        mangle: {
          properties: {
            keep_quoted: true,
          },
          module: true,
          keep_classnames: false,
          keep_fnames: false,
        }
      }),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  }
];
