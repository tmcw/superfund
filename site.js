/*!
  * =============================================================
  * Ender: open module JavaScript framework (https://ender.no.de)
  * Build: ender build domready qwery bean bonzo
  * =============================================================
  */

/*!
  * Ender-JS: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * https://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context;

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {};

  function require (identifier) {
    var module = modules[identifier] || window[identifier];
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.");
    return module;
  }

  function provide (name, what) {
    return modules[name] = what;
  }

  context['provide'] = provide;
  context['require'] = require;

  // Implements Ender's $ global access object
  // =========================================

  function aug(o, o2) {
    for (var k in o2) {
      k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k]);
    }
    return o;
  }

  function boosh(s, r, els) {
                          // string || node || nodelist || window
    if (ender._select && (typeof s == 'string' || s.nodeName || s.length && 'item' in s || s == window)) {
      els = ender._select(s, r);
      els.selector = s;
    } else {
      els = isFinite(s.length) ? s : [s];
    }
    return aug(els, boosh);
  }

  function ender(s, r) {
    return boosh(s, r);
  }

  aug(ender, {
    _VERSION: '0.2.5',
    ender: function (o, chain) {
      aug(chain ? boosh : ender, o);
    },
    fn: context.$ && context.$.fn || {} // for easy compat to jQuery plugins
  });

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) {
        i in this && fn.call(scope || this[i], this[i], i, this);
      }
      // return self for chaining
      return this;
    },
    $: ender // handy reference to self
  });

  var old = context.$;
  ender.noConflict = function () {
    context.$ = old;
    return this;
  };

  (typeof module !== 'undefined') && module.exports && (module.exports = ender);
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender;

}(this);

!function () {

  var module = { exports: {} }, exports = module.exports;

  !function (context, doc) {
    var fns = [], ol, fn, f = false,
        testEl = doc.documentElement,
        hack = testEl.doScroll,
        domContentLoaded = 'DOMContentLoaded',
        addEventListener = 'addEventListener',
        onreadystatechange = 'onreadystatechange',
        loaded = /^loade|c/.test(doc.readyState);
  
    function flush(i) {
      loaded = 1;
      while (i = fns.shift()) { i() }
    }
    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f);
      flush();
    }, f);
  
  
    hack && doc.attachEvent(onreadystatechange, (ol = function () {
      if (/^c/.test(doc.readyState)) {
        doc.detachEvent(onreadystatechange, ol);
        flush();
      }
    }));
  
    context['domReady'] = hack ?
      function (fn) {
        self != top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll('left');
            } catch (e) {
              return setTimeout(function() { context['domReady'](fn) }, 50);
            }
            fn();
          }()
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn);
      };
  
  }(this, document);
  

  provide("domready", module.exports);

  !function ($) {
    $.ender({domReady: domReady});
    $.ender({
      ready: function (f) {
        domReady(f);
        return this;
      }
    }, true);
  }(ender);

}();

!function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Qwery - A Blazing Fast query selector engine
    * https://github.com/ded/qwery
    * copyright Dustin Diaz & Jacob Thornton 2011
    * MIT License
    */
  
  !function (context, doc) {
  
    var c, i, j, k, l, m, o, p, r, v,
        el, node, len, found, classes, item, items, token,
        html = doc.documentElement,
        id = /#([\w\-]+)/,
        clas = /\.[\w\-]+/g,
        idOnly = /^#([\w\-]+$)/,
        classOnly = /^\.([\w\-]+)$/,
        tagOnly = /^([\w\-]+)$/,
        tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/,
        normalizr = /\s*([\s\+\~>])\s*/g,
        splitters = /[\s\>\+\~]/,
        splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\])/,
        dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g'),
        tokenizr = new RegExp(splitters.source + splittersMore.source),
        specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g,
        simple = /^([a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/,
        attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/,
        pseudo = /:([\w\-]+)(\(['"]?(\w+)['"]?\))?/,
        chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?'),
        walker = {
      ' ': function (node) {
        return node && node !== html && node.parentNode
      },
      '>': function (node, contestant) {
        return node && node.parentNode == contestant.parentNode && node.parentNode;
      },
      '~': function (node) {
        return node && node.previousSibling;
      },
      '+': function (node, contestant, p1, p2) {
        if (!node) {
          return false;
        }
        p1 = previous(node);
        p2 = previous(contestant);
        return p1 && p2 && p1 == p2 && p1;
      }
    };
    function cache() {
      this.c = {};
    }
    cache.prototype = {
      g: function (k) {
        return this.c[k] || undefined;
      },
      s: function (k, v) {
        this.c[k] = v;
        return v;
      }
    };
  
    var classCache = new cache(),
        cleanCache = new cache(),
        attrCache = new cache(),
        tokenCache = new cache();
  
    function array(ar) {
      r = [];
      for (i = 0, len = ar.length; i < len; i++) {
        r[i] = ar[i];
      }
      return r;
    }
  
    function previous(n) {
      while (n = n.previousSibling) {
        if (n.nodeType == 1) {
          break;
        }
      }
      return n
    }
  
    function q(query) {
      return query.match(chunker);
    }
  
    // this next method expect at most these args
    // given => div.hello[title="world"]:foo('bar')
  
    // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
  
    function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
      var m, c, k;
      if (tag && this.tagName.toLowerCase() !== tag) {
        return false;
      }
      if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) {
        return false;
      }
      if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
        for (i = classes.length; i--;) {
          c = classes[i].slice(1);
          if (!(classCache.g(c) || classCache.s(c, new RegExp('(^|\\s+)' + c + '(\\s+|$)'))).test(this.className)) {
            return false;
          }
        }
      }
      if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) {
        return false;
      }
      if (wholeAttribute && !value) {
        o = this.attributes;
        for (k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
            return this;
          }
        }
      }
      if (wholeAttribute && !checkAttr(qualifier, this.getAttribute(attribute) || '', value)) {
        return false;
      }
      return this;
    }
  
    function clean(s) {
      return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'));
    }
  
    function checkAttr(qualify, actual, val) {
      switch (qualify) {
      case '=':
        return actual == val;
      case '^=':
        return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, new RegExp('^' + clean(val))));
      case '$=':
        return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, new RegExp(clean(val) + '$')));
      case '*=':
        return actual.match(attrCache.g(val) || attrCache.s(val, new RegExp(clean(val))));
      case '~=':
        return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, new RegExp('(?:^|\\s+)' + clean(val) + '(?:\\s+|$)')));
      case '|=':
        return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, new RegExp('^' + clean(val) + '(-|$)')));
      }
      return 0;
    }
  
    function _qwery(selector) {
      var r = [], ret = [], i, j = 0, k, l, m, p, token, tag, els, root, intr, item, children,
          tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr)),
          dividedTokens = selector.match(dividers), dividedToken;
      tokens = tokens.slice(0); // this makes a copy of the array so the cached original is not effected
      if (!tokens.length) {
        return r;
      }
  
      token = tokens.pop();
      root = tokens.length && (m = tokens[tokens.length - 1].match(idOnly)) ? doc.getElementById(m[1]) : doc;
      if (!root) {
        return r;
      }
      intr = q(token);
      els = dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ? function (r) {
          while (root = root.nextSibling) {
            root.nodeType == 1 && (intr[1] ? intr[1] == root.tagName.toLowerCase() : 1) && r.push(root)
          }
          return r
        }([]) :
        root.getElementsByTagName(intr[1] || '*');
      for (i = 0, l = els.length; i < l; i++) {
        if (item = interpret.apply(els[i], intr)) {
          r[j++] = item;
        }
      }
      if (!tokens.length) {
        return r;
      }
  
      // loop through all descendent tokens
      for (j = 0, l = r.length, k = 0; j < l; j++) {
        p = r[j];
        // loop through each token backwards crawling up tree
        for (i = tokens.length; i--;) {
          // loop through parent nodes
          while (p = walker[dividedTokens[i]](p, r[j])) {
            if (found = interpret.apply(p, q(tokens[i]))) {
              break;
            }
          }
        }
        found && (ret[k++] = r[j]);
      }
      return ret;
    }
  
    function boilerPlate(selector, _root, fn) {
      var root = (typeof _root == 'string') ? fn(_root)[0] : (_root || doc);
      if (selector === window || isNode(selector)) {
        return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : [];
      }
      if (selector && typeof selector === 'object' && isFinite(selector.length)) {
        return array(selector);
      }
      if (m = selector.match(idOnly)) {
        return (el = doc.getElementById(m[1])) ? [el] : [];
      }
      if (m = selector.match(tagOnly)) {
        return array(root.getElementsByTagName(m[1]));
      }
      return false;
    }
  
    function isNode(el) {
      return (el && el.nodeType && (el.nodeType == 1 || el.nodeType == 9));
    }
  
    function uniq(ar) {
      var a = [], i, j;
      label:
      for (i = 0; i < ar.length; i++) {
        for (j = 0; j < a.length; j++) {
          if (a[j] == ar[i]) {
            continue label;
          }
        }
        a[a.length] = ar[i];
      }
      return a;
    }
  
    function qwery(selector, _root) {
      var root = (typeof _root == 'string') ? qwery(_root)[0] : (_root || doc);
      if (!root || !selector) {
        return [];
      }
      if (m = boilerPlate(selector, _root, qwery)) {
        return m;
      }
      return select(selector, root);
    }
  
    var isAncestor = 'compareDocumentPosition' in html ?
      function (element, container) {
        return (container.compareDocumentPosition(element) & 16) == 16;
      } : 'contains' in html ?
      function (element, container) {
        container = container == doc || container == window ? html : container;
        return container !== element && container.contains(element);
      } :
      function (element, container) {
        while (element = element.parentNode) {
          if (element === container) {
            return 1;
          }
        }
        return 0;
      },
  
    select = (doc.querySelector && doc.querySelectorAll) ?
      function (selector, root) {
        if (doc.getElementsByClassName && (m = selector.match(classOnly))) {
          return array((root).getElementsByClassName(m[1]));
        }
        return array((root).querySelectorAll(selector));
      } :
      function (selector, root) {
        selector = selector.replace(normalizr, '$1');
        var result = [], collection, collections = [], i;
        if (m = selector.match(tagAndOrClass)) {
          items = root.getElementsByTagName(m[1] || '*');
          r = classCache.g(m[2]) || classCache.s(m[2], new RegExp('(^|\\s+)' + m[2] + '(\\s+|$)'));
          for (i = 0, l = items.length, j = 0; i < l; i++) {
            r.test(items[i].className) && (result[j++] = items[i]);
          }
          return result;
        }
        for (i = 0, items = selector.split(','), l = items.length; i < l; i++) {
          collections[i] = _qwery(items[i]);
        }
        for (i = 0, l = collections.length; i < l && (collection = collections[i]); i++) {
          var ret = collection;
          if (root !== doc) {
            ret = [];
            for (j = 0, m = collection.length; j < m && (element = collection[j]); j++) {
              // make sure element is a descendent of root
              isAncestor(element, root) && ret.push(element);
            }
          }
          result = result.concat(ret);
        }
        return uniq(result);
      };
  
    qwery.uniq = uniq;
    qwery.pseudos = {};
  
    var oldQwery = context.qwery;
    qwery.noConflict = function () {
      context.qwery = oldQwery;
      return this;
    };
    context['qwery'] = qwery;
  
  }(this, document);

  provide("qwery", module.exports);

  !function (doc) {
    var q = qwery.noConflict();
    var table = 'table',
        nodeMap = {
          thead: table,
          tbody: table,
          tfoot: table,
          tr: 'tbody',
          th: 'tr',
          td: 'tr',
          fieldset: 'form',
          option: 'select'
        }
    function create(node, root) {
      var tag = /^<([^\s>]+)/.exec(node)[1]
      var el = (root || doc).createElement(nodeMap[tag] || 'div'), els = [];
      el.innerHTML = node;
      var nodes = el.childNodes;
      el = el.firstChild;
      els.push(el);
      while (el = el.nextSibling) {
        (el.nodeType == 1) && els.push(el);
      }
      return els;
    }
    $._select = function (s, r) {
      return /^\s*</.test(s) ? create(s, r) : q(s, r);
    };
    $.pseudos = q.pseudos;
    $.ender({
      find: function (s) {
        var r = [], i, l, j, k, els;
        for (i = 0, l = this.length; i < l; i++) {
          els = q(s, this[i]);
          for (j = 0, k = els.length; j < k; j++) {
            r.push(els[j]);
          }
        }
        return $(q.uniq(r));
      }
      , and: function (s) {
        var plus = $(s);
        for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
          this[i] = plus[j];
        }
        return this;
      }
    }, true);
  }(document);

}();

!function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * bean.js - copyright Jacob Thornton 2011
    * https://github.com/fat/bean
    * MIT License
    * special thanks to:
    * dean edwards: http://dean.edwards.name/
    * dperini: https://github.com/dperini/nwevents
    * the entire mootools team: github.com/mootools/mootools-core
    */
  !function (context) {
    var __uid = 1, registry = {}, collected = {},
        overOut = /over|out/,
        namespace = /[^\.]*(?=\..*)\.|.*/,
        stripName = /\..*/,
        addEvent = 'addEventListener',
        attachEvent = 'attachEvent',
        removeEvent = 'removeEventListener',
        detachEvent = 'detachEvent',
        doc = context.document || {},
        root = doc.documentElement || {},
        W3C_MODEL = root[addEvent],
        eventSupport = W3C_MODEL ? addEvent : attachEvent,
  
    isDescendant = function (parent, child) {
      var node = child.parentNode;
      while (node !== null) {
        if (node == parent) {
          return true;
        }
        node = node.parentNode;
      }
    },
  
    retrieveUid = function (obj, uid) {
      return (obj.__uid = uid || obj.__uid || __uid++);
    },
  
    retrieveEvents = function (element) {
      var uid = retrieveUid(element);
      return (registry[uid] = registry[uid] || {});
    },
  
    listener = W3C_MODEL ? function (element, type, fn, add) {
      element[add ? addEvent : removeEvent](type, fn, false);
    } : function (element, type, fn, add, custom) {
      custom && add && (element['_on' + custom] = element['_on' + custom] || 0);
      element[add ? attachEvent : detachEvent]('on' + type, fn);
    },
  
    nativeHandler = function (element, fn, args) {
      return function (event) {
        event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || context).event);
        return fn.apply(element, [event].concat(args));
      };
    },
  
    customHandler = function (element, fn, type, condition, args) {
      return function (e) {
        if (condition ? condition.apply(this, arguments) : W3C_MODEL ? true : e && e.propertyName == '_on' + type || !e) {
          fn.apply(element, Array.prototype.slice.call(arguments, e ? 0 : 1).concat(args));
        }
      };
    },
  
    addListener = function (element, orgType, fn, args) {
      var type = orgType.replace(stripName, ''),
          events = retrieveEvents(element),
          handlers = events[type] || (events[type] = {}),
          originalFn = fn,
          uid = retrieveUid(fn, orgType.replace(namespace, ''));
      if (handlers[uid]) {
        return element;
      }
      var custom = customEvents[type];
      if (custom) {
        fn = custom.condition ? customHandler(element, fn, type, custom.condition) : fn;
        type = custom.base || type;
      }
      var isNative = nativeEvents[type];
      fn = isNative ? nativeHandler(element, fn, args) : customHandler(element, fn, type, false, args);
      isNative = W3C_MODEL || isNative;
      if (type == 'unload') {
        var org = fn;
        fn = function () {
          removeListener(element, type, fn) && org();
        };
      }
      element[eventSupport] && listener(element, isNative ? type : 'propertychange', fn, true, !isNative && type);
      handlers[uid] = fn;
      fn.__uid = uid;
      fn.__originalFn = originalFn;
      return type == 'unload' ? element : (collected[retrieveUid(element)] = element);
    },
  
    removeListener = function (element, orgType, handler) {
      var uid, names, uids, i, events = retrieveEvents(element), type = orgType.replace(stripName, '');
      if (!events || !events[type]) {
        return element;
      }
      names = orgType.replace(namespace, '');
      uids = names ? names.split('.') : [handler.__uid];
  
      function destroyHandler(uid) {
        handler = events[type][uid];
        if (!handler) return;
        delete events[type][uid];
        if (element[eventSupport]) {
          type = customEvents[type] ? customEvents[type].base : type;
          var isNative = W3C_MODEL || nativeEvents[type];
          listener(element, isNative ? type : 'propertychange', handler, false, !isNative && type);
        }
      }
  
      destroyHandler(names) //get combos
      for (i = uids.length; i--; destroyHandler(uids[i])); //get singles
  
      return element;
    },
  
    del = function (selector, fn, $) {
      return function (e) {
        var array = typeof selector == 'string' ? $(selector, this) : selector;
        for (var target = e.target; target && target != this; target = target.parentNode) {
          for (var i = array.length; i--;) {
            if (array[i] == target) {
              return fn.apply(target, arguments);
            }
          }
        }
      };
    },
  
    add = function (element, events, fn, delfn, $) {
      if (typeof events == 'object' && !fn) {
        for (var type in events) {
          events.hasOwnProperty(type) && add(element, type, events[type]);
        }
      } else {
        var isDel = typeof fn == 'string', types = (isDel ? fn : events).split(' ');
        fn = isDel ? del(events, delfn, $) : fn;
        for (var i = types.length; i--;) {
          addListener(element, types[i], fn, Array.prototype.slice.call(arguments, isDel ? 4 : 3));
        }
      }
      return element;
    },
  
    remove = function (element, orgEvents, fn) {
      var k, type, events, i,
          isString = typeof(orgEvents) == 'string',
          names = isString && orgEvents.replace(namespace, ''),
          rm = removeListener,
          attached = retrieveEvents(element);
      if (isString && /\s/.test(orgEvents)) {
        orgEvents = orgEvents.split(' ');
        i = orgEvents.length - 1;
        while (remove(element, orgEvents[i]) && i--) {}
        return element;
      }
      events = isString ? orgEvents.replace(stripName, '') : orgEvents;
      if (!attached || (isString && !attached[events])) {
        if (attached && names) {
          for (k in attached) {
            if (attached.hasOwnProperty(k)) {
              for (i in attached[k]) {
                attached[k].hasOwnProperty(i) && new RegExp('^' + names + '(\\..*)?$').test(i) && rm(element, [k, i].join('.'));
              }
            }
          }
        }
        return element;
      }
      if (typeof fn == 'function') {
        rm(element, events, fn);
      } else if (names) {
        rm(element, orgEvents);
      } else {
        rm = events ? rm : remove;
        type = isString && events;
        events = events ? (fn || attached[events] || events) : attached;
        for (k in events) {
          if (events.hasOwnProperty(k)) {
            rm(element, type || k, events[k]);
            delete events[k]; // remove unused leaf keys
          }
        }
      }
      return element;
    },
  
    fire = function (element, type, args) {
      var evt, k, i, types = type.split(' ');
      for (i = types.length; i--;) {
        type = types[i].replace(stripName, '');
        var isNative = nativeEvents[type],
            isNamespace = types[i].replace(namespace, ''),
            handlers = retrieveEvents(element)[type];
        if (isNamespace) {
          isNamespace = isNamespace.split('.');
          for (k = isNamespace.length; k--;) {
            handlers && handlers[isNamespace[k]] && handlers[isNamespace[k]].apply(element, [false].concat(args));
          }
        } else if (!args && element[eventSupport]) {
          fireListener(isNative, type, element);
        } else {
          for (k in handlers) {
            handlers.hasOwnProperty(k) && handlers[k].apply(element, [false].concat(args));
          }
        }
      }
      return element;
    },
  
    fireListener = W3C_MODEL ? function (isNative, type, element) {
      evt = document.createEvent(isNative ? "HTMLEvents" : "UIEvents");
      evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, context, 1);
      element.dispatchEvent(evt);
    } : function (isNative, type, element) {
      isNative ? element.fireEvent('on' + type, document.createEventObject()) : element['_on' + type]++;
    },
  
    clone = function (element, from, type) {
      var events = retrieveEvents(from), obj, k;
      var uid = retrieveUid(element);
      obj = type ? events[type] : events;
      for (k in obj) {
        obj.hasOwnProperty(k) && (type ? add : clone)(element, type || from, type ? obj[k].__originalFn : k);
      }
      return element;
    },
  
    fixEvent = function (e) {
      var result = {};
      if (!e) {
        return result;
      }
      var type = e.type, target = e.target || e.srcElement;
      result.preventDefault = fixEvent.preventDefault(e);
      result.stopPropagation = fixEvent.stopPropagation(e);
      result.target = target && target.nodeType == 3 ? target.parentNode : target;
      if (~type.indexOf('key')) {
        result.keyCode = e.which || e.keyCode;
      } else if ((/click|mouse|menu/i).test(type)) {
        result.rightClick = e.which == 3 || e.button == 2;
        result.pos = { x: 0, y: 0 };
        if (e.pageX || e.pageY) {
          result.clientX = e.pageX;
          result.clientY = e.pageY;
        } else if (e.clientX || e.clientY) {
          result.clientX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
          result.clientY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        overOut.test(type) && (result.relatedTarget = e.relatedTarget || e[(type == 'mouseover' ? 'from' : 'to') + 'Element']);
      }
      for (var k in e) {
        if (!(k in result)) {
          result[k] = e[k];
        }
      }
      return result;
    };
  
    fixEvent.preventDefault = function (e) {
      return function () {
        if (e.preventDefault) {
          e.preventDefault();
        }
        else {
          e.returnValue = false;
        }
      };
    };
  
    fixEvent.stopPropagation = function (e) {
      return function () {
        if (e.stopPropagation) {
          e.stopPropagation();
        } else {
          e.cancelBubble = true;
        }
      };
    };
  
    var nativeEvents = { click: 1, dblclick: 1, mouseup: 1, mousedown: 1, contextmenu: 1, //mouse buttons
      mousewheel: 1, DOMMouseScroll: 1, //mouse wheel
      mouseover: 1, mouseout: 1, mousemove: 1, selectstart: 1, selectend: 1, //mouse movement
      keydown: 1, keypress: 1, keyup: 1, //keyboard
      orientationchange: 1, // mobile
      touchstart: 1, touchmove: 1, touchend: 1, touchcancel: 1, // touch
      gesturestart: 1, gesturechange: 1, gestureend: 1, // gesture
      focus: 1, blur: 1, change: 1, reset: 1, select: 1, submit: 1, //form elements
      load: 1, unload: 1, beforeunload: 1, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
      error: 1, abort: 1, scroll: 1 }; //misc
  
    function check(event) {
      var related = event.relatedTarget;
      if (!related) {
        return related === null;
      }
      return (related != this && related.prefix != 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related));
    }
  
    var customEvents = {
      mouseenter: { base: 'mouseover', condition: check },
      mouseleave: { base: 'mouseout', condition: check },
      mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
    };
  
    var bean = { add: add, remove: remove, clone: clone, fire: fire };
  
    var clean = function (el) {
      var uid = remove(el).__uid;
      if (uid) {
        delete collected[uid];
        delete registry[uid];
      }
    };
  
    if (context[attachEvent]) {
      add(context, 'unload', function () {
        for (var k in collected) {
          collected.hasOwnProperty(k) && clean(collected[k]);
        }
        context.CollectGarbage && CollectGarbage();
      });
    }
  
    var oldBean = context.bean;
    bean.noConflict = function () {
      context.bean = oldBean;
      return this;
    };
  
    (typeof module !== 'undefined' && module.exports) ?
      (module.exports = bean) :
      (context['bean'] = bean);
  
  }(this);

  provide("bean", module.exports);

  !function ($) {
    var b = require('bean'),
        integrate = function (method, type, method2) {
          var _args = type ? [type] : [];
          return function () {
            for (var args, i = 0, l = this.length; i < l; i++) {
              args = [this[i]].concat(_args, Array.prototype.slice.call(arguments, 0));
              args.length == 4 && args.push($);
              !arguments.length && method == 'add' && type && (method = 'fire');
              b[method].apply(this, args);
            }
            return this;
          };
        };
  
    var add = integrate('add'),
        remove = integrate('remove'),
        fire = integrate('fire');
  
    var methods = {
  
      on: add,
      addListener: add,
      bind: add,
      listen: add,
      delegate: add,
  
      unbind: remove,
      unlisten: remove,
      removeListener: remove,
      undelegate: remove,
  
      emit: fire,
      trigger: fire,
  
      cloneEvents: integrate('clone'),
  
      hover: function (enter, leave, i) { // i for internal
        for (i = this.length; i--;) {
          b.add.call(this, this[i], 'mouseenter', enter);
          b.add.call(this, this[i], 'mouseleave', leave);
        }
        return this;
      }
    };
  
    var i, shortcuts = [
      'blur', 'change', 'click', 'dblclick', 'error', 'focus', 'focusin',
      'focusout', 'keydown', 'keypress', 'keyup', 'load', 'mousedown',
      'mouseenter', 'mouseleave', 'mouseout', 'mouseover', 'mouseup', 'mousemove',
      'resize', 'scroll', 'select', 'submit', 'unload'
    ];
  
    for (i = shortcuts.length; i--;) {
      methods[shortcuts[i]] = integrate('add', shortcuts[i]);
    }
  
    $.ender(methods, true);
  }(ender);

}();

