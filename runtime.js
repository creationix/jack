// This will be a compiler when the runtime is attached to a jison parser.
var parse;
var assert = require('assert');
var classes = require('./classes');

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

Scope.prototype.run = function (code) {
  // Evaluate form codes
  if (Array.isArray(code)) {
    return this[code[0]].apply(this, code.slice(1));
  }
  if (typeof code === "number") {
    return new classes.Integer(code);
  }
  if (typeof code === "string") {
    return new classes.String(code);
  }
  if (code === null) {
    return new classes.Null();
  }
  if (typeof code === "boolean") {
    return new classes.Boolean(code);
  }
  throw new Error("Unknown type " + code);
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

Scope.prototype.spawn = function () {
  return new Scope(this.scope);
};

Scope.prototype.fn = function (names, code) {
  return new classes.Function(this, names, code);
};

Scope.prototype.def = function (name, names, code) {
  return this.scope[name] = new classes.Function(this, names, code);
};

Scope.prototype.class = function (name, names, code) {
  return this.scope[name] = new classes.Function(this, names, code, true);
};
Scope.prototype.on = function (name, names, code) {
  var method = new classes.Function(this, names, code);
  return this.instance[name] = method.call.bind(method);
};

Scope.prototype.send = function (val, message, args) {
  val = this.run(val);
  args = args.map(this.run, this);
  var fn = val[message] || classes.All[message];
  if (!fn) return this.abort(val.tostring().val + " does not respond to '" + message + "'");
  return (fn).apply(val, args);
};

Scope.prototype.return = function (val) {
  // console.log("RETURN", {val:val});
  throw {code:"RETURN", value: this.run(val)};
};

Scope.prototype.abort = function (message) {
  console.error(message);
  process.exit();
  // console.log("ABORT", {message:message});
  // throw new Error(message);
};

Scope.prototype.var = function (name, value) {
  // console.log("VAR", {name:name,value:value});
  if (hasOwn.call(this.scope, name)) {
    return this.abort("Attempt to redeclare local variable '" + name + "'");
  }
  return this.scope[name] = this.run(value);
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
    if (cond.val) {
      return this.runCodes(pairs[i + 1]);
    }
  }
  if (i < l) {
    return this.runCodes(pairs[i]);
  }
  return new classes.Null();
};

Scope.prototype.while = function (cond, code) {
  var child = this.spawn();
  var ret;
  while (child.run(cond).toboolean().val) {
    ret = child.runCodes(code);
  }
  return ret;
};

Scope.prototype.forin = function (name, val, filter, code) {
  val = this.run(val);
  var child = this.spawn();
  var ret;
  for (var i = 0, l = val.length(); i < l; i++) {
    var item = val.get(new classes.Integer(i));
    child.scope[name] = item;
    var cond = child.run(filter).toboolean();
    if (cond.val) {
      ret = child.runCodes(code);
    }
  }
  return ret || new classes.Null();
};

Scope.prototype.mapin = function (name, val, filter, code) {
  val = this.run(val);
  var child = this.spawn();
  var result = [];
  for (var i = 0, l = val.length(); i < l; i++) {
    var item = val.get(new classes.Integer(i));
    child.scope[name] = item;
    var cond = child.run(filter).toboolean();
    if (cond.val) {
      result.push(child.runCodes(code));
    }
  }
  return new classes.List(result);
};

Scope.prototype.list = function (items) {
  items = items.map(this.run, this);
  return new classes.List(items);
};

Scope.prototype.map = function (pairs) {
  pairs = pairs.map(this.run, this);
  return new classes.Map(pairs);
};

var inspect = require('util').inspect;

Scope.prototype.eval = function (string) {
  var codes = parse(string);
  // console.log(inspect(codes, false, 15, true));
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
    print: {
      call: function (val) {
        console.log(val.tostring().val)
      }
    }
  });
  return scope.eval(string);
};

exports.attachParser = function (parser) {
  parse = parser.parse.bind(parser);
};

