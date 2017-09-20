const fs = require('fs')
const path = require('path')
const load = require('pug-load')
var lex = require('pug-lexer')
var parse = require('pug-parser')

function PugComponentsCssExtractPlugin(options) {
  this.settings = options

  this.firstRun = true
  this.startTime = Date.now();
  this.prevTimestamps = {};
}

const walk = function (directoryName, tmplExt) {
  const pages = []
  let files = fs.readdirSync(directoryName)
  if (files) {
    files.forEach(function (file) {
      let fullPath = path.join(directoryName, file)
      let filestat = fs.statSync(fullPath)
      if (filestat.isDirectory()) {
        walk(fullPath)
      } else {
        if (file.substring(file.length - 4) === '.' + tmplExt) {
          pages.push(fullPath)
        }
      }
    })
  }
  return pages
}

const fillCssArray = function (arr, ext, compPath) {
  let dirCont = fs.readdirSync(compPath)
  let re = new RegExp('.*.(' + ext + ')', 'ig')
  let files = dirCont.filter(
    function (elm) {
      // TODO filter by filename or exclude '_filename.scss' with low dash
      return elm.match(re)
    }
  )
  let i = files.length
  while (i--) {
    let file = path.join(compPath, files[i])
    if (arr.indexOf(file) < 0) {
      arr.push(file)
    }
  }
  return arr
}

const writeCssFile = function (filePath, cssArr) {
  let fileDir = path.dirname(filePath)
  console.log('fileDir = ' + fileDir)
  let relPathStr = ''
  let i = cssArr.length
  while (i--) {
    let relPath = path.relative(fileDir, cssArr[i])
    relPathStr += '@import "' + relPath.replace(/\\/g, '/') + '";\n'
  }
  fs.writeFile(filePath, relPathStr, function (err) {
    if (err) {
      return console.log(err)
    }
    console.log('The file was saved!')
  })
}

PugComponentsCssExtractPlugin.prototype.apply = function (compiler) {
  let settings = this.settings
  compiler.plugin('emit', function (compilation, callback) {
    var changedFiles = Object.keys(compilation.fileTimestamps).filter(function(watchfile) {
      return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity)
    }.bind(this))
    // console.log(`changedFiles 1`)
    // console.log(changedFiles)
    // console.log('==================')
    this.prevTimestamps = compilation.fileTimestamps
    changedFiles = changedFiles.filter(function(file) {
      // console.log(file + ' vs ' + settings.stylePath)
      return (
        (path.extname(file).replace('.', '') === settings.tmplExt ||
        path.extname(file).replace('.', '') === settings.cssExt) &&
        file.replace(/\\/g, '/') !== settings.stylePath.replace(/\\/g, '/')
      )
    })
    // console.log(`changedFiles 2`)
    // console.log(changedFiles)
    // console.log('==================')
    
    // console.log(compilation)

    if (!settings.pagesDir) return
    if (this.firstRun || changedFiles.length) {
      this.firstRun = false
      // console.log('+++++++++++++++++++++')
      
      let componentsArr = []
      let cssArr = []
      const pagesArr = walk(settings.pagesDir, settings.tmplExt) // root pages templates array
      let i = pagesArr.length
      while (i--) {
        let pagePath = path.dirname(pagesArr[i])
        if (componentsArr.indexOf(pagePath) < 0) {
          componentsArr.push(pagePath)
          cssArr = fillCssArray(cssArr, settings.cssExt, pagePath)
        }
        load.file(pagesArr[i], {
          lex: lex,
          parse: parse,
          resolve: function (filename, source, options) {
            // console.log('"' + filename + '" file requested from "' + source + '".')
            // full path for components(includes)
            let compPath = path.dirname(path.resolve(path.dirname(source), filename))
            if (componentsArr.indexOf(compPath) < 0) {
              componentsArr.push(compPath)
              cssArr = fillCssArray(cssArr, settings.cssExt, compPath)
            }
            return load.resolve(filename, source, options)
          }
        })
      }
      writeCssFile(settings.stylePath, cssArr)

    }

    callback()
  }.bind(this))
}

module.exports = PugComponentsCssExtractPlugin
