// This will be a compiler when the runtime is attached to a jison parser.
var parse;
var assert = require('assert');

exports.Pair = Pair
function Pair(key, value) {
  if (!(this instanceof Pair)) { return new Pair(key, value); }
  this.key = key;
  this.value = value
}

var forms = exports.forms = {};
["add", "sub", "mul", "div", "mod", "pow", "and", "or", "xor",
  "not", "cond", "lte", "lt", "gte", "gt", "neq", "eq", "if", "while",
  "def", "block", "call", "let", "assign", "fn", "len", "keysof", "typeof",
  "get", "set", "aget", "aset", "insert", "remove", "slice", "alias", "read",
  "return", "abort"
].forEach(function (name) {
  forms[name] = new Form(name);
});

function Form(name) {
  this.name = name;
}
Form.prototype.inspect = function () {
  return "\033[36m@" + this.name + "\033[0m";
};

exports.Symbol = Symbol;
var symbols = {};
function Symbol(name) {
  if (symbols[name]) return symbols[name];
  if (!(this instanceof Symbol)) { return new Symbol(name); }
  symbols[name] = this;
  this.name = name;
}
Symbol.prototype.inspect = function () {
  return "\033[35m:" + this.name + "\033[0m";
};

exports.List = List;
function List(pairs) {
  if (!(this instanceof List)) { return new List(pairs); }
  this.items = [];
  this.aliases = {};
  if (pairs) {
    pairs.forEach(function (pair, i) {
      if (pair instanceof Pair) {
        this.insert(i, pair.value);
        this.alias(pair.key, i);
      }
      else {
        this.insert(i, pair);
      }
    }, this);
  }
}

List.prototype.checkIndex = function (index) {
  if (index >> 0 !== index) return null;
  if (index < 0) { index += this.items.length; }
  return index;
};

List.prototype.set = function (index, value) {
  index = this.checkIndex(index);
  if (this.items[index] === undefined) return null
  this.items[index] = value;
  return index;
};

List.prototype.get = function (index) {
  index = this.checkIndex(index);
  var value = this.items[index];
  if (value === undefined) value = null;
  return value;
};

List.prototype.aset = function (key, value) {
  var index = this.aliases[key];
  if (index === undefined) {
    index = this.items.length;
    this.aliases[key] = index;
  }
  this.items[index] = value;
  return index;
};

List.prototype.aget = function (key) {
  var index = this.aliases[key];
  if (index === undefined) return null;
  var value = this.items[index];
  if (value === undefined) return null;
  return value;
};

List.prototype.insert = function (index, value) {
  if (index === null) index = this.items.length;
  else index = this.checkIndex(index);
  if (index === this.items.length) {
    this.items[index] = value;
    return index;
  }
  throw new Error("TODO: Implement hard insert");
};

List.prototype.remove = function (index) {
  if (index === null) index = this.items.length - 1;
  else index = this.checkIndex(index);
  if (index === this.items.length - 1) {
    return this.items.pop();
  }
  throw new Error("TODO: Implement hard remove");
};

List.prototype.alias = function (key, index) {
  if (index === null) {
    delete this.aliases[key];
    return index;
  }
  if (index >> 0 !== index) return null;
  this.aliases[key] = index;
  return index;
};

List.prototype.read = function (key) {
  var index = this.aliases[key];
  if (index === undefined) return null;
  return index;
};

List.prototype.slice = function (start, end) {
  if (start === null) start = 0;
  if (end === null) end = this.items.length;
  start = this.checkIndex(start);
  end = this.checkIndex(end);
  // TODO: Should this copy aliases?
  return new List(this.items.slice(start, end));
};

var inspect = require('util').inspect;
var seen;
List.prototype.inspect = function (level) {
  var outer = seen === undefined;
  if (outer) {
    seen = [this];
  }
  else {
    if (seen.indexOf(this) >= 0) {
      return "[\033[30;1mcycle\033[0m]]";
    }
    seen.push(this);
  }
  if (level <= 0) return "[...]";
  var inverse = {};
  var aliases = this.aliases
  Object.keys(aliases).forEach(function (key) {
    var index = aliases[key];
    if (!inverse[index]) { inverse[index] = ""; }
    inverse[index] += "\033[30;1m" + key + ":\033[0m ";
  });
  var inner = this.items.map(function (item, i) {
    if (item === null) return (inverse[i] || "") + "nil";
    return (inverse[i] || "") + inspect(item, false, level - 1, true);
  });
  var line = "[ " + inner.join(" ") + " ]";
  if (outer) seen = undefined;
  if (line.length < 80) return line;
  return "[ " + inner.join("\n").split("\n").join("\n  ") + " ]";
};

List.prototype.length = function () {
  return this.items.length;
};

exports.NativeCode = NativeCode;
var nativeCodes = {};
function NativeCode(name, fn) {
  if (!fn) {
    if (nativeCodes[name]) return nativeCodes[name];
    throw new Error("Unknown native code " + name);
  }
  if (!(this instanceof NativeCode)) { return new NativeCode(name, fn); }
  nativeCodes[name] = this;
  this.fn = fn;
  this.name = name;
}
NativeCode.prototype.inspect = function () {
  return "\033[31;1m$" + this.name + "\033[0m";
};

