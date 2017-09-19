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

module.exports = function extractScss(pagesDir, tmplExt, stylePath) {
  let componentsArr = []
  let scssArr = []
  const pagesArr = walk(pagesDir, tmplExt) // root pages templates array
  let i=pagesArr.length
  while (i--) {
    let pagePath = path.dirname(pagesArr[i])
    if (componentsArr.indexOf(pagePath) < 0) {
      componentsArr.push(pagePath)
    }
    load.file(pagesArr[i], {
      lex: lex,
      parse: parse,
      resolve: function (filename, source, options) {
        // console.log('"' + filename + '" file requested from "' + source + '".')
        // console.log('......')
        // full path for components(includes)
        let pagePath = path.dirname(path.resolve(source, filename))
        if (componentsArr.indexOf(pagePath) < 0) {
          componentsArr.push(pagePath)
        }

        return load.resolve(filename, source, options)
      }
    })
  }
  console.log(componentsArr)
  console.log('============================')
  return componentsArr
}
