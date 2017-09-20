const fs = require('fs')
const path = require('path')
const load = require('pug-load')
var lex = require('pug-lexer')
var parse = require('pug-parser')

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

// TODO move arguments to the options object
module.exports = function extractScss(pagesDir, tmplExt, cssExt, stylePath) {
  let componentsArr = []
  let cssArr = []
  const pagesArr = walk(pagesDir, tmplExt) // root pages templates array
  let i = pagesArr.length
  while (i--) {
    let pagePath = path.dirname(pagesArr[i])
    if (componentsArr.indexOf(pagePath) < 0) {
      componentsArr.push(pagePath)
      cssArr = fillCssArray(cssArr, cssExt, pagePath)
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
          cssArr = fillCssArray(cssArr, cssExt, compPath)
        }
        return load.resolve(filename, source, options)
      }
    })
  }
  writeCssFile(stylePath, cssArr)
  return cssArr // array of only used scss files
}
