var Parser = require("jison").Parser;

var grammar = {
  lex: {
    rules: [
      ["\\s*$",                  "return 'EOF';"],
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
      ["assert\\b",              "return 'ASSERT';"],
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
      ["~",                      "return '~';"],
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
    ["left", '~'],
    ["left", '!'],
    ["left", '.', "[", "]"],
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
    term: [
      "TERMINATOR", "term TERMINATOR",
    ],
    item: [
      // ["LINECOMMENT", "$$ = ['COMMENT', $1]"],
      ["expr", "$$ = $1"],
      ["statement", "$$ = $1"],
    ],
    params: [
      ["IDENT", "$$ = [$1]"],
      ["params IDENT", "$$ = $1.concat([$2])"],
    ],
    pair: [
      ["IDENT = basic", "$$ = ['PAIR', ['VALUE', $1], $3]"],
      ["string = basic", "$$ = ['PAIR', $1, $3]"],
      ["[ basic ] = basic", "$$ = ['PAIR', $2, $5]"],
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
    string: [
      ["STRING", "$$ = ['VALUE', eval($1)];"],
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
      ["string", "$$ = $1"],
      ["~ basic", "$$ = ['NOT', $2];"],
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
      ["basic . IDENT", "$$ = ['LOOKUP', $1, ['VALUE', $3]];"],
      ["basic [ basic ]", "$$ = ['LOOKUP', $1, $3];"],
      ["basic !", "$$ = ['EXEC', $1, []]"],
      ["basic IF basic", "$$ = ['IF', $3, $1]"],
      ["basic IF basic ELSE basic", "$$ = ['IFELSE', $3, $1, $5]"],
    ],
    statement: [
      ["RETURN", "$$ = ['RETURN', ['VALUE', null]];"],
      ["RETURN expr", "$$ = ['RETURN', $2];"],
      ["ASSERT basic", "$$ = ['ASSERT', $2, []];"],
      ["ASSERT basic args", "$$ = ['ASSERT', $2, $3];"],
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

var code = require('fs').readFileSync(process.argv[2] || "sample.jk", "utf8");

// strip comments and normalize line-endings
code = code.split(/(?:\n|\r\n|\r)/g).map(function (line) {
  var state = false;
  for (var i = 0, l = line.length; i < l; i++) {
    var c = line.charAt(i);
    switch (state) {
      case false:
        if (c === "'" || c === '"') {
          state = c;
        }
        else if (c === "-") {
          state = "-";
        }
        break;
      case '\\':
        state = false;
        break;
      case '"': case "'":
        if (c === "\\") {
          state = "\\";
        }
        else if (c === state) {
          state = false;
        }
        break;
      case '-':
        if (c === "-") {
          return line.substr(0, i - 1).replace(/\s+$/, '');
        }
        state = false;
        break;
    }
  }
  return line.replace(/\s+$/, '');
}).join("\n");

// Trim lines at beginning and record how many there were
var lineOffset = 0;
var match = code.match(/^([ \t]*\n)*/);
if (match) {
  lineOffset = match[0].match(/\n/g).length;
  code = code.substr(match[0].length);
}
// Trim all trailing whitespace
code = code.replace(/\s*$/, "");

var parser = new Parser(grammar, {type: "lalr"});
var tree = parser.parse(code);
console.log(require('util').inspect(tree, false, 10, true));
