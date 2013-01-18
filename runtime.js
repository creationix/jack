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

function getForm(list) {
  if (!(Array.isArray(list) && list[0] instanceof Form)) return null;
  return list[0].name;
}

function Scope(parent) {
  this.scope = Object.create(parent || null);
  this.stack = [];
}

Scope.prototype.run = function (code) {
  if (Array.isArray(code) && code[0] instanceof Form) {
    return this[code[0].name].apply(this, code.slice(1));
  }
  if (code instanceof Symbol) {
    if (code.name in this.scope) {
      return this.scope[code.name];
    }
    return this.abort("Attempt to access undefined variable '" + code.name + "'");
  }
  return code;
};

Scope.prototype.runCodes = function (codes) {
  var result;
  for (var i = 0, l = codes.length; i < l; i++) {
    var code = codes[i];
    console.log("XXX",code);
    result = this.run(code);
  }
  return result;
}

var hasOwn = Object.prototype.hasOwnProperty;

Scope.prototype.def = function (args, code) {
  return [forms.fn, this.scope, args, code];
};

Scope.prototype.fn = function () {
  throw new Error("TODO: Implement fn");
};

Scope.prototype.call = function (fn, args) {
  fn = this.run(fn);
  args = args.map(this.run, this);
  console.log("CALL", fn, args);
  if (Array.isArray(fn) && fn[0] instanceof Form && fn[0].name === "fn") {
    var child = new Scope(this.scope);
    var scope = fn[1];
    var names = fn[2];
    var codes = fn[3];
    child.scope.self = fn;
    for (var i = 0, l = names.length; i < l; i++) {
      child.var(names[i], args[i]);
    }
    var result;
    try {
      result = child.runCodes(codes);
    } catch (err) {
      if (err.code === "RETURN") {
        result = this.returnValue;
        delete this.returnValue;
        return;
      }
      throw err;
    }
    return result;
  }
  if (fn === null) {
    if (args.length !== 2) {
      return this.abort("Null must be called with 2 arguments");
    }
    var op = args[0];
    var value = args[1];
    switch (op) {
      case "==": return fn === value;
      case "~=": return fn !== value;
      default: throw new Error("TODO: Implement null " + op);
    }
  }
  if (Array.isArray(fn)) {
    throw new Error("TODO: call arrays");
  }
  if (typeof fn === "object") {
    if (args.length === 0) {
      return Object.keys(fn);
    }
    if (args.length === 1) {
      var key = args[0];
      if (hasOwn.call(fn, key)) return fn[key];
      return null;
    }
    if (args.length === 2) {
      return fn[args[0]] = args[1];
    }
    return this.abort("Objects must be called with 0, 1, or 2 arguments");
  }
  if (typeof fn === "number") {
    if (args.length !== 2) {
      return this.abort("Integers must be called with 2 arguments");
    }
    var op = args[0];
    var value = args[1];
    switch (op) {
      case "<=": return fn <= value;
      case "<": return fn < value;
      case ">=": return fn >= value;
      case ">": return fn > value;
      case "==": return fn === value;
      case "~=": return fn !== value;

      case "+": return fn + value;
      case "-": return fn - value;
      case "*": return fn * value;
      case "/": return fn / value;
      case "^": return Math.pow(fn, value);
      case "%": return fn % value;

      default: throw new Error("TODO: Implement number " + op);
    }
    console.log(args);
  }
  console.log(fn);
  throw new Error("TODO: implement call");
};

Scope.prototype.return = function (val) {
  this.returnValue = this.run(val);
  throw {code:"RETURN"};
};

Scope.prototype.abort = function (message) {
  throw message;
};

Scope.prototype.var = function (name, value) {
  if (hasOwn.call(this.scope, name)) {
    this.abort("Attempt to redeclare local variable '" + name + "'");
  }
  return this.scope[name] = this.run(value);
};

Scope.prototype.assign = function () {
  throw new Error("TODO: Implement assign");
};

Scope.prototype.if = function (pairs, last) {
  for (var i = 0, l = pairs.length; i < l; i += 2) {
    var cond = this.run(pairs[i]);
    if (cond) {
      return this.runCodes(pairs[i + 1]);
    }
  }
  if (last !== undefined) {
    return this.runCodes(last);
  }
  return null;
};

Scope.prototype.while = function () {
  throw new Error("TODO: Implement while");
};

Scope.prototype.for = function () {
  throw new Error("TODO: Implement for");
};

Scope.prototype.map = function () {
  throw new Error("TODO: Implement map");
};

Scope.prototype.buf = function () {
  throw new Error("TODO: Implement buf");
};

Scope.prototype.array = function (arr) {
  return arr.slice();
};

Scope.prototype.object = function (pairs) {
  var value = Object.create(null);
  for (var i = 0, l = pairs.length; i < l; i += 2) {
    value[this.run(pairs[i])] = this.run(pairs[i + 1]);
  }
  return value;
};



Scope.prototype.eval = function (string) {
  var codes = parse(string);
  return this.runCodes(codes);
};

exports.eval = function (string) {
  var scope = new Scope();
  return scope.eval(string);
};

exports.attachParser = function (parser) {
  parser.yy = exports;
  parse = parser.parse.bind(parser);
};


