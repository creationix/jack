
var highest = 0;

function Memory(stdlib, foreign, heap) {
  "use asm";

  var H32 = new stdlib.Int32Array(heap);
  var offset = 1;

  // Malloc is very simple.  It looks for the next exactly fitting slot.
  // If no exact fits are found, it creates a new slot at the end.
  function malloc(len) {
    process.stdout.write("malloc start=" + offset + ", len=" + len + ", ");
    len = len|0;
    if (len === 0) return 0;
    // Add 4 and round up to the nearest word.
    var size = (len + 7) >> 2;
    var start = offset;
    var end = 0;
    for(;;) {
      var v = H32[offset];
      if (end && offset >= start) {
        offset = end;
        break;
      }
      if (v === 0) {
        end = offset;
        offset = 1;
        continue;
      }
      if (size === -v || v === 0) break;
      process.stdout.write(".");
      if (v > 0) offset += v;
      else offset -= v;
    }
    highest = Math.max(offset + size, highest);
    H32[offset] = size;
    var ptr = (offset + 1) << 2;
    process.stdout.write("end=" + offset + "\n");
    offset += size;
    return ptr;
  }

  // Free is very fast.  It simply marks a section as free.
  // Also it moves the offset to the newly freed slot.
  function free(ptr) {
    console.log("free", {ptr:ptr});
    ptr = ptr|0;
    if (ptr === 0) return;
    offset = (ptr >> 2) - 1;
    var size = H32[offset] | 0;
    H32[offset] = -size | 0;
    for (var i = offset + 1; i < offset + size; i++) {
      H32[i] = 0;
    }
  }

  return { malloc: malloc, free: free };
}

var stdlib = (function () { return this; }());
var heap = new ArrayBuffer(1024);
var H32 = new stdlib.Int32Array(heap);
var H = new stdlib.Uint8Array(heap);
for (var i = 0; i < H.length; ++i) {
  H[i] = 0;
}
var mem = Memory(stdlib, {}, heap);

function store(str) {
  var b = new Buffer(str);
  var ptr = mem.malloc(b.length + 1);
  for (var i = 0; i <= b.length; i++) {
    H[ptr + i] = b[i];
  }
  return ptr;
}

var words = ["Hello", "World", "true", "false", "yes", "no"];
var ptrs = [];

for (var i = 0; i < 30; i++) {
  dump();
  ptrs.push(store(words[Math.floor(Math.random() * words.length)]));
  dump();
  if (Math.random() > 0.3) {
    var ptr = ptrs.splice(Math.floor(Math.random() * ptrs.length), 1);
    mem.free(ptr);
    dump();
  }
}
// var ptr = store("Hello");
// dump();
// cstring(ptr);
// var ptr2 = store("World");
// // var ptr2 = mem.malloc(10);
// dump();
// cstring(ptr2);
// mem.free(ptr);
// dump();
// ptr = store("true");
// dump();
// cstring(ptr);
// var ptr3 = store("false");
// dump();
// cstring(ptr3);
// mem.free(ptr);
// dump();
// mem.free(ptr3);
// dump();
// mem.free(ptr2);
// dump();
// ptr = mem.malloc(20);
// dump();
// cstring(ptr);


function dump() {
  var parts = [];
  for (var i = 0; i < highest<<2; i += 4) {
    parts.push(H32[i>>2].toString(16));
  }
  console.log(parts.join(" "));
}

function cstring(ptr) {
  if (!ptr) return "(NULL)";
  var str = "";
  var i = 0;
  while (H[ptr] && i++ < 10) {
    str += String.fromCharCode(H[ptr++]);
  }
  console.log("0x%s: %s", ptr.toString(16), str);
}