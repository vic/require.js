
/*
# require.js - A simple node like require for the browser.
#
# Victor Hugo Borja <vic.borja@gmail.com>
# MIT Licensed.
# 2012.
*/


(function() {
  var Features, ajax, apply, codeLoader, funLoader, path, provide, relative, require, runLinks,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty;

  provide = function(name, location, exports) {
    Features.prototype.places[name] = location;
    return Features.prototype.loaded[name] = exports;
  };

  funLoader = function(name, location, fun, options) {
    if (options == null) {
      options = {};
    }
    return function(cb) {
      var args, exports, module, require, result;
      options.self || (options.self = {});
      module = options.module || {};
      module.exports || (module.exports = {});
      module.location = '' + location;
      require = relative(location);
      args = [require, module, module.exports, options.self];
      result = fun.apply(null, args);
      exports = result || module.exports;
      provide(name, location, exports);
      if (cb) {
        cb(exports);
      }
      return exports;
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

  Features = function(location, origin) {
    var m;
    if (origin) {
      this.origin = origin;
      return this.base = location;
    } else {
      m = location.match(/^(\w+:\/\/[^/]+)(.*)$/);
      this.origin = m[1];
      return this.base = path.dirname(m[2]);
    }
  };

  Features.prototype = {
    loaded: {},
    places: {},
    loader: {},
    find: function(feature) {
      var found, full, location, name, _name, _ref;
      name = feature;
      found = this.loaded[name];
      full = feature;
      if (this.seems_relative(full)) {
        full = this.absolute(full);
      }
      if (!found) {
        _ref = this.places;
        for (_name in _ref) {
          if (!__hasProp.call(_ref, _name)) continue;
          location = _ref[_name];
          if (location === feature || location === full) {
            found = this.loaded[_name];
            break;
          }
        }
      }
      if (found) {
        return this.already(found);
      }
      return this.loader[name] || codeLoader(name, full);
    },
    already: function(exports) {
      return function(cb) {
        cb(exports);
        return exports;
      };
    },
    seems_relative: function(location) {
      return !location.match(/^\w+:\/\//);
    },
    absolute: function(location) {
      return this.origin + path.resolve(this.base, location);
    },
    define: function(feature, location, fun, options) {
      var getter, loader;
      if (!location) {
        location = this.absolute('');
      }
      if (this.seems_relative(location)) {
        location = this.absolute(location);
      }
      this.places[feature] = location;
      loader = typeof fun === 'function' ? funLoader : codeLoader;
      getter = loader(feature, location, fun, options);
      this.loader[feature] = getter;
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

  relative = function(location, origin) {
    var features, require;
    features = new Features(location, origin);
    require = apply(features.require, features);
    require.def = apply(features.define, features);
    require.all = apply(features.requireAll, features);
    return require;
  };

  require = relative(location.pathname ? path.dirname(location.pathname) : '/', location.origin);

  this.require = require;

  this.require.codes = {};

  runLinks = function() {
    var execute, index, l, length, links, provides;
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
    length = provides.length;
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
        if (l.rel && l.rel.toLowerCase().match(/require|load|fetch|require\.js/)) {
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
