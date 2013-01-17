// This will be a compiler when the runtime is attached to a jison parser.
var parse;
var assert = require('assert');

var forms = exports.forms = {};
[ "def", "fn", "call", "return", "abort",
  "var", "assign",
  "if", "while", "for", "map",
  "buf", "array", "object"
].forEach(function (name) {
  forms[name] = new Form(name);
});

function Form(name) {
  this.name = name;
}
Form.prototype.inspect = function () {
  return "\033[36m@" + this.name + "\033[0m";
};

exports.Range = Range;
function Range(str) {
  if (!(this instanceof Range)) { return new Range(str); }
  var match = str.match(/([^:]*):([^:]*)/);
  this.start = match[1] ? parseInt(match[1], 10) : null;
  this.end = match[2] ? parseInt(match[2], 10) : null;
};
Range.prototype.inspect = function () {
  var string = ":";
  if (this.start !== null) {
    string = this.start + string;
  }
  if (this.end !== null) {
    string = string + this.end;
  }
  return "\033[32;1m" + string + "\033[0m";
}

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
  this.scope = Object.create(parent);
}
VM.prototype.getLocal = function (name) {
  if (name in this.scope) {
    return this.scope[name];
  }
  return this.abort("Attempt to access undefined variable '" + name + "'.");
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
  if (Array.isArray(code)) {
    var first = code[0];
    if (first instanceof Form) {
      var fn = this[first.name];
      if (fn === undefined) throw new Error("TODO: Implement " + first.name + " form");
      return fn.apply(this, code.slice(1));
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
  var result;
  for (var i = 0, l = codes.length; i < l; i++) {
    var code = codes[i];
    if (Array.isArray(code)) {
      var first = code[0];
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
  var tree = parse(code);
  console.log(require('util').inspect(tree, false, 10, true));
  // return this.runCodes();
};
VM.prototype.abort = function (message) {
  // TODO: show a jack stack trace, not the JS one.
  throw new Error(message);
};


exports.attachParser = function (parser) {
  parser.yy = exports;
  parse = parser.parse.bind(parser);
};


