# Primatives

## String

UTF-8 encoded string.

## Integer

Signed integer.

## Boolean

True or False.

## Nil

Nil represents nothing or an unitialized value.

## Query

These are kinda like regular expressions except they match not only contents of strings, but also parts of any data structure.  See `query-language.md` for more information.

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
  [@mul :a 2]
  [@div 2 3]]
```

Where `@add`, `@mul` and `@div` are the builtin primitives.

# Data Structures

## List

Contains 0 or more items in order.

## Map

A mapping of arbitrary values to other arbitrary values.

**TODO** Figure out how this part fits in.

# Function and Variable Types

## @fn args-array items-array

Define a function with args and body.

## @call function args...

Call a function with args.

## @bind symbol value?

Bind a new local variable with optional value.

## @rebind symbol value

Rebind an existing variable to a new value.

## @lookup value value

Treat the first value as either a list or

# Control Flow Types

## @while condition function

Repeatedly evaluate the condition expression and call the function with the result if it's truthy.

## @if (condition function)+ else-function?

Execute one of the functions by the first matched condition.  Can have 0 or more elif blocks and an optional else block at the end.  The if and elif block functions get the truthy condition as their first arg.

## @match expr (value-query function)+ default-function?

Works much like if..elif..else except checks for equality against the queries.  Queries can match type and structure on lists/objects.  The function is given the query results and the original data if matched.

# Numerical Operators

## @add expr expr

Add two values.

## @sub expr expr

Subtract two values.

## @mul expr expr

Multiply two values.

## @div expr expr

Divide two values.

## @pow expr expr

Raise the first value to the pow.er of the second.

# Logical Operators

## @and expr expr

Boolean and between expressions.

## @or expr expr

Boolean or between expressions.

## @xor expr expr

Boolean xor between expressions.

## @not expr

Boolean not of expression.

## @conditional cond expr expr

Choose one of two expressions based on the condition.

# Comparator Operators

## @lt expr expr

Less than comparator.

## @lte

Less than or equal comparator.

## @gt

Greater than comparator.

## @gte

Greater than or equal comparator.

## @eq

Equal comparator.

## @neq

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
