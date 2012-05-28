###
# require.js - A simple node like require for the browser.
#
# Victor Hugo Borja <vic.borja@gmail.com>
# MIT Licensed.
# 2012.
###

addPreload = (name, location)->
  links = document.getElementsByTagName 'link'
  found = (l for l in links when l.href == location)
  return if found.length > 0
  link = document.createElement 'link'
  link.href = location
  link.rel = 'prefetch'
  link.setAttribute('data-provide', name)
  heads = document.getElementsByTagName 'head'
  heads[0].appendChild link
  

provide = (name, location, module)->
  Features.prototype.loaded[name] = module
  Features.prototype.loaded[location] = module

funLoader = (name, location, fun, options = {})-> (cb)->
  options.self ||= {}
  module = options.module || {}
  module.exports ||= {}
  module.location = ''+location
  require = relative location
  args = [require, module, module.exports, options.self]
  provide name, location, module
  fun.apply null, args
  provide name, location, module
  cb module.exports if cb
  module.exports

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

  find: (name)->
    href = name
    href = @absolute(href) if @seems_relative href
    found = @loaded[name] || @loaded[href] ||
             @loaded[@places[name]] || @loaded[@places[href]]
    return @already found if found
    @loader[name] || @loader[href] ||
     @loader[@places[name]] || @loader[@places[href]] ||
     codeLoader name, href

  already: (module)-> (cb)-> cb module.exports if cb; module.exports

  seems_relative: (location)-> !location.match(/^\w+:\/\//)

  absolute: (location)-> @origin + path.resolve(@base, location)

  define: (feature, location, fun, options)->
    location = @absolute('') unless location
    if @seems_relative location
      location = @absolute location
    funGiven = typeof(fun) == 'function'
    unless funGiven
      addPreload feature, location  
    @places[feature] = location
    loader = if funGiven then funLoader else codeLoader
    getter = loader feature, location, fun, options
    @loader[feature] = getter
    delete @loaded[feature]
    delete @loaded[location]
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

runLinks = ->
  links = document.getElementsByTagName 'link'
  provides = (l for l in links when l.getAttribute('data-provide'))
  index = 0
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
      if link.rel && link.rel.
         toLowerCase().match(/^(require|load|fetch|require\.js)$/)
        require(feature)
      execute()
  null

if addEventListener
  addEventListener 'DOMContentLoaded', runLinks, no
else
  attachEvent 'onload', runLinks

