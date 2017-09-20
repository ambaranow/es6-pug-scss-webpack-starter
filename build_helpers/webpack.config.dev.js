const path = require('path')
var utils = require('./utils')
var webpack = require('webpack')
var config = require('../build_config')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.config.base')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const WriteFileWebpackPlugin = require('write-file-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const PugComponentsCssExtractPlugin = require('./pug-components-css-extract-plugin')

// add hot-reload related code to entry chunks
Object.keys(baseWebpackConfig.entry).forEach(function (name) {
  baseWebpackConfig.entry[name] = ['./build_helpers/dev-client'].concat(baseWebpackConfig.entry[name])
})
function resolve(dir) {
  return path.join(__dirname, '..', dir)
}
module.exports = merge(baseWebpackConfig, {
  module: {
    // rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: '#cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.dev.env
    }),
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new WriteFileWebpackPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/tmpl_pages/index.pug',
      inject: true
    }),
    new FriendlyErrorsPlugin(),
    new ExtractTextPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css')
    }),
    new PugComponentsCssExtractPlugin({
      pagesDir: resolve('src/tmpl_pages'),
      tmplExt: 'pug',
      cssExt: 'scss',
      stylePath: resolve('src') + '/scss/components.scss'
    })
  ]
})
