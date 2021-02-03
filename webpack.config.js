const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
  target: 'node',
  externals: [nodeExternals()],
  mode: "development",   
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js"
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: "babel-loader",
      options: {
        presets: [
          [          
          '@babel/preset-env',
          {
            "targets": {
              "node": "12"
            }
          }]
        ]
      },
      exclude: "/node_modules/"
    }]
  }
}