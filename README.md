require.js
==========

A simple node like synchronous require made just for the browser.


Usage
=====

```html
<head>

   <!-- Load require.min.js on your html -->
   <script src='js/require.min.js' />

   <!--
      require.js will search for links with data-provide attribute
      indicating the feature name provided by the href.

      in html5, prefetch will tell the browser that we are most
      likely to use a resource, so it loads faster when actually used.
      
      the following tag just defines the `baz` feature and its js.
    -->
   <link data-provide='baz' href='js/baz.js' rel='prefetch' />

   <!--
      if the link rel is 'require' the resource will be loaded
      immediatly. use this for your main script.
     -->
   <link data-provide='foo' href='js/foo/index.js' rel='require' />

 </head>
```

<code>js/foo/index.js</code>
```js

var bar = require('./bar.js') // will load relative to this resource
var baz = require('baz')      // will load the baz registered feature

```

<code>js/foo/bar.js</code>
```js
// Loaded by js/foo/index.js

// actually there's a module.location variable
// that lets you know where you are being loaded from.
alert("Bar being loaded from "+module.location);

// use the exports variable like in node
exports.something = 22
exports.great = 33
```

<code>js/baz.js</code>
```js
// Loaded by js/foo/index.js

module.exports = "A single object being exported"
```

Note, never assign exports like this:
```js
exports = "Foo"
```

Prefer it this way:
```js
module.exports = "Foo"
```
