var Parser = require("jison").Parser;

var grammar = {
  lex: {
    rules: [
      ["$",                      "return 'EOF';"],
      ["--.*",                   "/* ignore comments */"],
      ["\\s+",                   "/* skip whitespace */"],
      ["<[0-9A-Fa-f][0-9A-Fa-f](\\s+[0-9A-Fa-f][0-9A-Fa-f])*>", "return 'BUFFER'"],
      ["(nil|true|false)\\b",    "return 'CONSTANT';"],
      ["while\\b",               "return 'WHILE';"],
      ["return\\b",              "return 'RETURN';"],
      ["abort\\b",               "return 'ABORT';"],
      ["insert\\b",              "return 'INSERT';"],
      ["remove\\b",              "return 'REMOVE';"],
      ["keysof\\b",              "return 'KEYSOF';"],
      ["typeof\\b",              "return 'TYPEOF';"],
      ["let\\b",                 "return 'LET';"],
      ["if\\b",                  "return 'IF';"],
      ["elif\\b",                "return 'ELIF';"],
      ["else\\b",                "return 'ELSE';"],
      ["\\.&[a-zA-Z_][a-zA-Z0-9_]*\\s*=","return 'ALIAS';"],
      ["\\.&[a-zA-Z_][a-zA-Z0-9_]*","return 'READ';"],
      ["\\.[a-zA-Z_][a-zA-Z0-9_]*\\s*=","return 'ASET';"],
      ["\\.[a-zA-Z_][a-zA-Z0-9_]*","return 'AGET';"],
      ["\\.(?:0|-?[1-9][0-9]*)\\s*=","return 'ISET';"],
      ["\\.(?:0|-?[1-9][0-9]*)","return 'IGET';"],
      ["\\$[a-zA-Z_][a-zA-Z0-9_]*","return 'NATIVE_CODE';"],
      ["[a-zA-Z_][a-zA-Z0-9_]*:","return 'KEY';"],
      [":+[a-zA-Z_][a-zA-Z0-9_]*","return'SYMBOL';"],
      ["@[a-zA-Z_][a-zA-Z0-9_]*","return 'FORM';"],
      ["[a-zA-Z_][a-zA-Z0-9_]*", "return 'IDENT';"],
      ["(?:0|-?[1-9][0-9]*)",    "return 'INTEGER';"],
      ["\"((?:\\.|[^\"])*)\"",   "return 'STRING';"],
      ["'((?:\\.|[^'])*)'",      "return 'STRING';"],
      ["!\\(",                   "return '!(';"],
      ["!",                      "return '!';"],
      ["#",                      "return '#';"],
      ["\\+",                    "return '+';"],
      ["-",                      "return '-';"],
      ["\\*",                    "return '*';"],
      ["\\/",                    "return '/';"],
      ["\\^",                    "return '^';"],
      ["%",                      "return '%';"],
      ["\\?",                    "return '?';"],
      [":",                      "return ':';"],
      ["<=",                     "return '<=';"],
      ["<",                      "return '<';"],
      [">=",                     "return '>=';"],
      [">",                      "return '>';"],
      ["~=",                     "return '~=';"],
      ["~",                      "return '~';"],
      ["==",                     "return '==';"],
      ["=",                      "return '=';"],
      ["\\.",                    "return '.';"],
      ["&&",                     "return '&&';"],
      ["\\|\\|",                 "return '||';"],
      ["\\^\\^",                 "return '^^';"],
      ["\\|",                    "return '|';"],
      ["\\&\\[",                 "return '&[';"],
      ["\\.&",                   "return '.&';"],
      [":\\[",                    "return ':[';"],
      ["\\[",                    "return '[';"],
      ["\\]",                    "return ']';"],
      ["\\{",                    "return '{';"],
      ["\\}",                    "return '}';"],
      ["\\(",                    "return '(';"],
      ["\\)",                    "return ')';"],
    ]
  },

  operators: [
    ["left", "!("],
    ["right", '=', "ISET", "ASET", "ALIAS"],
    ["right", "?", ":"],
    ["left", '||', '^^'],
    ["left", '&&'],
    ["left", '<', '<=', '>', '>=', '==', '~='],
    ["left", '+', '-', '%'],
    ["left", '*', '/', '^'],
    ["left", '~', "#", "KEYSOF", "TYPEOF"],
    ["left", '!'],
    ["left", '.', "[", "]", "IGET", "AGET", "READ"],
  ],

  bnf: {
    root: [
      ["code EOF", "return yy.L($1)"],
    ],
    code: [
      ["", "$$ = []"],
      ["code expr", "$$ = $1.concat([$2])"],
      ["code statement", "$$ = $1.concat([$2])"],
    ],
    block: [
      ["{ code }", "$$ = yy.L([yy.F.block].concat($2))"],
    ],
    item: [
      ["KEY expr", "$$ = new yy.P($1.substr(0, $1.length - 1), $2)"],
      ["expr", "$$ = $1"],
    ],
    list1: [
      ["item", "$$ = [$1]"],
      ["list1 item", "$$ = $1.concat([$2])"],
    ],
    list: [
      ["", "$$ = []"],
      ["list1", "$$ = $1"],
    ],
    params: [
      ["", "$$ = []"],
      ["params IDENT", "$$ = $1.concat([$2])"],
    ],
    elifs: [
      ["", "$$ = []"],
      ["elifs ELIF expr block", "$$ = $1.concat([$3, $4])"],
    ],
    expr: [
      ["STRING", "$$ = eval($1);"],
      ["IDENT", "$$ = yy.S($1)"],
      ["INTEGER", "$$ = parseInt($1, 10);"],
      ["CONSTANT", "$$ = $1 === 'true' ? true : $1 === 'false' ? false : null;"],
      ["BUFFER", "$$ = yy.B($1)"],
      ["[ list ]", "$$ = yy.L($2)"],
      ["FORM", "$$ = yy.F[$1.substr(1)];"],
      ["SYMBOL", "$$ = yy.S($1);"],
      ["NATIVE_CODE", "$$ = yy.N($1.substr(1));"],
      ["expr !( list )", "$$ = yy.L([yy.F.call, $1, yy.L($3)])"],
      ["expr !", "$$ = yy.L([yy.F.call, $1, yy.L([])])"],
      ["{ || code }", "$$ = yy.L([yy.F.def, yy.L([])].concat($3))"],
      ["{ | params | code }", "$$ = yy.L([yy.F.def, yy.L($3)].concat($5))"],
      ["block", "$$ = $1"],
      ["( expr )", "$$ = $2"],
      ["KEYSOF expr", "$$ = yy.L([yy.F.keysof, $2])"],
      ["TYPEOF expr", "$$ = yy.L([yy.F.typeof, $2])"],
      ["expr = expr", "$$ = yy.L([yy.F.assign, $1, $3])"],
      ["expr + expr", "$$ = yy.L([yy.F.add, $1, $3])"],
      ["expr - expr", "$$ = yy.L([yy.F.sub, $1, $3])"],
      ["expr * expr", "$$ = yy.L([yy.F.mul, $1, $3])"],
      ["expr / expr", "$$ = yy.L([yy.F.div, $1, $3])"],
      ["expr ^ expr", "$$ = yy.L([yy.F.pow, $1, $3])"],
      ["expr % expr", "$$ = yy.L([yy.F.mod, $1, $3])"],
      ["expr < expr", "$$ = yy.L([yy.F.lt, $1, $3])"],
      ["expr <= expr", "$$ = yy.L([yy.F.lte, $1, $3])"],
      ["expr > expr", "$$ = yy.L([yy.F.gt, $1, $3])"],
      ["expr >= expr", "$$ = yy.L([yy.F.gte, $1, $3])"],
      ["expr == expr", "$$ = yy.L([yy.F.eq,  $1, $3])"],
      ["expr ~= expr", "$$ = yy.L([yy.F.neq, $1, $3])"],
      ["expr READ", "$$ = yy.L([yy.F.read, $1, $2.substr(1)])"],
      ["expr ALIAS expr", "$$ = yy.L([yy.F.alias, $1, $2.substr(1, $2.match(/[\\s=]/).index - 1), $3])"],
      ["expr AGET", "$$ = yy.L([yy.F.aget, $1, $2.substr(1)])"],
      ["expr ASET expr", "$$ = yy.L([yy.F.aset, $1, $2.substr(1, $2.match(/[\\s=]/).index - 1), $3])"],
      ["expr IGET", "$$ = yy.L([yy.F.get, $1, parseInt($2.substr(1), 10)])"],
      ["expr ISET expr", "$$ = yy.L([yy.F.set, $1, parseInt($2.substr(1, $2.match(/[\\s=]/).index - 1), 10), $3])"],
      ["~ expr", "$$ = yy.L([yy.F.not, $2])"],
      ["expr ? expr : expr", "$$ = yy.L([yy.F.cond, $1, $3, $5])"],
      ["# expr", "$$ = yy.L([yy.F.len, $2])"],
      ["expr && expr", "$$ = yy.L([yy.F.and, $1, $3])"],
      ["expr || expr", "$$ = yy.L([yy.F.or, $1, $3])"],
      ["expr ^^ expr", "$$ = yy.L([yy.F.xor, $1, $3])"],
      ["LET IDENT = expr", "$$ = yy.L([yy.F.let, $2, $4]);"],
      ["WHILE expr block", "$$ = yy.L([yy.F.while, $2, $3])"],
      ["IF expr block elifs", "$$ = yy.L([yy.F.if, $2, $3].concat($4))"],
      ["IF expr block elifs ELSE block", "$$ = yy.L([yy.F.if, $2, $3].concat($4).concat([$6]))"],
    ],
    statement: [
      ["RETURN expr", "$$ = yy.L([yy.F.return, $2])"],
      ["ABORT expr", "$$ = yy.L([yy.F.abort, $2])"],
    ],
  }
};