!function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * bonzo.js - copyright @dedfat 2011
    * https://github.com/ded/bonzo
    * Follow our software http://twitter.com/dedfat
    * MIT License
    */
  !function (context, win) {
  
    var doc = context.document,
        html = doc.documentElement,
        parentNode = 'parentNode',
        query = null,
        specialAttributes = /^checked|value|selected$/,
        specialTags = /select|fieldset|table|tbody|tfoot|td|tr|colgroup/i,
        table = 'table',
        tagMap = { thead: table, tbody: table, tfoot: table, tr: 'tbody', th: 'tr', td: 'tr', fieldset: 'form', option: 'select' },
        stateAttributes = /^checked|selected$/,
        ie = /msie/i.test(navigator.userAgent),
        uidList = [],
        uuids = 0,
        digit = /^-?[\d\.]+$/,
        px = 'px',
        // commonly used methods
        setAttribute = 'setAttribute',
        getAttribute = 'getAttribute',
        trimReplace = /(^\s*|\s*$)/g,
        unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1 };
  
    function classReg(c) {
      return new RegExp("(^|\\s+)" + c + "(\\s+|$)");
    }
  
    function each(ar, fn, scope) {
      for (var i = 0, l = ar.length; i < l; i++) {
        fn.call(scope || ar[i], ar[i], i, ar);
      }
      return ar;
    }
  
    var trim = String.prototype.trim ?
      function (s) {
        return s.trim();
      } :
      function (s) {
        return s.replace(trimReplace, '');
      };
  
    function camelize(s) {
      return s.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase();
      });
    }
  
    function is(node) {
      return node && node.nodeName && node.nodeType == 1;
    }
  
    function some(ar, fn, scope) {
      for (var i = 0, j = ar.length; i < j; ++i) {
        if (fn.call(scope, ar[i], i, ar)) {
          return true;
        }
      }
      return false;
    }
  
    var getStyle = doc.defaultView && doc.defaultView.getComputedStyle ?
      function (el, property) {
        var value = null;
        if (property == 'float') {
          property = 'cssFloat';
        }
        var computed = doc.defaultView.getComputedStyle(el, '');
        computed && (value = computed[camelize(property)]);
        return el.style[property] || value;
  
      } : (ie && html.currentStyle) ?
  
      function (el, property) {
        property = camelize(property);
        property = property == 'float' ? 'styleFloat' : property;
  
        if (property == 'opacity') {
          var val = 100;
          try {
            val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;
          } catch (e1) {
            try {
              val = el.filters('alpha').opacity;
            } catch (e2) {}
          }
          return val / 100;
        }
        var value = el.currentStyle ? el.currentStyle[property] : null;
        return el.style[property] || value;
      } :
  
      function (el, property) {
        return el.style[camelize(property)];
      };
  
    function insert(target, host, fn) {
      var i = 0, self = host || this, r = [],
          nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? function (n) {
            return (n = query(target)) && (n.selected = 1) && n;
          }() : target;
      each(normalize(nodes), function (t) {
        each(self, function (el) {
          var n = !el[parentNode] || (el[parentNode] && !el[parentNode][parentNode]) ?
                    function () {
                      var c = el.cloneNode(true);
                      self.$ && self.cloneEvents && self.$(c).cloneEvents(el);
                      return c;
                    }() :
                    el;
          fn(t, n);
          r[i] = n;
          i++;
        });
      }, this);
      each(r, function (e, i) {
        self[i] = e;
      });
      self.length = i;
      return self;
    }
  
    function xy(el, x, y) {
      var $el = bonzo(el),
          style = $el.css('position'),
          offset = $el.offset(),
          rel = 'relative',
          isRel = style == rel,
          delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)];
  
      if (style == 'static') {
        $el.css('position', rel);
        style = rel;
      }
  
      isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft);
      isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop);
  
      x !== null && (el.style.left = x - offset.left + delta[0] + px);
      y !== null && (el.style.top = y - offset.top + delta[1] + px);
  
    }
  
    function Bonzo(elements) {
      this.length = 0;
      if (elements) {
        elements = typeof elements !== 'string' &&
          !elements.nodeType &&
          typeof elements.length !== 'undefined' ?
            elements :
            [elements];
        this.length = elements.length;
        for (var i = 0; i < elements.length; i++) {
          this[i] = elements[i];
        }
      }
    }
  
    Bonzo.prototype = {
  
      get: function (index) {
        return this[index];
      },
  
      each: function (fn, scope) {
        return each(this, fn, scope);
      },
  
      map: function (fn, reject) {
        var m = [], n, i;
        for (i = 0; i < this.length; i++) {
          n = fn.call(this, this[i], i);
          reject ? (reject(n) && m.push(n)) : m.push(n);
        }
        return m;
      },
  
      first: function () {
        return bonzo(this[0]);
      },
  
      last: function () {
        return bonzo(this[this.length - 1]);
      },
  
      html: function (h, text) {
        var method = text ?
          html.textContent == null ?
            'innerText' :
            'textContent' :
          'innerHTML', m;
        function append(el) {
          while (el.firstChild) {
            el.removeChild(el.firstChild);
          }
          each(normalize(h), function (node) {
            el.appendChild(node);
          });
        }
        return typeof h !== 'undefined' ?
            this.each(function (el) {
              (m = el.tagName.match(specialTags)) ?
                append(el, m[0]) :
                (el[method] = h);
            }) :
          this[0] ? this[0][method] : '';
      },
  
      text: function (text) {
        return this.html(text, 1);
      },
  
      addClass: function (c) {
        return this.each(function (el) {
          this.hasClass(el, c) || (el.className = trim(el.className + ' ' + c));
        }, this);
      },
  
      removeClass: function (c) {
        return this.each(function (el) {
          this.hasClass(el, c) && (el.className = trim(el.className.replace(classReg(c), ' ')));
        }, this);
      },
  
      hasClass: function (el, c) {
        return typeof c == 'undefined' ?
          some(this, function (i) {
            return classReg(el).test(i.className);
          }) :
          classReg(c).test(el.className);
      },
  
      toggleClass: function (c, condition) {
        if (typeof condition !== 'undefined' && !condition) {
          return this;
        }
        return this.each(function (el) {
          this.hasClass(el, c) ?
            (el.className = trim(el.className.replace(classReg(c), ' '))) :
            (el.className = trim(el.className + ' ' + c));
        }, this);
      },
  
      show: function (type) {
        return this.each(function (el) {
          el.style.display = type || '';
        });
      },
  
      hide: function (elements) {
        return this.each(function (el) {
          el.style.display = 'none';
        });
      },
  
      append: function (node) {
        return this.each(function (el) {
          each(normalize(node), function (i) {
            el.appendChild(i);
          });
        });
      },
  
      prepend: function (node) {
        return this.each(function (el) {
          var first = el.firstChild;
          each(normalize(node), function (i) {
            el.insertBefore(i, first);
          });
        });
      },
  
      appendTo: function (target, host) {
        return insert.call(this, target, host, function (t, el) {
          t.appendChild(el);
        });
      },
  
      prependTo: function (target, host) {
        return insert.call(this, target, host, function (t, el) {
          t.insertBefore(el, t.firstChild);
        });
      },
  
      next: function () {
        return this.related('nextSibling');
      },
  
      previous: function () {
        return this.related('previousSibling');
      },
  
      related: function (method) {
        return this.map(
          function (el) {
            el = el[method];
            while (el && el.nodeType !== 1) {
              el = el[method];
            }
            return el || 0;
          },
          function (el) {
            return el;
          }
        );
      },
  
      before: function (node) {
        return this.each(function (el) {
          each(bonzo.create(node), function (i) {
            el[parentNode].insertBefore(i, el);
          });
        });
      },
  
      after: function (node) {
        return this.each(function (el) {
          each(bonzo.create(node), function (i) {
            el[parentNode].insertBefore(i, el.nextSibling);
          });
        });
      },
  
      insertBefore: function (target, host) {
        return insert.call(this, target, host, function (t, el) {
          t[parentNode].insertBefore(el, t);
        });
      },
  
      insertAfter: function (target, host) {
        return insert.call(this, target, host, function (t, el) {
          var sibling = t.nextSibling;
          if (sibling) {
            t[parentNode].insertBefore(el, sibling);
          }
          else {
            t[parentNode].appendChild(el);
          }
        });
      },
  
      css: function (o, v, p) {
        // is this a request for just getting a style?
        if (v === undefined && typeof o == 'string') {
          // repurpose 'v'
          v = this[0];
          if (!v) {
            return null;
          }
          if (v == doc || v == win) {
            p = (v == doc) ? bonzo.doc() : bonzo.viewport();
            return o == 'width' ? p.width :
              o == 'height' ? p.height : '';
          }
          return getStyle(v, o);
        }
        var iter = o;
        if (typeof o == 'string') {
          iter = {};
          iter[o] = v;
        }
  
        if (ie && iter.opacity) {
          // oh this 'ol gamut
          iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')';
          // give it layout
          iter.zoom = o.zoom || 1;
          delete iter.opacity;
        }
  
        if (v = iter['float']) {
          // float is a reserved style word. w3 uses cssFloat, ie uses styleFloat
          ie ? (iter.styleFloat = v) : (iter.cssFloat = v);
          delete iter['float'];
        }
  
        var fn = function (el, p, v) {
          for (var k in iter) {
            if (iter.hasOwnProperty(k)) {
              v = iter[k];
              // change "5" to "5px" - unless you're line-height, which is allowed
              (p = camelize(k)) && digit.test(v) && !(p in unitless) && (v += px);
              el.style[p] = v;
            }
          }
        };
        return this.each(fn);
      },
  
      offset: function (x, y) {
        if (typeof x == 'number' || typeof y == 'number') {
          return this.each(function (el) {
            xy(el, x, y);
          });
        }
        var el = this[0],
            width = el.offsetWidth,
            height = el.offsetHeight,
            top = el.offsetTop,
            left = el.offsetLeft;
        while (el = el.offsetParent) {
          top = top + el.offsetTop;
          left = left + el.offsetLeft;
        }
  
        return {
          top: top,
          left: left,
          height: height,
          width: width
        };
      },
  
      attr: function (k, v) {
        var el = this[0];
        if (typeof k != 'string' && !(k instanceof String)) {
          for (var n in k) {
            k.hasOwnProperty(n) && this.attr(n, k[n]);
          }
          return this;
        }
        return typeof v == 'undefined' ?
          specialAttributes.test(k) ?
            stateAttributes.test(k) && typeof el[k] == 'string' ?
              true : el[k] : el[getAttribute](k) :
          this.each(function (el) {
            k == 'value' ? (el.value = v) : el[setAttribute](k, v);
          });
      },
  
      val: function (s) {
        return (typeof s == 'string') ? this.attr('value', s) : this[0].value;
      },
  
      removeAttr: function (k) {
        return this.each(function (el) {
          el.removeAttribute(k);
        });
      },
  
      data: function (k, v) {
        var el = this[0];
        if (typeof v === 'undefined') {
          el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids);
          var uid = el[getAttribute]('data-node-uid');
          uidList[uid] || (uidList[uid] = {});
          return uidList[uid][k];
        } else {
          return this.each(function (el) {
            el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids);
            var uid = el[getAttribute]('data-node-uid');
            var o = {};
            o[k] = v;
            uidList[uid] = o;
          });
        }
      },
  
      remove: function () {
        return this.each(function (el) {
          el[parentNode] && el[parentNode].removeChild(el);
        });
      },
  
      empty: function () {
        return this.each(function (el) {
          while (el.firstChild) {
            el.removeChild(el.firstChild);
          }
        });
      },
  
      detach: function () {
        return this.map(function (el) {
          return el[parentNode].removeChild(el);
        });
      },
  
      scrollTop: function (y) {
        return scroll.call(this, null, y, 'y');
      },
  
      scrollLeft: function (x) {
        return scroll.call(this, x, null, 'x');
      }
    };
  
    function normalize(node) {
      return typeof node == 'string' ? bonzo.create(node) : is(node) ? [node] : node; // assume [nodes]
    }
  
    function scroll(x, y, type) {
      var el = this[0];
      if (x == null && y == null) {
        return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type];
      }
      if (isBody(el)) {
        win.scrollTo(x, y);
      } else {
        x != null && (el.scrollLeft = x);
        y != null && (el.scrollTop = y);
      }
      return this;
    }
  
    function isBody(element) {
      return element === win || (/^(?:body|html)$/i).test(element.tagName);
    }
  
    function getWindowScroll() {
      return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop };
    }
  
    function bonzo(els, host) {
      return new Bonzo(els, host);
    }
  
    bonzo.setQueryEngine = function (q) {
      query = q;
      delete bonzo.setQueryEngine;
    };
  
    bonzo.aug = function (o, target) {
      for (var k in o) {
        o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k]);
      }
    };
  
    bonzo.create = function (node) {
      return typeof node == 'string' ?
        function () {
          var tag = /^<([^\s>]+)/.exec(node);
          var el = doc.createElement(tag && tagMap[tag[1].toLowerCase()] || 'div'), els = [];
          el.innerHTML = node;
          var nodes = el.childNodes;
          el = el.firstChild;
          els.push(el);
          while (el = el.nextSibling) {
            (el.nodeType == 1) && els.push(el);
          }
          return els;
  
        }() : is(node) ? [node.cloneNode(true)] : [];
    };
  
    bonzo.doc = function () {
      var vp = this.viewport();
      return {
        width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width),
        height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
      };
    };
  
    bonzo.firstChild = function (el) {
      for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
        if (c[i].nodeType === 1) {
          e = c[j = i];
        }
      }
      return e;
    };
  
    bonzo.viewport = function () {
      return {
        width: ie ? html.clientWidth : self.innerWidth,
        height: ie ? html.clientHeight : self.innerHeight
      };
    };
  
    bonzo.isAncestor = 'compareDocumentPosition' in html ?
      function (container, element) {
        return (container.compareDocumentPosition(element) & 16) == 16;
      } : 'contains' in html ?
      function (container, element) {
        return container !== element && container.contains(element);
      } :
      function (container, element) {
        while (element = element[parentNode]) {
          if (element === container) {
            return true;
          }
        }
        return false;
      };
  
    var old = context.bonzo;
    bonzo.noConflict = function () {
      context.bonzo = old;
      return this;
    };
    context['bonzo'] = bonzo;
  
  }(this, window);
  

  provide("bonzo", module.exports);

  !function ($) {
  
    var b = bonzo;
    b.setQueryEngine($);
    $.ender(b);
    $.ender(b(), true);
    $.ender({
      create: function (node) {
        return $(b.create(node));
      }
    });
  
    $.id = function (id) {
      return $([document.getElementById(id)]);
    };
  
    function indexOf(ar, val) {
      for (var i = 0; i < ar.length; i++) {
        if (ar[i] === val) {
          return i;
        }
      }
      return -1;
    }
  
    function uniq(ar) {
      var a = [], i, j;
      label:
      for (i = 0; i < ar.length; i++) {
        for (j = 0; j < a.length; j++) {
          if (a[j] == ar[i]) {
            continue label;
          }
        }
        a[a.length] = ar[i];
      }
      return a;
    }
  
    $.ender({
      parents: function (selector, closest) {
        var collection = $(selector), j, k, p, r = [];
        for (j = 0, k = this.length; j < k; j++) {
          p = this[j];
          while (p = p.parentNode) {
            if (indexOf(collection, p) !== -1) {
              r.push(p);
              if (closest) break;
            }
          }
        }
        return $(uniq(r));
      },
  
      closest: function (selector) {
        return this.parents(selector, true);
      },
  
      first: function () {
        return $(this[0]);
      },
  
      last: function () {
        return $(this[this.length - 1]);
      },
  
      next: function () {
        return $(b(this).next());
      },
  
      previous: function () {
        return $(b(this).previous());
      },
  
      appendTo: function (t) {
        return b(this.selector).appendTo(t, this);
      },
  
      prependTo: function (t) {
        return b(this.selector).prependTo(t, this);
      },
  
      insertAfter: function (t) {
        return b(this.selector).insertAfter(t, this);
      },
  
      insertBefore: function (t) {
        return b(this.selector).insertBefore(t, this);
      },
  
      siblings: function () {
        var i, l, p, r = [];
        for (i = 0, l = this.length; i < l; i++) {
          p = this[i];
          while (p = p.previousSibling) {
            p.nodeType == 1 && r.push(p);
          }
          p = this[i];
          while (p = p.nextSibling) {
            p.nodeType == 1 && r.push(p);
          }
        }
        return $(r);
      },
  
      children: function () {
        var i, el, r = [];
        for (i = 0, l = this.length; i < l; i++) {
          if (!(el = b.firstChild(this[i]))) {
            continue;
          }
          r.push(el);
          while (el = el.nextSibling) {
            el.nodeType == 1 && r.push(el);
          }
        }
        return $(uniq(r));
      },
  
      height: function (v) {
        return dimension(v, this, 'height')
      },
  
      width: function (v) {
        return dimension(v, this, 'width')
      }
    }, true);
  
    function dimension(v, self, which) {
      return v ?
        self.css(which, v) :
        function (r) {
          r = parseInt(self.css(which), 10);
          return isNaN(r) ? self[0]['offset' + which.replace(/^\w/, function (m) {return m.toUpperCase()})] : r
        }()
    }
  
  }(ender || $);
  

}();
// Underscore.js 1.1.7
// (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
(function(){var p=this,C=p._,m={},i=Array.prototype,n=Object.prototype,f=i.slice,D=i.unshift,E=n.toString,l=n.hasOwnProperty,s=i.forEach,t=i.map,u=i.reduce,v=i.reduceRight,w=i.filter,x=i.every,y=i.some,o=i.indexOf,z=i.lastIndexOf;n=Array.isArray;var F=Object.keys,q=Function.prototype.bind,b=function(a){return new j(a)};typeof module!=="undefined"&&module.exports?(module.exports=b,b._=b):p._=b;b.VERSION="1.1.7";var h=b.each=b.forEach=function(a,c,b){if(a!=null)if(s&&a.forEach===s)a.forEach(c,b);else if(a.length===
+a.length)for(var e=0,k=a.length;e<k;e++){if(e in a&&c.call(b,a[e],e,a)===m)break}else for(e in a)if(l.call(a,e)&&c.call(b,a[e],e,a)===m)break};b.map=function(a,c,b){var e=[];if(a==null)return e;if(t&&a.map===t)return a.map(c,b);h(a,function(a,g,G){e[e.length]=c.call(b,a,g,G)});return e};b.reduce=b.foldl=b.inject=function(a,c,d,e){var k=d!==void 0;a==null&&(a=[]);if(u&&a.reduce===u)return e&&(c=b.bind(c,e)),k?a.reduce(c,d):a.reduce(c);h(a,function(a,b,f){k?d=c.call(e,d,a,b,f):(d=a,k=!0)});if(!k)throw new TypeError("Reduce of empty array with no initial value");
return d};b.reduceRight=b.foldr=function(a,c,d,e){a==null&&(a=[]);if(v&&a.reduceRight===v)return e&&(c=b.bind(c,e)),d!==void 0?a.reduceRight(c,d):a.reduceRight(c);a=(b.isArray(a)?a.slice():b.toArray(a)).reverse();return b.reduce(a,c,d,e)};b.find=b.detect=function(a,c,b){var e;A(a,function(a,g,f){if(c.call(b,a,g,f))return e=a,!0});return e};b.filter=b.select=function(a,c,b){var e=[];if(a==null)return e;if(w&&a.filter===w)return a.filter(c,b);h(a,function(a,g,f){c.call(b,a,g,f)&&(e[e.length]=a)});return e};
b.reject=function(a,c,b){var e=[];if(a==null)return e;h(a,function(a,g,f){c.call(b,a,g,f)||(e[e.length]=a)});return e};b.every=b.all=function(a,c,b){var e=!0;if(a==null)return e;if(x&&a.every===x)return a.every(c,b);h(a,function(a,g,f){if(!(e=e&&c.call(b,a,g,f)))return m});return e};var A=b.some=b.any=function(a,c,d){c=c||b.identity;var e=!1;if(a==null)return e;if(y&&a.some===y)return a.some(c,d);h(a,function(a,b,f){if(e|=c.call(d,a,b,f))return m});return!!e};b.include=b.contains=function(a,c){var b=
!1;if(a==null)return b;if(o&&a.indexOf===o)return a.indexOf(c)!=-1;A(a,function(a){if(b=a===c)return!0});return b};b.invoke=function(a,c){var d=f.call(arguments,2);return b.map(a,function(a){return(c.call?c||a:a[c]).apply(a,d)})};b.pluck=function(a,c){return b.map(a,function(a){return a[c]})};b.max=function(a,c,d){if(!c&&b.isArray(a))return Math.max.apply(Math,a);var e={computed:-Infinity};h(a,function(a,b,f){b=c?c.call(d,a,b,f):a;b>=e.computed&&(e={value:a,computed:b})});return e.value};b.min=function(a,
c,d){if(!c&&b.isArray(a))return Math.min.apply(Math,a);var e={computed:Infinity};h(a,function(a,b,f){b=c?c.call(d,a,b,f):a;b<e.computed&&(e={value:a,computed:b})});return e.value};b.sortBy=function(a,c,d){return b.pluck(b.map(a,function(a,b,f){return{value:a,criteria:c.call(d,a,b,f)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;return c<d?-1:c>d?1:0}),"value")};b.groupBy=function(a,b){var d={};h(a,function(a,f){var g=b(a,f);(d[g]||(d[g]=[])).push(a)});return d};b.sortedIndex=function(a,c,d){d||
(d=b.identity);for(var e=0,f=a.length;e<f;){var g=e+f>>1;d(a[g])<d(c)?e=g+1:f=g}return e};b.toArray=function(a){if(!a)return[];if(a.toArray)return a.toArray();if(b.isArray(a))return f.call(a);if(b.isArguments(a))return f.call(a);return b.values(a)};b.size=function(a){return b.toArray(a).length};b.first=b.head=function(a,b,d){return b!=null&&!d?f.call(a,0,b):a[0]};b.rest=b.tail=function(a,b,d){return f.call(a,b==null||d?1:b)};b.last=function(a){return a[a.length-1]};b.compact=function(a){return b.filter(a,
function(a){return!!a})};b.flatten=function(a){return b.reduce(a,function(a,d){if(b.isArray(d))return a.concat(b.flatten(d));a[a.length]=d;return a},[])};b.without=function(a){return b.difference(a,f.call(arguments,1))};b.uniq=b.unique=function(a,c){return b.reduce(a,function(a,e,f){if(0==f||(c===!0?b.last(a)!=e:!b.include(a,e)))a[a.length]=e;return a},[])};b.union=function(){return b.uniq(b.flatten(arguments))};b.intersection=b.intersect=function(a){var c=f.call(arguments,1);return b.filter(b.uniq(a),
function(a){return b.every(c,function(c){return b.indexOf(c,a)>=0})})};b.difference=function(a,c){return b.filter(a,function(a){return!b.include(c,a)})};b.zip=function(){for(var a=f.call(arguments),c=b.max(b.pluck(a,"length")),d=Array(c),e=0;e<c;e++)d[e]=b.pluck(a,""+e);return d};b.indexOf=function(a,c,d){if(a==null)return-1;var e;if(d)return d=b.sortedIndex(a,c),a[d]===c?d:-1;if(o&&a.indexOf===o)return a.indexOf(c);d=0;for(e=a.length;d<e;d++)if(a[d]===c)return d;return-1};b.lastIndexOf=function(a,
b){if(a==null)return-1;if(z&&a.lastIndexOf===z)return a.lastIndexOf(b);for(var d=a.length;d--;)if(a[d]===b)return d;return-1};b.range=function(a,b,d){arguments.length<=1&&(b=a||0,a=0);d=arguments[2]||1;for(var e=Math.max(Math.ceil((b-a)/d),0),f=0,g=Array(e);f<e;)g[f++]=a,a+=d;return g};b.bind=function(a,b){if(a.bind===q&&q)return q.apply(a,f.call(arguments,1));var d=f.call(arguments,2);return function(){return a.apply(b,d.concat(f.call(arguments)))}};b.bindAll=function(a){var c=f.call(arguments,1);
c.length==0&&(c=b.functions(a));h(c,function(c){a[c]=b.bind(a[c],a)});return a};b.memoize=function(a,c){var d={};c||(c=b.identity);return function(){var b=c.apply(this,arguments);return l.call(d,b)?d[b]:d[b]=a.apply(this,arguments)}};b.delay=function(a,b){var d=f.call(arguments,2);return setTimeout(function(){return a.apply(a,d)},b)};b.defer=function(a){return b.delay.apply(b,[a,1].concat(f.call(arguments,1)))};var B=function(a,b,d){var e;return function(){var f=this,g=arguments,h=function(){e=null;
a.apply(f,g)};d&&clearTimeout(e);if(d||!e)e=setTimeout(h,b)}};b.throttle=function(a,b){return B(a,b,!1)};b.debounce=function(a,b){return B(a,b,!0)};b.once=function(a){var b=!1,d;return function(){if(b)return d;b=!0;return d=a.apply(this,arguments)}};b.wrap=function(a,b){return function(){var d=[a].concat(f.call(arguments));return b.apply(this,d)}};b.compose=function(){var a=f.call(arguments);return function(){for(var b=f.call(arguments),d=a.length-1;d>=0;d--)b=[a[d].apply(this,b)];return b[0]}};b.after=
function(a,b){return function(){if(--a<1)return b.apply(this,arguments)}};b.keys=F||function(a){if(a!==Object(a))throw new TypeError("Invalid object");var b=[],d;for(d in a)l.call(a,d)&&(b[b.length]=d);return b};b.values=function(a){return b.map(a,b.identity)};b.functions=b.methods=function(a){var c=[],d;for(d in a)b.isFunction(a[d])&&c.push(d);return c.sort()};b.extend=function(a){h(f.call(arguments,1),function(b){for(var d in b)b[d]!==void 0&&(a[d]=b[d])});return a};b.defaults=function(a){h(f.call(arguments,
1),function(b){for(var d in b)a[d]==null&&(a[d]=b[d])});return a};b.clone=function(a){return b.isArray(a)?a.slice():b.extend({},a)};b.tap=function(a,b){b(a);return a};b.isEqual=function(a,c){if(a===c)return!0;var d=typeof a;if(d!=typeof c)return!1;if(a==c)return!0;if(!a&&c||a&&!c)return!1;if(a._chain)a=a._wrapped;if(c._chain)c=c._wrapped;if(a.isEqual)return a.isEqual(c);if(c.isEqual)return c.isEqual(a);if(b.isDate(a)&&b.isDate(c))return a.getTime()===c.getTime();if(b.isNaN(a)&&b.isNaN(c))return!1;
if(b.isRegExp(a)&&b.isRegExp(c))return a.source===c.source&&a.global===c.global&&a.ignoreCase===c.ignoreCase&&a.multiline===c.multiline;if(d!=="object")return!1;if(a.length&&a.length!==c.length)return!1;d=b.keys(a);var e=b.keys(c);if(d.length!=e.length)return!1;for(var f in a)if(!(f in c)||!b.isEqual(a[f],c[f]))return!1;return!0};b.isEmpty=function(a){if(b.isArray(a)||b.isString(a))return a.length===0;for(var c in a)if(l.call(a,c))return!1;return!0};b.isElement=function(a){return!!(a&&a.nodeType==
1)};b.isArray=n||function(a){return E.call(a)==="[object Array]"};b.isObject=function(a){return a===Object(a)};b.isArguments=function(a){return!(!a||!l.call(a,"callee"))};b.isFunction=function(a){return!(!a||!a.constructor||!a.call||!a.apply)};b.isString=function(a){return!!(a===""||a&&a.charCodeAt&&a.substr)};b.isNumber=function(a){return!!(a===0||a&&a.toExponential&&a.toFixed)};b.isNaN=function(a){return a!==a};b.isBoolean=function(a){return a===!0||a===!1};b.isDate=function(a){return!(!a||!a.getTimezoneOffset||
!a.setUTCFullYear)};b.isRegExp=function(a){return!(!a||!a.test||!a.exec||!(a.ignoreCase||a.ignoreCase===!1))};b.isNull=function(a){return a===null};b.isUndefined=function(a){return a===void 0};b.noConflict=function(){p._=C;return this};b.identity=function(a){return a};b.times=function(a,b,d){for(var e=0;e<a;e++)b.call(d,e)};b.mixin=function(a){h(b.functions(a),function(c){H(c,b[c]=a[c])})};var I=0;b.uniqueId=function(a){var b=I++;return a?a+b:b};b.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g};
b.template=function(a,c){var d=b.templateSettings;d="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+a.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(d.interpolate,function(a,b){return"',"+b.replace(/\\'/g,"'")+",'"}).replace(d.evaluate||null,function(a,b){return"');"+b.replace(/\\'/g,"'").replace(/[\r\n\t]/g," ")+"__p.push('"}).replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');";d=new Function("obj",d);return c?d(c):d};
var j=function(a){this._wrapped=a};b.prototype=j.prototype;var r=function(a,c){return c?b(a).chain():a},H=function(a,c){j.prototype[a]=function(){var a=f.call(arguments);D.call(a,this._wrapped);return r(c.apply(b,a),this._chain)}};b.mixin(b);h(["pop","push","reverse","shift","sort","splice","unshift"],function(a){var b=i[a];j.prototype[a]=function(){b.apply(this._wrapped,arguments);return r(this._wrapped,this._chain)}});h(["concat","join","slice"],function(a){var b=i[a];j.prototype[a]=function(){return r(b.apply(this._wrapped,
arguments),this._chain)}});j.prototype.chain=function(){this._chain=!0;return this};j.prototype.value=function(){return this._wrapped}})();
function toolbit(options) {
    this._currentTooltip = undefined;
    options = options || {};
    if (options.animationOut) this.animationOut = options.animationOut;
    if (options.animationIn) this.animationIn = options.animationIn;
};

// Helper function to determine whether a given element is a wax popup.
toolbit.prototype.isPopup = function(el) {
    return el && el.className.indexOf('wax-popup') !== -1;
};

// Get the active tooltip for a layer or create a new one if no tooltip exists.
// Hide any tooltips on layers underneath this one.
toolbit.prototype.getTooltip = function(feature, context) {
    var tooltip = document.createElement('div');
    tooltip.className = 'toolbit';
    tooltip.innerHTML = feature;
    context.appendChild(tooltip);
    return tooltip;
};

// Hide a given tooltip.
toolbit.prototype.hideTooltip = function(el) {
    if (!el) return;
    var event,
        remove = function() {
        if (this.parentNode) this.parentNode.removeChild(this);
    };

    if (el.style['-webkit-transition'] !== undefined && this.animationOut) {
        event = 'webkitTransitionEnd';
    } else if (el.style.MozTransition !== undefined && this.animationOut) {
        event = 'transitionend';
    }

    if (event) {
        // This code assumes that transform-supporting browsers
        // also support proper events. IE9 does both.
        el.addEventListener(event, remove, false);
        el.addEventListener('transitionend', remove, false);
        el.className += ' ' + this.animationOut;
    } else {
        if (el.parentNode) el.parentNode.removeChild(el);
    }
};

// Expand a tooltip to be a "popup". Suspends all other tooltips from being
// shown until this popup is closed or another popup is opened.
toolbit.prototype.click = function(feature, context) {
    // Hide any current tooltips.
    if (this._currentTooltip) {
        this.hideTooltip(this._currentTooltip);
        this._currentTooltip = undefined;
    }
};

// Show a tooltip.
toolbit.prototype.over = function(feature, context, i, evt) {
    if (!feature) return;
    context.style.cursor = 'pointer';

    if (this.isPopup(this._currentTooltip)) {
        return;
    } else {
        if (!evt.pageX) {
            evt.pageX = evt.clientX + document.body.scrollLeft;
            evt.pageY = evt.clientY + document.body.scrollTop;
        }
        this._currentTooltip = this.getTooltip(feature, context);
        this._currentTooltip.style.left = (evt.pageX - 400) + 'px';
        this._currentTooltip.style.top = evt.pageY + 'px';
    }
};


// Hide all tooltips on this layer and show the first hidden tooltip on the
// highest layer underneath if found.
toolbit.prototype.out = function(context) {
    context.style.cursor = 'default';

    if (this.isPopup(this._currentTooltip)) {
        return;
    } else if (this._currentTooltip) {
        this.hideTooltip(this._currentTooltip);
        this._currentTooltip = undefined;
    }
};

var SphericalMercator = (function(){

// Closures including constants and other precalculated values.
var cache = {},
    EPSLN = 1.0e-10,
    D2R = Math.PI / 180,
    R2D = 180 / Math.PI,
    // 900913 properties.
    A = 6378137,
    MAXEXTENT = 20037508.34;


// SphericalMercator constructor: precaches calculations
// for fast tile lookups.
function SphericalMercator(options) {
    options = options || {};
    this.size = options.size || 256;
    if (!cache[this.size]) {
        var size = this.size;
        var c = cache[this.size] = {};
        c.Bc = [];
        c.Cc = [];
        c.zc = [];
        c.Ac = [];
        for (var d = 0; d < 30; d++) {
            c.Bc.push(size / 360);
            c.Cc.push(size / (2 * Math.PI));
            c.zc.push(size / 2);
            c.Ac.push(size);
            size *= 2;
        }
    }
    this.Bc = cache[this.size].Bc;
    this.Cc = cache[this.size].Cc;
    this.zc = cache[this.size].zc;
    this.Ac = cache[this.size].Ac;
};

// Convert lon lat to screen pixel value
//
// - `ll` {Array} `[lon, lat]` array of geographic coordinates.
// - `zoom` {Number} zoom level.
SphericalMercator.prototype.px = function(ll, zoom) {
    var d = this.zc[zoom];
    var f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
    var x = Math.round(d + ll[0] * this.Bc[zoom]);
    var y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * (-this.Cc[zoom]));
    (x > this.Ac[zoom]) && (x = this.Ac[zoom]);
    (y > this.Ac[zoom]) && (y = this.Ac[zoom]);
    //(x < 0) && (x = 0);
    //(y < 0) && (y = 0);
    return [x, y];
};

// Convert screen pixel value to lon lat
//
// - `px` {Array} `[x, y]` array of geographic coordinates.
// - `zoom` {Number} zoom level.
SphericalMercator.prototype.ll = function(px, zoom) {
    var g = (px[1] - this.zc[zoom]) / (-this.Cc[zoom]);
    var lon = (px[0] - this.zc[zoom]) / this.Bc[zoom];
    var lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
    return [lon, lat];
};

// Convert tile xyz value to bbox of the form `[w, s, e, n]`
//
// - `x` {Number} x (longitude) number.
// - `y` {Number} y (latitude) number.
// - `zoom` {Number} zoom.
// - `tms_style` {Boolean} whether to compute using tms-style.
// - `srs` {String} projection for resulting bbox (WGS84|900913).
// - `return` {Array} bbox array of values in form `[w, s, e, n]`.
SphericalMercator.prototype.bbox = function(x, y, zoom, tms_style, srs) {
    // Convert xyz into bbox with srs WGS84
    if (tms_style) {
        y = (Math.pow(2, zoom) - 1) - y;
    }
    // Use +y to make sure it's a number to avoid inadvertent concatenation.
    var ll = [x * this.size, (+y + 1) * this.size]; // lower left
    // Use +x to make sure it's a number to avoid inadvertent concatenation.
    var ur = [(+x + 1) * this.size, y * this.size]; // upper right
    var bbox = this.ll(ll, zoom).concat(this.ll(ur, zoom));

    // If web mercator requested reproject to 900913.
    if (srs === '900913') {
        return this.convert(bbox, '900913');
    } else {
        return bbox;
    }
};

// Convert bbox to xyx bounds
//
// - `bbox` {Number} bbox in the form `[w, s, e, n]`.
// - `zoom` {Number} zoom.
// - `tms_style` {Boolean} whether to compute using tms-style.
// - `srs` {String} projection of input bbox (WGS84|900913).
// - `@return` {Object} XYZ bounds containing minX, maxX, minY, maxY properties.
SphericalMercator.prototype.xyz = function(bbox, zoom, tms_style, srs) {
    // If web mercator provided reproject to WGS84.
    if (srs === '900913') {
        bbox = this.convert(bbox, 'WGS84');
    }

    var ll = [bbox[0], bbox[1]]; // lower left
    var ur = [bbox[2], bbox[3]]; // upper right
    var px_ll = this.px(ll, zoom);
    var px_ur = this.px(ur, zoom);
    // Y = 0 for XYZ is the top hence minY uses px_ur[1].
    var bounds = {
        minX: Math.floor(px_ll[0] / this.size),
        minY: Math.floor(px_ur[1] / this.size),
        maxX: Math.floor((px_ur[0] - 1) / this.size),
        maxY: Math.floor((px_ll[1] - 1) / this.size)
    };
    if (tms_style) {
        var tms = {
            minY: (Math.pow(2, zoom) - 1) - bounds.maxY,
            maxY: (Math.pow(2, zoom) - 1) - bounds.minY
        };
        bounds.minY = tms.minY;
        bounds.maxY = tms.maxY;
    }
    return bounds;
};

// Convert projection of given bbox.
//
// - `bbox` {Number} bbox in the form `[w, s, e, n]`.
// - `to` {String} projection of output bbox (WGS84|900913). Input bbox
//   assumed to be the "other" projection.
// - `@return` {Object} bbox with reprojected coordinates.
SphericalMercator.prototype.convert = function(bbox, to) {
    if (to === '900913') {
        return this.forward(bbox.slice(0, 2)).concat(this.forward(bbox.slice(2,4)));
    } else {
        return this.inverse(bbox.slice(0, 2)).concat(this.inverse(bbox.slice(2,4)));
    }
};

// Convert lon/lat values to 900913 x/y.
SphericalMercator.prototype.forward = function(ll) {
    var xy = [
        A * ll[0] * D2R,
        A * Math.log(Math.tan((Math.PI*0.25) + (0.5 * ll[1] * D2R)))
    ];
    // if xy value is beyond maxextent (e.g. poles), return maxextent.
    (xy[0] > MAXEXTENT) && (xy[0] = MAXEXTENT);
    (xy[0] < -MAXEXTENT) && (xy[0] = -MAXEXTENT);
    (xy[1] > MAXEXTENT) && (xy[1] = MAXEXTENT);
    (xy[1] < -MAXEXTENT) && (xy[1] = -MAXEXTENT);
    return xy;
};

// Convert 900913 x/y values to lon/lat.
SphericalMercator.prototype.inverse = function(xy) {
    return [
        (xy[0] * R2D / A),
        ((Math.PI*0.5) - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D
    ];
};

return SphericalMercator;

})();

if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
    module.exports = exports = SphericalMercator;
}

