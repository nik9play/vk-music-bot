import json from '@rollup/plugin-json';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import del from 'rollup-plugin-delete'

export default {
  input: './src/index.js',
  output: {
    dir: './dist/',
    format: 'cjs'
  },
  plugins: [dynamicImportVars(), json(),
  del({targets: 'dist/*'})]
};
