// This will be a compiler when the runtime is attached to a jison parser.
var parse;
var assert = require('assert');
var inspect = require('util').inspect;

var forms = {}
exports.Form = Form;
function Form(name) {
  if (forms[name]) return forms[name];
  if (!(this instanceof Form)) return new Form(name);
  this.name = name;
  forms[name] = this;
}
Form.prototype.inspect = function () {
  return "\033[34;1m@" + this.name + "\033[0m";
};
var symbols = {}
exports.Symbol = Symbol;
function Symbol(name) {
  if (symbols[name]) return symbols[name];
  if (!(this instanceof Symbol)) return new Symbol(name);
  this.name = name;
  symbols[name] = this;
}
Symbol.prototype.inspect = function () {
  return "\033[35m:" + this.name + "\033[0m";
};

var metas = new WeakMap();
var pmetas = new Map();
function getMeta(obj) {
  var type = typeof obj;
  var mtab = (type === "object" || type === "function") ? metas : pmetas;
  if (mtab.has(obj)) {
    return mtab.get(obj);
  }
  var meta = {};
  mtab.set(obj, meta);
  if (Array.isArray(obj) || type === "string" || Buffer.isBuffer(obj)) {
    meta.len = function () { return obj.length; };
  }
  else if (type === "function") {
    meta.call = obj;
  }
  else {
    meta.keys = function () { return Object.keys(obj); };
  }
  return meta;
}
function metaSet(obj, key, value) {
  var meta = getMeta(obj);
  if (key instanceof Form) {
    return meta[key.name] = value;
  }
  if (key in obj) {
    return obj[key] = value;
  }
  if (meta.set) {
    return meta.set(key, value);
  }
  return obj[key] = value;
}
function metaGet(obj, key) {
  var meta = getMeta(obj);
  if (key instanceof Form) {
    return meta[key.name];
  }
  if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }
  if (meta.get) {
    return meta.get(key);
  }
}
function metaHas(obj, key) {
  var meta = getMeta(obj);
  if (key instanceof Form) {
    return key.value in meta;
  }
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    return true;
  }
  if (meta.has) {
    return meta.has();
  }
  return false;
}
function metaDelete(obj, key) {
  var meta = getMeta(obj);
  if (key instanceof Form) {
    delete meta[key.name];
    return;
  }
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    delete obj[key];
    return;
  }
  if (meta.delete) {
    return meta.delete(key);
  }
}

function Scope(parent) {
  this.scope = Object.create(parent || null);
}

function getForm(array) {
  return Array.isArray(array) && array[0] instanceof Form && array[0].name;
}

Scope.prototype.run = function (code) {
  // Evaluate form codes
  var form = getForm(code);
  if (form) {
    // console.log("running", code)
    return this[form].apply(this, code.slice(1));
  }
  if (code instanceof Symbol) {
    return this.lookup(code.name);
  }
  return code;
};

Scope.prototype.runCodes = function (codes) {
  var result;
  for (var i = 0, l = codes.length; i < l; i++) {
    var code = codes[i];
    result = this.run(code);
  }
  return result;
}

var hasOwn = Object.prototype.hasOwnProperty;
var slice = Array.prototype.slice;
var map = Array.prototype.map;

Scope.prototype.spawn = function () {
  return new Scope(this.scope);
};

Scope.prototype.params = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    this.scope[arguments[i]] = this.arguments[i];
  }
};

Scope.prototype.vars = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    this.scope[arguments[i]] = undefined;
  }
};

Scope.prototype.fn = function () {
  var closure = this.scope;
  var codes = slice.call(arguments);
  return function jackFunction() {
    var child = new Scope(closure);
    child.arguments = arguments;
    return child.runCodes(codes);
  };
};

Scope.prototype.call = function (val) {
  val = this.run(val);
  var meta = getMeta(val);
  if (!meta.call) {
    return this.abort("Attempt to call non-callable value");
  }
  try {
    return meta.call.apply(null, slice.call(arguments, 1).map(this.run, this));
  }
  catch (err) {
    if (err.code === "RETURN") return err.value;
    throw err;
  }
};