/*
 * Modest Maps JS v0.18.4
 * http://modestmaps.com/
 *
 * Copyright (c) 2011 Stamen Design, All Rights Reserved.
 *
 * Open source under the BSD License.
 * http://creativecommons.org/licenses/BSD/
 *
 * Versioned using Semantic Versioning (v.major.minor.patch)
 * See CHANGELOG and http://semver.org/ for more details.
 * 
 */
if(!com){var com={};if(!com.modestmaps){com.modestmaps={}}}(function(a){a.extend=function(d,b){for(var c in b.prototype){if(typeof d.prototype[c]=="undefined"){d.prototype[c]=b.prototype[c]}}return d};a.getFrame=function(){return function(b){(window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(c){window.setTimeout(function(){c(+new Date())},10)})(b)}}();a.transformProperty=(function(d){if(!this.document){return}var c=document.documentElement.style;for(var b=0;b<d.length;b++){if(d[b] in c){return d[b]}}return false})(["transformProperty","WebkitTransform","OTransform","MozTransform","msTransform"]);a.matrixString=function(b){if(b.scale*b.width%1){b.scale+=(1-b.scale*b.width%1)/b.width}if(a._browser.webkit3d){return"matrix3d("+[(b.scale||"1"),"0,0,0,0",(b.scale||"1"),"0,0","0,0,1,0",(b.x+(((b.width*b.scale)-b.width)/2)).toFixed(4),(b.y+(((b.height*b.scale)-b.height)/2)).toFixed(4),0,1].join(",")+")"}else{var c=(a.transformProperty=="MozTransform")?"px":"";return"matrix("+[(b.scale||"1"),0,0,(b.scale||"1"),(b.x+(((b.width*b.scale)-b.width)/2))+c,(b.y+(((b.height*b.scale)-b.height)/2))+c].join(",")+")"}};a._browser=(function(b){return{webkit:("WebKitCSSMatrix" in b),webkit3d:("WebKitCSSMatrix" in b)&&("m11" in new WebKitCSSMatrix())}})(this);a.moveElement=function(d,b){if(a.transformProperty){var c=a.matrixString(b);if(d[a.transformProperty]!==c){d.style[a.transformProperty]=d[a.transformProperty]=c}}else{d.style.left=b.x+"px";d.style.top=b.y+"px";d.style.width=Math.ceil(b.width*b.scale)+"px";d.style.height=Math.ceil(b.height*b.scale)+"px"}};a.cancelEvent=function(b){b.cancelBubble=true;b.cancel=true;b.returnValue=false;if(b.stopPropagation){b.stopPropagation()}if(b.preventDefault){b.preventDefault()}return false};a.addEvent=function(d,c,b){if(d.attachEvent){d["e"+c+b]=b;d[c+b]=function(){d["e"+c+b](window.event)};d.attachEvent("on"+c,d[c+b])}else{d.addEventListener(c,b,false);if(c=="mousewheel"){d.addEventListener("DOMMouseScroll",b,false)}}};a.bind=function(d,e){var f=Array.prototype.slice;var c=Function.prototype.bind;if(d.bind===c&&c){return c.apply(d,f.call(arguments,1))}var b=f.call(arguments,2);return function(){return d.apply(e,b.concat(f.call(arguments)))}};a.removeEvent=function(d,c,b){if(d.detachEvent){d.detachEvent("on"+c,d[c+b]);d[c+b]=null}else{d.removeEventListener(c,b,false);if(c=="mousewheel"){d.removeEventListener("DOMMouseScroll",b,false)}}};a.getStyle=function(c,b){if(c.currentStyle){return c.currentStyle[b]}else{if(window.getComputedStyle){return document.defaultView.getComputedStyle(c,null).getPropertyValue(b)}}};a.Point=function(b,c){this.x=parseFloat(b);this.y=parseFloat(c)};a.Point.prototype={x:0,y:0,toString:function(){return"("+this.x.toFixed(3)+", "+this.y.toFixed(3)+")"}};a.Point.distance=function(e,d){var c=(d.x-e.x);var b=(d.y-e.y);return Math.sqrt(c*c+b*b)};a.Point.interpolate=function(f,e,d){var c=f.x+(e.x-f.x)*d;var b=f.y+(e.y-f.y)*d;return new a.Point(c,b)};a.Coordinate=function(d,b,c){this.row=d;this.column=b;this.zoom=c};a.Coordinate.prototype={row:0,column:0,zoom:0,toString:function(){return"("+this.row.toFixed(3)+", "+this.column.toFixed(3)+" @"+this.zoom.toFixed(3)+")"},toKey:function(){return[this.zoom,this.row,this.column].join(",")},copy:function(){return new a.Coordinate(this.row,this.column,this.zoom)},container:function(){return new a.Coordinate(Math.floor(this.row),Math.floor(this.column),Math.floor(this.zoom))},zoomTo:function(b){var c=Math.pow(2,b-this.zoom);return new a.Coordinate(this.row*c,this.column*c,b)},zoomBy:function(c){var b=Math.pow(2,c);return new a.Coordinate(this.row*b,this.column*b,this.zoom+c)},up:function(b){if(b===undefined){b=1}return new a.Coordinate(this.row-b,this.column,this.zoom)},right:function(b){if(b===undefined){b=1}return new a.Coordinate(this.row,this.column+b,this.zoom)},down:function(b){if(b===undefined){b=1}return new a.Coordinate(this.row+b,this.column,this.zoom)},left:function(b){if(b===undefined){b=1}return new a.Coordinate(this.row,this.column-b,this.zoom)}};a.Location=function(b,c){this.lat=parseFloat(b);this.lon=parseFloat(c)};a.Location.prototype={lat:0,lon:0,toString:function(){return"("+this.lat.toFixed(3)+", "+this.lon.toFixed(3)+")"}};a.Location.distance=function(i,h,b){if(!b){b=6378000}var o=Math.PI/180,g=i.lat*o,n=i.lon*o,f=h.lat*o,m=h.lon*o,l=Math.cos(g)*Math.cos(n)*Math.cos(f)*Math.cos(m),k=Math.cos(g)*Math.sin(n)*Math.cos(f)*Math.sin(m),j=Math.sin(g)*Math.sin(f);return Math.acos(l+k+j)*b};a.Location.interpolate=function(i,g,m){if(i.lat===g.lat&&i.lon===g.lon){return new a.Location(i.lat,i.lon)}var s=Math.PI/180,k=i.lat*s,n=i.lon*s,j=g.lat*s,l=g.lon*s;var o=2*Math.asin(Math.sqrt(Math.pow(Math.sin((k-j)/2),2)+Math.cos(k)*Math.cos(j)*Math.pow(Math.sin((n-l)/2),2)));var t=Math.atan2(Math.sin(n-l)*Math.cos(j),Math.cos(k)*Math.sin(j)-Math.sin(k)*Math.cos(j)*Math.cos(n-l))/-(Math.PI/180);t=t<0?360+t:t;var e=Math.sin((1-m)*o)/Math.sin(o);var b=Math.sin(m*o)/Math.sin(o);var r=e*Math.cos(k)*Math.cos(n)+b*Math.cos(j)*Math.cos(l);var q=e*Math.cos(k)*Math.sin(n)+b*Math.cos(j)*Math.sin(l);var p=e*Math.sin(k)+b*Math.sin(j);var c=Math.atan2(p,Math.sqrt(Math.pow(r,2)+Math.pow(q,2)));var h=Math.atan2(q,r);return new a.Location(c/s,h/s)};a.Transformation=function(d,f,b,c,e,g){this.ax=d;this.bx=f;this.cx=b;this.ay=c;this.by=e;this.cy=g};a.Transformation.prototype={ax:0,bx:0,cx:0,ay:0,by:0,cy:0,transform:function(b){return new a.Point(this.ax*b.x+this.bx*b.y+this.cx,this.ay*b.x+this.by*b.y+this.cy)},untransform:function(b){return new a.Point((b.x*this.by-b.y*this.bx-this.cx*this.by+this.cy*this.bx)/(this.ax*this.by-this.ay*this.bx),(b.x*this.ay-b.y*this.ax-this.cx*this.ay+this.cy*this.ax)/(this.bx*this.ay-this.by*this.ax))}};a.deriveTransformation=function(l,k,f,e,b,o,h,g,d,c,n,m){var j=a.linearSolution(l,k,f,b,o,h,d,c,n);var i=a.linearSolution(l,k,e,b,o,g,d,c,m);return new a.Transformation(j[0],j[1],j[2],i[0],i[1],i[2])};a.linearSolution=function(f,o,i,e,n,h,d,m,g){f=parseFloat(f);o=parseFloat(o);i=parseFloat(i);e=parseFloat(e);n=parseFloat(n);h=parseFloat(h);d=parseFloat(d);m=parseFloat(m);g=parseFloat(g);var l=(((h-g)*(o-n))-((i-h)*(n-m)))/(((e-d)*(o-n))-((f-e)*(n-m)));var k=(((h-g)*(f-e))-((i-h)*(e-d)))/(((n-m)*(f-e))-((o-n)*(e-d)));var j=i-(f*l)-(o*k);return[l,k,j]};a.Projection=function(c,b){if(!b){b=new a.Transformation(1,0,0,0,1,0)}this.zoom=c;this.transformation=b};a.Projection.prototype={zoom:0,transformation:null,rawProject:function(b){throw"Abstract method not implemented by subclass."},rawUnproject:function(b){throw"Abstract method not implemented by subclass."},project:function(b){b=this.rawProject(b);if(this.transformation){b=this.transformation.transform(b)}return b},unproject:function(b){if(this.transformation){b=this.transformation.untransform(b)}b=this.rawUnproject(b);return b},locationCoordinate:function(c){var b=new a.Point(Math.PI*c.lon/180,Math.PI*c.lat/180);b=this.project(b);return new a.Coordinate(b.y,b.x,this.zoom)},coordinateLocation:function(c){c=c.zoomTo(this.zoom);var b=new a.Point(c.column,c.row);b=this.unproject(b);return new a.Location(180*b.y/Math.PI,180*b.x/Math.PI)}};a.LinearProjection=function(c,b){a.Projection.call(this,c,b)};a.LinearProjection.prototype={rawProject:function(b){return new a.Point(b.x,b.y)},rawUnproject:function(b){return new a.Point(b.x,b.y)}};a.extend(a.LinearProjection,a.Projection);a.MercatorProjection=function(c,b){a.Projection.call(this,c,b)};a.MercatorProjection.prototype={rawProject:function(b){return new a.Point(b.x,Math.log(Math.tan(0.25*Math.PI+0.5*b.y)))},rawUnproject:function(b){return new a.Point(b.x,2*Math.atan(Math.pow(Math.E,b.y))-0.5*Math.PI)}};a.extend(a.MercatorProjection,a.Projection);a.MapProvider=function(b){if(b){this.getTileUrl=b}};a.MapProvider.prototype={projection:new a.MercatorProjection(0,a.deriveTransformation(-Math.PI,Math.PI,0,0,Math.PI,Math.PI,1,0,-Math.PI,-Math.PI,0,1)),tileWidth:256,tileHeight:256,topLeftOuterLimit:new a.Coordinate(0,0,0),bottomRightInnerLimit:new a.Coordinate(1,1,0).zoomTo(18),getTileUrl:function(b){throw"Abstract method not implemented by subclass."},locationCoordinate:function(b){return this.projection.locationCoordinate(b)},coordinateLocation:function(b){return this.projection.coordinateLocation(b)},outerLimits:function(){return[this.topLeftOuterLimit.copy(),this.bottomRightInnerLimit.copy()]},setZoomRange:function(c,b){this.topLeftOuterLimit=this.topLeftOuterLimit.zoomTo(c);this.bottomRightInnerLimit=this.bottomRightInnerLimit.zoomTo(b)},sourceCoordinate:function(g){var b=this.topLeftOuterLimit.zoomTo(g.zoom);var d=this.bottomRightInnerLimit.zoomTo(g.zoom);var c=d.row-b.row;if(g.row<0|g.row>=c){return null}var f=d.column-b.column;var e=g.column%f;while(e<0){e+=f}return new a.Coordinate(g.row,e,g.zoom)}};a.TemplatedMapProvider=function(c,b){a.MapProvider.call(this,function(f){f=this.sourceCoordinate(f);if(!f){return null}var d=c;if(b&&b.length&&d.indexOf("{S}")>=0){var e=parseInt(f.zoom+f.row+f.column,10)%b.length;d=d.replace("{S}",b[e])}return d.replace("{Z}",f.zoom.toFixed(0)).replace("{X}",f.column.toFixed(0)).replace("{Y}",f.row.toFixed(0))})};a.extend(a.TemplatedMapProvider,a.MapProvider);a.getMousePoint=function(f,d){var b=new a.Point(f.clientX,f.clientY);b.x+=document.body.scrollLeft+document.documentElement.scrollLeft;b.y+=document.body.scrollTop+document.documentElement.scrollTop;for(var c=d.parent;c;c=c.offsetParent){b.x-=c.offsetLeft;b.y-=c.offsetTop}return b};a.MouseWheelHandler=function(b){if(b!==undefined){this.init(b)}};a.MouseWheelHandler.prototype={init:function(b){this.map=b;this._mouseWheel=a.bind(this.mouseWheel,this);a.addEvent(b.parent,"mousewheel",this._mouseWheel)},remove:function(){a.removeEvent(this.map.parent,"mousewheel",this._mouseWheel)},mouseWheel:function(d){var f=0;this.prevTime=this.prevTime||new Date().getTime();if(d.wheelDelta){f=d.wheelDelta}else{if(d.detail){f=-d.detail}}var c=new Date().getTime()-this.prevTime;if(Math.abs(f)>0&&(c>200)){var b=a.getMousePoint(d,this.map);this.map.zoomByAbout(f>0?1:-1,b);this.prevTime=new Date().getTime()}return a.cancelEvent(d)}};a.DoubleClickHandler=function(b){if(b!==undefined){this.init(b)}};a.DoubleClickHandler.prototype={init:function(b){this.map=b;this._doubleClick=a.bind(this.doubleClick,this);a.addEvent(b.parent,"dblclick",this._doubleClick)},remove:function(){a.removeEvent(this.map.parent,"dblclick",this._doubleClick)},doubleClick:function(c){var b=a.getMousePoint(c,this.map);this.map.zoomByAbout(c.shiftKey?-1:1,b);return a.cancelEvent(c)}};a.DragHandler=function(b){if(b!==undefined){this.init(b)}};a.DragHandler.prototype={init:function(b){this.map=b;this._mouseDown=a.bind(this.mouseDown,this);a.addEvent(b.parent,"mousedown",this._mouseDown)},remove:function(){a.removeEvent(this.map.parent,"mousedown",this._mouseDown)},mouseDown:function(b){a.addEvent(document,"mouseup",this._mouseUp=a.bind(this.mouseUp,this));a.addEvent(document,"mousemove",this._mouseMove=a.bind(this.mouseMove,this));this.prevMouse=new a.Point(b.clientX,b.clientY);this.map.parent.style.cursor="move";return a.cancelEvent(b)},mouseMove:function(b){if(this.prevMouse){this.map.panBy(b.clientX-this.prevMouse.x,b.clientY-this.prevMouse.y);this.prevMouse.x=b.clientX;this.prevMouse.y=b.clientY;this.prevMouse.t=+new Date()}return a.cancelEvent(b)},mouseUp:function(b){a.removeEvent(document,"mouseup",this._mouseUp);a.removeEvent(document,"mousemove",this._mouseMove);this.prevMouse=null;this.map.parent.style.cursor="";return a.cancelEvent(b)}};a.MouseHandler=function(b){if(b!==undefined){this.init(b)}};a.MouseHandler.prototype={init:function(b){this.map=b;this.handlers=[new a.DragHandler(b),new a.DoubleClickHandler(b),new a.MouseWheelHandler(b)]},remove:function(){for(var b=0;b<this.handlers.length;b++){this.handlers[b].remove()}}};a.TouchHandler=function(){};a.TouchHandler.prototype={maxTapTime:250,maxTapDistance:30,maxDoubleTapDelay:350,locations:{},taps:[],wasPinching:false,lastPinchCenter:null,init:function(c,b){this.map=c;b=b||{};this._touchStartMachine=a.bind(this.touchStartMachine,this);this._touchMoveMachine=a.bind(this.touchMoveMachine,this);this._touchEndMachine=a.bind(this.touchEndMachine,this);a.addEvent(c.parent,"touchstart",this._touchStartMachine);a.addEvent(c.parent,"touchmove",this._touchMoveMachine);a.addEvent(c.parent,"touchend",this._touchEndMachine);this.options={};this.options.snapToZoom=b.snapToZoom||true},remove:function(){a.removeEvent(this.map.parent,"touchstart",this._touchStartMachine);a.removeEvent(this.map.parent,"touchmove",this._touchMoveMachine);a.removeEvent(this.map.parent,"touchend",this._touchEndMachine)},updateTouches:function(f){for(var d=0;d<f.touches.length;d+=1){var c=f.touches[d];if(c.identifier in this.locations){var b=this.locations[c.identifier];b.x=c.screenX;b.y=c.screenY;b.scale=f.scale}else{this.locations[c.identifier]={scale:f.scale,startPos:{x:c.screenX,y:c.screenY},x:c.screenX,y:c.screenY,time:new Date().getTime()}}}},sameTouch:function(b,c){return(b&&b.touch)&&(c.identifier==b.touch.identifier)},touchStartMachine:function(b){this.updateTouches(b);return a.cancelEvent(b)},touchMoveMachine:function(b){switch(b.touches.length){case 1:this.onPanning(b.touches[0]);break;case 2:this.onPinching(b);break}this.updateTouches(b);return a.cancelEvent(b)},touchEndMachine:function(l){var c=new Date().getTime();if(l.touches.length===0&&this.wasPinching){this.onPinched(this.lastPinchCenter)}for(var h=0;h<l.changedTouches.length;h+=1){var o=l.changedTouches[h],k=this.locations[o.identifier];if(!k||k.wasPinch){continue}var n={x:o.screenX,y:o.screenY},f=c-k.time,d=a.Point.distance(n,k.startPos);if(d>this.maxTapDistance){}else{if(f>this.maxTapTime){n.end=c;n.duration=f;this.onHold(n)}else{n.time=c;this.onTap(n)}}}var m={};for(var g=0;g<l.touches.length;g++){m[l.touches[g].identifier]=true}for(var b in this.locations){if(!(b in m)){delete m[b]}}return a.cancelEvent(l)},onHold:function(b){},onTap:function(b){if(this.taps.length&&(b.time-this.taps[0].time)<this.maxDoubleTapDelay){this.onDoubleTap(b);this.taps=[];return}this.taps=[b]},onDoubleTap:function(c){var e=this.map.getZoom(),f=Math.round(e)+1,b=f-e;var d=new a.Point(c.x,c.y);this.map.zoomByAbout(b,d)},onPanning:function(d){var c={x:d.screenX,y:d.screenY},b=this.locations[d.identifier];this.map.panBy(c.x-b.x,c.y-b.y)},onPinching:function(i){var h=i.touches[0],g=i.touches[1],k=new a.Point(h.screenX,h.screenY),j=new a.Point(g.screenX,g.screenY),d=this.locations[h.identifier],c=this.locations[g.identifier];d.wasPinch=true;c.wasPinch=true;var b=a.Point.interpolate(k,j,0.5);this.map.zoomByAbout(Math.log(i.scale)/Math.LN2-Math.log(d.scale)/Math.LN2,b);var f=a.Point.interpolate(d,c,0.5);this.map.panBy(b.x-f.x,b.y-f.y);this.wasPinching=true;this.lastPinchCenter=b},onPinched:function(b){if(this.options.snapToZoom){var c=this.map.getZoom(),d=Math.round(c);this.map.zoomByAbout(d-c,b)}this.wasPinching=false}};a.CallbackManager=function(b,d){this.owner=b;this.callbacks={};for(var c=0;c<d.length;c++){this.callbacks[d[c]]=[]}};a.CallbackManager.prototype={owner:null,callbacks:null,addCallback:function(b,c){if(typeof(c)=="function"&&this.callbacks[b]){this.callbacks[b].push(c)}},removeCallback:function(e,f){if(typeof(f)=="function"&&this.callbacks[e]){var c=this.callbacks[e],b=c.length;for(var d=0;d<b;d++){if(c[d]===f){c.splice(d,1);break}}}},dispatchCallback:function(d,c){if(this.callbacks[d]){for(var b=0;b<this.callbacks[d].length;b+=1){try{this.callbacks[d][b](this.owner,c)}catch(f){}}}}};a.RequestManager=function(b){this.loadingBay=document.createDocumentFragment();this.requestsById={};this.openRequestCount=0;this.maxOpenRequests=4;this.requestQueue=[];this.callbackManager=new a.CallbackManager(this,["requestcomplete"])};a.RequestManager.prototype={loadingBay:null,requestsById:null,requestQueue:null,openRequestCount:null,maxOpenRequests:null,callbackManager:null,addCallback:function(b,c){this.callbackManager.addCallback(b,c)},removeCallback:function(b,c){this.callbackManager.removeCallback(b,c)},dispatchCallback:function(c,b){this.callbackManager.dispatchCallback(c,b)},clear:function(){this.clearExcept({})},clearExcept:function(f){for(var e=0;e<this.requestQueue.length;e++){var g=this.requestQueue[e];if(g&&!(g.id in f)){this.requestQueue[e]=null}}var b=this.loadingBay.childNodes;for(var d=b.length-1;d>=0;d--){var c=b[d];if(!(c.id in f)){this.loadingBay.removeChild(c);this.openRequestCount--;c.src=c.coord=c.onload=c.onerror=null}}for(var k in this.requestsById){if(this.requestsById.hasOwnProperty(k)){if(!(k in f)){var h=this.requestsById[k];delete this.requestsById[k];if(h!==null){h=h.id=h.coord=h.url=null}}}}},hasRequest:function(b){return(b in this.requestsById)},requestTile:function(e,d,b){if(!(e in this.requestsById)){var c={id:e,coord:d.copy(),url:b};this.requestsById[e]=c;if(b){this.requestQueue.push(c)}}},getProcessQueue:function(){if(!this._processQueue){var b=this;this._processQueue=function(){b.processQueue()}}return this._processQueue},processQueue:function(d){if(d&&this.requestQueue.length>8){this.requestQueue.sort(d)}while(this.openRequestCount<this.maxOpenRequests&&this.requestQueue.length>0){var c=this.requestQueue.pop();if(c){this.openRequestCount++;var b=document.createElement("img");b.id=c.id;b.style.position="absolute";b.coord=c.coord;this.loadingBay.appendChild(b);b.onload=b.onerror=this.getLoadComplete();b.src=c.url;c=c.id=c.coord=c.url=null}}},_loadComplete:null,getLoadComplete:function(){if(!this._loadComplete){var b=this;this._loadComplete=function(d){d=d||window.event;var c=d.srcElement||d.target;c.onload=c.onerror=null;b.loadingBay.removeChild(c);b.openRequestCount--;delete b.requestsById[c.id];if(d.type==="load"&&(c.complete||(c.readyState&&c.readyState=="complete"))){b.dispatchCallback("requestcomplete",c)}else{c.src=null}setTimeout(b.getProcessQueue(),0)}}return this._loadComplete}};a.Map=function(k,j,b,c){if(typeof k=="string"){k=document.getElementById(k);if(!k){throw"The ID provided to modest maps could not be found."}}this.parent=k;this.parent.style.padding="0";this.parent.style.overflow="hidden";var g=a.getStyle(this.parent,"position");if(g!="relative"&&g!="absolute"){this.parent.style.position="relative"}if(!b){var l=this.parent.offsetWidth;var f=this.parent.offsetHeight;if(!l){l=640;this.parent.style.width=l+"px"}if(!f){f=480;this.parent.style.height=f+"px"}b=new a.Point(l,f);var d=this;a.addEvent(window,"resize",this.windowResize())}else{this.parent.style.width=Math.round(b.x)+"px";this.parent.style.height=Math.round(b.y)+"px"}this.dimensions=b;this.requestManager=new a.RequestManager(this.parent);this.requestManager.addCallback("requestcomplete",this.getTileComplete());this.layers={};this.layerParent=document.createElement("div");this.layerParent.id=this.parent.id+"-layers";this.layerParent.style.cssText="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; margin: 0; padding: 0; z-index: 0";this.parent.appendChild(this.layerParent);this.coordinate=new a.Coordinate(0.5,0.5,0);this.setProvider(j);this.enablePyramidLoading=false;this.callbackManager=new a.CallbackManager(this,["zoomed","panned","centered","extentset","resized","drawn"]);if(c===undefined){this.eventHandlers=[];this.eventHandlers.push(new a.MouseHandler(this))}else{this.eventHandlers=c;if(c instanceof Array){for(var e=0;e<c.length;e++){c[e].init(this)}}}};a.Map.prototype={parent:null,provider:null,dimensions:null,coordinate:null,tiles:null,layers:null,layerParent:null,requestManager:null,tileCacheSize:null,maxTileCacheSize:null,recentTiles:null,recentTilesById:null,recentTileSize:null,callbackManager:null,eventHandlers:null,toString:function(){return"Map(#"+this.parent.id+")"},addCallback:function(b,c){this.callbackManager.addCallback(b,c)},removeCallback:function(b,c){this.callbackManager.removeCallback(b,c)},dispatchCallback:function(c,b){this.callbackManager.dispatchCallback(c,b)},windowResize:function(){if(!this._windowResize){var b=this;this._windowResize=function(c){b.dimensions=new a.Point(b.parent.offsetWidth,b.parent.offsetHeight);b.draw();b.dispatchCallback("resized",[b.dimensions])}}return this._windowResize},zoomBy:function(b){var c=this;this.coordinate=this.enforceLimits(this.coordinate.zoomBy(b));a.getFrame(function(){c.draw()});this.dispatchCallback("zoomed",b);return this},zoomIn:function(){return this.zoomBy(1)},zoomOut:function(){return this.zoomBy(-1)},setZoom:function(b){return this.zoomBy(b-this.coordinate.zoom)},zoomByAbout:function(c,b){var e=this.pointLocation(b);this.coordinate=this.enforceLimits(this.coordinate.zoomBy(c));var d=this.locationPoint(e);this.dispatchCallback("zoomed",c);return this.panBy(b.x-d.x,b.y-d.y)},panBy:function(d,b){var c=this;this.coordinate.column-=d/this.provider.tileWidth;this.coordinate.row-=b/this.provider.tileHeight;this.coordinate=this.enforceLimits(this.coordinate);a.getFrame(function(){c.draw()});this.dispatchCallback("panned",[d,b]);return this},panLeft:function(){return this.panBy(100,0)},panRight:function(){return this.panBy(-100,0)},panDown:function(){return this.panBy(0,-100)},panUp:function(){return this.panBy(0,100)},setCenter:function(b){return this.setCenterZoom(b,this.coordinate.zoom)},setCenterZoom:function(b,c){this.coordinate=this.provider.locationCoordinate(b).zoomTo(parseFloat(c)||0);this.draw();this.dispatchCallback("centered",[b,c]);return this},setExtent:function(k){var h,g;for(var f=0;f<k.length;f++){var q=this.provider.locationCoordinate(k[f]);if(h){h.row=Math.min(h.row,q.row);h.column=Math.min(h.column,q.column);h.zoom=Math.min(h.zoom,q.zoom);g.row=Math.max(g.row,q.row);g.column=Math.max(g.column,q.column);g.zoom=Math.max(g.zoom,q.zoom)}else{h=q.copy();g=q.copy()}}var c=this.dimensions.x+1;var r=this.dimensions.y+1;var b=(g.column-h.column)/(c/this.provider.tileWidth);var l=Math.log(b)/Math.log(2);var m=h.zoom-Math.ceil(l);var n=(g.row-h.row)/(r/this.provider.tileHeight);var s=Math.log(n)/Math.log(2);var p=h.zoom-Math.ceil(s);var d=Math.min(m,p);d=Math.min(d,this.provider.outerLimits()[1].zoom);d=Math.max(d,this.provider.outerLimits()[0].zoom);var e=(h.row+g.row)/2;var j=(h.column+g.column)/2;var o=h.zoom;this.coordinate=new a.Coordinate(e,j,o).zoomTo(d);this.draw();this.dispatchCallback("extentset",k);return this},setSize:function(c,b){if(c.hasOwnProperty("x")&&c.hasOwnProperty("y")){this.dimensions=c}else{if(b!==undefined&&!isNaN(b)){this.dimensions=new a.Point(c,b)}}this.parent.style.width=Math.round(this.dimensions.x)+"px";this.parent.style.height=Math.round(this.dimensions.y)+"px";this.draw();this.dispatchCallback("resized",[this.dimensions]);return this},coordinatePoint:function(c){if(c.zoom!=this.coordinate.zoom){c=c.zoomTo(this.coordinate.zoom)}var b=new a.Point(this.dimensions.x/2,this.dimensions.y/2);b.x+=this.provider.tileWidth*(c.column-this.coordinate.column);b.y+=this.provider.tileHeight*(c.row-this.coordinate.row);return b},pointCoordinate:function(b){var c=this.coordinate.copy();c.column+=(b.x-this.dimensions.x/2)/this.provider.tileWidth;c.row+=(b.y-this.dimensions.y/2)/this.provider.tileHeight;return c},locationPoint:function(b){return this.coordinatePoint(this.provider.locationCoordinate(b))},pointLocation:function(b){return this.provider.coordinateLocation(this.pointCoordinate(b))},getExtent:function(){var b=[];b.push(this.pointLocation(new a.Point(0,0)));b.push(this.pointLocation(this.dimensions));return b},getCenter:function(){return this.provider.coordinateLocation(this.coordinate)},getZoom:function(){return this.coordinate.zoom},setProvider:function(d){var e=false;if(this.provider===null){e=true}if(!e){this.requestManager.clear();for(var b in this.layers){if(this.layers.hasOwnProperty(b)){var c=this.layers[b];while(c.firstChild){c.removeChild(c.firstChild)}}}}this.tiles={};this.tileCacheSize=0;this.maxTileCacheSize=64;this.recentTiles=[];this.recentTilesById={};this.provider=d;if(!e){this.draw()}return this},enforceLimits:function(e){e=e.copy();var c=this.provider.outerLimits();if(c){var d=c[0].zoom;var b=c[1].zoom;if(e.zoom<d){e=e.zoomTo(d)}else{if(e.zoom>b){e=e.zoomTo(b)}}}return e},draw:function(){this.coordinate=this.enforceLimits(this.coordinate);var o=Math.round(this.coordinate.zoom);var u=this.pointCoordinate(new a.Point(0,0)).zoomTo(o).container();var s=this.pointCoordinate(this.dimensions).zoomTo(o).container().right().down();var k=0;if(k){u=u.left(k).up(k);s=s.right(k).down(k)}var E={};var l=this.createOrGetLayer(u.zoom);var e=u.copy();for(e.column=u.column;e.column<=s.column;e.column+=1){for(e.row=u.row;e.row<=s.row;e.row+=1){var m=e.toKey();E[m]=true;if(m in this.tiles){var H=this.tiles[m];if(H.parentNode!=l){l.appendChild(H)}}else{if(!this.requestManager.hasRequest(m)){var n=this.provider.getTileUrl(e);this.requestManager.requestTile(m,e,n)}var q=false;var D=e.zoom;for(var r=1;r<=D;r++){var t=e.zoomBy(-r).container();var y=t.toKey();if(this.enablePyramidLoading){E[y]=true;var z=this.createOrGetLayer(t.zoom);if(y in this.tiles){var v=this.tiles[y];if(v.parentNode!=z){z.appendChild(v)}}else{if(!this.requestManager.hasRequest(y)){this.requestManager.requestTile(y,t,this.provider.getTileUrl(t))}}}else{if(y in this.tiles){E[y]=true;q=true;break}}}if(!q&&!this.enablePyramidLoading){var h=e.zoomBy(1);E[h.toKey()]=true;h.column+=1;E[h.toKey()]=true;h.row+=1;E[h.toKey()]=true;h.column-=1;E[h.toKey()]=true}}}}for(var I in this.layers){if(this.layers.hasOwnProperty(I)){var d=parseInt(I,10);if(d>=u.zoom-5&&d<u.zoom+2){continue}var G=this.layers[I];G.style.display="none";var C=G.getElementsByTagName("img");for(var w=C.length-1;w>=0;w--){G.removeChild(C[w])}}}var f=new Date().getTime();var A=u.zoom-5;var g=u.zoom+2;for(var x=A;x<g;x++){var G=this.layers[x];if(!G){continue}var F=1,c=this.coordinate.copy(),C=G.getElementsByTagName("img");if(C.length>0){G.style.display="block";F=Math.pow(2,this.coordinate.zoom-x);c=c.zoomTo(x)}else{G.style.display="none"}var b=this.provider.tileWidth*F,p=this.provider.tileHeight*F,B=new a.Point(this.dimensions.x/2,this.dimensions.y/2);for(var w=C.length-1;w>=0;w--){var H=C[w];if(!E[H.id]){G.removeChild(H)}else{a.moveElement(H,{x:Math.round(B.x+(H.coord.column-c.column)*b),y:Math.round(B.y+(H.coord.row-c.row)*p),scale:F,width:this.provider.tileWidth,height:this.provider.tileHeight});this.recentTilesById[H.id].lastTouchedTime=f}}}this.requestManager.clearExcept(E);this.requestManager.processQueue(this.getCenterDistanceCompare());this.checkCache();this.dispatchCallback("drawn")},_tileComplete:null,getTileComplete:function(){if(!this._tileComplete){var b=this;this._tileComplete=function(g,h){b.tiles[h.id]=h;b.tileCacheSize++;var e={id:h.id,lastTouchedTime:new Date().getTime()};b.recentTilesById[h.id]=e;b.recentTiles.push(e);var f=b.coordinate.zoomTo(h.coord.zoom);var j=Math.pow(2,b.coordinate.zoom-h.coord.zoom);var d=((b.dimensions.x/2)+(h.coord.column-f.column)*b.provider.tileWidth*j);var c=((b.dimensions.y/2)+(h.coord.row-f.row)*b.provider.tileHeight*j);a.moveElement(h,{x:Math.round(d),y:Math.round(c),scale:j,width:b.provider.tileWidth,height:b.provider.tileHeight});var i=b.layers[h.coord.zoom];i.appendChild(h);h.className="map-tile-loaded";if(Math.round(b.coordinate.zoom)===h.coord.zoom){i.style.display="block"}b.requestRedraw()}}return this._tileComplete},_redrawTimer:undefined,requestRedraw:function(){if(!this._redrawTimer){this._redrawTimer=setTimeout(this.getRedraw(),1000)}},_redraw:null,getRedraw:function(){if(!this._redraw){var b=this;this._redraw=function(){b.draw();b._redrawTimer=0}}return this._redraw},createOrGetLayer:function(c){if(c in this.layers){return this.layers[c]}var b=document.createElement("div");b.id=this.parent.id+"-zoom-"+c;b.style.cssText=this.layerParent.style.cssText;b.style.zIndex=c;this.layerParent.appendChild(b);this.layers[c]=b;return b},checkCache:function(){var f=this.parent.getElementsByTagName("img").length;var d=Math.max(f,this.maxTileCacheSize);if(this.tileCacheSize>d){this.recentTiles.sort(function(h,g){return g.lastTouchedTime<h.lastTouchedTime?-1:g.lastTouchedTime>h.lastTouchedTime?1:0})}while(this.tileCacheSize>d){var c=this.recentTiles.pop();var b=new Date().getTime();delete this.recentTilesById[c.id];var e=this.tiles[c.id];if(e.parentNode){alert("Gah: trying to removing cached tile even though it's still in the DOM")}else{delete this.tiles[c.id];this.tileCacheSize--}}},getCenterDistanceCompare:function(){var b=this.coordinate.zoomTo(Math.round(this.coordinate.zoom));return function(e,d){if(e&&d){var g=e.coord;var f=d.coord;if(g.zoom==f.zoom){var c=Math.abs(b.row-g.row-0.5)+Math.abs(b.column-g.column-0.5);var h=Math.abs(b.row-f.row-0.5)+Math.abs(b.column-f.column-0.5);return c<h?1:c>h?-1:0}else{return g.zoom<f.zoom?1:g.zoom>f.zoom?-1:0}}return e?1:d?-1:0}},destroy:function(){this.requestManager.clear();for(var b=0;b<this.eventHandlers.length;b++){this.eventHandlers[b].remove()}this.parent.removeChild(this.layerParent);a.removeEvent(window,"resize",this.windowResize());return this}};if(typeof module!=="undefined"&&module.exports){module.exports={Point:a.Point,Projection:a.Projection,MercatorProjection:a.MercatorProjection,LinearProjection:a.LinearProjection,Transformation:a.Transformation,Location:a.Location,MapProvider:a.MapProvider,TemplatedMapProvider:a.TemplatedMapProvider,Coordinate:a.Coordinate}}})(com.modestmaps);/* wax - 3.0.6 - 1.0.4-374-g42f5e32 */


