const fs = require('fs')
const path = require('path')

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
  const pagesArr = walk(pagesDir, tmplExt)
  return pagesArr
}
