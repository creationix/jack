var Parser = require("jison").Parser;

var grammar = require('./grammar');
var runtime = require('./runtime');



var filename = process.argv[2] || "sample.jk";
console.log("Parsing: " + filename);
var code = require('fs').readFileSync(filename, "utf8");
console.log("Creating parser...");
var parser = new Parser(grammar, {type: "lalr"});
parser.yy = runtime;
console.log("Parsing file...");
var tree = parser.parse(code);
console.log("Running program...")
runtime.call(tree);