/*!
  * Reqwest! A general purpose XHR connection manager
  * copyright Dustin Diaz 2011
  * https://github.com/ded/reqwest
  * license MIT
  */
!function(context,win){function serial(a){var b=a.name;if(a.disabled||!b)return"";b=enc(b);switch(a.tagName.toLowerCase()){case"input":switch(a.type){case"reset":case"button":case"image":case"file":return"";case"checkbox":case"radio":return a.checked?b+"="+(a.value?enc(a.value):!0)+"&":"";default:return b+"="+(a.value?enc(a.value):"")+"&"}break;case"textarea":return b+"="+enc(a.value)+"&";case"select":return b+"="+enc(a.options[a.selectedIndex].value)+"&"}return""}function enc(a){return encodeURIComponent(a)}function reqwest(a,b){return new Reqwest(a,b)}function init(o,fn){function error(a){o.error&&o.error(a),complete(a)}function success(resp){o.timeout&&clearTimeout(self.timeout)&&(self.timeout=null);var r=resp.responseText;if(r)switch(type){case"json":resp=win.JSON?win.JSON.parse(r):eval("("+r+")");break;case"js":resp=eval(r);break;case"html":resp=r}fn(resp),o.success&&o.success(resp),complete(resp)}function complete(a){o.complete&&o.complete(a)}this.url=typeof o=="string"?o:o.url,this.timeout=null;var type=o.type||setType(this.url),self=this;fn=fn||function(){},o.timeout&&(this.timeout=setTimeout(function(){self.abort(),error()},o.timeout)),this.request=getRequest(o,success,error)}function setType(a){if(/\.json$/.test(a))return"json";if(/\.jsonp$/.test(a))return"jsonp";if(/\.js$/.test(a))return"js";if(/\.html?$/.test(a))return"html";if(/\.xml$/.test(a))return"xml";return"js"}function Reqwest(a,b){this.o=a,this.fn=b,init.apply(this,arguments)}function getRequest(a,b,c){if(a.type!="jsonp"){var f=xhr();f.open(a.method||"GET",typeof a=="string"?a:a.url,!0),setHeaders(f,a),f.onreadystatechange=handleReadyState(f,b,c),a.before&&a.before(f),f.send(a.data||null);return f}var d=doc.createElement("script"),e=0;win[getCallbackName(a)]=generalCallback,d.type="text/javascript",d.src=a.url,d.async=!0,d.onload=d.onreadystatechange=function(){if(d[readyState]&&d[readyState]!=="complete"&&d[readyState]!=="loaded"||e)return!1;d.onload=d.onreadystatechange=null,a.success&&a.success(lastValue),lastValue=undefined,head.removeChild(d),e=1},head.appendChild(d)}function generalCallback(a){lastValue=a}function getCallbackName(a){var b=a.jsonpCallback||"callback";if(a.url.slice(-(b.length+2))==b+"=?"){var c="reqwest_"+uniqid++;a.url=a.url.substr(0,a.url.length-1)+c;return c}var d=new RegExp(b+"=([\\w]+)");return a.url.match(d)[1]}function setHeaders(a,b){var c=b.headers||{};c.Accept=c.Accept||"text/javascript, text/html, application/xml, text/xml, */*",b.crossOrigin||(c["X-Requested-With"]=c["X-Requested-With"]||"XMLHttpRequest"),c[contentType]=c[contentType]||"application/x-www-form-urlencoded";for(var d in c)c.hasOwnProperty(d)&&a.setRequestHeader(d,c[d],!1)}function handleReadyState(a,b,c){return function(){a&&a[readyState]==4&&(twoHundo.test(a.status)?b(a):c(a))}}var twoHundo=/^20\d$/,doc=document,byTag="getElementsByTagName",readyState="readyState",contentType="Content-Type",head=doc[byTag]("head")[0],uniqid=0,lastValue,xhr="XMLHttpRequest"in win?function(){return new XMLHttpRequest}:function(){return new ActiveXObject("Microsoft.XMLHTTP")};Reqwest.prototype={abort:function(){this.request.abort()},retry:function(){init.call(this,this.o,this.fn)}},reqwest.serialize=function(a){var b=[a[byTag]("input"),a[byTag]("select"),a[byTag]("textarea")],c=[],d,e;for(d=0,l=b.length;d<l;++d)for(e=0,l2=b[d].length;e<l2;++e)c.push(serial(b[d][e]));return c.join("").replace(/&$/,"")},reqwest.serializeArray=function(a){for(var b=this.serialize(a).split("&"),c=0,d=b.length,e=[],f;c<d;c++)b[c]&&(f=b[c].split("="))&&e.push({name:f[0],value:f[1]});return e};var old=context.reqwest;reqwest.noConflict=function(){context.reqwest=old;return this},typeof module!="undefined"?module.exports=reqwest:context.reqwest=reqwest}(this,window)// Instantiate objects based on a JSON "record". The record must be a statement
// array in the following form:
//
//     [ "{verb} {subject}", arg0, arg1, arg2, ... argn ]
//
// Each record is processed from a passed `context` which starts from the
// global (ie. `window`) context if unspecified.
//
// - `@literal` Evaluate `subject` and return its value as a scalar. Useful for
//   referencing API constants, object properties or other values.
// - `@new` Call `subject` as a constructor with args `arg0 - argn`. The
//   newly created object will be the new context.
// - `@call` Call `subject` as a function with args `arg0 - argn` in the
//   global namespace. The return value will be the new context.
// - `@chain` Call `subject` as a method of the current context with args `arg0
//   - argn`. The return value will be the new context.
// - `@inject` Call `subject` as a method of the current context with args
//   `arg0 - argn`. The return value will *not* affect the context.
// - `@group` Treat `arg0 - argn` as a series of statement arrays that share a
//   context. Each statement will be called in serial and affect the context
//   for the next statement.
//
// Usage:
//
//     var gmap = ['@new google.maps.Map',
//         ['@call document.getElementById', 'gmap'],
//         {
//             center: [ '@new google.maps.LatLng', 0, 0 ],
//             zoom: 2,
//             mapTypeId: [ '@literal google.maps.MapTypeId.ROADMAP' ]
//         }
//     ];
//     wax.Record(gmap);
var wax = wax || {};


