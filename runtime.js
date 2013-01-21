// This will be a compiler when the runtime is attached to a jison parser.
var parse;
var assert = require('assert');
var classes = require('./classes');

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
  console.log(inspect(codes, false, 15, true));
  console.log({
    originalLength: Buffer.byteLength(string),
    msgpackLength: require('msgpack-js').encode(codes).length,
    jsonLength: Buffer.byteLength(JSON.stringify(codes)),
    binaryLength: exports.save(codes).length
  });

  // return this.runCodes(codes);
};

exports.eval = function (string) {
  var scope = new Scope();
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
      num  = num >> 7;
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
  console.log(buffer);
  return buffer;
}