Scope.prototype.le = function (a, b) {
  return this.run(a) <= this.run(b);
};

Scope.prototype.lt = function (a, b) {
  return this.run(a) < this.run(b);
};

Scope.prototype.eq = function (a, b) {
  return this.run(a) === this.run(b);
};

Scope.prototype.neq = function (a, b) {
  return this.run(a) !== this.run(b);
};

Scope.prototype.in = function (val, key) {
  val = this.run(val);
  key = this.run(key);
  return metaHas(val, key);
};

Scope.prototype.add = function (a, b) {
  return this.run(a) + this.run(b);
};

Scope.prototype.sub = function (a, b) {
  return this.run(a) - this.run(b);
};

Scope.prototype.mul = function (a, b) {
  return this.run(a) * this.run(b);
};

Scope.prototype.div = function (a, b) {
  return Math.floor(this.run(a) / this.run(b));
};

Scope.prototype.pow = function (a, b) {
  return Math.pow(this.run(a), this.run(b));
};

Scope.prototype.mod = function (a, b) {
  return this.run(a) % this.run(b);
};

Scope.prototype.unm = function (a) {
  return -this.run(a);
};

Scope.prototype.or = function (a, b) {
  return this.run(a) || this.run(b);
};

Scope.prototype.and = function (a, b) {
  return this.run(a) && this.run(b);
};

Scope.prototype.xor = function (a, b) {
  return !this.run(a) !== !this.run(b);
};

Scope.prototype.not = function (a) {
  return !this.run(a);
};

Scope.prototype.len = function (obj) {
  obj = this.run(obj);
  var meta = getMeta(obj);
  if (meta.len) return meta.len();
};

Scope.prototype.set = function (obj, key, value) {
  obj = this.run(obj);
  key = this.run(key);
  value = this.run(value);
  return metaSet(obj, key, value);
};

Scope.prototype.get = function (obj, key) {
  obj = this.run(obj);
  key = this.run(key);
  return metaGet(obj, key);
};

Scope.prototype.delete = function (obj, key) {
  obj = this.run(obj);
  key = this.run(key);
  return metaDelete(obj, key);
};

Scope.prototype.return = function (val) {
  throw {code:"RETURN", value: this.run(val)};
};

Scope.prototype.abort = function (message) {
  message = this.run(message);
  console.error(message);
  process.exit();
  // console.log("ABORT", {message:message});
  // throw new Error(message);
};


Scope.prototype.assign = function (name, value) {
  var scope = this.scope;
  while (scope) {
    if (hasOwn.call(scope, name)) return scope[name] = this.run(value);
    scope = Object.getPrototypeOf(scope);
  }
  return this.abort("Attempt to access undefined variable '" + name + "'");
};

Scope.prototype.lookup = function (name) {
  if (name in this.scope) {
    return this.scope[name];
  }
  return this.abort("Attempt to access undefined variable '" + name + "'");
};

Scope.prototype.if = function () {
  var pairs = slice.call(arguments);
  for (var i = 0, l = pairs.length; i + 1 < l; i += 2) {
    var cond = this.run(pairs[i]);
    if (cond) {
      return this.runCodes(pairs[i + 1]);
    }
  }
  if (i < l) {
    return this.runCodes(pairs[i]);
  }
};

Scope.prototype.while = function (cond) {
  var child = this.spawn();
  var code = slice.call(arguments, 1);
  var ret;
  while (child.run(cond)) {
    ret = child.runCodes(code);
  }
  return ret;
};

function iValues(list) {
  var meta = getMeta(list);
  if (meta.call) {
    return meta.call;
  }
  if (meta.len) {
    var i = 0, length = meta.len();
    return function () {
      if (i < length) {
        return metaGet(list, i++);
      }
    };
  }
  if (meta.keys) {
    var it = iValues(meta.keys());
    return function () {
      var key = it();
      if (key !== undefined) {
        return metaGet(list, key);
      }
    };
  }
  throw new Error("Can't iterate over value that doesn't have @call, @len, or @keys");
}

