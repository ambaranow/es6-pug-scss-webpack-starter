const env = process.env.NODE_ENV || 'development'

function buildConfig(env) {
  return require('./build_helpers/webpack.config.' + env + '.js')
}

module.exports = buildConfig(env === 'production' ? 'prod' : 'dev')
