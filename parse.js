var fs = require('fs');
var pathJoin = require('path').join;
var runtime = require('./runtime');

fs.stat(pathJoin(__dirname, "parser.js"), function (err, pstat) {
  if (err) {
    // If the parser doesn't exist, generate it.
    if (err.code === "ENOENT") return generate();
    throw err;
  }
  fs.stat(pathJoin(__dirname, "grammar.json"), function (err, gstat) {
    if (err) throw err;
    // See if the grammer has been changed since the generated file.
    if (gstat.mtime > pstat.mtime) return generate();
    // Otherwise we can use the cached version.
    ready();
  });
});

function generate() {
  console.log("Compiling fresh parser...");
  var Parser = require("jison").Parser;
  var parser = new Parser(require('./grammar'));
  fs.writeFile(pathJoin(__dirname, "parser.js"), parser.generate(), function (err) {
    if (err) throw err;
    ready();
  });
}

var forms = {}
function Form(name) {
  if (forms[name]) return forms[name];
  if (!(this instanceof Form)) return new Form(name);
  this.name = name;
  forms[name] = this;
}
Form.prototype.inspect = function () {
  return "\033[34;1m@" + this.name + "\033[0m";
};
var symbols = {}
function Symbol(name) {
  if (symbols[name]) return symbols[name];
  if (!(this instanceof Symbol)) return new Symbol(name);
  this.name = name;
  symbols[name] = this;
}
Symbol.prototype.inspect = function () {
  return "\033[35m:" + this.name + "\033[0m";
};

function ready() {
  var filename = process.argv[2] || "sample.jk";
  // console.log("Parsing: " + filename);

  var parser = require('./parser').parser;
  parser.yy.F = Form;
  parser.yy.S = Symbol;
  runtime.attachParser(parser);
  fs.readFile(filename, "utf8", function (err, code) {
    if (err) throw err;
    var tree = parser.parse(code);
    console.log(require('util').inspect(tree, false, 12, true));
    // console.log("Running program...")
    // console.log(runtime.eval(code));
  });
}
