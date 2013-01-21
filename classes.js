if (typeof WeakMap === "undefined") {
  // Polyfill that's not actually weak, but does work in a pinch.
  WeakMap = function WeakMap() {
    this.keys = [];
    this.values = [];
  }
  WeakMap.prototype.has = function (key) {
    return this.keys.indexOf(key) >= 0;
  };
  WeakMap.prototype.get = function (key, fallback) {
    var index = this.keys.indexOf(key);
    if (index >= 0) {
      return this.values[index];
    }
    return fallback;
  };
  WeakMap.prototype.set = function (key, value) {
    var index = this.keys.indexOf(key);
    if (index >= 0) {
      this.values[index] = value;
      return;
    }
    this.keys.push(key);
    this.values.push(value);
  };
  WeakMap.prototype.delete = function (key) {
    var index = this.keys.indexOf(key);
    if (index >= 0) {
      this.keys.splice(index, 1);
      this.values.splice(index, 1);
    }
  };
  WeakMap.prototype.clear = function () {
    this.keys.length = 0;
    this.values.length = 0;
  };
}

var Integer = exports.Integer = (function () {
  var cache = {};
  function Integer(val) {
    val = Math.floor(val);
    if (val !== val) throw new Error("Invalid val");
    if (cache.hasOwnProperty(val)) return cache[val];
    this.val = val;
    cache[val] = this;
  }
  Integer.prototype["+"] = function (other) {
    return new Integer(this.val + other.tointeger().val);
  };
  Integer.prototype["-"] = function (other) {
    return new Integer(this.val - other.tointeger().val);
  };
  Integer.prototype["/"] = function (other) {
    return new Integer(this.val / other.tointeger().val);
  };
  Integer.prototype["*"] = function (other) {
    return new Integer(this.val * other.tointeger().val);
  };
  Integer.prototype["^"] = function (other) {
    return new Integer(Math.pow(this.val, other.tointeger().val));
  };
  Integer.prototype["%"] = function (other) {
    return new Integer(this.val % other.tointeger().val);
  };

  Integer.prototype["<"] = function (other) {
    return new Boolean(this.val < other.tointeger().val);
  };
  Integer.prototype["<="] = function (other) {
    return new Boolean(this.val <= other.tointeger().val);
  };
  Integer.prototype[">"] = function (other) {
    return new Boolean(this.val > other.tointeger().val);
  };
  Integer.prototype[">="] = function (other) {
    return new Boolean(this.val >= other.tointeger().val);
  };
  Integer.prototype.tointeger = function () {
    return this;
  };
  Integer.prototype.tostring = function (base) {
    return new String(this.val.toString(base));
  };
  Integer.prototype.toboolean = function () {
    return new Boolean(this.val !== 0);
  };
  return Integer;
}());

var Boolean = exports.Boolean = (function () {
  var t, f;
  function Boolean(val) {
    if (val) {
      if (t) return t;
      t = this;
      this.val = true;
    }
    else {
      if (f) return f;
      f = this;
      this.val = false;
    }
  };
  Boolean.prototype.tointeger = function () {
    return new Integer(this.val ? 1 : 0);
  };
  Boolean.prototype.tostring = function () {
    return new String(this.val ? "true" : "false");
  };
  Boolean.prototype.toboolean = function () {
    return this;
  };
  return Boolean;
}());

var String = exports.String = (function () {
  var cache = {};
  function String(val) {
    if (cache.hasOwnProperty(val)) return cache[val];
    this.val = val;
    cache[val] = this;
  }
  String.prototype["+"] = function (other) {
    return new String(this.val + other.tostring().val);
  };
  String.prototype["*"] = function (repeat) {
    var times = repeat.tointeger().val;
    if (times < 0) throw new Error("Repeat must not be negative.");
    var result = "";
    for (var i = 0; i < times; i++) {
      result += this.val;
    }
    return new String(result);
  };
  String.prototype["<"] = function (other) {
    return new Boolean(this.val < other.tostring().val);
  };
  String.prototype["<="] = function (other) {
    return new Boolean(this.val <= other.tostring().val);
  };
  String.prototype[">"] = function (other) {
    return new Boolean(this.val > other.tostring().val);
  };
  String.prototype[">="] = function (other) {
    return new Boolean(this.val >= other.tostring().val);
  };
  String.prototype.tostring = function () {
    return this;
  };
  String.prototype.toboolean = function () {
    return new Boolean(this.val.length > 0);
  };
  String.prototype.tointeger = function (base) {
    if (base === undefined || base instanceof Null) base = 10;
    else base = base.tointeger().val;
    if (base < 2 || base > 36) throw new Error("Base must be between 2 and 36 inclusive");
    return new Integer(parseInt(this.val, base));
  };
  String.prototype.length = function () {
    return new Integer(this.val.length);
  };
  String.prototype.get = function (index) {
    var length = this.val.length;
    index = index.tointeger().val;
    if (index < 0) index += length;
    if (index < 0 || index >= length) throw new Error("Index out of bounds");
    return new String(this.substr(index, 1));
  };
  String.prototype.slice = function (start, end) {
    var length = this.val.length;
    start = start.tointeger().val;
    if (start < 0) start += length;
    end = end.tointeger().val;
    if (end < 0) end += length;
    if (start < 0 || end >= length || end < start) throw new Error("Illegal Range");
    return new String(this.substr(start, end));
  };
  return String;
}());

