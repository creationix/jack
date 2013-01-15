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
        this.insert(pair.value, i);
        this.alias(pair.key, i);
      }
      else {
        this.insert(pair, i);
      }
    }, this);
  }
}
List.prototype.checkIndex = function (index) {
  if (index >> 0 !== index) throw new Error("index must be string or integer");
  if (index < 0) { index += this.items.length; }
  return index;
};
List.prototype.insert = function (value, index) {
  if (index === null || index === this.items.length) {
    return this.items.push(value);
  }
};
List.prototype.get = function (index) {
  index = this.checkIndex(index);
  var value = this.items[index];
  if (value === undefined) value = null;
  return value;
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

exports.NativeCode = NativeCode;
var nativeCodes = {};
function NativeCode(name) {
  if (nativeCodes[name]) return nativeCodes[name];
  if (!(this instanceof NativeCode)) { return new NativeCode(name); }
  nativeCodes[name] = this;
  this.name = name;
}
NativeCode.prototype.inspect = function () {
  return "\033[31;1m$" + this.name + "\033[0m";
};

exports.Buffer = Buffer;

exports.call = call;
// fn is a List with a @fn form at the root.
// args is a List with values as args.
function call(fn, args) {
  if (fn.get(0) !== forms.fn) throw new Error("Can only execute lists with @fn form");
  var scope = fn.get(1);
  var argNames = fn.get(2);
  var code = fn.slice(3, null);
  console.log(code);
}