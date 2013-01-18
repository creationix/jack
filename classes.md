# Generic methods

All types have these

## "!="

`self != tobool(other)`

## "=="

`self == tobool(other)`

## "&&"

`self && tobool(other)`

## "||"

`self || tobool(other)`

## "^^"

`self ^^ tobool(other)`


# Integer

## "+"

`self + tonumber(other)`

## "-"

`self - tonumber(other)`

## "/"

`self / tonumber(other)`

## "*"

`self * tonumber(other)`

## "^"

`self ^ tonumber(other)`

## "%"

`self % tonumber(other)`

## "<"

`self < tonumber(other)`

## "<="

`self <= tonumber(other)`

## ">"

`self > tonumber(other)`

## ">="

`self >= tonumber(other)`

## "!="

`self != tonumber(other)`

## "=="

`self == tonumber(other)`

## "&&"

`tobool(self) && tobool(other)`

## "||"

`tobool(self) || tobool(other)`

## "^^"

`tobool(self) ^^ tobool(other)`

## "tonumber"

`self`

## "tostring" (base)

Convert to string with optional tonumber(base) (defaulting to 10)
error if base < 2 or base > 36

## "tobool"

Convert to `true` unless the value is `0`.

# Boolean

## "tobool"

Return self

## "tonumber"

Convert to `1` if `true` and `0` if `false`.

## "tostring"

Convert to `"true"` if `true` and `"false"` if `false`.

# String

## "+"

`self concat tostring(other)`

## "*"

`repeat self tonumber(other) times`

## "<"

`self < tostring(other)`

## "<="

`self <= tostring(other)`

## ">"

`self > tostring(other)`

## ">="

`self >= tostring(other)`

## "!="

`self != tostring(other)`

## "=="

`self == tostring(other)`

## "&&"

`tobool(self) && tobool(other)`

## "||
"
`tobool(self) || tobool(other)`

## "^^"

`tobool(self) ^^ tobool(other)`

## "tostring"

return self

## "tonumber" (base)

Attempt to parse as a number (defaulting to base 10, but accept tonumber(base)).
May fail depending on the input.
error if base < 2 or base > 36

## "tobool"

true for everything except empty strings.

## "length"

return number of characters in string

## "get" (index)

return character at 0-based tonumber(index).
Negative indexes count back from end.
error if out of range

## "slice" (start, end)

return substr from tonumber(start) to tonumber(end)
Negative indexes count back from end.
error if out of range

# Null

## "tostring"

`"null"`

## "tonumber"

`0`

## "tobool"

`false`

# List

## "+" (other)

concat self with tolist(other)

## "*" (num)

repeat self tonumber(other) times

## "tobool"

`true`

## "length"

Return the number of items

## "slice" (start, end)

return copy of array from tonumber(start) to tonumber(end)

## "get" (index)

Get item at tonumber(index)
error if out of range

## "set" (value, index)

Set item at tonumber(index) to value
error if out of range

## "keys"

return an array of integers from 0 to length - 1.

## "insert" (value, index)

otherwise insert value at tonumber(index)
error if out of range
return value

## "remove" (index)

remove item at tonumber(index)
error if out of range

## "push" (value)

push a new item on the end
return index

## "pop"

Remove last item from list, return
error if empty

# Map

## "+" (other)

merge keys and values in self with tomap(other)
conflicts in other replace keys in self.

## "get" (key)

Get item at key
error if it doesn't exist

## "set" (value, key)

Set item at key
return value

## "has" (key)

return true if key is in map

## "delete" (key)

remove a key from map
error if it doesn't exist

## "clear"

Remove all keys and values from map

## "keys"

return an array of keys in map

# WeakMap

Works exactly like Map, except there is no "keys" handler and keys are held weakly.

# Function

## "call" (...)

A function can be called obviously.  This creates a new local scope inheriting from the function's closure scope, binds the passed in parameters to local variables and executes the contents returning whatever is eventually returned.

## "tolist"

Returns the AST of the function as nested lists.  Modifications to this list will change and/or break the behavior of the function.

## "clone"

This makes a deep clone of the function keeping the same closure reference.

# Class

Classes act the same as functions, they simply interpret their contents slightly differently.  Classes return instances of themselves that listen to the defined handlers.


