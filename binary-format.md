This document is the binary representation of jack abstract code in a serializable format.  It tells how to serialize and deserialize all the primitive types.

# Header

The beginning of the file has the following 6 byte magic header:

    <4A 61 63 6B 2A 00> or "Jack*\0" or "Jack" + 42 + 0

This is followed by a ULEB128 <http://en.wikipedia.org/wiki/LEB128> byte-length value of the payload.

# Code Section

The code sections is stored as unstructured data in nested lists.  Each value can be distinguished by the first byte in the value.

 - `00000000` - Nil
 - `0000001X` - Boolean where `X==1` is true and `X==0` is false
 - `0000010X` - Integer `X` is sign bit (1 is negative). The value is stored in the following byte(s) as ULEB128 format.
 - `00001000` - String, Next is the string length as ULEB128 followed by actual data encoded as UTF8 (without surrogate pairs).
 - `00001001` - Buffer, Next is the string length as ULEB128 followed by actual raw data.
 - `00001010` - Symbol, stored the same as string.
 - `00001011` - Name of native code block stored as ASCII string.
 - `00010000` - List. Followed by two ULEB128 numbers, one for number of aliases and one for number of items in list.
  - Next is the aliases block.  Each alias is a string followed by a ULELB128 number for the index.
  - Next is the actual raw values. 
 - `01XXXXXX

 - `1XXXXXXX` - Built-in where `X` is a 7-bit instruction code as follows.
  - `1000 0000` - @add
  - `1000 0001` - @sub
  - `1000 0010` - @mul
  - `1000 0011` - @div
  - `1000 0100` - @pow
  - `1000 1000` - @and
  - `1000 1001` - @or
  - `1000 1010` - @xor
  - `1000 1011` - @not
  - `1000 1100` - @conditional
  - `1000 1101` - @type
  - `1001 0000` - @lte
  - `1001 0001` - @lt
  - `1001 0010` - @gte
  - `1001 0011` - @gt
  - `1001 0100` - @neq
  - `1001 0101` - @eq
  - `1001 1000` - @if
  - `1001 1001` - @while
  - `1010 0000` - @def
  - `1010 0001` - @block
  - `1010 0010` - @call
  - `1010 0100` - @let
  - `1010 0101` - @assign
  - `1011 0000` - @fn
  - `1100 0000` - @len
  - `1100 0001` - @keys
  - `1100 0010` - @get
  - `1100 0011` - @set
  - `1100 0100` - @insert
  - `1100 0101` - @remove
  - `1100 0111` - @slice
  - `1100 1000` - @alias
  - `1100 1001` - @read
  - `1100 1010` - @unalias
  - `1100 1100` - @aget
  - `1100 1101` - @aset
  - `1100 1111` - @adel