var forms = {};
["add", "sub", "mul", "div", "mod", "pow", "and", "or", "xor",
  "not", "cond", "lte", "lt", "gte", "gt", "neq", "eq", "if", "while",
  "def", "block", "call", "let", "assign", "fn", "len", "keysof", "typeof", "get",
  "set", "aget", "aset", "insert", "remove", "slice", "alias", "read", "return", "abort"
].map(function (name) {
  forms[name] = new Form(name);
});

function Form(name) {
  this.name = name;
}
Form.prototype.inspect = function () {
  return "\033[36m@" + this.name + "\033[0m";
};
var symbols = {};
function Symbol(name) {
  this.name = name;
}
Symbol.prototype.inspect = function () {
  return "\033[35m:" + this.name + "\033[0m";
};
var nativeCodes = {};
function NativeCode(name) {
  this.name = name;
}
NativeCode.prototype.inspect = function () {
  return "\033[31;1m$" + this.name + "\033[0m";
};
function Pair(key, value) {
  this.key = key;
  this.value = value;
}
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
    return (inverse[i] || "") + inspect(item, false, 10, true);
  });
  var line = "[ " + inner.join(" ") + " ]";
  if (line.length < 80) return line;
  return "[ " + inner.join("\n").split("\n").join("\n  ") + " ]";
};

var filename = process.argv[2] || "sample.jk";
console.log("Parsing: " + filename);
var code = require('fs').readFileSync(filename, "utf8");
console.log("Creating parser...");
var parser = new Parser(grammar, {type: "lalr"});
parser.yy = {
  P: Pair,
  L: function (pairs) {
    var list = new List();
    pairs.forEach(function (pair, i) {
      if (pair instanceof Pair) {
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
    if (symbols[name]) return symbols[name];
    return symbols[name] = new Symbol(name);
  },
  N: function (name) {
    if (nativeCodes[name]) return nativeCodes[name];
    return nativeCodes[name] = new NativeCode(name);
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