// TODO: replace with non-global-modifier
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Reduce
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(fun /*, initialValue */) {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    // no value to return if no initial value and an empty array
    if (len == 0 && arguments.length == 1)
      throw new TypeError();

    var k = 0;
    var accumulator;
    if (arguments.length >= 2) {
      accumulator = arguments[1];
    } else {
      do {
        if (k in t) {
          accumulator = t[k++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++k >= len)
          throw new TypeError();
      }
      while (true);
    }

    while (k < len) {
      if (k in t)
        accumulator = fun.call(undefined, accumulator, t[k], k, t);
      k++;
    }

    return accumulator;
  };
}


wax.Record = function(obj, context) {
    var getFunction = function(head, cur) {
        // TODO: strip out reduce
        var ret = head.split('.').reduce(function(part, segment) {
            return [part[1] || part[0], part[1] ? part[1][segment] : part[0][segment]];
        }, [cur || window, null]);
        if (ret[0] && ret[1]) {
            return ret;
        } else {
            throw head + ' not found.';
        }
    };
    var makeObject = function(fn_name, args) {
        var fn_obj = getFunction(fn_name),
            obj;
        args = args.length ? wax.Record(args) : [];

        // real browsers
        if (Object.create) {
            obj = Object.create(fn_obj[1].prototype);
            fn_obj[1].apply(obj, args);
        // lord have mercy on your soul.
        } else {
            switch (args.length) {
                case 0: obj = new fn_obj[1](); break;
                case 1: obj = new fn_obj[1](args[0]); break;
                case 2: obj = new fn_obj[1](args[0], args[1]); break;
                case 3: obj = new fn_obj[1](args[0], args[1], args[2]); break;
                case 4: obj = new fn_obj[1](args[0], args[1], args[2], args[3]); break;
                case 5: obj = new fn_obj[1](args[0], args[1], args[2], args[3], args[4]); break;
                default: break;
            }
        }
        return obj;
    };
    var runFunction = function(fn_name, args, cur) {
        var fn_obj = getFunction(fn_name, cur);
        var fn_args = args.length ? wax.Record(args) : [];
        // @TODO: This is currently a stopgap measure that calls methods like
        // `foo.bar()` in the context of `foo`. It will probably be necessary
        // in the future to be able to call `foo.bar()` from other contexts.
        if (cur && fn_name.indexOf('.') === -1) {
            return fn_obj[1].apply(cur, fn_args);
        } else {
            return fn_obj[1].apply(fn_obj[0], fn_args);
        }
    };
    var isKeyword = function(string) {
        return wax.util.isString(string) && (wax.util.indexOf([
            '@new',
            '@call',
            '@literal',
            '@chain',
            '@inject',
            '@group'
        ], string.split(' ')[0]) !== -1);
    };
    var altersContext = function(string) {
        return wax.util.isString(string) && (wax.util.indexOf([
            '@new',
            '@call',
            '@chain'
        ], string.split(' ')[0]) !== -1);
    };
    var getStatement = function(obj) {
        if (wax.util.isArray(obj) && obj[0] && isKeyword(obj[0])) {
            return {
                verb: obj[0].split(' ')[0],
                subject: obj[0].split(' ')[1],
                object: obj.slice(1)
            };
        }
        return false;
    };

    var i,
        fn = false,
        ret = null,
        child = null,
        statement = getStatement(obj);
    if (statement) {
        switch (statement.verb) {
        case '@group':
            for (i = 0; i < statement.object.length; i++) {
                ret = wax.Record(statement.object[i], context);
                child = getStatement(statement.object[i]);
                if (child && altersContext(child.verb)) {
                    context = ret;
                }
            }
            return context;
        case '@new':
            return makeObject(statement.subject, statement.object);
        case '@literal':
            fn = getFunction(statement.subject);
            return fn ? fn[1] : null;
        case '@inject':
            return runFunction(statement.subject, statement.object, context);
        case '@chain':
            return runFunction(statement.subject, statement.object, context);
        case '@call':
            return runFunction(statement.subject, statement.object, null);
        }
    } else if (obj !== null && typeof obj === 'object') {
        var keys = wax.util.keys(obj);
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            obj[key] = wax.Record(obj[key], context);
        }
        return obj;
    } else {
        return obj;
    }
};
wax = wax || {};