var Null = exports.Null = (function () {
  var n;
  function Null() {
    if (n) return n;
    n = this;
  }
  Null.prototype.tointeger = function () {
    return new Integer(0);
  };
  Null.prototype.tostring = function () {
    return new String("null");
  };
  Null.prototype.toboolean = function () {
    return new Boolean(false);
  };
  return Null;
}());

var List = exports.List = (function () {
  function List(items) {
    this.val = items.slice() || [];
  }
  List.prototype["+"] = function (other) {
    return new List(this.val.concat(other.tolist().val));
  };
  List.prototype["*"] = function (repeat) {
    var times = repeat.tointeger().val;
    if (times < 0) throw new Error("Repeat must not be negative.");
    var items = [];
    for (var i = 0; i < times; i++) {
      items = items.concat(this.val);
    }
    return new List(items);
  };
  List.prototype.toboolean = function () {
    return new Boolean(true);
  };
  List.prototype.tolist = function () {
    return this;
  };
  List.prototype.length = function () {
    return this.val.length;
  };
  List.prototype.slice = function (start, end) {
    var length = this.val.length;
    start = start.tointeger().val;
    if (start < 0) start += length;
    end = end.tointeger().val;
    if (end < 0) end += length;
    if (start < 0 || end >= length || end < start) throw new Error("Illegal Range");
    return new List(this.val.slice(start, end));
  };
  List.prototype.get = function (index) {
    var length = this.val.length;
    index = index.tointeger().val;
    if (index < 0) index += length;
    if (index < 0 || index >= length) throw new Error("Index out of bounds");
    return this.val[index];
  };
  List.prototype.set = function (value, index) {
    var length = this.val.length;
    index = index.tointeger().val;
    if (index < 0) index += length;
    if (index < 0 || index >= length) throw new Error("Index out of bounds");
    return this.val[index] = value;    
  };
  List.prototype.keys = function () {
    var length = this.val.length;
    var keys = new Array(length);
    for (var i = 0; i < length; i++) {
      keys[i] = new Integer(i);
    }
    return new List(keys);
  };
  List.prototype.insert = function (value, index) {
    var length = this.val.length;
    index = index.tointeger().val;
    if (index < 0) index += length;
    if (index < 0 || index > length) throw new Error("Index out of bounds");
    this.val.splice(index, 0, value);
    return value;
  };
  List.prototype.remove = function (index) {
    var length = this.val.length;
    index = index.tointeger().val;
    if (index < 0) index += length;
    if (index < 0 || index >= length) throw new Error("Index out of bounds");
    return this.val.splice(index, 1);
  };
  List.prototype.has = function (index) {
    var length = this.val.length;
    index = index.tointeger().val;
    if (index < 0) index += length;
    return new Boolean(index >= 0 && index < length);
  };
  List.prototype.push = function (value) {
    this.val.push(value);
    return value;
  };
  List.prototype.pop = function () {
    return this.val.pop();
  };
  return List;
}());

var Map = exports.Map = (function () {
  function Map(pairs) {
    pairs = pairs || [];
    this.val = new WeakMap();
    this._keys = new Array(pairs.length / 2);
    for (var i = 0, l = pairs.length; i < l; i += 2) {
      this.val.set(pairs[i], pairs[i + 1]);
      this._keys[i / 2] = pairs[i];
    }
  }
  Map.prototype["+"] = function (other) {
    other = other.tomap();
    other._keys.forEach(function (key) {
      this.set(other.get(key), key);
    }, this);
    return this;
  };
  Map.prototype.get = function (key) {
    if (this.val.has(key)) return this.val.get(key);
    throw new Error("Invalid map key");
  };
  Map.prototype.set = function (value, key) {
    if (!this.val.has(key)) this._keys.push(key);
    this.val.set(key, value);
    return value;
  };
  Map.prototype.insert = Map.prototype.set;
  Map.prototype.has = function (key) {
    return new Boolean(this.val.has(key));
  };
  Map.prototype.remove = function (key) {
    if (!this.val.has(key)) throw new Error("Invalid key");
    var value = this.val.get(key);
    this._keys.splice(this._keys.indexOf(key), 1);
    this.val.delete(key);
    return value;
  };
  // Map.prototype.clear = function () {
  //   this.val.clear();
  //   this._keys.length = 0;
  //   return this;
  // };
  Map.prototype.keys = function () {
    return new List(this._keys.slice());
  };
  Map.prototype.tomap = function () {
    return this;
  };
  Map.prototype.toboolean = function () {
    return new Boolean(true);
  };
  return Map;
}());

var Function = exports.Function = (function () {
  function Function(parent, names, codes) {
    this.parent = parent;
    this.names = names;
    this.codes = codes;
  }
  Function.prototype.call = function () {
    // console.log("CALL", arguments);
    var child = this.parent.spawn();
    for (var i = 0, l = this.names.length; i < l; i++) {
      var name = this.names[i];
      if (i < arguments.length) {
        child.scope[name] = arguments[i];
      }
      else {
        child.scope[name] = new Null();
      }
    }
    try {
      return child.runCodes(this.codes);
    } catch (err) {
      if (err.code === "RETURN") {
        return err.value;
      }
      throw err;
    }
  };
  return Function;
}());