var Parser = require("jison").Parser;

var grammar = {
  lex: {
    rules: [
      ["\\s*$",                  "return 'EOF';"],
      [".--.*",                  "/* skip line comments */"],
      ["--.*\\s*",               "/* skip line comments */"],
      ["<<\\s*",                 "return '<<';"],
      ["\\s*>>",                 "return '>>';"],
      ["\\[\\s*",                "return '[';"],
      ["\\s*\\]",                "return ']';"],
      ["\\{\\s*",                "return '{';"],
      ["\\s*\\}",                "return '}';"],
      ["\\(\\s*",                "return '(';"],
      ["\\s*\\)",                "return ')';"],
      ["\\s*\\n\\s*",            "return 'TERMINATOR';"],
      ["[ \t]*;[ \t]*",          "return 'TERMINATOR';"],
      ["(nil|true|false)\\b",    "return 'CONSTANT';"],
      ["return\\b",              "return 'RETURN';"],
      ["loop\\b",                "return 'LOOP';"],
      ["if\\b",                  "return 'IF';"],
      ["else\\b",                "return 'ELSE';"],
      ["[a-zA-Z_][a-zA-Z0-9_]*", "return 'IDENT';"],
      ["-?[1-9][0-9]*",          "return 'INTEGER';"],
      ["0",                      "return 'INTEGER';"],
      ["\"((?:\\.|[^\"])*)\"",   "return 'STRING';"],
      ["'((?:\\.|[^'])*)'",      "return 'STRING';"],
      ["[ \t]+",                 "/* skip whitespace */"],
      [":=",                     "return ':=';"],
      ["!",                      "return '!';"],
      ["\\+",                    "return '+';"],
      ["-",                      "return '-';"],
      ["\\*",                    "return '*';"],
      ["\\/",                    "return '/';"],
      ["<=",                     "return '<=';"],
      ["<",                      "return '<';"],
      [">=",                     "return '>=';"],
      [">",                      "return '>';"],
      ["~=",                     "return '~=';"],
      ["==",                     "return '==';"],
      ["=",                      "return '=';"],
      ["&&",                     "return '&&';"],
      [":",                      "return ':';"],
      ["\\.",                    "return '.';"],
      ["\\|\\|",                 "return '||';"],
      ["\\^\\^",                 "return '^^';"],
      ["\\|\\s*",                "return '|';"],
    ]
  },

  operators: [
    ["right", '='],
    ["right", "IF", "ELSE"],
    ["left", '||', '^^'],
    ["left", '&&'],
    ["left", '<', '<=', '>', '>=', '==', '~='],
    ["left", '+', '-'],
    ["left", '*', '/'],
    ["left", '!'],
    ["left", '.'],
  ],

  bnf: {
    // The program is 0 or more items
    root: [
      ["block0 EOF", "return $1"],
    ],
    // Zero or more items with terminators in-between
    block0: [
      ["", "$$ = []"],
      ["block1", "$$ = $1"],
    ],
    // One or more items with terminators in-between
    block1: [
      ["item", "$$ = [$1]"],
      ["block1 term item", "$$ = $1.concat([$3])"],
    ],
    // Two or more items with terminators in-between
    block2: [
      ["item term item", "$$ = [$1, $3]"],
      ["block2 term item", "$$ = $1.concat([$3])"],
    ],
    // One or more terminators
    term: ["TERMINATOR", "term TERMINATOR"],
    item: [
      ["expr", "$$ = $1"],
      ["statement", "$$ = $1"],
    ],
    params: [
      ["IDENT", "$$ = [$1]"],
      ["params IDENT", "$$ = $1.concat([$2])"],
    ],
    pair: [
      ["IDENT = basic", "$$ = ['PAIR', $1, $3]"],
    ],
    map: [
      ["", "$$ = []"],
      ["map pair", "$$ = $1.concat([$2])"],
      ["map pair term", "$$ = $1.concat([$2])"],
    ],
    list: [
      ["", "$$ = []"],
      ["list basic", "$$ = $1.concat([$2])"],
      ["list basic term", "$$ = $1.concat([$2])"],
    ],
    basic: [
      ["{ block0 }", "$$ = ['FUNCTION', [], $2]"],
      ["<< map >>", "$$ = ['MAP', $2]"],
      ["[ list ]", "$$ = ['LIST', $2]"],
      ["{ | params | block0 }", "$$ = ['FUNCTION', $3, $5]"],
      ["IDENT", "$$ = ['IDENT', $1]"],
      ["( expr )", "$$ = $2"],
      ["( block2 )", "$$ = ['BLOCK', $2]"],
      ["INTEGER", "$$ = ['VALUE', parseInt($1, 10)];"],
      ["CONSTANT", "$$ = ['VALUE', $1 === 'true' ? true : $1 === 'false' ? false : null];"],
      ["STRING", "$$ = ['VALUE', eval($1)];"],
      ["basic + basic", "$$ = ['ADD', $1, $3];"],
      ["basic - basic", "$$ = ['SUB', $1, $3];"],
      ["basic * basic", "$$ = ['MUL', $1, $3];"],
      ["basic / basic", "$$ = ['DIV', $1, $3];"],
      ["basic < basic", "$$ = ['LT', $1, $3];"],
      ["basic <= basic", "$$ = ['LTE', $1, $3];"],
      ["basic > basic", "$$ = ['GT', $1, $3];"],
      ["basic >= basic", "$$ = ['GTE', $1, $3];"],
      ["basic == basic", "$$ = ['EQ', $1, $3];"],
      ["basic ~= basic", "$$ = ['NEQ', $1, $3];"],
      ["basic && basic", "$$ = ['AND', $1, $3];"],
      ["basic || basic", "$$ = ['OR', $1, $3];"],
      ["basic ^^ basic", "$$ = ['XOR', $1, $3];"],
      ["basic = basic", "$$ = ['ASSIGN', $1, $3];"],
      ["basic . IDENT", "$$ = ['LOOKUP', $1, ['IDENT', $3]];"],
      ["basic !", "$$ = ['EXEC', $1, []]"],
      ["basic IF basic", "$$ = ['IF', $3, $1]"],
      ["basic IF basic ELSE basic", "$$ = ['IFELSE', $3, $1, $5]"],
    ],
    statement: [
      ["RETURN", "$$ = ['RETURN', ['VALUE', null]];"],
      ["RETURN expr", "$$ = ['RETURN', $2];"],
      ["LOOP", "$$ = ['LOOP', ['VALUE', null]];"],
      ["LOOP expr", "$$ = ['LOOP', $2];"],
      ["IDENT := expr", "$$ = ['DEF', $1, $3]"],
    ],
    expr: [
      ["basic", "$$ = $1"],
      ["basic ! args", "$$ = ['EXEC', $1, $3]"],
    ],
    args: [
      ["basic", "$$ = [$1]"],
      ["args basic", "$$ = $1.concat([$2])"],
    ]
  }
};

var parser = new Parser(grammar, {type: "lalr"});
var code = require('fs').readFileSync("sample.jk", "utf8");
var tree = parser.parse(code + "\n");
var inspect = require('util').inspect;
console.log(inspect(tree, false, 10, true));
