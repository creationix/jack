
function Memory(stdlib, foreign, heap) {
  "use asm";

  var H32 = new stdlib.Int32Array(heap);
  var offset = 1;
  var length = H32.length | 0;

  // Malloc is very simple.  If there is free space at the end, it uses that.
  // If not, it looks for the next fitting empty slot, merging if needed.
  function malloc(len) {
    // len is length requested by user in bytes
    len = len|0;
    if (len === 0) return 0;
    // size is size of block (including header) in words.
    var size = (len + 7) >> 2;
    var loop = 0;
    for(;;) {
      var v = H32[offset]|0;

      // If we're at the end of all used memory...
      if (v === 0) {
        // If there is still space, grab it.
        if (((offset + size) | 0) < length) break;
        // If this is the second time here, we're in trouble!
        if (loop === 1) combine();
        else if (loop === 2) return 0;
        // Otherwise, start over looking for leftovers.
        loop = (loop + 1) | 0;
        offset = 1;
        continue;
      }

      // If it's still in use, skip over it.
      if (v > 0) {
        offset = (offset + v) | 0;
        continue;
      }

      // If the slot is an exact fit, take it.
      if (v === -size) break;

      // If there is room to split, then split it.
      if (-v >= size + 2) {
        H32[offset + size] = (v + size) | 0;
        break;
      }
      offset = (offset - v) | 0;
    }
    
    // Record this new slot
    H32[offset] = size;
    // Calculate the data offset in bytes for user data.
    var ptr = (offset + 1) << 2;
    // Increment the offset for the next malloc
    offset = (offset + size) | 0;
    return ptr;
  }
  
  function combine() {
    var i = 1;
    for (;;) {
      var v = H32[i] | 0;
      if (v > 0) {
        i = (i + v) | 0;
        continue;
      }
      if (v === 0) break;
      var start = i;
      do {
        H32[i] = 0;
        i = (i - v) | 0;
      } while ((v = H32[i]|0) < 0);
      H32[start] = start - i;
    }
  }

  // Free is very fast.  It simply marks a section as free.
  // Also it moves the offset to the newly freed slot.
  function free(ptr) {
    ptr = ptr|0;
    if (ptr === 0) return;
    var start = (ptr >> 2) - 1;
    var size = H32[start] | 0;
    H32[start] = -size | 0;
    for (var i = 1; i < size; ++i) {
      H32[start + i] = 0;
    }
  }

  return { malloc: malloc, free: free, combine: combine };
}

var stdlib = (function () { return this; }());
var heap = new ArrayBuffer(0x70);
var H32 = new stdlib.Int32Array(heap);
var H = new stdlib.Uint8Array(heap);
for (var i = 0; i < H.length; ++i) {
  H[i] = 0;
}
var mem = Memory(stdlib, {}, heap);

function store(str) {
  var b = new Buffer(str);
  var ptr = mem.malloc(b.length + 1);
  if (!ptr) throw "ENOMEM";
  for (var i = 0; i <= b.length; i++) {
    H[ptr + i] = b[i];
  }
  return ptr;
}

var words = ["Hello", "World", "true", "false", "yes", "no", "A Long Message", "More Detailed"];
var ptrs = [];

for (var i = 0; i < 40; i++) {
  dump();
  ptrs.push(store(words[Math.floor(Math.random() * words.length)]));
  dump();
  if (Math.random() > 0.3) {
    var ptr = ptrs.splice(Math.floor(Math.random() * ptrs.length), 1);
    mem.free(ptr);
    dump();
  }
}
while (ptrs.length) {
  var ptr = ptrs.splice(Math.floor(Math.random() * ptrs.length), 1);
  mem.free(ptr);
  dump();
}
// mem.combine();
dump();


function dump() {
  var parts = [];
  for (var i = 0; i < H32.length; ++i) {
    parts.push(H32[i].toString(16));
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