Keep it Simple. Keep it Safe.

# Primatives

## String

Unicode string.

### Supported Operators

 - @add string string - concatenates two strings and results in a new string
 - All comparator operators
 - @index - extracts a single character at an index

## Buffer

Chunk of raw memory as byte array.

 - @index - extracts a single byte from the array.

## Integer

Signed integer.

 - All operators when num to num
 - ToStrings to base 10 version of number

## Boolean

True or False.

 - Works with the logical operators.

## Nil

Nil represents nothing or an unitialized value.

 - Acts as false in logical operations

## Symbol

A symbol represents a variable itself not it's value.

 - No operators

## Builtin

An opaque handle to one of the builtin program fragment types.  These tag lists in representations of program code.  For example, the following expression:

```jack
a * 2 + 2 / 3
```

is encoded as:

```jack
[@add
  val: [@mul val: :a val: 2]
  val: [@div val:  2 val: 3]]
```

Where `@add`, `@mul` and `@div` are the builtin primitives.

## Native

A piece of code implemented outside the language.  A chunk is given the current scope and can modify or use variables.  It can also define new variables.  It can optionally exit with a return value.

# Data Structures

## List

Contains 0 or more items in order.

List items, in addition to their list offset, may have offset keys for fast and position independent access.

# Function and Variable Types

## @fn args code

Define a function with args and body.

## @fni scope fn

An instance of a function with reference to it's parent closure scope and reference to it's function prototype.

## @block code

Like a function except it doesn't accept arguments or return values.  It's an expression.  The last expression in it's code body is it's value.

## @call fni args

Call a function instance with args.

## @return val

Return early from the current function with an optional value.

## @returnif cond val

Return early if the condition is truthy. It only evaluates the value in the true case.

## @let sym val

Bind a new local variable with optional value.

## @assign sym val

Rebind an existing variable to a new value.

# Lookup Operators

## @lookup val key

Lookup a value in a list by key. Returns `nil` if the key doens't exist.

## @index val num

Lookup a value in a list by index. Negative indexes count from end.

# Control Flow Types

## @while cond block

Repeatedly evaluate the condition expression and execute the block.

## @if [cond block]+ else

Execute one of the blocks by the first matched condition.  Can have 0 or more elif blocks and an optional else block at the end.

# Numerical Operators

## @add val val

Add two values.

## @sub val val

Subtract two values.

## @mul val val

Multiply two values.

## @div val val

Divide two values. Rounding down.

## @pow val val

Raise the first value to the power of the second.

Rounds down when

# Logical Operators

All values are truthy except for `false`, `nil`.

## @and cond cond

Boolean and between expressions.

## @or cond cond

Boolean or between expressions.

## @xor cond cond

Boolean xor between expressions.

## @not cond

Boolean not of expression.

## @conditional cond val val

Choose one of two expressions based on the condition.

# Comparator Operators

## @lt val val

Less than comparator.

## @lte val val

Less than or equal comparator.

## @gt val val

Greater than comparator.

## @gte val val

Greater than or equal comparator.

## @eq val val

Equal comparator.

## @neq val val

Not equal comparator.

# Bitwise Operators

## @lshift num num

Left shift first expression by second expression bits.

## @rshift num num

Right shift first expression by second expression bits.

## @bxor num num

Bitwise xor the two values

## @band num num

Bitwise and the two values

## @bor num num

Bitwise or the two values
