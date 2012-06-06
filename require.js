
/*
# require.js - A simple node like require for the browser.
#
# Victor Hugo Borja <vic.borja@gmail.com>
# MIT Licensed.
# 2012.
*/


(function() {
  var Features, ajax, apply, codeLoader, defPlace, funLoader, getPlace, path, provide, relative, require, runLinks,
    __slice = [].slice;

  getPlace = function(name) {
    var found, l, links;
    links = document.getElementsByTagName('link');
    found = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = links.length; _i < _len; _i++) {
        l = links[_i];
        if (l.getAttribute('data-provide') === name) {
          _results.push(l);
        }
      }
      return _results;
    })();
    if (found.length > 0) {
      return found[0].href;
    }
  };

  defPlace = function(name, location) {
    var heads, link;
    if (getPlace(name)) {
      return;
    }
    link = document.createElement('link');
    link.href = location;
    link.rel = 'prefetch';
    link.setAttribute('data-provide', name);
    heads = document.getElementsByTagName('head');
    return heads[0].appendChild(link);
  };

  provide = function(name, location, module) {
    Features.prototype.loaded[name] = module;
    return Features.prototype.loaded[location] = module;
  };

  funLoader = function(name, location, fun, options) {
    if (options == null) {
      options = {};
    }
    return function(cb) {
      var args, module, require;
      options.self || (options.self = {});
      module = options.module || {};
      module.exports || (module.exports = {});
      module.location = '' + location;
      require = relative(location);
      args = [require, module, module.exports, options.self];
      provide(name, location, module);
      fun.apply(null, args);
      provide(name, location, module);
      if (cb) {
        cb(module.exports);
      }
      return module.exports;
    };
  };

  codeLoader = function(name, location, code, options) {
    if (options == null) {
      options = {};
    }
    return function(cb) {
      var body, fun, id, post, pre, s, shadow_exports;
      if (!code) {
        code = ajax(location);
      }
      pre = options.preCode || '';
      post = options.postCode || '';
      shadow_exports = '';
      if (options.shadows) {
        shadow_exports = ((function() {
          var _i, _len, _ref, _results;
          _ref = options.shadows;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            s = _ref[_i];
            _results.push("var " + s + " = exports;");
          }
          return _results;
        })()).join("\n");
      }
      id = '$require_js$' + name.replace(/\W/g, '_');
      body = "return (function " + id + "(){\n  " + shadow_exports + "\n  (function() { " + pre + code + post + " }).apply(self, []);\n  return module.exports;\n})()";
      fun = new Function("require", "module", "exports", "self", body);
      return funLoader(name, location, fun, options)(cb);
    };
  };

  ajax = function(location) {
    var req;
    if (window.XMLHttpRequest) {
      req = new XMLHttpRequest;
    } else {
      req = new ActiveXObject("Microsoft.XMLHTTP");
    }
    if (!req) {
      return;
    }
    req.open("GET", location, false);
    req.send(null);
    return req.responseText;
  };

  path = {
    separator: '/',
    join: function(a, b) {
      if (a && b) {
        return "" + a + this.separator + b;
      } else {
        return a || b;
      }
    },
    normalize: function(dir) {
      var name, names, patH, _i, _len;
      names = dir.split(this.separator);
      patH = [];
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        name = names[_i];
        if (name === '' && patH.length > 0) {

        } else if (name === '.') {

        } else if (name === '..') {
          patH.pop();
        } else {
          patH.push(name);
        }
      }
      return patH.join(this.separator);
    },
    dirname: function(name) {
      var names, patH;
      names = this.normalize(name).split(this.separator);
      patH = names.slice(0, -1);
      if (patH.length > 0) {
        return patH.join(this.separator);
      } else {
        return '/';
      }
    },
    basename: function(name) {
      var names;
      names = this.normalize(name).split(this.separator);
      return names.pop();
    },
    resolve: function() {
      var parts;
      parts = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.normalize(parts.join(this.separator));
    }
  };

  Features = function(location, origin, name) {
    var m;
    if (origin) {
      this.origin = origin;
      this.base = location;
    } else if (m = location.match(/^(\w+:\/\/[^/]+)(.*)$/)) {
      this.origin = m[1];
      this.base = path.dirname(m[2]);
    }
    if (name) {
      return this.name = name;
    }
  };

  Features.prototype = {
    loaded: {},
    loader: {},
    find: function(name) {
      var found, href, place;
      href = name;
      if (this.seems_relative(href)) {
        href = this.absolute(href);
      }
      place = (this.name ? getPlace(this.name + "/" + name) : void 0) || getPlace(name) || getPlace(href);
      found = this.loaded[name] || this.loaded[href] || this.loaded[place];
      if (found) {
        return this.already(found);
      }
      return (this.name ? this.loader[this.name + "/" + name] : void 0) || this.loader[name] || this.loader[href] || this.loader[place] || codeLoader(name, place || href);
    },
    already: function(module) {
      return function(cb) {
        if (cb) {
          cb(module.exports);
        }
        return module.exports;
      };
    },
    seems_relative: function(location) {
      return !location.match(/^\w+:\/\//);
    },
    absolute: function(location) {
      return this.origin + path.resolve(this.base, location);
    },
    define: function(feature, location, fun, options) {
      var funGiven, getter, loader;
      if (!location) {
        location = this.absolute('');
      }
      if (this.seems_relative(location)) {
        location = this.absolute(location);
      }
      funGiven = typeof fun === 'function';
      defPlace(feature, location);
      loader = funGiven ? funLoader : codeLoader;
      getter = loader(feature, location, fun, options);
      this.loader[feature] = getter;
      delete this.loaded[feature];
      delete this.loaded[location];
      return feature;
    },
    require: function(feature, cb) {
      return this.find(feature)(cb);
    },
    requireAll: function() {
      var cb, features, index, results, size, _i, _results;
      features = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      results = [];
      size = features.length;
      index = 0;
      _results = [];
      while (index < size) {
        _results.push((function(idx) {
          var feature;
          feature = features[idx];
          return this.require(feature, function(res) {
            results[idx] = res;
            if (results.length === size) {
              return cb.apply(null, results);
            }
          });
        })(index++));
      }
      return _results;
    }
  };

  apply = function(fun, self) {
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return fun.apply(self, args);
    };
  };

  relative = function(location, origin, name) {
    var features, require;
    features = new Features(location, origin, name);
    require = apply(features.require, features);
    require.def = apply(features.define, features);
    require.all = apply(features.requireAll, features);
    return require;
  };

  require = relative(location.pathname ? path.dirname(location.pathname) : '/', location.origin);

  this.require = require;

  runLinks = function() {
    var execute, index, l, links, provides;
    links = document.getElementsByTagName('link');
    provides = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = links.length; _i < _len; _i++) {
        l = links[_i];
        if (l.getAttribute('data-provide')) {
          _results.push(l);
        }
      }
      return _results;
    })();
    index = 0;
    (execute = function() {
      var feature, href, link, options, postCode, preCode, shadows;
      link = provides[index++];
      if (link) {
        options = {};
        feature = link.getAttribute('data-provide');
        href = link.getAttribute('href');
        shadows = link.getAttribute('data-shadows');
        if (shadows) {
          options.shadows = shadows.split(/\s*,\s*/);
        }
        preCode = link.getAttribute('data-precode');
        if (preCode) {
          options.preCode = preCode;
        }
        postCode = link.getAttribute('data-postcode');
        if (postCode) {
          options.postCode = postCode;
        }
        require.def(feature, href, null, options);
        if (link.rel && link.rel.toLowerCase().match(/^(require|load|fetch|require\.js)$/)) {
          require(feature);
        }
        return execute();
      }
    })();
    return null;
  };

  if (addEventListener) {
    addEventListener('DOMContentLoaded', runLinks, false);
  } else {
    attachEvent('onload', runLinks);
  }

}).call(this);