// Attribution
// -----------
wax.attribution = function() {
    var container,
        a = {};

    a.set = function(content) {
        if (typeof content === 'undefined') return;
        container.innerHTML = content;
        return this;
    };

    a.element = function() {
        return container;
    };

    a.init = function() {
        container = document.createElement('div');
        container.className = 'wax-attribution';
        return this;
    };

    return a.init();
};
wax = wax || {};

// Attribution
// -----------
wax.bwdetect = function(options, callback) {
    var detector = {},
        threshold = options.threshold || 400,
        // test image: 30.29KB
        testImage = 'http://a.tiles.mapbox.com/mapbox/1.0.0/blue-marble-topo-bathy-jul/0/0/0.png?preventcache=' + (+new Date()),
        // High-bandwidth assumed
        // 1: high bandwidth (.png, .jpg)
        // 0: low bandwidth (.png128, .jpg70)
        bw = 1,
        // Alternative versions
        auto = options.auto === undefined ? true : options.auto;

    function bwTest() {
        wax.bw = -1;
        var im = new Image();
        im.src = testImage;
        var first = true;
        var timeout = setTimeout(function() {
            if (first && wax.bw == -1) {
                detector.bw(0);
                first = false;
            }
        }, threshold);
        im.onload = function() {
            if (first && wax.bw == -1) {
                clearTimeout(timeout);
                detector.bw(1);
                first = false;
            }
        };
    }

    detector.bw = function(x) {
        if (!arguments.length) return bw;
        var oldBw = bw;
        if (wax.bwlisteners && wax.bwlisteners.length) (function () {
            listeners = wax.bwlisteners;
            wax.bwlisteners = [];
            for (i = 0; i < listeners; i++) {
                listeners[i](x);
            }
        })();
        wax.bw = x;

        if (bw != (bw = x)) callback(x);
    };

    detector.add = function() {
        if (auto) bwTest();
        return this;
    };

    if (wax.bw == -1) {
      wax.bwlisteners = wax.bwlisteners || [];
      wax.bwlisteners.push(detector.bw);
    } else if (wax.bw !== undefined) {
        detector.bw(wax.bw);
    } else {
        detector.add();
    }
    return detector;
};
// Formatter
// ---------
wax.formatter = function(x) {
    var formatter = {},
        f;

    // Prevent against just any input being used.
    if (x && typeof x === 'string') {
        try {
            // Ugly, dangerous use of eval.
            eval('f = ' + x);
        } catch (e) {
            if (console) console.log(e);
        }
    } else if (x && typeof x === 'function') {
        f = x;
    } else {
        f = function() {};
    }

    // Wrap the given formatter function in order to
    // catch exceptions that it may throw.
    formatter.format = function(options, data) {
        try {
            return f(options, data);
        } catch (e) {
            if (console) console.log(e);
        }
    };

    return formatter;
};
// GridInstance
// ------------
// GridInstances are queryable, fully-formed
// objects for acquiring features from events.
wax.GridInstance = function(grid_tile, formatter, options) {
    options = options || {};
    // resolution is the grid-elements-per-pixel ratio of gridded data.
    // The size of a tile element. For now we expect tiles to be squares.
    var instance = {},
        resolution = options.resolution || 4;
        tileSize = options.tileSize || 256;

    // Resolve the UTF-8 encoding stored in grids to simple
    // number values.
    // See the [utfgrid section of the mbtiles spec](https://github.com/mapbox/mbtiles-spec/blob/master/1.1/utfgrid.md)
    // for details.
    function resolveCode(key) {
        if (key >= 93) key--;
        if (key >= 35) key--;
        key -= 32;
        return key;
    }

    // Lower-level than tileFeature - has nothing to do
    // with the DOM. Takes a px offset from 0, 0 of a grid.
    instance.gridFeature = function(x, y) {
        if (!(grid_tile && grid_tile.grid)) return;
        if ((y < 0) || (x < 0)) return;
        if ((Math.floor(y) > tileSize) ||
            (Math.floor(x) > tileSize)) return;
        // Find the key in the grid. The above calls should ensure that
        // the grid's array is large enough to make this work.
        var key = resolveCode(grid_tile.grid[
           Math.floor((y) / resolution)
        ].charCodeAt(
           Math.floor((x) / resolution)
        ));

        if (grid_tile.keys[key] && grid_tile.data[grid_tile.keys[key]]) {
            return grid_tile.data[grid_tile.keys[key]];
        }
    };

    // Get a feature:
    //
    // * `x` and `y`: the screen coordinates of an event
    // * `tile_element`: a DOM element of a tile, from which we can get an offset.
    // * `options` options to give to the formatter: minimally having a `format`
    //   member, being `full`, `teaser`, or something else.
    instance.tileFeature = function(x, y, tile_element, options) {
        // IE problem here - though recoverable, for whatever reason
        var offset = wax.util.offset(tile_element);
            feature = this.gridFeature(x - offset.left, y - offset.top);

        if (feature) return formatter.format(options, feature);
    };

    return instance;
};
// GridManager
// -----------
// Generally one GridManager will be used per map.
//
// It takes one options object, which current accepts a single option:
// `resolution` determines the number of pixels per grid element in the grid.
// The default is 4.
wax.GridManager = function(options) {
    options = options || {};

    var resolution = options.resolution || 4,
        grid_tiles = {},
        manager = {},
        formatter;

    var formatterUrl = function(url) {
        return url.replace(/\d+\/\d+\/\d+\.\w+/, 'layer.json');
    };

    var gridUrl = function(url) {
        return url.replace(/(\.png|\.jpg|\.jpeg)(\d*)/, '.grid.json');
    };

    function getFormatter(url, callback) {
        if (typeof formatter !== 'undefined') {
            return callback(null, formatter);
        } else {
            wax.request.get(formatterUrl(url), function(err, data) {
                if (data && data.formatter) {
                    formatter = wax.formatter(data.formatter);
                } else {
                    formatter = false;
                }
                return callback(err, formatter);
            });
        }
    }

    function templatedGridUrl(template) {
        if (typeof template === 'string') template = [template];
        return function templatedGridFinder(url) {
            if (!url) return;
            var xyz = /(\d+)\/(\d+)\/(\d+)\.[\w\._]+/g.exec(url);
            if (!xyz) return;
            return template[parseInt(xyz[2], 10) % template.length]
                .replace('{z}', xyz[1])
                .replace('{x}', xyz[2])
                .replace('{y}', xyz[3]);
        };
    }

    manager.formatter = function(x) {
        if (!arguments.length) return formatter;
        formatter =  wax.formatter(x);
        return manager;
    };

    manager.formatterUrl = function(x) {
        if (!arguments.length) return formatterUrl;
        formatterUrl = typeof x === 'string' ?
            function() { return x; } : x;
        return manager;
    };

    manager.gridUrl = function(x) {
        if (!arguments.length) return gridUrl;
        gridUrl = typeof x === 'function' ?
            x : templatedGridUrl(x);
        return manager;
    };

     manager.getGrid = function(url, callback) {
        getFormatter(url, function(err, f) {
            var gurl = gridUrl(url);
            if (err || !f || !gurl) return callback(err, null);

            wax.request.get(gurl, function(err, t) {
                if (err) return callback(err, null);
                callback(null, wax.GridInstance(t, f, {
                    resolution: resolution || 4
                }));
            });
        });
        return manager;
    };

    if (options.formatter) manager.formatter(options.formatter);
    if (options.grids) manager.gridUrl(options.grids);

    return manager;
};
// Wax Legend
// ----------

// Wax header
var wax = wax || {};

wax.legend = function() {
    var element,
        legend = {},
        container;

    legend.element = function() {
        return container;
    };

    legend.content = function(content) {
        if (!arguments.length) return element.innerHTML;
        if (content) {
            element.innerHTML = content;
            element.style.display = 'block';
        } else {
            element.innerHTML = '';
            element.style.display = 'none';
        }
        return this;
    };

    legend.add = function() {
        container = document.createElement('div');
        container.className = 'wax-legends';

        element = document.createElement('div');
        element.className = 'wax-legend';
        element.style.display = 'none';

        container.appendChild(element);
        return this;
    };

    return legend.add();
};
// Like underscore's bind, except it runs a function
// with no arguments off of an object.
//
//     var map = ...;
//     w(map).melt(myFunction);
//
// is equivalent to
//
//     var map = ...;
//     myFunction(map);
//
var w = function(self) {
    self.melt = function(func, obj) {
        return func.apply(obj, [self, obj]);
    };
    return self;
};
// Wax GridUtil
// ------------

// Wax header
var wax = wax || {};

// Request
// -------
// Request data cache. `callback(data)` where `data` is the response data.
wax.request = {
    cache: {},
    locks: {},
    promises: {},
    get: function(url, callback) {
        // Cache hit.
        if (this.cache[url]) {
            return callback(this.cache[url][0], this.cache[url][1]);
        // Cache miss.
        } else {
            this.promises[url] = this.promises[url] || [];
            this.promises[url].push(callback);
            // Lock hit.
            if (this.locks[url]) return;
            // Request.
            var that = this;
            this.locks[url] = true;
            reqwest({
                url: url + '?callback=grid',
                type: 'jsonp',
                jsonpCallback: 'callback',
                success: function(data) {
                    that.locks[url] = false;
                    that.cache[url] = [null, data];
                    for (var i = 0; i < that.promises[url].length; i++) {
                        that.promises[url][i](that.cache[url][0], that.cache[url][1]);
                    }
                },
                error: function(err) {
                    that.locks[url] = false;
                    that.cache[url] = [err, null];
                    for (var i = 0; i < that.promises[url].length; i++) {
                        that.promises[url][i](that.cache[url][0], that.cache[url][1]);
                    }
                }
            });
        }
    }
};
if (!wax) var wax = {};

// A wrapper for reqwest jsonp to easily load TileJSON from a URL.
wax.tilejson = function(url, callback) {
    reqwest({
        url: url + '?callback=grid',
        type: 'jsonp',
        jsonpCallback: 'callback',
        success: callback,
        error: callback
    });
};
var wax = wax || {};
wax.tooltip = {};

wax.tooltip = function(options) {
    this._currentTooltip = undefined;
    options = options || {};
    if (options.animationOut) this.animationOut = options.animationOut;
    if (options.animationIn) this.animationIn = options.animationIn;
};

// Helper function to determine whether a given element is a wax popup.
wax.tooltip.prototype.isPopup = function(el) {
    return el && el.className.indexOf('wax-popup') !== -1;
};

// Get the active tooltip for a layer or create a new one if no tooltip exists.
// Hide any tooltips on layers underneath this one.
wax.tooltip.prototype.getTooltip = function(feature, context, index, evt) {
    tooltip = document.createElement('div');
    tooltip.className = 'wax-tooltip wax-tooltip-' + index;
    tooltip.innerHTML = feature;
    context.appendChild(tooltip);
    return tooltip;
};

// Hide a given tooltip.
wax.tooltip.prototype.hideTooltip = function(el) {
    if (!el) return;
    var event;
    var remove = function() {
        if (this.parentNode) this.parentNode.removeChild(this);
    };
    if (el.style['-webkit-transition'] !== undefined && this.animationOut) {
        event = 'webkitTransitionEnd';
    } else if (el.style.MozTransition !== undefined && this.animationOut) {
        event = 'transitionend';
    }
    if (event) {
        el.addEventListener(event, remove, false);
        el.addEventListener('transitionend', remove, false);
        el.className += ' ' + this.animationOut;
    } else {
        if (el.parentNode) el.parentNode.removeChild(el);
    }
};

// Expand a tooltip to be a "popup". Suspends all other tooltips from being
// shown until this popup is closed or another popup is opened.
wax.tooltip.prototype.click = function(feature, context, index) {
    // Hide any current tooltips.
    this.unselect(context);

    var tooltip = this.getTooltip(feature, context, index);
    var close = document.createElement('a');
    close.href = '#close';
    close.className = 'close';
    close.innerHTML = 'Close';

    var closeClick = wax.util.bind(function(ev) {
        this.hideTooltip(tooltip);
        this._currentTooltip = undefined;
        ev.returnValue = false; // Prevents hash change.
        if (ev.stopPropagation) ev.stopPropagation();
        if (ev.preventDefault) ev.preventDefault();
        return false;
    }, this);
    // IE compatibility.
    if (close.addEventListener) {
        close.addEventListener('click', closeClick, false);
    } else if (close.attachEvent) {
        close.attachEvent('onclick', closeClick);
    }

    tooltip.className += ' wax-popup';
    tooltip.innerHTML = feature;
    tooltip.appendChild(close);
    this._currentTooltip = tooltip;
};

// Show a tooltip.
wax.tooltip.prototype.select = function(feature, context, layer_id, evt) {
    if (!feature) return;
    if (this.isPopup(this._currentTooltip)) return;

    this._currentTooltip = this.getTooltip(feature, context, layer_id, evt);
    context.style.cursor = 'pointer';
};


// Hide all tooltips on this layer and show the first hidden tooltip on the
// highest layer underneath if found.
wax.tooltip.prototype.unselect = function(context) {
    if (this.isPopup(this._currentTooltip)) return;

    context.style.cursor = 'default';
    if (this._currentTooltip) {
        this.hideTooltip(this._currentTooltip);
        this._currentTooltip = undefined;
    }
};

wax.tooltip.prototype.out = wax.tooltip.prototype.unselect;
wax.tooltip.prototype.over = wax.tooltip.prototype.select;
wax.tooltip.prototype.click = wax.tooltip.prototype.click;
var wax = wax || {};
wax.util = wax.util || {};

// Utils are extracted from other libraries or
// written from scratch to plug holes in browser compatibility.
wax.util = {
    // From Bonzo
    offset: function(el) {
        // TODO: window margins
        //
        // Okay, so fall back to styles if offsetWidth and height are botched
        // by Firefox.
        var width = el.offsetWidth || parseInt(el.style.width, 10),
            height = el.offsetHeight || parseInt(el.style.height, 10),
            top = 0,
            left = 0;

        var calculateOffset = function(el) {
            if (el === document.body || el === document.documentElement) return;
            top += el.offsetTop;
            left += el.offsetLeft;

            var style = el.style.transform ||
                el.style.WebkitTransform ||
                el.style.OTransform ||
                el.style.MozTransform ||
                el.style.msTransform;

            if (style) {
                if (match = style.match(/translate\((.+)px, (.+)px\)/)) {
                    top += parseInt(match[2], 10);
                    left += parseInt(match[1], 10);
                } else if (match = style.match(/translate3d\((.+)px, (.+)px, (.+)px\)/)) {
                    top += parseInt(match[2], 10);
                    left += parseInt(match[1], 10);
                } else if (match = style.match(/matrix3d\(([\-\d,\s]+)\)/)) {
                    var pts = match[1].split(',');
                    top += parseInt(pts[13], 10);
                    left += parseInt(pts[12], 10);
                } else if (match = style.match(/matrix\(.+, .+, .+, .+, (.+), (.+)\)/)) {
                    top += parseInt(match[2], 10);
                    left += parseInt(match[1], 10);
                }
            }
        };

        calculateOffset(el);

        try {
            while (el = el.offsetParent) calculateOffset(el);
        } catch(e) {
            // Hello, internet explorer.
        }

        // Offsets from the body
        top += document.body.offsetTop;
        left += document.body.offsetLeft;
        // Offsets from the HTML element
        top += document.body.parentNode.offsetTop;
        left += document.body.parentNode.offsetLeft;

        // Firefox and other weirdos. Similar technique to jQuery's
        // `doesNotIncludeMarginInBodyOffset`.
        var htmlComputed = document.defaultView ?
            window.getComputedStyle(document.body.parentNode, null) :
            document.body.parentNode.currentStyle;
        if (document.body.parentNode.offsetTop !==
            parseInt(htmlComputed.marginTop, 10) &&
            !isNaN(parseInt(htmlComputed.marginTop, 10))) {
            top += parseInt(htmlComputed.marginTop, 10);
        left += parseInt(htmlComputed.marginLeft, 10);
        }

        return {
            top: top,
            left: left,
            height: height,
            width: width
        };
    },

    '$': function(x) {
        return (typeof x === 'string') ?
            document.getElementById(x) :
            x;
    },

    // From underscore, minus funcbind for now.
    // Returns a version of a function that always has the second parameter,
    // `obj`, as `this`.
    bind: function(func, obj) {
      var args = Array.prototype.slice.call(arguments, 2);
      return function() {
        return func.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
      };
    },
    // From underscore
    isString: function(obj) {
      return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
    },
    // IE doesn't have indexOf
    indexOf: function(array, item) {
        var nativeIndexOf = Array.prototype.indexOf;
        if (array === null) return -1;
        var i, l;
        if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
        for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
        return -1;
    },
    // is this object an array?
    isArray: Array.isArray || function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    },
    // From underscore: reimplement the ECMA5 `Object.keys()` method
    keys: Object.keys || function(obj) {
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        if (obj !== Object(obj)) throw new TypeError('Invalid object');
        var keys = [];
        for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
        return keys;
    },
    // From quirksmode: normalize the offset of an event from the top-left
    // of the page.
    eventoffset: function(e) {
        var posx = 0;
        var posy = 0;
        if (!e) var e = window.event;
        if (e.pageX || e.pageY) {
            // Good browsers
            return {
                x: e.pageX,
                y: e.pageY
            };
        } else if (e.clientX || e.clientY) {
            // Internet Explorer
            var doc = document.documentElement, body = document.body;
            var htmlComputed = document.body.parentNode.currentStyle;
            var topMargin = parseInt(htmlComputed.marginTop, 10) || 0;
            var leftMargin = parseInt(htmlComputed.marginLeft, 10) || 0;
            return {
                x: e.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                  (doc && doc.clientLeft || body && body.clientLeft || 0) + leftMargin,
                y: e.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                  (doc && doc.clientTop  || body && body.clientTop  || 0) + topMargin
            };
        } else if (e.touches && e.touches.length === 1) {
            // Touch browsers
            return {
                x: e.touches[0].pageX,
                y: e.touches[0].pageY
            };
        }
    }
};
wax = wax || {};
wax.mm = wax.mm || {};

// Attribution
// -----------
// Attribution wrapper for Modest Maps.
wax.mm.attribution = function(map, tilejson) {
    tilejson = tilejson || {};
    var a, // internal attribution control
        attribution = {};

    attribution.element = function() {
        return a.element();
    };

    attribution.appendTo = function(elem) {
        wax.util.$(elem).appendChild(a.element());
        return this;
    };

    attribution.init = function() {
        a = wax.attribution();
        a.set(tilejson.attribution);
        a.element().className = 'wax-attribution wax-mm';
        return this;
    };

    return attribution.init();
};
wax = wax || {};
wax.mm = wax.mm || {};

