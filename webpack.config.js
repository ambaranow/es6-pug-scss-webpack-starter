const log = require('gutil-color-log')
const NODE_ENV = require('./build_helpers/nodeEnv')
log('blue', NODE_ENV)

const config = require('./build_helpers/config')

const testServer = config.server.testServer;
const buildFolder = config.paths.dist

const pkg = require('./package.json')
const version = pkg.version
const banner = pkg.name + ' v' + version

const HTMLCompressionPlugin = require('html-compression-webpack-plugin')
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WriteFileWebpackPlugin = require('write-file-webpack-plugin')
const LocalePlugin = require('./build_helpers/WebpackLocalePlugin')
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin')

// const jQuery = require('jquery/dist/jquery.min')
// const Bootstrap = require('bootstrap/dist/js/bootstrap.min')

const path = require('path')

const isDevMode = NODE_ENV === 'development'
const isProdMode = NODE_ENV === 'production'

const extractLocale = new ExtractTextPlugin({
  filename: '[name].i18n.json',
  allChunks: true
})

const localePlugin = new LocalePlugin({
  paths: [path.resolve(__dirname, '**/*.i18n.json')],
  outputFileName: '[lang].json'
})

const setLocalhost = require('./build_helpers/setLocalhost')
setLocalhost()

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    app: [
      './index.pug',
    //   './vendor.js',
      './index.js',
      './styles/style.scss'
    ]
  },
  output: {
    path: path.resolve(__dirname, buildFolder),
    filename: 'js/[name].min.js'
  },
  resolve: {
    alias: {
      Root: path.resolve(__dirname, 'src/js/'),
      Assets: path.resolve(__dirname, 'src/assets/')
    }
  },
  externals: {},
  module: {
    loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
            loader: 'imports-loader?define=>false'
          },
          {
            loader: 'babel-loader',
            query: {
              presets: ['es2015', 'stage-0', 'react'],
              plugins: ["syntax-dynamic-import"]
            }
          },
          {
            loader: 'string-replace-loader',
            query: {
              search: 'addVersionControlFlag',
              replace: `${version}`,
              flags: 'g'
            }
          }
        ]
      },
      {
        test: /\.(pug|jade)$/,
        // loader: ExtractTextPlugin.extract({
        use: [{
            loader: 'pug-loader',
            options: {
              pretty: true
            }
          },
          {
            loader: 'string-replace-loader',
            query: {
              search: 'addVersionControlFlag',
              replace: `${version}`,
              flags: 'g'
            }
          },
          // { loader: 'css-loader' }
        ]
        // })
      },
      {
        test: /\.(scss|sass)$/,
        loader: ExtractTextPlugin.extract({
          use: [{
              loader: 'css-loader',
              options: {
                sourceMap: true,
                minimize: isProdMode,
              }
            },
            {
              loader: 'postcss-loader',
              options: {}
            },
            {
              loader: 'sass-loader',
              // options: {
              // 	sourceMap: true
              // }
            },
          ],
        })
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      // {
      // 	test: /\.css$/,
      // 	loader: 'style-loader!css-loader'
      // },
      {
        test: /\.yaml/,
        loader: extractLocale.extract({
          use: LocalePlugin.loader()
        })
      }
    ]

  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new CleanWebpackPlugin(['dist']),
    new webpack.BannerPlugin(`${banner}`),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 2,
      async: true
    }),
    new HtmlWebpackPlugin({
      template: 'index.pug',
      filename: 'index.html',
      inject: true,
      minify: isDevMode ? false : {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        html5: true,
        minifyCSS: true,
        removeComments: true,
        removeEmptyAttributes: true
      },
      NODE_ENV: NODE_ENV
    }),
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, 'src/assets'),
      to: path.resolve(__dirname, buildFolder + '/assets')
    }]),
    new webpack.NoEmitOnErrorsPlugin(),
    new WriteFileWebpackPlugin(),
    localePlugin,
    new UnminifiedWebpackPlugin(),
    new webpack.ContextReplacementPlugin(/node_modules\/moment\/locale/, /ru|en/),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
    }),
    new ExtractTextPlugin({
      filename: 'css/[name].min.css',
      allChunks: true
    })
  ],

  // webpack dev server configuration
  devServer: {
    host: config.server.localhost,
    contentBase: path.join(__dirname, buildFolder),
    port: config.server.port,
    historyApiFallback: {
      index: '/'
    },
    hot: true,
    // proxy: [
    // 	{
    // 		path: '/api',
    // 		target: testServer,
    // 		secure: false,
    // 		changeOrigin: true
    // 	},
    // 	{
    // 		path: '/upload',
    // 		target: testServer,
    // 		secure: false,
    // 		changeOrigin: true
    // 	},
    // 	{
    // 		path: '/static',
    // 		target: testServer,
    // 		secure: false,
    // 		changeOrigin: true
    // 	},
    // 	{
    // 		path: '/app',
    // 		target: `${config.server.localhost}:${config.server.port}`,
    // 		pathRewrite: {"^/app": ""},
    // 		secure: false,
    // 		changeOrigin: true
    // 	}
    // ],
    noInfo: false,
    stats: {
      color: true
    }
  },
  // support source maps
  devtool: isDevMode ? 'source-map' : 'false',
  watch: isDevMode,
  watchOptions: {
    aggregateTimeout: 100
  }
}

if (isProdMode) {
  module.exports.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      compress: {
        drop_console: true,
        drop_debugger: true,
        unsafe: true
      },
      sourceMap: isDevMode
    })
  )
  module.exports.plugins.push(
    new HTMLCompressionPlugin()
  )
}
