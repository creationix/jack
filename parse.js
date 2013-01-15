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
      ["let\\b",                 "return 'LET';"],
      ["if\\b",                  "return 'IF';"],
      ["elif\\b",                "return 'ELIF';"],
      ["else\\b",                "return 'ELSE';"],
      ["\\$[a-zA-Z_][a-zA-Z0-9_]*","return 'NATIVE_CODE';"],
      ["[a-zA-Z_][a-zA-Z0-9_]*:","return'ALIAS';"],
      [":+[a-zA-Z_][a-zA-Z0-9_]*","return'SYMBOL';"],
      ["@[a-zA-Z_][a-zA-Z0-9_]*","return 'FORM';"],
      ["[a-zA-Z_][a-zA-Z0-9_]*", "return 'IDENT';"],
      ["(?:0|-?[1-9][0-9]*)",    "return 'INTEGER';"],
      ["\"((?:\\.|[^\"])*)\"",   "return 'STRING';"],
      ["'((?:\\.|[^'])*)'",      "return 'STRING';"],
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
      ["\\[",                    "return '[';"],
      ["\\]",                    "return ']';"],
      ["\\{",                    "return '{';"],
      ["\\}",                    "return '}';"],
      ["\\(",                    "return '(';"],
      ["\\)",                    "return ')';"],
    ]
  },

  operators: [
    ["right", '='],
    ["right", "?", ":"],
    ["left", '||', '^^'],
    ["left", '&&'],
    ["left", '<', '<=', '>', '>=', '==', '~='],
    ["left", '+', '-', '%'],
    ["left", '*', '/', '^'],
    ["left", '~'],
    ["left", '!'],
    ["left", '.', "[", "]", ".&", "&["],
  ],

  bnf: {
    root: [
      ["code EOF", "return $1"],
    ],
    code: [
      ["", "$$ = []"],
      ["code expr", "$$ = $1.concat([$2])"],
    ],
    block: [
      ["{ code }", "$$ = [ yy.F.block].concat($2)"],
    ],
    params: [
      ["", "$$ = []"],
      ["params IDENT", "$$ = $1.concat([$2])"],
    ],
    elifs: [
      ["", "$$ = []"],
      ["elifs ELIF expr block", "$$ = $1.concat([$3, $4])"],
    ],
    item: [
      ["ALIAS expr", "$$ = [$1.substr(0, $1.length - 1), $2]"],
      ["expr", "$$ = [nil, $1]"],
    ],
    list1: [
      ["item", "$$ = [$1]"],
      ["list1 item", "$$ = $1.concat([$2])"],
    ],
    list: [
      ["", "$$ = []"],
      ["list1", "$$ = $1"],
    ],
    expr: [
      ["STRING", "$$ = eval($1);"],
      ["block", "$$ = $1"],
      ["{ | params | code }", "$$ = [yy.F.def, $3].concat($5)"],
      ["IDENT", "$$ = yy.S($1)"],
      ["( expr )", "$$ = $2"],
      ["INTEGER", "$$ = parseInt($1, 10);"],
      ["BUFFER", "$$ = yy.B($1)"],
      ["CONSTANT", "$$ = $1 === 'true' ? true : $1 === 'false' ? false : null;"],
      ["[ list ]", "$$ = $2"],
      ["LET IDENT = expr", "$$ = [yy.F.let, yy.S($2), $4];"],
      ["expr = expr", "$$ = [yy.F.assign, $1, $3];"],
      ["FORM", "$$ = yy.F[$1.substr(1)];"],
      ["SYMBOL", "$$ = yy.S($1);"],
      ["IF expr block", "$$ = [yy.F.if, $2, $3]"],
      ["IF expr block elifs", "$$ = [yy.F.if, $2, $3].concat($4)"],
      ["IF expr block elifs ELSE block", "$$ = [yy.F.if, $2, $3].concat($4).concat([$6])"],
      ["expr + expr", "$$ = [yy.F.add, $1, $3];"],
      ["expr - expr", "$$ = [yy.F.sub, $1, $3];"],
      ["expr * expr", "$$ = [yy.F.mul, $1, $3];"],
      ["expr / expr", "$$ = [yy.F.div, $1, $3];"],
      ["expr ^ expr", "$$ = [yy.F.pow, $1, $3];"],
      ["expr % expr", "$$ = [yy.F.mod, $1, $3];"],
      ["expr < expr", "$$ = [yy.F.lt, $1, $3];"],
      ["expr <= expr", "$$ = [yy.F.lte, $1, $3];"],
      ["expr > expr", "$$ = [yy.F.gt, $1, $3];"],
      ["expr >= expr", "$$ = [yy.F.gte, $1, $3];"],
      ["expr == expr", "$$ = [yy.F.eq, $1, $3];"],
      ["expr ~= expr", "$$ = [yy.F.neq, $1, $3];"],
      ["~ expr", "$$ = [yy.F.not, $2];"],
      ["expr ? expr : expr", "$$ = ['COND', $1, $3, $5];"],
      ["# expr", "$$ = [yy.F.len, $2]"],
      ["expr . IDENT = expr", "$$ = [yy.F.set, $1, $3, $5];"],
      ["expr . IDENT", "$$ = [yy.F.get, $1, $3];"],
      // ["expr [ STRING ] = expr", "$$ = [yy.F.set, $1, eval($3), $6];"],
      // ["expr [ IDENT ] = expr", "$$ = [yy.F.set, $1, yy.S($3), $6];"],
      ["expr . IDENT", "$$ = [yy.F.get, $1, $3];"],
      // ["expr [ STRING ]", "$$ = [yy.F.get, $1, eval($3)];"],
      // ["expr [ IDENT ]", "$$ = [yy.F.get, $1, yy.S($3)];"],
      ["expr ( list )", "$$ = [yy.F.call, $1, $4]"],
      // ["basic [ basic ]", "$$ = ['LOOKUP', $1, $3];"],
      // ["basic && basic", "$$ = ['AND', $1, $3];"],
      // ["basic || basic", "$$ = ['OR', $1, $3];"],
      // ["basic ^^ basic", "$$ = ['XOR', $1, $3];"],
      // ["basic", "$$ = $1"],
      // ["basic ! args", "$$ = ['EXEC', $1, $3]"],
      // ["basic = expr", "$$ = ['ASSIGN', $1, $3];"],
    // args: [
    //   ["basic", "$$ = [$1]"],
    //   ["args basic", "$$ = $1.concat([$2])"],
    // ],
    ],
    // statement: [
    //   ["RETURN", "$$ = ['RETURN', ['VALUE', null]];"],
    //   ["RETURN expr", "$$ = ['RETURN', $2];"],
    //   ["IDENT := expr", "$$ = ['DEF', $1, $3]"],
    //   ["ERROR basic", "$$ = ['ERROR', $2]"],
    //   ["IF basic basic", "$$ = ['IF', $2, $3]"],
    //   ["IF basic basic elifs ELSE basic", "$$=['IF', $2, $3].concat($4).concat([$6])"],
    //   ["RETURN IF expr", "$$ = ['RETURNIF', $3, ['VALUE', null]]"],
    //   ["RETURN basic IF expr", "$$ = ['RETURNIF', $4, $2]"],
    //   ["FROM basic TO basic basic", "$$ = ['FROM', $2, $4, ['VALUE', 1], $5]"],
    //   ["FROM basic TO basic BY basic basic", "$$ = ['FROM', $2, $4, $6, $7]"],
    //   ["WHILE basic basic", "$$ = ['WHILE', $2, $3]"],
    // ],
    // elifs: [
    //   ["", "$$ = []"],
    //   ["elifs ELIF basic basic", "$$ = $1.concat([$3, $4])"],
    // ]
  }
};

var forms = {};
["add", "sub", "mul", "div", "mod", "pow", "and", "or", "xor",
  "not", "cond", "lte", "lt", "gte", "gt", "neq", "eq", "if", "while",
  "def", "block", "call", "let", "assign", "fn", "len", "keys", "get",
  "set", "insert", "remove", "slice", "alias", "read", "unalias"
].map(function (name) {
  forms[name] = new Form(name);
});

function Form(name) {
  this.name = name;
}
Form.prototype.inspect = function () {
  return "@" + this.name;
};
var symbols = {};
function Symbol(name) {
  this.name = name;
}
Symbol.prototype.inspect = function () {
  return ":" + this.name;
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
List.protype.alias = function (key, index) {
  this.aliases[key] = index;
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
  }
  F: forms,
  S: function (name) {
    if (symbols[name]) return symbols[name];
    return symbols[name] = new Symbol(name);
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