// Box Selector
// ------------
wax.mm.boxselector = function(map, tilejson, opts) {
    var mouseDownPoint = null,
        MM = com.modestmaps,
        callback = ((typeof opts === 'function') ?
            opts :
            opts.callback),
        boxDiv,
        box,
        boxselector = {};

    function getMousePoint(e) {
        // start with just the mouse (x, y)
        var point = new MM.Point(e.clientX, e.clientY);
        // correct for scrolled document
        point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
        point.y += document.body.scrollTop + document.documentElement.scrollTop;

        // correct for nested offsets in DOM
        for (var node = map.parent; node; node = node.offsetParent) {
            point.x -= node.offsetLeft;
            point.y -= node.offsetTop;
        }
        return point;
    }

    function mouseDown(e) {
        if (!e.shiftKey) return;

        mouseDownPoint = getMousePoint(e);

        boxDiv.style.left = mouseDownPoint.x + 'px';
        boxDiv.style.top = mouseDownPoint.y + 'px';

        MM.addEvent(map.parent, 'mousemove', mouseMove);
        MM.addEvent(map.parent, 'mouseup', mouseUp);

        map.parent.style.cursor = 'crosshair';
        return MM.cancelEvent(e);
    }


    function mouseMove(e) {
        var point = getMousePoint(e);
        boxDiv.style.display = 'block';
        if (point.x < mouseDownPoint.x) {
            boxDiv.style.left = point.x + 'px';
        } else {
            boxDiv.style.left = mouseDownPoint.x + 'px';
        }
        if (point.y < mouseDownPoint.y) {
            boxDiv.style.top = point.y + 'px';
        } else {
            boxDiv.style.top = mouseDownPoint.y + 'px';
        }
        boxDiv.style.width = Math.abs(point.x - mouseDownPoint.x) + 'px';
        boxDiv.style.height = Math.abs(point.y - mouseDownPoint.y) + 'px';
        return MM.cancelEvent(e);
    }

    function mouseUp(e) {
        var point = getMousePoint(e),
            l1 = map.pointLocation(point),
            l2 = map.pointLocation(mouseDownPoint);

        // Format coordinates like mm.map.getExtent().
        boxselector.extent([
            new MM.Location(
                Math.max(l1.lat, l2.lat),
                Math.min(l1.lon, l2.lon)),
            new MM.Location(
                Math.min(l1.lat, l2.lat),
                Math.max(l1.lon, l2.lon))
        ]);

        MM.removeEvent(map.parent, 'mousemove', mouseMove);
        MM.removeEvent(map.parent, 'mouseup', mouseUp);

        map.parent.style.cursor = 'auto';
    }

    function drawbox(map, e) {
        if (!boxDiv || !box) return;
        var br = map.locationPoint(box[0]),
            tl = map.locationPoint(box[1]);

        boxDiv.style.display = 'block';
        boxDiv.style.height = 'auto';
        boxDiv.style.width = 'auto';
        boxDiv.style.left = Math.max(0, tl.x) + 'px';
        boxDiv.style.top = Math.max(0, tl.y) + 'px';
        boxDiv.style.right = Math.max(0, map.dimensions.x - br.x) + 'px';
        boxDiv.style.bottom = Math.max(0, map.dimensions.y - br.y) + 'px';
    }

    boxselector.extent = function(x) {
        if (!x) return box;

        box = [
            new MM.Location(
                Math.max(x[0].lat, x[1].lat),
                Math.min(x[0].lon, x[1].lon)),
            new MM.Location(
                Math.min(x[0].lat, x[1].lat),
                Math.max(x[0].lon, x[1].lon))
        ];

        callback(box);
    };

    boxselector.add = function(map) {
        boxDiv = boxDiv || document.createElement('div');
        boxDiv.id = map.parent.id + '-boxselector-box';
        boxDiv.className = 'boxselector-box';
        map.parent.appendChild(boxDiv);

        MM.addEvent(map.parent, 'mousedown', mouseDown);
        map.addCallback('drawn', drawbox);
        return this;
    };

    boxselector.remove = function() {
        map.parent.removeChild(boxDiv);
        MM.removeEvent(map.parent, 'mousedown', mouseDown);
        map.removeCallback('drawn', drawbox);
    };

    return boxselector.add(map);
};
wax = wax || {};
wax.mm = wax.mm || {};

// Bandwidth Detection
// ------------------
wax.mm.bwdetect = function(map, options) {
    options = options || {};
    var lowpng = options.png || '.png128',
        lowjpg = options.jpg || '.jpg70',
        mm = com.modestmaps,
        bw = 1;

    function setProvider(x) {
        // More or less detect the Wax version
        if (!(x.options && x.options.scheme)) mm.Map.prototype.setProvider.call(map, x);
        var swap = [['.png', '.jpg'], [lowpng, lowjpg]];
        if (bw) swap.reverse();
        for (var i = 0; i < x.options.tiles.length; i++) {
            x.options.tiles[i] = x.options.tiles[i]
                .replace(swap[0][0], swap[1][0])
                .replace(swap[0][1], swap[1][1]);
        }
        mm.Map.prototype.setProvider.call(map, x);
    }

    map.setProvider = setProvider;

    return wax.bwdetect(options, function(x) {
      bw = x;
      setProvider(map.provider);
    });
};
wax = wax || {};
wax.mm = wax.mm || {};

// Fullscreen
// ----------
// A simple fullscreen control for Modest Maps

// Add zoom links, which can be styled as buttons, to a `modestmaps.Map`
// control. This function can be used chaining-style with other
// chaining-style controls.
wax.mm.fullscreen = function(map) {
    // true: fullscreen
    // false: minimized
    var state = false,
        fullscreen = {},
        a,
        smallSize;

    function click(e) {
        if (e) com.modestmaps.cancelEvent(e);
        if (state) {
            fullscreen.original();
        } else {
            fullscreen.full();
        }
    }

    // Modest Maps demands an absolute height & width, and doesn't auto-correct
    // for changes, so here we save the original size of the element and
    // restore to that size on exit from fullscreen.
    fullscreen.add = function(map) {
        a = document.createElement('a');
        a.className = 'wax-fullscreen';
        a.href = '#fullscreen';
        a.innerHTML = 'fullscreen';
        com.modestmaps.addEvent(a, 'click', click);
        return this;
    };
    fullscreen.full = function() {
        if (state) { return; } else { state = true; }
        smallSize = [map.parent.offsetWidth, map.parent.offsetHeight];
        map.parent.className += ' wax-fullscreen-map';
        map.setSize(
            map.parent.offsetWidth,
            map.parent.offsetHeight);
    };
    fullscreen.original = function() {
        if (!state) { return; } else { state = false; }
        map.parent.className = map.parent.className.replace('wax-fullscreen-map', '');
        map.setSize(
            smallSize[0],
            smallSize[1]);
    };
    fullscreen.appendTo = function(elem) {
        wax.util.$(elem).appendChild(a);
        return this;
    };

    return fullscreen.add(map);
};
wax = wax || {};
wax.mm = wax.mm || {};

// A basic manager dealing only in hashchange and `location.hash`.
// This **will interfere** with anchors, so a HTML5 pushState
// implementation will be preferred.
wax.mm.locationHash = {
  stateChange: function(callback) {
    com.modestmaps.addEvent(window, 'hashchange', function() {
      callback(location.hash.substring(1));
    }, false);
  },
  getState: function() {
    return location.hash.substring(1);
  },
  pushState: function(state) {
    location.hash = '#' + state;
  }
};

// a HTML5 pushstate-based hash changer.
//
// This **does not degrade** with non-supporting browsers - it simply
// does nothing.
wax.mm.pushState = {
    stateChange: function(callback) {
        com.modestmaps.addEvent(window, 'popstate', function(e) {
            if (e.state && e.state.map_location) {
                callback(e.state.map_location);
            }
        }, false);
    },
    getState: function() {
       if (!(window.history && window.history.state)) return;
       return history.state && history.state.map_location;
    },
    // Push states - so each substantial movement of the map
    // is a history object.
    pushState: function(state) {
        if (!(window.history && window.history.pushState)) return;
        window.history.pushState({ map_location: state }, document.title, window.location.href);
    }
};

// Hash
// ----
wax.mm.hash = function(map, tilejson, options) {
    options = options || {};

    var s0,
        hash = {},
        // allowable latitude range
        lat = 90 - 1e-8;

    options.manager = options.manager || wax.mm.pushState;

    // Ripped from underscore.js
    // Internal function used to implement `_.throttle` and `_.debounce`.
    function limit(func, wait, debounce) {
        var timeout;
          return function() {
              var context = this, args = arguments;
              var throttler = function() {
                  timeout = null;
                  func.apply(context, args);
              };
              if (debounce) clearTimeout(timeout);
              if (debounce || !timeout) timeout = setTimeout(throttler, wait);
          };
    }

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time.
    function throttle(func, wait) {
        return limit(func, wait, false);
    }

    var parser = function(s) {
        var args = s.split('/');
        for (var i = 0; i < args.length; i++) {
            args[i] = Number(args[i]);
            if (isNaN(args[i])) return true;
        }
        if (args.length < 3) {
            // replace bogus hash
            return true;
        } else if (args.length == 3) {
            map.setCenterZoom(new com.modestmaps.Location(args[1], args[2]), args[0]);
        }
    };

    var formatter = function() {
        var center = map.getCenter(),
            zoom = map.getZoom(),
            precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        return [zoom.toFixed(2),
          center.lat.toFixed(precision),
          center.lon.toFixed(precision)].join('/');
    };

    function move() {
        var s1 = formatter();
        if (s0 !== s1) {
            s0 = s1;
            // don't recenter the map!
            options.manager.pushState(s0);
        }
    }

    function stateChange(state) {
        // ignore spurious hashchange events
        if (state === s0) return;
        if (parser(s0 = state)) {
            // replace bogus hash
            move();
        }
    }

    var initialize = function() {
        if (options.defaultCenter) map.setCenter(options.defaultCenter);
        if (options.defaultZoom) map.setZoom(options.defaultZoom);
    };

    hash.add = function(map) {
        if (options.manager.getState()) {
            stateChange(options.manager.getState());
        } else {
            initialize();
            move();
        }
        map.addCallback('drawn', throttle(move, 500));
        options.manager.stateChange(stateChange);
        return this;
    };

    return hash.add(map);
};
wax = wax || {};
wax.mm = wax.mm || {};

// A chaining-style control that adds
// interaction to a modestmaps.Map object.
//
// Takes an options object with the following keys:
//
// * `callbacks` (optional): an `out`, `over`, and `click` callback.
//   If not given, the `wax.tooltip` library will be expected.
// * `clickAction` (optional): **full** or **location**: default is
//   **full**.
// * `clickHandler` (optional): if not given, `clickAction: 'location'` will
//   assign a location to your window with `window.location = 'location'`.
//   To make location-getting work with other systems, like those based on
//   pushState or Backbone, you can provide a custom function of the form
//
//
//     `clickHandler: function(url) { ... go to url ... }`
wax.mm.interaction = function(map, tilejson, options) {
    options = options || {};
    tilejson = tilejson || {};

    var MM = com.modestmaps,
        waxGM = wax.GridManager(tilejson),
        callbacks = options.callbacks || new wax.tooltip(options),
        clickAction = options.clickAction || ['full', 'location'],
        clickHandler = options.clickHandler || function(url) {
            window.location = url;
        },
        interaction = {},
        _downLock = false,
        _clickTimeout = false,
        touchable = ('ontouchstart' in document.documentElement),
        // Active feature
        _af,
        // Down event
        _d,
        // Touch tolerance
        tol = 4,
        tileGrid;

    // Search through `.tiles` and determine the position,
    // from the top-left of the **document**, and cache that data
    // so that `mousemove` events don't always recalculate.
    function getTileGrid() {
        // TODO: don't build for tiles outside of viewport
        // Touch interaction leads to intermediate
        var zoomLayer = map.createOrGetLayer(Math.round(map.getZoom()));
        // Calculate a tile grid and cache it, by using the `.tiles`
        // element on this map.
        return tileGrid || (tileGrid =
            (function(t) {
                var o = [];
                for (var key in t) {
                    if (t[key].parentNode === zoomLayer) {
                        var offset = wax.util.offset(t[key]);
                        o.push([offset.top, offset.left, t[key]]);
                    }
                }
                return o;
            })(map.tiles));
    }

    // When the map moves, the tile grid is no longer valid.
    function clearTileGrid(map, e) {
        tileGrid = null;
    }

    function getTile(e) {
        for (var i = 0, grid = getTileGrid(); i < grid.length; i++) {
            if ((grid[i][0] < e.y) &&
               ((grid[i][0] + 256) > e.y) &&
                (grid[i][1] < e.x) &&
               ((grid[i][1] + 256) > e.x)) return grid[i][2];
        }
        return false;
    }

    // Clear the double-click timeout to prevent double-clicks from
    // triggering popups.
    function killTimeout() {
        if (_clickTimeout) {
            window.clearTimeout(_clickTimeout);
            _clickTimeout = null;
            return true;
        } else {
            return false;
        }
    }

    function onMove(e) {
        // If the user is actually dragging the map, exit early
        // to avoid performance hits.
        if (_downLock) return;

        var pos = wax.util.eventoffset(e),
            tile = getTile(pos),
            feature;

        if (tile) waxGM.getGrid(tile.src, function(err, g) {
            if (err || !g) return;
            if (feature = g.tileFeature(pos.x, pos.y, tile, {
                format: 'teaser'
            })) {
                if (feature && _af !== feature) {
                    _af = feature;
                    callbacks.out(map.parent);
                    callbacks.over(feature, map.parent, 0, e);
                } else if (!feature) {
                    _af = null;
                    callbacks.out(map.parent);
                }
            } else {
                _af = null;
                callbacks.out(map.parent);
            }
        });
    }

    // A handler for 'down' events - which means `mousedown` and `touchstart`
    function onDown(e) {
        // Ignore double-clicks by ignoring clicks within 300ms of
        // each other.
        if (killTimeout()) { return; }

        // Prevent interaction offset calculations happening while
        // the user is dragging the map.
        //
        // Store this event so that we can compare it to the
        // up event
        _downLock = true;
        _d = wax.util.eventoffset(e);
        if (e.type === 'mousedown') {
            MM.addEvent(document.body, 'mouseup', onUp);

        // Only track single-touches. Double-touches will not affect this
        // control
        } else if (e.type === 'touchstart' && e.touches.length === 1) {

            // turn this into touch-mode. Fallback to teaser and full.
            clickAction = ['full', 'teaser'];

            // Don't make the user click close if they hit another tooltip
            if (callbacks._currentTooltip) {
                callbacks.hideTooltip(callbacks._currentTooltip);
            }

            // Touch moves invalidate touches
            MM.addEvent(map.parent, 'touchend', onUp);
            MM.addEvent(map.parent, 'touchmove', touchCancel);
        }
    }

    function touchCancel() {
        MM.removeEvent(map.parent, 'touchend', onUp);
        MM.removeEvent(map.parent, 'touchmove', onUp);
        _downLock = false;
    }

    function onUp(e) {
        var pos = wax.util.eventoffset(e);

        MM.removeEvent(document.body, 'mouseup', onUp);
        if (map.parent.ontouchend) {
            MM.removeEvent(map.parent, 'touchend', onUp);
            MM.removeEvent(map.parent, 'touchmove', _touchCancel);
        }

        _downLock = false;
        if (e.type === 'touchend') {
            // If this was a touch and it survived, there's no need to avoid a double-tap
            click(e, _d);
        } else if (Math.round(pos.y / tol) === Math.round(_d.y / tol) &&
            Math.round(pos.x / tol) === Math.round(_d.x / tol)) {
            // Contain the event data in a closure.
            _clickTimeout = window.setTimeout((function(pos) {
                return function(e) {
                    _clickTimeout = null;
                    click(e, pos);
                };
            })(pos), 300);
        }
        return onUp;
    }

    // Handle a click event. Takes a second
    function click(e, pos) {
        var tile = getTile(pos),
            feature;

        if (tile) waxGM.getGrid(tile.src, function(err, g) {
            for (var i = 0; g && i < clickAction.length; i++) {
                if (feature = g.tileFeature(pos.x, pos.y, tile, {
                    format: clickAction[i]
                })) {
                    switch (clickAction[i]) {
                        case 'full':
                        // clickAction can be teaser in touch interaction
                        case 'teaser':
                            return callbacks.click(feature, map.parent, 0, e);
                        case 'location':
                            return clickHandler(feature);
                    }
                }
            }
        });
    }

    // Attach listeners to the map
    interaction.add = function() {
        var l = ['zoomed', 'panned', 'centered',
            'extentset', 'resized', 'drawn'];
        for (var i = 0; i < l.length; i++) {
            map.addCallback(l[i], clearTileGrid);
        }
        MM.addEvent(map.parent, 'mousemove', onMove);
        MM.addEvent(map.parent, 'mousedown', onDown);
        if (touchable) {
            MM.addEvent(map.parent, 'touchstart', onDown);
        }
        return this;
    };

    // Remove this control from the map.
    interaction.remove = function() {
        var l = ['zoomed', 'panned', 'centered',
            'extentset', 'resized', 'drawn'];
        for (var i = 0; i < l.length; i++) {
            map.removeCallback(l[i], clearTileGrid);
        }
        MM.removeEvent(map.parent, 'mousemove', onMove);
        MM.removeEvent(map.parent, 'mousedown', onDown);
        if (touchable) {
            MM.removeEvent(map.parent, 'touchstart', onDown);
        }
        if (callbacks._currentTooltip) {
            callbacks.hideTooltip(callbacks._currentTooltip);
        }
        return this;
    };

    // Ensure chainability
    return interaction.add(map);
};
wax = wax || {};
wax.mm = wax.mm || {};

// Legend Control
// --------------
// The Modest Maps version of this control is a very, very
// light wrapper around the `/lib` code for legends.
wax.mm.legend = function(map, tilejson) {
    tilejson = tilejson || {};
    var l, // parent legend
        legend = {};

    legend.add = function() {
        l = wax.legend()
            .content(tilejson.legend || '');
        return this;
    };

    legend.content = function(x) {
        if (x) l.content(x.legend || '');
    };

    legend.element = function() {
        return l.element();
    };

    legend.appendTo = function(elem) {
        wax.util.$(elem).appendChild(l.element());
        return this;
    };

    return legend.add();
};
wax = wax || {};
wax.mm = wax.mm || {};

// Mobile
// ------
// For making maps on normal websites nicely mobile-ized
wax.mm.mobile = function(map, tilejson, opts) {
    opts = opts || {};
    // Inspired by Leaflet
    var mm = com.modestmaps,
        ua = navigator.userAgent.toLowerCase(),
        isWebkit = ua.indexOf("webkit") != -1,
        isMobile = ua.indexOf("mobile") != -1,
        mobileWebkit = isMobile && isWebkit;

    var defaultOverlayDraw = function(div) {
        var canvas = document.createElement('canvas');
        var width = parseInt(div.style.width, 10),
            height = parseInt(div.style.height, 10),
            w2 = width / 2,
            h2 = height / 2,
            // Make the size of the arrow nicely proportional to the map
            size = Math.min(width, height) / 4;

        var ctx = canvas.getContext('2d');
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        ctx.globalAlpha = 0.5;
        // Draw a nice gradient to signal that the map is inaccessible
        var inactive = ctx.createLinearGradient(0, 0, 300, 225);
        inactive.addColorStop(0, "black");
        inactive.addColorStop(1, "rgb(200, 200, 200)");
        ctx.fillStyle = inactive;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.beginPath();
        ctx.moveTo(w2 - size * 0.6, h2 - size); // give the (x,y) coordinates
        ctx.lineTo(w2 - size * 0.6, h2 + size);
        ctx.lineTo(w2 + size * 0.6, h2);
        ctx.fill();

        // Done! Now fill the shape, and draw the stroke.
        // Note: your shape will not be visible until you call any of the two methods.
        div.appendChild(canvas);
    };

    var defaultBackDraw = function(div) {
        div.style.position = 'absolute';
        div.style.height = '50px';
        div.style.left =
            div.style.right = '0';

        var canvas = document.createElement('canvas');
        canvas.setAttribute('width', div.offsetWidth);
        canvas.setAttribute('height', div.offsetHeight);

        var ctx = canvas.getContext('2d');
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(0, 0, div.offsetWidth, div.offsetHeight);
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("back", 20, 30);
        div.appendChild(canvas);
    };

    var maximizeElement = function(elem) {
        elem.style.position = 'absolute';
        elem.style.width =
            elem.style.height = 'auto';
        elem.style.top = (window.pageYOffset) + 'px';
        elem.style.left =
            elem.style.right = '0px';
    };

    var minimizeElement = function(elem) {
        elem.style.position = 'relative';
        elem.style.width =
            elem.style.height =
            elem.style.top =
            elem.style.left =
            elem.style.right = 'auto';
    };

    var overlayDiv,
        oldBody,
        standIn,
        meta,
        overlayDraw = opts.overlayDraw || defaultOverlayDraw,
        backDraw = opts.backDraw || defaultBackDraw;
        bodyDraw = opts.bodyDraw || function() {};

    var mobile = {
        add: function(map) {
            // Code in this block is only run on Mobile Safari;
            // therefore HTML5 Canvas is fine.
            if (mobileWebkit) {
                meta = document.createElement('meta');
                meta.id = 'wax-touch';
                meta.setAttribute('name', 'viewport');
                overlayDiv = document.createElement('div');
                overlayDiv.id = map.parent.id + '-mobileoverlay';
                overlayDiv.className = 'wax-mobileoverlay';
                overlayDiv.style.position = 'absolute';
                overlayDiv.style.width = map.dimensions.x + 'px';
                overlayDiv.style.height = map.dimensions.y + 'px';
                map.parent.appendChild(overlayDiv);
                overlayDraw(overlayDiv);

                standIn = document.createElement('div');
                backDiv = document.createElement('div');
                // Store the old body - we'll need it.
                oldBody = document.body;

                newBody = document.createElement('body');
                newBody.className = 'wax-mobile-body';
                newBody.appendChild(backDiv);

                mm.addEvent(overlayDiv, 'touchstart', this.toTouch);
                mm.addEvent(backDiv, 'touchstart', this.toPage);
            }
            return this;
        },
        // Enter "touch mode"
        toTouch: function() {
            // Enter a new body
            map.parent.parentNode.replaceChild(standIn, map.parent);
            newBody.insertBefore(map.parent, backDiv);
            document.body = newBody;

            bodyDraw(newBody);
            backDraw(backDiv);
            meta.setAttribute('content',
                'initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0');
            document.head.appendChild(meta);
            map._smallSize = [map.parent.clientWidth, map.parent.clientHeight];
            maximizeElement(map.parent);
            map.setSize(
                map.parent.offsetWidth,
                window.innerHeight);
            backDiv.style.display = 'block';
            overlayDiv.style.display = 'none';
        },
        // Return from touch mode
        toPage: function() {
            // Currently this code doesn't, and can't, reset the
            // scale of the page. Anything to not use the meta-element
            // would be a bit of a hack.
            document.body = oldBody;
            standIn.parentNode.replaceChild(map.parent, standIn);
            minimizeElement(map.parent);
            map.setSize(map._smallSize[0], map._smallSize[1]);
            backDiv.style.display = 'none';
            overlayDiv.style.display = 'block';
        }
    };
    return mobile.add(map);
};
wax = wax || {};
wax.mm = wax.mm || {};

