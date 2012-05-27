###
# require.js - A simple node like require for the browser.
#
# Victor Hugo Borja <vic.borja@gmail.com>
# MIT Licensed.
# 2012.
###

provide = (name, location, exports)->
  Features.prototype.places[name] = location
  Features.prototype.loaded[name] = exports

funLoader = (name, location, fun, options = {})-> (cb)->
  options.self ||= {}
  module = options.module || {}
  module.exports ||= {}
  module.location = ''+location
  require = relative location
  args = [require, module, module.exports, options.self]
  result = fun.apply null, args
  exports = result || module.exports
  provide name, location, exports
  cb exports if cb
  exports

codeLoader = (name, location, code, options = {})-> (cb)->
  code = ajax(location) unless code
  pre = options.preCode or ''
  post = options.postCode or '' 
  shadow_exports = ''
  if options.shadows
    shadow_exports = ("var #{s} = exports;" for s in options.shadows).join("\n")
  id = '$require_js$'+name.replace(/\W/g, '_')
  body = """
  return (function #{id}(){
    #{shadow_exports}
    (function() { #{pre}#{code}#{post} }).apply(self, []);
    return module.exports;
  })()
  """
  fun = new Function "require", "module", "exports", "self", body
  funLoader(name, location, fun, options) cb
  
ajax = (location)->
  if window.XMLHttpRequest
    req = new XMLHttpRequest
  else
    req = new ActiveXObject "Microsoft.XMLHTTP" 
  return unless req
  req.open "GET", location, false
  req.send null
  req.responseText

path =
  separator: '/'

  join: (a, b)->
    if a and b
      "#{a}#{@separator}#{b}" 
    else
       a || b

  normalize: (dir)->
    names = dir.split(@separator)
    patH = []
    for name in names
      if name == '' && patH.length > 0
        # skip it
      else if name == '.'
        # skip it
      else if name == '..'
        patH.pop()
      else
        patH.push name
    patH.join @separator

  dirname: (name)->
    names = @normalize(name).split @separator
    patH = names[0 .. -2]
    if patH.length > 0
      patH.join @separator 
    else
      '/'

  basename: (name)->
    names = @normalize(name).split @separator
    names.pop()

  resolve: (parts ...)-> @normalize parts.join @separator

Features = (location, origin)->
  if origin
    @origin = origin
    @base = location
  else
    m = location.match(/^(\w+:\/\/[^/]+)(.*)$/)
    @origin = m[1]
    @base = path.dirname(m[2])

Features.prototype = 

  loaded: {} # feature name -> feature object
  places: {} # feature name -> feature location

  loader: {} # feature name -> feature loader

  find: (feature)->
    name = feature
    found = @loaded[name]

    full = feature
    if @seems_relative full
      full = @absolute full

    unless found
      for own _name, location of @places 
        if location == feature || location == full
          found = @loaded[_name]
          break
      
    return @already found if found
    @loader[name] || codeLoader name, full

  already: (exports)-> (cb)-> cb exports; exports

  seems_relative: (location)-> !location.match(/^\w+:\/\//)

  absolute: (location)-> @origin + path.resolve(@base, location)

  define: (feature, location, fun, options)->
    location = @absolute('') unless location
    if @seems_relative location
      location = @absolute location
    @places[feature] = location
    loader = if typeof(fun) == 'function' then funLoader else codeLoader
    getter = loader feature, location, fun, options
    @loader[feature] = getter
    feature

  require: (feature, cb)-> @find(feature)(cb)

  requireAll: (features..., cb)->
    results = []
    size = features.length
    index = 0
    while index < size
      ((idx)->
        feature = features[idx]
        @require feature, (res)->
          results[idx] = res
          if results.length == size
            cb.apply(null, results)
      ) index++

apply = (fun, self) -> (args...)-> fun.apply self, args

relative = (location, origin)->
  features = new Features location, origin
  require = apply features.require, features
  require.def = apply features.define, features
  require.all = apply features.requireAll, features
  require

require = relative(if location.pathname
    path.dirname location.pathname  
  else
    '/'
  , location.origin)

@require = require
@require.codes = {}

runLinks = ->
  links = document.getElementsByTagName 'link'
  provides = (l for l in links when l.getAttribute('data-provide'))
  index = 0
  length = provides.length
  do execute = ->
    link = provides[index++]
    if link
      options = {}
      feature = link.getAttribute('data-provide')
      href = link.getAttribute('href')

      shadows = link.getAttribute('data-shadows')
      if shadows
        options.shadows = shadows.split(/\s*,\s*/)
      preCode = link.getAttribute('data-precode')
      options.preCode = preCode if preCode
      postCode = link.getAttribute('data-postcode')
      options.postCode = postCode if postCode

      require.def feature, href, null, options
      require(feature) if l.rel and l.rel.toLowerCase().match(/require|load|fetch|require\.js/)
      execute()
  null

if addEventListener
  addEventListener 'DOMContentLoaded', runLinks, no
else
  attachEvent 'onload', runLinks

