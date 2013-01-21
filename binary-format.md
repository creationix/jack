This document is the binary representation of jack abstract code in a serializable format.  It tells how to serialize and deserialize all the primitive types.

# Header

The beginning of the file has the following 6 byte magic header:

    <4A 61 63 6B 2A 00> or "Jack*\0" or "Jack" + 42 + 0

This is followed by a ULEB128 <http://en.wikipedia.org/wiki/LEB128> byte-length value of the payload.

# Code Section

The code sections is stored as unstructured data in nested lists.  Each value can be distinguished by the first byte in the value. Strings are stored using utf8 encoding.

```
00xxxxxx 0x00-0x3f
  00000000 0x00 - long negative integer, following bytes are ULEB128
  00000001 0x01 - long positive integer, following bytes are ULEB128
  00000010 0x02 - long string, first ULEB128 length, then raw data
  00000011 0x03 - long list, first ULEB128 length, then raw items
  00000100 0x04 - buffer, ULEB128 length, then raw data
  00000101 0x05 - Null
  00000110 0x06 - False
  00000111 0x07 - True
  00010000 0x10 - @class
  00010001 0x11 - @on
  00010010 0x12 - @def
  00010011 0x13 - @return
  00010100 0x14 - @abort
  00010101 0x15 - @fn
  00010110 0x16 - @send
  00010111 0x17 - @var
  00011000 0x18 - @assign
  00011001 0x19 - @lookup
  00011010 0x1a - @if
  00011011 0x1b - @while
  00011100 0x1c - @forin
  00011101 0x1d - @mapin
  00011110 0x1e - @list
  00011111 0x1f - @map
01xxxxxx 0x40-0x7f - small positive int (0-63)
10xxxxxx 0x80-0xbf - short string (0-63 bytes long) then raw data
11xxxxxx 0xc0-0xff - short list (0-63 items long) then raw data
```