function iPairs(list) {
  var meta = getMeta(list);
  if (meta.keys) {
    var it = iValues(meta.keys());
    return function () {
      var key = it();
      if (key !== undefined) {
        return [key, metaGet(list, key)];
      }
    };
  }
  if (meta.len) {
    var i = 0, length = meta.len();
    return function () {
      if (i < length) {
        var k = i++;
        return [k, metaGet(list, k)];
      }
    };
  }
  if (meta.call) {
    var k = 0;
    return function () {
      var next = meta.call();
      if (next !== undefined) {
        return [k++, next];
      }
    };
  }
  throw new Error("Can't iterate over value that doesn't have @call, @len, or @keys");
}

function iKeys(list) {
  var meta = getMeta(list);
  if (meta.keys) {
    return iValues(meta.keys());
  }
  if (meta.len) {
    var i = 0, length = meta.len();
    return function () {
      if (i < length) {
        return i++;
      }
    };
  }
  if (meta.call) {
    var i = 0;
    return function () {
      var next = meta.call();
      if (next !== undefined) {
        return i++;
      }
    };
  }
  throw new Error("Can't iterate over value that doesn't have @call, @len, or @keys");
}

Scope.prototype.iterate = function (list, names, filter, code, callback) {
  list = this.run(list);
  var child = this.spawn();
  var ret;
  var meta = getMeta(list);
  if (meta.call) {
    var i = 0;
    var item;
    while ((item = meta.call()) !== undefined) {
      if (names.length === 2) {
        child.scope[names[0]] = i++;
        child.scope[names[1]] = item;
      }
      else {
        child.scope[names[0]] = item;
      }
      if (filter && !child.run(filter)) continue;
      ret = child.runCodes(code);
      if (callback) callback(ret);
    }
  }
  else if (meta.len) {
    for (var i = 0, l = meta.len(); i < l; i++) {
      var item = metaGet(list, i);
      if (names.length === 2) {
        child.scope[names[0]] = i;
        child.scope[names[1]] = item;
      }
      else {
        child.scope[names[0]] = item;
      }
      if (filter && !child.run(filter)) continue;
      ret = child.runCodes(code);
      if (callback) callback(ret);
    }
  }
  else if (meta.keys) {
    var keyIt = iValues(meta.keys());
    var key;
    while ((key = keyIt()) !== undefined) {
      var item = metaGet(list, key);
      if (names.length === 2) {
        child.scope[names[0]] = key;
        child.scope[names[1]] = item;
      }
      else {
        child.scope[names[0]] = item;
      }
      if (filter && !child.run(filter)) continue;
      ret = child.runCodes(code);
      if (callback) callback(ret);
    }
  }
  return ret;
};

Scope.prototype.for = function (list, names, filter) {
  return this.iterate(list, names, filter, slice.call(arguments, 2));
};

Scope.prototype.map = function (list, names, filter) {
  var result = [];
  this.iterate(list, names, filter, slice.call(arguments, 2), result.push.bind(result));
  return result;
};


Scope.prototype.list = function () {
  return map.call(arguments, this.run, this);
};

function Tuple(len) {
  Array.call(this, len);
  this.length = len;
}
Tuple.prototype.__proto__ = Array.prototype;
Tuple.prototype.inspect = function () {
  return "(" + this.map(inspect).join(", ") + ")";
};

Scope.prototype.tuple = function () {
  var l = arguments.length;
  var tuple = new Tuple(l);
  for (var i = 0; i < l; i++) {
    tuple[i] = this.run(arguments[i]);
  }
  return tuple;
};


Scope.prototype.object = function () {
  var obj = Object.create(null);
  for (var i = 0, l = arguments.length; i < l; i += 2) {
    var key = this.run(arguments[i]);
    var value = this.run(arguments[i + 1]);
    metaSet(obj, key, value);
  }
  return obj;
};

