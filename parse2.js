var Parser = require("jison").Parser;

var grammar = {
  lex: {
    rules: [
      ["--.*\\n?",               "/* skip line comments */"],
      ["\\s*\\n\\s*",            "return 'TERMINATOR';"],
      ["[ \t]*;[ \t]*",          "return 'TERMINATOR';"],
      ["(nil|true|false)\\b",    "return 'CONSTANT';"],
      ["if\\b",                  "return 'IF';"],
      ["else\\b",                "return 'ELSE';"],
      ["return\\b",              "return 'RETURN';"],
      ["loop\\b",                "return 'LOOP';"],
      ["[a-zA-Z_][a-zA-Z0-9_]*", "return 'IDENT';"],
      ["-?[1-9][0-9]*"  ,        "return 'INTEGER';"],
      ["\"((?:\\.|[^\"])*)\"",   "return 'STRING';"],
      ["'((?:\\.|[^'])*)'",      "return 'STRING';"],
      ["[ \t]+",                 "/* skip whitespace */"],
      [":=",                     "return ':=';"],
      ["=",                      "return '=';"],
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
      ["\\!",                    "return '!';"],
      ["\\{",                    "return '{';"],
      ["\\}",                    "return '}';"],
      ["\\(\\s*",                "return '(';"],
      ["\\)",                    "return ')';"],
      ["\\|",                    "return '|';"],
      ["\\[",                    "return '[';"],
      ["\\]",                    "return ']';"],
      ["$",                      "return 'TERMINATOR';"],
    ]
  },

  operators: [
    ["left", '=', ':='],
    ["left", '<', '<=', '>', '>=', '==', '~='],
    ["left", '+', '-'],
    ["left", '*', '/'],
  ],

  bnf: {
    expressions: [
      ["blockPart TERMINATOR", "return $$;"],
    ],
    blockPart: [
      ["expr", "$$ = [$1];"],
      ["blockPart TERMINATOR expr", "$$ = $1.concat([$3]);"],
      ["", "$$ = []"],
    ],
    expr: [
      ["( blockPart )", "$$ = ['BLOCK'].concat($2);"],
      ["( blockPart TERMINATOR )", "$$ = ['BLOCK'].concat($2);"],
      ["INTEGER", "$$ = ['INTEGER', $1];"],
      ["CONSTANT", "$$ = ['CONSTANT', $1];"],
      ["STRING", "$$ = ['STRING', $1];"],
      ["IDENT", "$$ = ['IDENT', $1];"],
      // ["expr ! args", "$$ = ['EXEC', $1, $3];"],
      // ["expr !", "$$ = ['EXEC', $1, []];"],
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
      ["IDENT := expr", "$$ = ['DEF', $1, $3];"],
      ["IDENT = expr", "$$ = ['ASSIGN', $1, $3];"],
    ],
    args: [
      ["expr", "$$ = [$1];"],
      ["args expr", "$$ = $1.concat([$2]);"],
    ]
  }
};

var parser = new Parser(grammar);
var code = require('fs').readFileSync("sample.jk", "utf8");
var tree = parser.parse(code);
var inspect = require('util').inspect;
console.log(inspect(tree, false, 10, true));
