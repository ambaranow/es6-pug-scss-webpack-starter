const ExtractTextPlugin = require('extract-text-webpack-plugin')
const NODE_ENV = require('./nodeEnv')
const log = require('gutil-color-log')
log('blue', NODE_ENV)
var path = require('path')
var utils = require('./utils')
var config = require('../build_config')
const cssModuleExcludes = require('../build_config/css.module.excludes')
const scssExtractor = require('./css-from-pug-extractor')

const isDevMode = NODE_ENV === 'development'
const isProdMode = NODE_ENV === 'production'

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

const pages = scssExtractor(
  resolve('src/tmpl_pages'),
  'pug',
  'scss',
  resolve('src/tmpl_pages') + '/scss/components.scss')

module.exports = {
  entry: {
    app: './src/main.js'
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production' ?
      config.build.assetsPublicPath : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [resolve('src'), resolve('test')],
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test')]
      },
      {
        test: /\.(pug|jade)$/,
        // loader: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'pug-loader',
              options: {
                pretty: true
              }
            }
            // {
            //   loader: 'string-replace-loader',
            //   query: {
            //     search: 'addVersionControlFlag',
            //     replace: `${version}`,
            //     flags: 'g'
            //   }
            // },
          ]
        // })
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              query: {
                modules: true,
                sourceMap: true,
                // minimize: isProdMode,
                localIdentName: '[hash:base64:5]'
              }
            },
            {
              loader: 'postcss-loader',
              query: {
                sourceMap: true
              }
            },
            'resolve-url-loader',
            {
              loader: 'sass-loader',
              query: {
                sourceMap: true
              }
            }
          ]
        }),
        exclude: cssModuleExcludes
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  }
}
