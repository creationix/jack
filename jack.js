#!/home/tim/Code/nvm/v0.10.18/bin/node --harmony-collections
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


function ready() {
  var filename = process.argv[2];
  if (!filename) throw new Error("filename required");
  // console.log("Parsing: " + filename);

  var parser = require('./parser').parser;
  runtime.attachParser(parser);
  fs.readFile(filename, "utf8", function (err, code) {
    if (err) throw err;
    var tree = parser.parse(code);
    if (process.env.DUMP) {
      var inspect = require('util').inspect;
      console.log(inspect(tree, false, 15, true));
    }
    else {
      // console.log("Running program...")
      runtime.eval(code);
    }
  });
}
