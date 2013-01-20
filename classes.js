var Integer = exports.Integer = (function () {
  function Integer(val) {
    this.val = Math.floor(val);
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
  function Boolean(val) {
    this.val = !!val;
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

function String = exports.String = (function () {
  function String(val) {
    this.val = val;
  }
  String.prototype["+"] = function (other) {
    return new String(this.val + other.tostring().val);
  };
  String.prototype["*"] = function (other) {
    var times = other.tointeger().val;
    var result = "";
    for (var i = 0; i < times; i++) {
      result += this.val;
    }
    return new String(result);
  };
  // ...
}());