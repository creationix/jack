# Primatives

## String

UTF-8 encoded string.

## Buffer

Chunk of raw memory as byte array.

## Integer

Signed integer.

## Boolean

True or False.

## Nil

Nil represents nothing or an unitialized value.

## Symbol

A symbol represents a variable itself not it's value.

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

## @query path

These are kinda like regular expressions except they match not only contents of strings, but also parts of any data structure.  See `query-language.md` for more information.

## @block code

Like a function except it doesn't accept arguments or return values.  It's an expression.  The last expression in it's code body is it's value.

## @call fn args

Call a function with args.

## @bind sym val

Bind a new local variable with optional value.

## @rebind sym val

Rebind an existing variable to a new value.

## @lookup val key

Treat the first value as either a list or

# Control Flow Types

## @while cond fn

Repeatedly evaluate the condition expression and call the function with the result if it's truthy.

## @if [cond fn]+ else

Execute one of the functions by the first matched condition.  Can have 0 or more elif blocks and an optional else block at the end.  The if and elif block functions get the truthy condition as their first arg.

## @match val [query fn]+ default

Works much like if..elif..else except checks for equality against the queries.  Queries can match type and structure on lists/objects.  The function is given the query results and the original data if matched.

# Numerical Operators

## @add val val

Add two values.

## @sub val val

Subtract two values.

## @mul val val

Multiply two values.

## @div val val

Divide two values.

## @pow val val

Raise the first value to the power of the second.

# Logical Operators

## @and val val

Boolean and between expressions.

## @or val val

Boolean or between expressions.

## @xor val val

Boolean xor between expressions.

## @not val

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
