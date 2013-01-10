var Parser = require("jison").Parser;

var grammar = {
  lex: {
    rules: [
      ["\\s*$",                  "return 'TERMINATOR';"],
      ["--.*\\s*",               "/* skip line comments */"],
      ["\\s*\\n\\s*",            "return 'TERMINATOR';"],
      ["[ \t]*;[ \t]*",          "return 'TERMINATOR';"],
      ["(nil|true|false)\\b",    "return 'CONSTANT';"],
      ["return\\b",              "return 'RETURN';"],
      ["loop\\b",                "return 'LOOP';"],
      ["[a-zA-Z_][a-zA-Z0-9_]*", "return 'IDENT';"],
      ["-?[1-9][0-9]*",          "return 'INTEGER';"],
      ["0",                      "return 'INTEGER';"],
      ["\"((?:\\.|[^\"])*)\"",   "return 'STRING';"],
      ["'((?:\\.|[^'])*)'",      "return 'STRING';"],
      ["[ \t]+",                 "/* skip whitespace */"],
      [":=",                     "return ':=';"],
      ["=",                      "return '=';"],
      ["!",                      "return '!';"],
      ["\\+",                    "return '+';"],
      ["-",                      "return '-';"],
      ["\\*",                    "return '*';"],
      ["\\/",                    "return '/';"],
      ["<",                      "return '<';"],
      ["<=",                     "return '<=';"],
      [">",                      "return '>';"],
      [">=",                     "return '>=';"],
      ["~=",                     "return '~=';"],
      ["==",                     "return '==';"],
      ["&&",                     "return '&&';"],
      ["\\.",                    "return '.';"],
      ["\\|\\|",                 "return '||';"],
      ["\\^\\^",                 "return '^^';"],
      ["\\{\\s*",                "return '{';"],
      ["\\s*\\}",                "return '}';"],
      ["\\(\\s*",                "return '(';"],
      ["\\s*\\)",                "return ')';"],
      ["\\|\\s*",                "return '|';"],
      ["\\[\\s*",                "return '[';"],
      ["\\s*\\]",                "return ']';"],
    ]
  },

  operators: [
    ["nonassoc", ':='],
    ["right", '='],
    ["left", '||', '^^'],
    ["left", '&&'],
    ["left", '<', '<=', '>', '>=', '==', '~='],
    ["left", '+', '-'],
    ["left", '*', '/'],
    ["left", '!'],
    ["left", '.'],
  ],

  bnf: {
    root: [
      ["", "return []"],
      ["body", "return $1"],
    ],
    body: [
      ["expr", "$$ = [$1]"],
      ["body TERMINATOR expr", "$$ = $1.concat([$3])"],
      ["body TERMINATOR", "$$ = $1"],
    ],
    expr: [
      ["( expr )", "$$ = $2"],
      ["INTEGER", "$$ = ['VALUE', parseInt($1, 10)];"],
      ["CONSTANT", "$$ = ['VALUE', $1 === 'true' ? true : $1 === 'false' ? false : null];"],
      ["STRING", "$$ = ['VALUE', eval($1)];"],
      ["expr + expr", "$$ = ['ADD', $1, $3];"],
      ["expr - expr", "$$ = ['SUB', $1, $3];"],
      ["expr * expr", "$$ = ['MUL', $1, $3];"],
      ["expr / expr", "$$ = ['DIV', $1, $3];"],
      ["expr < expr", "$$ = ['LT', $1, $3];"],
      ["expr <= expr", "$$ = ['LTE', $1, $3];"],
      ["expr > expr", "$$ = ['GT', $1, $3];"],
      ["expr >= expr", "$$ = ['GTE', $1, $3];"],
      ["expr == expr", "$$ = ['EQ', $1, $3];"],
      ["expr ~= expr", "$$ = ['NEQ', $1, $3];"],
      ["expr && expr", "$$ = ['AND', $1, $3];"],
      ["expr || expr", "$$ = ['OR', $1, $3];"],
      ["expr ^^ expr", "$$ = ['XOR', $1, $3];"],
      ["IDENT := expr", "$$ = ['DEF', $1, $3];"],
      ["expr = expr", "$$ = ['ASSIGN', $1, $3];"],
      ["expr . IDENT", "$$ = ['LOOKUP', $1, ['IDENT', $3]];"],
      ["IDENT", "$$ = ['IDENT', $1];"],
      // ["expr ! args", "$$ = ['EXEC', $1, [$3, $4, $5]];"],
      ["expr !", "$$ = ['EXEC', $1, []];"],
    ],
    args: [
      ["expr", "$$ = [$1];"],
      ["args expr", "$$ = $1.concat([$2]);"],
    ]
  }
};

var parser = new Parser(grammar, {type: "lalr"});
var code = require('fs').readFileSync("sample.jk", "utf8");
var tree = parser.parse(code);
var inspect = require('util').inspect;
console.log(inspect(tree, false, 10, true));
