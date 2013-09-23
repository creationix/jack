function Memory(stdlib, foreign, heap) {
  "use asm";

  var H32 = new stdlib.Int32Array(heap);
  var HU32 = new stdlib.Uint32Array(heap);
  
  var start = 0x1000;
  
  function malloc(len) {
    len = len|0;
    if (len === 0) return 0;
    // Add 8 and round up to the nearest word.
    var size = (len + 11) >> 2;
    var offset = start >> 2;
    for(;;) {
      var v = H32[offset] >> 2;
      if (v > 0) {
        offset += v;
        continue;
      }
      if (v < 0) {
        if (size === -v) break;
        if (size <= (-v - 12)) {
          var nSize = v + size;
          H32[offset + size] =
          H32[offset + size + nSize] = -nSize << 2;
          break;
        }
        offset -= v >> 2;
        continue;
      }
      break;
    }
    H32[offset] = H32[offset + size - 1] = size << 2;

    return (offset + 1) << 2;
  }

  function free(ptr) {
    ptr = ptr|0;
    if (ptr === 0) return;
    // Offset of start in words
    var offset = (ptr >> 2) - 1;
    // Size in words
    var size = H32[offset] >> 2;
    if (size <= 0) throw "INVALID SIZE: " + size
    // Next size in words
    var nOffset, nSize;
    while ((nSize = -H32[nOffset = (offset + size)] >> 2) > 0) {
      H32[nOffset] = 0;
      H32[nOffset + nSize - 1] = 0;
      size = (size + nSize) | 0;
    }
    if (H32[offset + size] === 0) {
      H32[offset] = 0;
      H32[offset + size - 1] = 0;
    }
    else {
      H32[offset] = -size << 2;
      H32[offset + size - 1] = -size << 2;
    }
  }

  return { malloc: malloc, free: free };
}

var stdlib = (function () { return this; }());
var heap = new ArrayBuffer(1024*1024*16);
var H32 = new stdlib.Int32Array(heap);
var H = new stdlib.Uint8Array(heap);
var mem = Memory(stdlib, {}, heap);

dump();
var ptr = mem.malloc(13);
dump();
var ptr2 = mem.malloc(10);
dump();
mem.free(ptr);
dump();
ptr = mem.malloc(4);
dump();
var ptr3 = mem.malloc(4);
dump();
mem.free(ptr);
dump();
mem.free(ptr3);
dump();
mem.free(ptr2);
dump();
ptr = mem.malloc(20);


function dump() {
  var parts = [];
  for (var i = 0x1000; i < 0x1040; i += 4) {
    parts.push(H32[i>>2]);
  }
  console.log(parts.join(" "));
}

function cstring(ptr) {
  if (!ptr) return "(NULL)";
  var str = "";
  var i = 0;
  while (H32[ptr] && i++ < 10) {
    str += String.fromCharCode(H32[ptr++]);
  }
  return str;
}