var is = {
  Integer: function (val) {
    return val >>> 0 === val;
  },
  Null: function (val) {
    return val === undefined;
  },
  Boolean: function (val) {
    return val === true || val === false;
  },
  String: function (val) {
    return typeof val === "string";
  },
  Buffer: function (val) {
    return Buffer.isBuffer(val);
  },
  Function: function (val) {
    return typeof val === "function"
  },
  Tuple: function (val) {
    return val instanceof Tuple;
  },
  List: function (val) {
    return Array.isArray(val);
  },
  Object: function (val) {
    return val && val.__proto__ === null;
  }
}

Scope.prototype.is = function (a, b) {
  a = this.run(a);
  var fn = is[b];
  if (!fn) return this.abort("Unknown type " + b);
  return fn(a);
};


Scope.prototype.eval = function (string) {
  var codes = parse(string);
  return this.runCodes(codes);
};

exports.eval = function (string) {
  var scope = new Scope({
    lines: string.split("\n"),
    source: string,
    substr: function (string, start, len) {
      return string.substr(start, len);
    },
    parseint: function (num, base) {
      return parseInt(num, base || 10);
    },
    print: console.log.bind(console),
    range: function range(n) {
      var i = 0, v;
      return function () {
        v = i;
        i++;
        if (v < n) return v;
        else i = 0;
      };
    },
    rand: function rand(n) {
      return Math.floor(Math.random() * n);
    },
    inspect: function (val, d) {
      return inspect(val, false, d, true);
    },
    bind: function (fn) {
      var args = slice.call(arguments, 1);
      return function partial() {
        return fn.apply(this, args.concat(slice.call(arguments)));
      };
    },
    "i-values": iValues,
    "i-pairs": iPairs,
    "i-keys": iKeys,
    "i-map": function (callback, it) {
      it = iValues(it);
      return function () {
        var next = it();
        if (next !== undefined) return callback(next);
      };
    },
    "i-filter": function (callback, it) {
      it = iValues(it);
      return function () {
        var next;
        while ((next = it()) !== undefined && !callback(next));
        return next;
      };
    },
    "i-chunk": function (size, it) {
      it = iValues(it);
      return function () {
        var next, chunk = [];
        while (chunk.length < size && (next = it()) !== undefined) {
          chunk.push(next);
        }
        if (chunk.length) return chunk;
      };
    },
    "i-all?": function (callback, it) {
      it = iValues(it);
      var next;
      while ((next = it()) !== undefined) {
        if (!callback(next)) return false;
      }
      return true;
    },
    "i-any?": function (callback, it) {
      it = iValues(it);
      var next;
      while ((next = it()) !== undefined) {
        if (callback(next)) return true;
      }
      return false;
    },
    "i-collect": function (it) {
      it = iValues(it);
      var arr = [], next;
      while ((next = it()) !== undefined) {
        arr.push(next);
      }
      return arr;
    },
    "i-zip": function () {
      var its = slice.call(arguments).map(iValues);
      var num = its.length;
      var alive = true;
      return function () {
        if (!alive) { return; }
        var part = [];
        var good = false;
        for (var i = 0; i < num; i++) {
          var item = part[i] = its[i]();
          if (item === undefined) {
            alive = false;
            return;
          }
        }
        return part;
      };
    },
    "i-merge": function (it) {
      it = iValues(it);
      var obj = Object.create(null);
      var pair;
      while ((pair = it()) !== undefined) {
        obj[metaGet(pair, 0)] = metaGet(pair, 1);
      }
      return obj;
    },
    "i-each": function (callback, it) {
      var next;
      var ret;
      while ((next = it()) !== undefined) {
        ret = callback(next);
      }
      return ret;
    }
  });
  return scope.eval(string);
};

exports.attachParser = function (parser) {
  parser.yy.F = Form
  parser.yy.S = Symbol;
  parse = parser.parse.bind(parser);
};

Number.prototype.times = function (callback) {
  var value;
  for (var i = 0; i < this; i++) {
    value = callback(i);
  }
  return value;
};