// Point Selector
// --------------
//
// This takes an object of options:
//
// * `callback`: a function called with an array of `com.modestmaps.Location`
//   objects when the map is edited
//
// It also exposes a public API function: `addLocation`, which adds a point
// to the map as if added by the user.
wax.mm.pointselector = function(map, tilejson, opts) {
    var mouseDownPoint = null,
        mouseUpPoint = null,
        tolerance = 5,
        overlayDiv,
        MM = com.modestmaps,
        pointselector = {},
        locations = [];

    var callback = (typeof opts === 'function') ?
        opts :
        opts.callback;

    // Create a `com.modestmaps.Point` from a screen event, like a click.
    function makePoint(e) {
        var coords = wax.util.eventoffset(e);
        var point = new MM.Point(coords.x, coords.y);
        // correct for scrolled document

        // and for the document
        var body = {
            x: parseFloat(MM.getStyle(document.documentElement, 'margin-left')),
            y: parseFloat(MM.getStyle(document.documentElement, 'margin-top'))
        };

        if (!isNaN(body.x)) point.x -= body.x;
        if (!isNaN(body.y)) point.y -= body.y;

        // TODO: use wax.util.offset
        // correct for nested offsets in DOM
        for (var node = map.parent; node; node = node.offsetParent) {
            point.x -= node.offsetLeft;
            point.y -= node.offsetTop;
        }
        return point;
    }

    // Currently locations in this control contain circular references to elements.
    // These can't be JSON encoded, so here's a utility to clean the data that's
    // spit back.
    function cleanLocations(locations) {
        var o = [];
        for (var i = 0; i < locations.length; i++) {
            o.push(new MM.Location(locations[i].lat, locations[i].lon));
        }
        return o;
    }

    // Attach this control to a map by registering callbacks
    // and adding the overlay

    // Redraw the points when the map is moved, so that they stay in the
    // correct geographic locations.
    function drawPoints() {
        var offset = new MM.Point(0, 0);
        for (var i = 0; i < locations.length; i++) {
            var point = map.locationPoint(locations[i]);
            if (!locations[i].pointDiv) {
                locations[i].pointDiv = document.createElement('div');
                locations[i].pointDiv.className = 'wax-point-div';
                locations[i].pointDiv.style.position = 'absolute';
                locations[i].pointDiv.style.display = 'block';
                // TODO: avoid circular reference
                locations[i].pointDiv.location = locations[i];
                // Create this closure once per point
                MM.addEvent(locations[i].pointDiv, 'mouseup',
                    (function selectPointWrap(e) {
                    var l = locations[i];
                    return function(e) {
                        MM.removeEvent(map.parent, 'mouseup', mouseUp);
                        pointselector.deletePoint(l, e);
                    };
                })());
                map.parent.appendChild(locations[i].pointDiv);
            }
            locations[i].pointDiv.style.left = point.x + 'px';
            locations[i].pointDiv.style.top = point.y + 'px';
        }
    }

    function mouseDown(e) {
        mouseDownPoint = makePoint(e);
        MM.addEvent(map.parent, 'mouseup', mouseUp);
    }

    // Remove the awful circular reference from locations.
    // TODO: This function should be made unnecessary by not having it.
    function mouseUp(e) {
        if (!mouseDownPoint) return;
        mouseUpPoint = makePoint(e);
        if (MM.Point.distance(mouseDownPoint, mouseUpPoint) < tolerance) {
            pointselector.addLocation(map.pointLocation(mouseDownPoint));
            callback(cleanLocations(locations));
        }
        mouseDownPoint = null;
    }

    // API for programmatically adding points to the map - this
    // calls the callback for ever point added, so it can be symmetrical.
    // Useful for initializing the map when it's a part of a form.
    pointselector.addLocation = function(location) {
        locations.push(location);
        drawPoints();
        callback(cleanLocations(locations));
    };

    pointselector.add = function(map) {
        MM.addEvent(map.parent, 'mousedown', mouseDown);
        map.addCallback('drawn', drawPoints());
        return this;
    };

    pointselector.deletePoint = function(location, e) {
        if (confirm('Delete this point?')) {
            location.pointDiv.parentNode.removeChild(location.pointDiv);
            locations.splice(wax.util.indexOf(locations, location), 1);
            callback(cleanLocations(locations));
        }
    };

    return pointselector.add(map);
};
wax = wax || {};
wax.mm = wax.mm || {};

// ZoomBox
// -------
// An OL-style ZoomBox control, from the Modest Maps example.
wax.mm.zoombox = function(map) {
    // TODO: respond to resize
    var zoombox = {},
        mm = com.modestmaps,
        drawing = false,
        box,
        mouseDownPoint = null;

    function getMousePoint(e) {
        // start with just the mouse (x, y)
        var point = new mm.Point(e.clientX, e.clientY);
        // correct for scrolled document
        point.x += document.body.scrollLeft + document.documentElement.scrollLeft;
        point.y += document.body.scrollTop + document.documentElement.scrollTop;

        // correct for nested offsets in DOM
        for (var node = map.parent; node; node = node.offsetParent) {
            point.x -= node.offsetLeft;
            point.y -= node.offsetTop;
        }
        return point;
    }

    function mouseUp(e) {
        if (!drawing) return;

        drawing = false;
        var point = getMousePoint(e);

        var l1 = map.pointLocation(point),
            l2 = map.pointLocation(mouseDownPoint);

        map.setExtent([l1, l2]);

        box.style.display = 'none';
        mm.removeEvent(map.parent, 'mousemove', mouseMove);
        mm.removeEvent(map.parent, 'mouseup', mouseUp);

        map.parent.style.cursor = 'auto';
    }

    function mouseDown(e) {
        if (!(e.shiftKey && !this.drawing)) return;

        drawing = true;
        mouseDownPoint = getMousePoint(e);

        box.style.left = mouseDownPoint.x + 'px';
        box.style.top = mouseDownPoint.y + 'px';

        mm.addEvent(map.parent, 'mousemove', mouseMove);
        mm.addEvent(map.parent, 'mouseup', mouseUp);

        map.parent.style.cursor = 'crosshair';
        return mm.cancelEvent(e);
    }

    function mouseMove(e) {
        if (!drawing) return;

        var point = getMousePoint(e);
        box.style.display = 'block';
        if (point.x < mouseDownPoint.x) {
            box.style.left = point.x + 'px';
        } else {
            box.style.left = mouseDownPoint.x + 'px';
        }
        box.style.width = Math.abs(point.x - mouseDownPoint.x) + 'px';
        if (point.y < mouseDownPoint.y) {
            box.style.top = point.y + 'px';
        } else {
            box.style.top = mouseDownPoint.y + 'px';
        }
        box.style.height = Math.abs(point.y - mouseDownPoint.y) + 'px';
        return mm.cancelEvent(e);
    }

    zoombox.add = function(map) {
        // Use a flag to determine whether the zoombox is currently being
        // drawn. Necessary only for IE because `mousedown` is triggered
        // twice.
        box = box || document.createElement('div');
        box.id = map.parent.id + '-zoombox-box';
        box.className = 'zoombox-box';
        map.parent.appendChild(box);
        mm.addEvent(map.parent, 'mousedown', mouseDown);
        return this;
    };

    zoombox.remove = function() {
        map.parent.removeChild(box);
        mm.removeEvent(map.parent, 'mousedown', mouseDown);
    };

    return zoombox.add(map);
};
wax = wax || {};
wax.mm = wax.mm || {};

// Zoomer
// ------
// Add zoom links, which can be styled as buttons, to a `modestmaps.Map`
// control. This function can be used chaining-style with other
// chaining-style controls.
wax.mm.zoomer = function(map) {
    var mm = com.modestmaps;

    var zoomin = document.createElement('a');
    zoomin.innerHTML = '+';
    zoomin.href = '#';
    zoomin.className = 'zoomer zoomin';
    mm.addEvent(zoomin, 'mousedown', function(e) {
        mm.cancelEvent(e);
    });
    mm.addEvent(zoomin, 'dblclick', function(e) {
        mm.cancelEvent(e);
    });
    mm.addEvent(zoomin, 'click', function(e) {
        mm.cancelEvent(e);
        map.zoomIn();
    }, false);

    var zoomout = document.createElement('a');
    zoomout.innerHTML = '-';
    zoomout.href = '#';
    zoomout.className = 'zoomer zoomout';
    mm.addEvent(zoomout, 'mousedown', function(e) {
        mm.cancelEvent(e);
    });
    mm.addEvent(zoomout, 'dblclick', function(e) {
        mm.cancelEvent(e);
    });
    mm.addEvent(zoomout, 'click', function(e) {
        mm.cancelEvent(e);
        map.zoomOut();
    }, false);

    var zoomer = {
        add: function(map) {
            map.addCallback('drawn', function(map, e) {
                if (map.coordinate.zoom === map.provider.outerLimits()[0].zoom) {
                    zoomout.className = 'zoomer zoomout zoomdisabled';
                } else if (map.coordinate.zoom === map.provider.outerLimits()[1].zoom) {
                    zoomin.className = 'zoomer zoomin zoomdisabled';
                } else {
                    zoomin.className = 'zoomer zoomin';
                    zoomout.className = 'zoomer zoomout';
                }
            });
            return this;
        },
        appendTo: function(elem) {
            wax.util.$(elem).appendChild(zoomin);
            wax.util.$(elem).appendChild(zoomout);
            return this;
        }
    };
    return zoomer.add(map);
};
var wax = wax || {};
wax.mm = wax.mm || {};

// A layer connector for Modest Maps conformant to TileJSON
// https://github.com/mapbox/tilejson
wax.mm.connector = function(options) {
    this.options = {
        tiles: options.tiles,
        scheme: options.scheme || 'xyz',
        minzoom: options.minzoom || 0,
        maxzoom: options.maxzoom || 22
    };
};

wax.mm.connector.prototype = {
    outerLimits: function() {
        return [
            new com.modestmaps.Coordinate(0,0,0).zoomTo(this.options.minzoom),
            new com.modestmaps.Coordinate(1,1,0).zoomTo(this.options.maxzoom)
        ];
    },
    getTileUrl: function(c) {
        if (!(coord = this.sourceCoordinate(c))) return null;

        coord.row = (this.options.scheme === 'tms') ?
            Math.pow(2, coord.zoom) - coord.row - 1 :
            coord.row;

        return this.options.tiles[parseInt(Math.pow(2, coord.zoom) * coord.row + coord.column, 10) %
            this.options.tiles.length]
            .replace('{z}', coord.zoom.toFixed(0))
            .replace('{x}', coord.column.toFixed(0))
            .replace('{y}', coord.row.toFixed(0));
    }
};

// Wax shouldn't throw any exceptions if the external it relies on isn't
// present, so check for modestmaps.
if (com && com.modestmaps) {
    com.modestmaps.extend(wax.mm.connector, com.modestmaps.MapProvider);
}
(function(context) {
    var s = new SphericalMercator();
    var savedD = false;

    function utfgridquery(tilejson, point, callback) {
      function getTile(d) {
        savedD = d;
        var xy = s.px([
          point.lon, point.lat], d.maxzoom, true);

        var y = (Math.pow(2, d.maxzoom) - 1) -
            Math.floor(xy[1] / 256);

        var gurl = d.grids[0]
          .replace('{z}', d.maxzoom)
          .replace('{x}', Math.floor(xy[0] / 256))
          .replace('{y}', y);

        wax.request.get(gurl, function(err, t) {
            var g = wax.GridInstance(t);
            var f = g.gridFeature(
                (xy[0] / 256) % 256,
                (xy[1] / 256) % 256);
            callback(f);
        });
      }
      if (!savedD) {
          wax.tilejson(tilejson, getTile);
      } else {
          getTile(savedD);
      }
    }
    context.utfgridquery = utfgridquery;
})(this);
(function(context, MM) {
    var easey = {},
        i; // the interval!

    var easings = {
        easeIn: function(t) { return t * t; },
        easeOut: function(t) { return Math.sin(t * Math.PI / 2); },
        linear: function(t) { return t; }
    };

    easey.cancel = function() {
        if (i) { window.clearInterval(i); }
    };

    easey.sequence = function(map, steps) {
        function noop() {}
        for (var i = 0; i < (steps.length - 1); i++) {
            var c = steps[i].callback || noop;
            steps[i].callback = (function(j, ca) {
                return function() {
                    if (ca) ca();
                    easey.slow(map, steps[j]);
                };
            })(i + 1, c);
        }
        return easey.slow(map, steps[0]);
    };

    easey.cancel = function() {
        if (i) { window.clearInterval(i); }
    };

    easey.slow = function(map, options) {
        if (i) { window.clearInterval(i); }

        var start = (+new Date()),
            startZoom = map.getZoom(),
            startCenter = map.getCenter(),
            startCoordinate = map.coordinate.copy();

        if (typeof options === 'number') {
            options = { zoom: options };
        } else if (options.lat && typeof options.lat === 'number') {
            options = { location: options };
        } else if (options.x && typeof options.x === 'number') {
            options = { coordinate: map.pointCoordinate(options) };
        }

        if (options.point) {
            options.coordinate = map.pointCoordinate(options.point);
        }

        z = options.zoom || startZoom;
        time = options.time || 1000;
        callback = options.callback || function() {};
        ease = easings[options.ease] || easings.easeOut;

        i = window.setInterval(function() {
            // use shift-double-click to zoom out
            var delta = (+new Date()) - start;
            if (delta > time) {
                map.setZoom(z);
                window.clearInterval(i);
                return callback();
            }

            var t = ease(delta / time);
            var tz = (z == startZoom) ? z : (startZoom * (1 - t) + z * t);
            if (options.location) {
                map.setCenterZoom(MM.Location.interpolate(startCenter, options.location, t),
                    tz);
            } else if (options.coordinate) {
                var a = startCoordinate.copy().zoomTo(tz);
                var b = options.coordinate.copy().zoomTo(tz);
                map.coordinate = new MM.Coordinate(
                    (a.row * (1 - t)) +    (b.row * t),
                    (a.column * (1 - t)) + (b.column * t),
                    tz);
            } else if (options.zoom) {
                map.setZoom(tz);
            }
            map.draw();
        }, 1);
    };

    // Handle double clicks, that zoom the map in one zoom level.
    easey.DoubleClickHandler = function(map) {
        if (map !== undefined) {
            this.init(map);
        }
    };

    easey.DoubleClickHandler.prototype = {

        init: function(map) {
            this.map = map;
            MM.addEvent(map.parent, 'dblclick', this.getDoubleClick());
        },

        doubleClickHandler: null,

        getDoubleClick: function() {

            // Ensure that this handler is attached once.
            if (!this.doubleClickHandler) {
                var theHandler = this;
                this.doubleClickHandler = function(e) {
                    var map = theHandler.map,
                        location = map.pointLocation(MM.getMousePoint(e, map)),
                        z = map.getZoom() + (e.shiftKey ? -1 : 1);

                    easey.slow(map, {
                        zoom: z,
                        location: location,
                        time: 100
                    });

                    return MM.cancelEvent(e);
                };
            }
            return this.doubleClickHandler;
        }
    };

    // A handler that allows mouse-wheel zooming - zooming in
    // when page would scroll up, and out when the page would scroll down.
    easey.MouseWheelHandler = function(map) {
        if (map !== undefined) {
            this.init(map);
        }
    };

    easey.MouseWheelHandler.prototype = {

        init: function(map) {
            this.map = map;
            MM.addEvent(map.parent, 'mousewheel', this.getMouseWheel());
        },

        mouseWheelHandler: null,

        getMouseWheel: function() {
            // Ensure that this handler is attached once.
            if (!this.mouseWheelHandler) {
                var theHandler = this;
                var prevTime = new Date().getTime();
                this.mouseWheelHandler = function(e) {

                    var delta = 0;
                    if (e.wheelDelta) {
                        delta = e.wheelDelta;
                    } else if (e.detail) {
                        delta = -e.detail;
                    }

                    // limit mousewheeling to once every 200ms
                    var timeSince = new Date().getTime() - prevTime;

                    if (Math.abs(delta) > 0 && (timeSince > 200)) {
                        var map = theHandler.map,
                            location = map.pointLocation(MM.getMousePoint(e, map)),
                            z = map.getZoom();
                        easey.slow(map, {
                            zoom: z + (delta > 0 ? 1 : -1),
                            location: location,
                            time: 100
                        });

                        prevTime = new Date().getTime();
                    }

                    // Cancel the event so that the page doesn't scroll
                    return MM.cancelEvent(e);
                };
            }
            return this.mouseWheelHandler;
        }
    };

    // Handle the use of mouse dragging to pan the map.
    easey.DragHandler = function(map) {
        if (map !== undefined) {
            this.init(map);
        }
    };

    easey.DragHandler.prototype = {

        init: function(map) {
            this.map = map;
            MM.addEvent(map.parent, 'mousedown', MM.bind(this.mouseDown, this));
        },

        mouseDown: function(e) {
            MM.addEvent(document, 'mouseup', this._mouseUp = MM.bind(this.mouseUp, this));
            MM.addEvent(document, 'mousemove', this._mouseMove = MM.bind(this.mouseMove, this));

            this.lastMouse = MM.getMousePoint(e, this.map);
            this.prevMouse = MM.getMousePoint(e, this.map);
            this.map.parent.style.cursor = 'move';

            return MM.cancelEvent(e);
        },

        mouseMove: function(e) {
            if (this.prevMouse) {
                var nextMouse = MM.getMousePoint(e, this.map);
                this.map.panBy(
                    nextMouse.x - this.prevMouse.x,
                    nextMouse.y - this.prevMouse.y);

                this.lastMouse = new MM.Point(this.prevMouse.x, this.prevMouse.y);
                this.prevMouse = MM.getMousePoint(e, this.map);

                this.prevMouse.t = +new Date();
            }

            return MM.cancelEvent(e);
        },

        mouseUp: function(e) {
            MM.removeEvent(document, 'mouseup', this._mouseUp);
            MM.removeEvent(document, 'mousemove', this._mouseMove);

            var angle = Math.atan2(
                this.lastMouse.y - this.prevMouse.y,
                this.lastMouse.x - this.prevMouse.x);
            var distance = MM.Point.distance(this.lastMouse, this.prevMouse);
            var speed = Math.min(Math.log(1 + (distance / ((+new Date()) - this.prevMouse.t))) * 90, 300);

            if (isNaN(angle)) return;

            var center = this.map.coordinatePoint(this.map.coordinate);
            var pan = this.map.pointLocation(new MM.Point(
                center.x + (Math.cos(angle) * speed),
                center.y + (Math.sin(angle) * speed)));

            easey.slow(this.map, {
                pan: pan
            }, speed / 100);
            this.prevMouse = null;
            this.map.parent.style.cursor = '';

            return MM.cancelEvent(e);
        }
    };

    this.easey = easey;
})(this, com.modestmaps);
var map;
var mm = com.modestmaps;

$.domReady(function() {
    var drawertemplate = _.template($('#drawer-template').html());

    function googleDirections(a, b) {
        return 'http://maps.google.com/maps?saddr={source}&daddr={dest}'
            .replace('{source}', a.lat + ',' + a.lon)
            .replace('{dest}', encodeURIComponent(b));
    }

    function gridQuery(l) {
      utfgridquery('http://d.tiles.mapbox.com/tmcw/1.0.0/superfundvoronoi/layer.json', {
        lat: l.lat,
        lon: l.lon
        }, function(f) {
            $('.your-name').text(f.FAC_NAME);
            $('.your-location').html(f.LOC_ADD + '<br />' + f.LOC_CITY + ', ' + f.LOC_STATE);
            $('.your-directions').attr('href', googleDirections(l, f.LOC_ADD + ' ' + f.LOC_CITY + ' ' + f.LOC_STATE));
            window.loadSite(f.LOC_STATE + f.REG_ID);
            easey.slow(map, {
                location: new mm.Location(l.lat, l.lon),
                zoom: 7,
                time: 1000
            });

        });
    }

    window.loadSite = function(siteid) {
        reqwest({
            url: 'sites/' + siteid + '.json',
            type: 'json',
            success: function(d) {
                $('.drawer').html(drawertemplate({
                    sites: d
                }));
            }
        });
    };

    // if (navigator && navigator.geolocation) {
    //     navigator.geolocation.getCurrentPosition(function(res) {
    //       gridQuery({
    //         lat: res.coords.latitude,
    //         lon: res.coords.longitude
    //       });
    //     });
    // }

    wax.tilejson('http://a.tiles.mapbox.com/tmcw/1.0.0/tmcw.superfund_8550eb,mapbox.world-glass/layer.json', function(tj) {
        map = new mm.Map('map',
            new wax.mm.connector(tj),
            null, [
                new mm.DragHandler(),
                new easey.DoubleClickHandler(),
                new easey.MouseWheelHandler(),
                new mm.TouchHandler()
            ]);
        map.setCenterZoom(new mm.Location(38, -96), 4);
        wax.mm.zoombox(map);
        wax.mm.zoomer(map).appendTo(map.parent);
        wax.mm.interaction(map, tj, {
            callbacks: new toolbit(),
            clickHandler: function(id) {
                window.loadSite(id);
            }
        });
    });

    $('#butte').click(function(e) {
        e.preventDefault();
        easey.slow(map, {
            zoom:8,
            location: new mm.Location(
                46.07953676396906,
                -112.68265950280083)
        });
    });


    $('#lovecanal').click(function(e) {
        e.preventDefault();
        easey.slow(map, {
            zoom:8,
            location: new mm.Location(
                43.06919439483221,
                -78.93251611607292
            )
        });
    });

    $('#toggle-mapquest').click(function(e) {
      e.preventDefault();
      wax.tilejson('http://a.tiles.mapbox.com/tmcw/1.0.0/externals.streetlevel,tmcw.superfund_8550eb/layer.json', function(tj) {
        map.setProvider(new wax.mm.connector(tj));
      });
    });
    $('#toggle-mapbox').click(function(e) {
      e.preventDefault();
      wax.tilejson('http://a.tiles.mapbox.com/tmcw/1.0.0/tmcw.superfund_8550eb,mapbox.world-glass/layer.json', function(tj) {
        map.setProvider(new wax.mm.connector(tj));
      });
    });
});
