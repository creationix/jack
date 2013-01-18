// This will be a compiler when the runtime is attached to a jison parser.
var parse;
var assert = require('assert');

var forms = exports.forms = {};
[ "class", "on", "def", "fn",
  "var", "assign",
  "call", "send", "get", "set",
  "return", "abort",
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

var objectMethods = {
  keys: function (obj) {
    return Object.keys(obj);
  },
  get: function (obj, key) {
    return hasOwn.call(obj, key) ? obj[key] : null;
  },
  set: function (obj, value, key) {
    return obj[key] = value;
  },
};
var arrayMethods = {
  length: function (obj) {
    return obj.length;
  }
};
arrayMethods.get = objectMethods.get;
arrayMethods.set = objectMethods.set;
var genericMethods = {
  "<": function (val, other) {
    return val < other;
  },
  "<=": function (val, other) {
    return val <= other;
  },
  ">": function (val, other) {
    return val < other;
  },
  ">=": function (val, other) {
    return val >= other;
  },
  "==": function (val, other) {
    return val === other;
  },
  "!=": function (val, other) {
    return val !== other;
  },
};
var integerMethods = {
  "+": function (num, other) {
    return num + other;
  },
  "-": function (num, other) {
    return num - other;
  },
  "*": function (num, other) {
    return num * other;
  },
  "/": function (num, other) {
    return num / other;
  },
  "^": function (num, other) {
    return Math.pow(num, other);
  },
  "%": function (num, other) {
    return num % other;
  },
};

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

Scope.prototype.call = function (val, args) {
  // console.log("CALL", val, args);
  args = args.map(this.run, this);
  val = this.run(val);
  if (Array.isArray(val) && val[0] instanceof Form && val[0].name === "fn") {
    var child = new Scope(this.scope);
    var scope = val[1];
    var names = val[2];
    var codes = val[3];
    child.scope.self = val;
    for (var i = 0, l = names.length; i < l; i++) {
      child.var(names[i], args[i]);
    }
    var result;
    try {
      result = child.runCodes(codes);
    } catch (err) {
      if (err.code === "RETURN") {
        return err.value;
      }
      throw err;
    }
    return result;
  }
  var action = args[0];
  var method;
  if (typeof val === "number") {
    method = integerMethods[action];
  } else if (Array.isArray(val)) {
    method = arrayMethods[action];
  } else if (val && typeof val === "object") {
    method = objectMethods[action];
  }
  if (!method) method = genericMethods[action];
  if (!method) {
    return this.abort("Unknown method '" + action + "' for " + val);
  }
  var res = method.apply(this, [val].concat(args.slice(1)));
  return res;
};

Scope.prototype.return = function (val) {
  // console.log("RETURN", val);
  throw {code:"RETURN", value: this.run(val)};
};

Scope.prototype.abort = function (message) {
  throw new Error(message);
};

Scope.prototype.var = function (name, value) {
  console.log("VAR", name, value);
  if (hasOwn.call(this.scope, name)) {
    return this.abort("Attempt to redeclare local variable '" + name + "'");
  }
  return this.scope[name] = this.run(value);
};

Scope.prototype.assign = function (name, value) {
  // console.log("ASSIGN", name, value);
  var scope = this.scope;
  while (scope) {
    if (hasOwn.call(scope, name)) return scope[name] = this.run(value);
    scope = Object.getPrototypeOf(scope);
  } 
  return this.abort("Attempt to access undefined variable '" + name + "'");
};

Scope.prototype.get = function (obj, keys) {
  // console.log("GET", obj, key);
  return this.call(obj, ["get"].concat(keys));
};

Scope.prototype.set = function (obj, keys, value) {
  // console.log("SET", obj, key, value);
  return this.call(obj, ["set", value].concat(keys));
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

var inspect = require('util').inspect;

Scope.prototype.eval = function (string) {
  var codes = parse(string);
  console.log(inspect(codes, false, 10, true));
  // return this.runCodes(codes);
};

exports.eval = function (string) {
  var scope = new Scope();
  return scope.eval(string);
};

exports.attachParser = function (parser) {
  parser.yy = exports;
  parse = parser.parse.bind(parser);
};


