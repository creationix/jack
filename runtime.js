exports.Pair = Pair
function Pair(key, value) {
  this.key = key;
  this.value = value
}

exports.Form = Form;
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
  symbols[name] = this;
  this.name = name;
}
Symbol.prototype.inspect = function () {
  return "\033[35m:" + this.name + "\033[0m";
};

exports.List = List;
function List() {
  this.items = [];
  this.aliases = {};
}
List.prototype.insert = function (value, index) {
  if (index === null || index === this.items.length) {
    return this.items.push(value);
  }
};
List.prototype.set = function (index, value) {
  if (typeof index === "string") {
    if (this.aliases[key] === undefined) {
      index = this.aliases[key];
    }
    else {
      index = this.aliases[key] = this.items.length;
    }
  }
  else {
    if (index >> 0 !== index) throw new Error("index must be string or integer");
    if (index < 0) { index += this.items.length; }
  }
  this.items[index] = value;
  return index;
};
List.prototype.alias = function (key, index) {
  this.aliases[key] = index;
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
  nativeCodes[name] = this;
  this.name = name;
}
NativeCode.prototype.inspect = function () {
  return "\033[31;1m$" + this.name + "\033[0m";
};
