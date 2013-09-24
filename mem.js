
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
    // Add in pointer type tag.
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
    // Ensure the first two bits are "10"
    if (((ptr >> 30) & 3) !== 2) return 0;
    // Mask off the remaining 30 bits
    ptr = ptr | 0;
    var start = (ptr - 1) >> 2;
    var size = H32[start] | 0;
    H32[start] = -size | 0;
    for (var i = 1; i < size; ++i) {
      H32[start + i] = 0;
    }
    return 1;
  }


  function writeNull(offset) {
    H[offset | 0] = 0;
    return offset;
  }

  function writeBool(val, offset) {
    H32[offset >> 2] = (1 << 24) | val;
    return offset;
  }

  function writeInt(val, offset) {
    H[offset | 0] = 2;
    H32[(offset + 4) >> 2] = val | 0;
    return offset;
  }

  function writeForm(val, offset) {
    H[offset | 0] = 4;
    H32[(offset + 4) >> 2] = val | 0;
    return offset;
  }

  function writeString(ptr, length, offset) {
    H32[offset >> 2] = (8 << 24) | length;
    H32[(offset + 4) >> 2] = ptr | 0;
    return offset;
  }

  function writeBuffer(ptr, length, offset) {
    H32[offset >> 2] = (9 << 24) | length;
    H32[(offset + 4) >> 2] = ptr | 0;
    return offset;
  }

  function writeTuple(ptr, length, offset) {
    H32[offset >> 2] = (10<<24) | length;
    H32[(offset + 4) >> 2] = ptr | 0;
    return offset;
  }

  // function len(ptr) {
  //   var type = H[ptr] | 0;
  //   // 0 - null
  //   if (type === 0) return nullLen() | 0;
  //   // 1 - int32
  //   if (type === 1) return intLen(H32[(ptr >> 2) + 1] | 0) | 0;
  //   // 2 - false
  //   if (type === 2) return falseLen() | 0;
  //   // 3 - true
  //   if (type === 3) return trueLen() | 0;
  //   // 4 - form
  //   if (type === 4) return formLen(H32[(ptr + 4) >> 2] | 0) | 0;
  //   // 5 - symbol
  //   if (type === 5) return symbolLen(H32[(ptr + 4) >> 2] | 0) | 0;
  //   // 8 - string
  //   if (type === 8) return stringLen((ptr + 4) | 0, H32[ptr >> 2] & 0xffffff) | 0;
  //   // 9 - buffer
  //   if (type === 9) return bufferLen((ptr + 4) | 0, H32[ptr >> 2] & 0xffffff) | 0;
  //   // a - tuple
  //   if (type === 10) return tupleLen((ptr + 4) | 0, H32[ptr >> 2] & 0xffffff) | 0;
  //   // b - list
  //   if (type === 11) return listLen((ptr + 4) | 0) | 0;
  //   // c - map
  //   if (type === 11) return mapLen((ptr + 4) | 0) | 0;
  //   // e - code
  //   if (type === 11) return codeLen((ptr + 4) | 0) | 0;
  //   // f - scope
  //   if (type === 11) return scopeLen((ptr + 4) | 0) | 0;
  // }

  return { malloc: malloc, free: free, combine: combine,
    writeNull: writeNull,
    writeBool: writeBool,
    writeInt: writeInt,
    writeString: writeString,
    writeBuffer: writeBuffer,
    writeTuple: writeTuple,
    writeForm: writeForm,
  };
}

var stdlib = (function () { return this; }());
var heap = new ArrayBuffer(0x80);
var H32 = new stdlib.Int32Array(heap);
var H = new stdlib.Uint8Array(heap);
for (var i = 0; i < H.length; ++i) {
  H[i] = 0;
}
var mem = Memory(stdlib, {}, heap);

// writeTuple([0, 1, 2, true, false, null, "Hello", new Buffer([1,2,3])]);
writeTuple([new Form("get"), new Form("get")])
dump();

function writeTuple(items, ptr) {
  ptr = ptr || mem.malloc(8);
  var length = items.length;
  var ext = mem.malloc(length * 8);
  for (var i = 0; i < length; ++i) {
    write(items[i], ext + i * 8);
  }
  return mem.writeTuple(ext, length, ptr);
}

function write(val, ptr) {
  var length, ext, i, buffer;
  ptr = ptr || mem.malloc(8);
  if (!ptr) throw "ENOMEM";
  if (typeof val === "string") {
    buffer = new Buffer(val);
    length = buffer.length;
    ext = mem.malloc(length);
    if (!ext) throw "ENOMEM";
    for (i = 0; i < length; ++i) H[ext + i] = buffer[i];
    return mem.writeString(ext, length, ptr);
  }
  if (Buffer.isBuffer(val)) {
    length = val.length;
    ext = mem.malloc(length);
    if (!ext) throw "ENOMEM";
    for (i = 0; i < length; ++i) H[ext + i] = val[i];
    return mem.writeBuffer(ext, length, ptr);
  }
  if (val === null) return mem.writeNull(ptr);
  if (typeof val === "boolean") return mem.writeBool(val ? 1 : 0, ptr);
  if (val|0 === val) return mem.writeInt(val, ptr);
  if (val instanceof Form) {
    buffer = new Buffer(val.name);
    return mem.writeForm(
      buffer[0] << 0 |
      buffer[1] << 8 |
      buffer[2] << 16 |
      buffer[3] << 24, ptr);
  }
  throw "TYPE NOT SUPPORTED";
}

function Form(name) {
  this.name = name;
}

function Symbol(name) {
  this.symbol = symbol;
}

// var words = ["Hello", "World", "true", "false", "yes", "no", "A Long Message", "More Detailed"];
// var ptrs = [];

// for (var i = 0; i < 40; i++) {
//   dump();
//   ptrs.push(store(words[Math.floor(Math.random() * words.length)]));
//   dump();
//   if (Math.random() > 0.3) {
//     var ptr = ptrs.splice(Math.floor(Math.random() * ptrs.length), 1);
//     if (!mem.free(ptr)) throw "EINVALID";
//     dump();
//   }
// }
// while (ptrs.length) {
//   var ptr = ptrs.splice(Math.floor(Math.random() * ptrs.length), 1);
//   if (!mem.free(ptr)) throw "EINVALID";
//   dump();
// }
// // mem.combine();
// dump();


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