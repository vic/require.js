#!node_modules/jake/bin/cli.js default

jsp = require("uglify-js").parser
pro = require("uglify-js").uglify
coffee  = require 'coffee-script'
fs      = require 'fs'
path    = require 'path'
pkgJSON = JSON.parse fs.readFileSync path.join(__dirname, 'package.json'), 'utf-8'

files = [
  'require.js'
]
  
new jake.PackageTask pkgJSON.name, pkgJSON.version, ->
  @packageFiles.include files
  @needTarGz = true

new jake.NpmPublishTask pkgJSON.name, files

file 'require.js', ['index.coffee'], ->
  fs.writeFileSync 'require.js', coffee.compile(fs.readFileSync('index.coffee').toString())

file 'require.min.js', ['require.js'], ->
  orig_code = fs.readFileSync('require.js').toString()
  ast = jsp.parse(orig_code)
  ast = pro.ast_mangle(ast)
  ast = pro.ast_squeeze(ast)
  final_code = pro.gen_code(ast)
  fs.writeFileSync 'require.min.js', final_code
  

task 'default', ['require.min.js']

