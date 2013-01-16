// This will be a compiler when the runtime is attached to a jison parser.
var parse;

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
List.prototype.inspect = function () {
  var inverse = {};
  var aliases = this.aliases
  Object.keys(aliases).forEach(function (key) {
    var index = aliases[key];
    if (!inverse[index]) { inverse[index] = ""; }
    inverse[index] += "\033[30;1m" + key + ":\033[0m ";
  });
  var inner = this.items.map(function (item, i) {
    if (item === null) return (inverse[i] || "") + "nil";
    return (inverse[i] || "") + inspect(item, false, 10, true);
  });
  var line = "[ " + inner.join(" ") + " ]";
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
});

exports.Buffer = Buffer;

exports.VM = VM;
function VM() {
  this.scope = new List([null]);
}
VM.prototype.getLocal = function (name) {
  var index = this.scope.read(name);
  // TODO: look in parent scopes.
  if (index === null) return this.abort("Attempt to access undefined variable '" + name + "'.");
  return this.scope.get(index);
};
// Assign a local variable
VM.prototype.setLocal = function (name, value) {
  var index = this.scope.read(name);
  // TODO: look in parent scopes.
  if (index === null) return this.abort("Attempt to access undefined variable '" + name + "'.");
  return this.scope.set(index, value);
};
VM.prototype.defineLocal = function (name, value) {
  var index = this.scope.read(name);
  if (index !== null) return this.abort("Attempt to redefine '" + name + "'' local variable.");
  return this.scope.aset(name, value);
};
VM.prototype.interpret = function (code) {
  var result;
  for (var i = 0, l = code.length(); i < l; i++) {
    var item = code.get(i);
    if (item instanceof NativeCode) {
      result = item.fn(this);
      continue;
    }
    if (item instanceof List) {
      var first = item.get(0);
      if (first instanceof Form) {
        switch (first.name) {
          case "let":
            this.defineLocal(item.get(1), item.get(2));
            break;
          default: 
            throw new Error("TODO: Implement " + first.name + " form");
        }
        continue;
      }
    }
    result = item;
  }
  // console.log(this, code);
};
VM.prototype.eval = function (code) {
  this.interpret(parse(code));
};
VM.prototype.abort = function (message) {
  // TODO: show a jack stack trace, not the JS one.
  throw message;
};


exports.attachParser = function (parser) {
  parser.yy = exports;
  parse = parser.parse.bind(parser);
};