// Logs a local variable by the name of "val";
NativeCode("print", function (vm) {
  console.log(vm.getLocal("val"));
  return null;
});

exports.Buffer = Buffer;

exports.VM = VM;
function VM(parent) {
  this.scope = new List([parent]);
}
VM.prototype.getLocal = function (name) {
  function find(scope) {
    var index = scope.read(name);
    if (index === null) {
      var parent = scope.get(0);
      if (parent === null) {
        return this.abort("Attempt to access undefined variable '" + name + "'.");
      }
      return find.call(this, parent);
    }
    return scope.get(index);
  }
  return find.call(this, this.scope);
};
// Assign a local variable
VM.prototype.setLocal = function (name, value) {
  function find(scope) {
    console.log("SET", name, scope);
    var index = scope.read(name);
    if (index === null) {
      var parent = scope.get(0);
      if (parent === null) {
        return this.abort("Attempt to access undefined variable '" + name + "'.");
      }
      return find.call(this, parent);
    }
    return scope.set(index, value);
  }
  return find.call(this, this.scope);
};
VM.prototype.defineLocal = function (name, value) {
  var index = this.scope.read(name);
  if (index !== null) return this.abort("Attempt to redefine '" + name + "'' local variable.");
  return this.scope.aset(name, value);
};
VM.prototype.run = function (code) {
  if (code instanceof NativeCode) {
    return code.fn(this);
  }
  if (code instanceof Symbol) {
    return this.getLocal(code.name);
  }
  if (code instanceof List) {
    var first = code.get(0);
    if (first instanceof Form) {
      var fn = this[first.name];
      if (fn === undefined) throw new Error("TODO: Implement " + first.name + " form");
      return fn.apply(this, code.items.slice(1));
    }
  }
  return code;
};

var slice = Array.prototype.slice;

VM.prototype.let = function (name, value) {
  value = this.run(value);
  this.defineLocal(name, value);
  return value;
};
VM.prototype.def = function () {
  return new List([forms.fn, this.scope].concat(slice.call(arguments)));
};
VM.prototype.add = function (a, b) {
  return this.run(a) + this.run(b);
};
VM.prototype.sub = function (a, b) {
  return this.run(a) - this.run(b);
};
VM.prototype.and = function (a, b) {
  return this.run(a) && this.run(b);
};
VM.prototype.or = function (a, b) {
  return this.run(a) || this.run(b);
};
VM.prototype.xor = function (a, b) {
  return !this.run(a) !== !this.run(b);
};
VM.prototype.eq = function (a, b) {
  return this.run(a) === this.run(b);
};
VM.prototype.lte = function (a, b) {
  return this.run(a) <= this.run(b);
};
VM.prototype.aget = function (list, key) {
  list = this.run(list);
  key = this.run(key);
  return list.aget(key);
};
VM.prototype.aset = function (list, key, value) {
  return this.run(list).aset(this.run(key), this.run(value));
}
VM.prototype.assign = function (variable, value) {
  variable = this.run(variable);
  value = this.run(value);
  return this.setLocal(variable, value);
};
VM.prototype.block = function () {
  var codes = new List(slice.call(arguments));
  return this.runCodes(codes);
};
VM.prototype.if = function () {
  for (var i = 0, l = arguments.length; i + 1 < l; i += 2) {
    var cond = this.run(arguments[i]);
    if (this.run(arguments[i])) {
      return this.run(arguments[i + 1]);
    }
  }
  if (i < l) {
    return this.run(arguments[i]);
  }
  return null;
}
VM.prototype.call = function (fn) {
  var args = new List(slice.call(arguments, 1).map(function (arg) {
    return this.run(arg);
  }, this));
  fn = this.run(fn);
  var form = fn.get(0);
  assert(form instanceof Form);
  assert(form.name === "fn");
  var scope = fn.get(1);
  assert(scope instanceof List);
  var child = new VM(scope);
  var names = fn.get(2);
  assert(names instanceof List);
  child.defineLocal("self", fn);
  for (var i = 0, l = names.length(); i < l; i++) {
    child.defineLocal(names.get(i), args.get(i));
  }
  var codes = fn.slice(3, null);
  try {
    return child.runCodes(codes);
  } catch (err) {
    if (err === "return") {
      return this.earlyExit;
    }
    throw err;
  }
}

VM.prototype.runCodes = function (codes, earlyExit) {
  assert(codes instanceof List);
  var result;
  for (var i = 0, l = codes.length(); i < l; i++) {
    var code = codes.get(i);
    if (code instanceof List) {
      var first = code.get(0);
      if (first instanceof Form && first.name === "return") {
        this.earlyExit = this.run(code.get(1));
        throw "return";
      }
    }
    result = this.run(code);
  }
  return result;
};
VM.prototype.eval = function (code) {
  return this.runCodes(parse(code));
};
VM.prototype.abort = function (message) {
  // TODO: show a jack stack trace, not the JS one.
  throw new Error(message);
};


exports.attachParser = function (parser) {
  parser.yy = exports;
  parse = parser.parse.bind(parser);
};


