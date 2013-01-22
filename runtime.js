// This will be a compiler when the runtime is attached to a jison parser.
var parse;
var assert = require('assert');
var classes = require('./classes');

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
  // console.log("ABORT", {message:message});
  throw new Error(message);
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

var formByIndex = ["class", "on", "def", "return", "abort", "fn", "send", "var",
  "assign", "lookup", "if", "while", "forin", "mapin", "list", "map"];
var indexByForm = {};
formByIndex.forEach(function (name, index) {
  indexByForm[name] = index;
});

// Since the array ["call", ...] could be an array starting with the string
// "call" or a special call-form depending on the context, this is a helper that
// tells the binary writer when an argument is a form and when it's just an
// array of forms.
function isChildForm(form, index, length) {
  if (!form) return true;
  switch (form) {
    case "class":  // name, args, body
    case "on":     // name, args, body
    case "def":    // name, args, body
    case "fn":     // args, body
    case "lookup": // name
    case "list":   // items
    case "map":    // pairs
      return false;
    case "return": // expr
    case "abort":  // expr
      return true;
    case "send":   // obj, name, args
    case "while":  // cond, body
      return index === 1;
    case "var":    // name, value
    case "assign": // name, value
      return index === 2;
    case "forin":  // ident, val, cond, block
    case "mapin":  // ident, val, cond, block
      return index === 2 || index === 3;
    case "if":     // (cond, body)+, else-body
      return index % 2 && index < length - 1;
  }
  throw new Error("Unknown form '" + form + "'");
}

// Convert an AST tree to a savable binary buffer
exports.save = function (tree) {
  function sizeof(array, isform) {
    var i = 0
    var l = array.length;
    var size = 0;
    var form;
    if (isform) {
      form = array[0];
      size = 1;
      i = 1;
    }
    for (;i < l; i++) {
      var child = array[i];
      if (child === null || child === false || child === true) {
        size += 1;
        continue;
      }
      if (typeof child === "number") {
        if (child >= 0 && child < 64) {
          size += 1;
        }
        else {
          size += 1 + Math.ceil(Math.log(Math.abs(child) + 1) / Math.log(128));
        }
        continue;
      }
      if (Array.isArray(child)) {
        var childLength = child.length;
        if (childLength >= 0 && childLength < 64) {
          size += 1;
        }
        else {
          size += 1 + Math.ceil(Math.log(Math.abs(childLength) + 1) / Math.log(128));
        }
        size += sizeof(child, isChildForm(form, i, l));
        continue;
      }
      if (typeof child === "string") {
        var childLength = Buffer.byteLength(child);
        if (childLength >= 0 && childLength < 64) {
          size += 1;
        }
        else {
          size += 1 + Math.ceil(Math.log(Math.abs(childLength) + 1) / Math.log(128));
        }
        size += childLength;
        continue;
      }
      if (Buffer.isBuffer(child)) {
        var childLength = child.length;
        size += 1 + Math.ceil(Math.log(Math.abs(childLength) + 1) / Math.log(128));
        size += childLength;
        continue;
      }
      throw new Error("UNKNOWN TYPE " + child);
    }
    return size;
  }

  // Helper to write uleb128 values to the stream
  function uleb128(num) {
    while (num >= 0x80) {
      buffer[offset++] = 0x80 | (num & 0x7f);
      num = num >>> 7;
    }
    buffer[offset++] = num;
  }
  function encode(array, isform) {
    var i = 0
    var l = array.length;
    var form;
    if (isform) {
      form = array[0];
      buffer[offset++] = indexByForm[form] + 0x10;
      i = 1;
    }
    for (;i < l; i++) {
      var child = array[i];
      if (child === null) { buffer[offset++] = 0x05; continue }
      if (child === false) { buffer[offset++] = 0x06; continue }
      if (child === true) { buffer[offset++] = 0x07; continue }
      if (typeof child === "number") {
        // Small Positive Int
        if (child >= 0 && child < 64) {
          buffer[offset++] = 0x40 | child;
          continue;
        }
        // Negative Int
        if (child < 0) {
          buffer[offset++] = 0x00;
          uleb128(-child);
          continue;
        }
        // Large Negative Int
        buffer[offset++] = 0x01;
        uleb128(child);
        continue;
      }
      if (typeof child === "string") {
        var childLength = Buffer.byteLength(child);
        // Short string
        if (childLength >= 0 && childLength < 64) {
          buffer[offset++] = 0x80 | childLength;
        }
        // Long string
        else {
          buffer[offset++] = 0x02;
          uleb128(childLength);
        }
        buffer.write(child, offset);
        offset += childLength;
        continue;
      }
      if (Array.isArray(child)) {
        var childLength = child.length;
        // short list
        if (childLength >= 0 && childLength < 64) {
          buffer[offset++] = 0xc0 | childLength;
        }
        // long list
        else {
          buffer[offset++] = 0x03;
          uleb128(childLength);
        }
        encode(child, isChildForm(form, i, l));
        continue;
      }
      if (Buffer.isBuffer(child)) {
        var childLength = child.length;
        buffer[offset++] = 0x04;
        uleb128(childLength);
        child.copy(buffer, offset);
        offset += childLength;
        continue;
      }
      throw new Error("UNKNOWN TYPE " + child);
    }
  }
  var codeSize = sizeof(tree);
  var size = 6 + codeSize + Math.ceil(Math.log(Math.abs(codeSize) + 1) / Math.log(128));
  var buffer = new Buffer(size);
  buffer.write("Jack*\0", 0);
  var offset = 6;
  uleb128(codeSize);
  encode(tree);
  return buffer;
}