// This will be a compiler when the runtime is attached to a jison parser.
var parse;
var assert = require('assert');

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

Scope.prototype.object = function () {
  var obj = {};
  for (var i = 0, l = arguments.length; i < l; i += 2) {
    obj[this.run(arguments[i])] = this.run(arguments[i + 1]);
  }
  return obj;
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
  if (!val instanceof Function) {
    return this.abort("Attempt to call non-function");
  }
  try {
    return val.apply(null, slice.call(arguments, 1).map(this.run, this));
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

Scope.prototype.in = function (val, item) {
  return this.run(item) in this.run(val);
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
  return this.run(a) / this.run(b);
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

Scope.prototype.set = function (obj, key, value) {
  obj = this.run(obj);
  key = this.run(key);
  value = this.run(value);
  return obj[key] = value;
};

Scope.prototype.get = function (obj, key) {
  obj = this.run(obj);
  key = this.run(key);
  return obj[key];
};

Scope.prototype.return = function (val) {
  throw {code:"RETURN", value: this.run(val)};
};

Scope.prototype.abort = function (message) {
  console.error(message);
  process.exit();
  // console.log("ABORT", {message:message});
  // throw new Error(message);
};


Scope.prototype.assign = function (name, value) {
  // console.log("ASSIGN", {name:name,value:value});
  var scope = this.scope;
  while (scope) {
    if (hasOwn.call(scope, name)) return scope[name] = this.run(value);
    scope = Object.getPrototypeOf(scope);
  }
  return this.abort("Attempt to access undefined variable '" + name + "'");
};

Scope.prototype.lookup = function (name) {
  // console.log("LOOKUP", {name:name});
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

Scope.prototype.for = function (list, names) {
  list = this.run(list);
  var code = slice.call(arguments, 2);
  var child = this.spawn();
  var ret;
  if (typeof list === "function") {
    var i = 0;
    var item;
    while ((item = list()) !== undefined) {
      if (names.length === 2) {
        child.scope[names[0]] = i;
        child.scope[names[1]] = item;
      }
      else {
        child.scope[names[0]] = item;
      }
      ret = child.runCodes(code);
    }
  }
  else if (Array.isArray(list)) {
    for (var i = 0, l = list.length; i < l; i++) {
      var item = list[i];
      if (names.length === 2) {
        child.scope[names[0]] = i;
        child.scope[names[1]] = item;
      }
      else {
        child.scope[names[0]] = item;
      }
      ret = child.runCodes(code);
    }
  }
  else {
    var keys = Object.keys(list);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      var item = list[key];
      if (names.length === 2) {
        child.scope[names[0]] = key;
        child.scope[names[1]] = item;
      }
      else {
        child.scope[names[0]] = item;
      }
      ret = child.runCodes(code);
    }
  }
  return ret;
};


Scope.prototype.list = function () {
  return map.call(arguments, this.run, this);
};

Scope.prototype.object = function () {
  var obj = Object.create(null);
  for (var i = 0, l = arguments.length; i < l; i += 2) {
    var key = this.run(arguments[i]);
    var value = this.run(arguments[i + 1]);
    obj[key] = value;
  }
  return obj;
};

var inspect = require('util').inspect;

Scope.prototype.eval = function (string) {
  var codes = parse(string);
  console.log(inspect(codes, false, 15, true));
  // console.log({
  //   originalLength: Buffer.byteLength(string),
  //   msgpackLength: require('msgpack-js').encode(codes).length,
  //   jsonLength: Buffer.byteLength(JSON.stringify(codes)),
  //   binaryLength: exports.save(codes).length
  // });

  return this.runCodes(codes);
};

exports.eval = function (string) {
  var scope = new Scope({
    print: console.log.bind(console)
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