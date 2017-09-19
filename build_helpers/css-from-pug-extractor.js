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

const fillCssArray = function(arr, ext, compPath) {
  let dirCont = fs.readdirSync(compPath)
  let files = dirCont.filter(
    function(elm) {
      return elm.match(/.*\.(scss)/ig)
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

module.exports = function extractScss(pagesDir, tmplExt, cssExt, stylePath) {
  let componentsArr = []
  let cssArr = []
  const pagesArr = walk(pagesDir, tmplExt) // root pages templates array
  let i=pagesArr.length
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
        // console.log('......')
        // full path for components(includes)
        let compPath = path.dirname(path.resolve(path.dirname(source), filename))
        if (componentsArr.indexOf(compPath) < 0) {
          componentsArr.push(compPath)
          // console.log(':: ' + compPath)
          cssArr = fillCssArray(cssArr, cssExt, compPath)
        }

        return load.resolve(filename, source, options)
      }
    })
  }
  // console.log(componentsArr)
  // console.log(cssArr)
  // console.log('============================')
  return cssArr
}
