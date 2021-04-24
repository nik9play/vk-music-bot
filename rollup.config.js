import json from '@rollup/plugin-json';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

export default {
  input: './src/index.js',
  output: {
    dir: './dist/',
    format: 'cjs'
  },
  plugins: [dynamicImportVars(), json()]
};
