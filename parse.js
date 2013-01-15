var Parser = require("jison").Parser;

var grammar = require('./grammar');
var runtime = require('./runtime');

// Generate all the forms.
var forms = {};
grammar.forms.map(function (name) {
  forms[name] = new runtime.Form(name);
});


var filename = process.argv[2] || "sample.jk";
console.log("Parsing: " + filename);
var code = require('fs').readFileSync(filename, "utf8");
console.log("Creating parser...");
var parser = new Parser(grammar, {type: "lalr"});
parser.yy = {
  P: function (key, value) {
    return new runtime.Pair(key, value);
  },
  L: function (pairs) {
    var list = new runtime.List();
    pairs.forEach(function (pair, i) {
      if (pair instanceof runtime.Pair) {
        list.insert(pair.value, i);
        list.alias(pair.key, i);
      }
      else {
        list.insert(pair, i);
      }
    });
    return list;
  },
  F: forms,
  S: function (name) {
    return new runtime.Symbol(name);
  },
  N: function (name) {
    return new runtime.NativeCode(name);
  },
  B: function (str) {
    return new Buffer(str.substr(1, str.length - 2).split(/\s+/).map(function (byte) {
      return parseInt(byte, 16);
    }));
  }
};
console.log("Parsing file...");
var tree = parser.parse(code);
console.log("Logging abstract syntax tree...");
console.log(require('util').inspect(tree, false, 10, true));
