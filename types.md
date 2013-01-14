Keep it Simple. Keep it Safe.

# Primatives

These are the values that make up the core data representation of the abstract language and runtime.  They are represented as themselves directly.

## String

Unicode string.


### Supported Operators

 - @add string string - concatenates two strings and results in a new string
 - All comparator operators
 - @get and @len - extracts a single character at an index and gives character length.

## Buffer

Raw binary data as byte array.

Only @get @set and @len operators can be used on this type.

## Integer

Signed integer.

 - Works with all operators when num to num

## Boolean

True or False.

 - Works with the logical operators.

## Nil

Nil represents nothing or an unitialized value.

 - Acts as false in logical operations

## Symbol

A symbol represents a variable itself not it's value.

 - Acts as true in logical operations

## Builtin

An opaque handle to one of the builtin program fragment types.  These tag lists in representations of program code.  For example, the following expression:

 - Acts as true in logical operations

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

## Native Code

A piece of code implemented outside the language.  A chunk is given the current scope and can modify or use variables.  It can also define new variables.  It can optionally exit with a return value.

 - Acts as true in logical operations

## Native Value

An opaque value that can be created by or used by native code chunks.

## List

There is one data structure in the language.  It's the list.

Contains 0 or more items in order.

List items, in addition to their list offset, may have offset keys for fast and position independent access.  Any value type may be used as the alias key.

 - Supports all list operations

# Function and Variable Types

## @def args code*

Define a function with args and body.  For example, a square function definition looks like:

    [@def [:x]
      [@mul :x :x]
    ]

## @fn scope args code*

An instance of a function with reference to the scope it was defined in and the list that was in the definition.

A scope is just a hash-map that also has the parent scope at index 0.  If the parent it nil, there is no parent.

For example, the following program:

    let name = "Tim"
    let square = {|x| x * x }

will result in the following `@fn` object:

    [@fn
      [nil name: "tim" square: [@def ...]]
      [:x]
      [@mul :x :x]
    ]

## @block code

Like a function except it doesn't accept arguments or return values.  It's an expression.  The last expression in it's code body is it's value.

## @call fni args

Call a function instance with args.

## @return val

Return early from the current function with an optional value.

## @let sym val

Bind a new local variable with optional value.

## @assign sym val

Rebind an existing variable to a new value.

## @type val

return the string type representation of the value.  The possible values are: `string`, `buffer`, `nil`, `boolean`, `int`, `symbol`, `nativecode`, `nativevalue`, `symbol`, X where X is the specific builtin name. (like `fn`, `type`, etc..).

# Data Operators

These work with lists and somewhat with other types.

In all operations that accept numerical indexes, a negative index means to count down from list length.  So, for example, a list of 5 items, -2 would be index 3 or the fourth item.

If the index is a string, a corresponding alias is looked in the list.  If found, the real value is inserted.  If it's not found an error is thrown (except for the @set operation)

## @len list-or-string

Return the number of items in the list or the number of unicode characters in the string.

## @slice list-or-string index index

Return a shallow copy of the list or string.  The indexes are start and end indexes.  Passing in nil for the first defaults to 0 and nil for the second defaults to length.  Negative indexes can be used here as well, but remember that -1 is 1 before length.

## @get list-or-string index

Lookup a value in a list or string by index.
Negative indexes count from end.

## @set list index val

Put a new value in the list at the specified slot index.

If the index is a string that doesn't correspond to an alias, a new value is inserted and an alias created.

## @insert list index val

Insert an item into the list before the index value.  If nil is used, it means to insert on to the end.  Negative indexes still are added to length, but in the case of insert, this means insert before the last item.

This will shift all items after it and any alias index after it as well.

## @remove list index

Remove an item from the list by index.  This will shift all items after it and any alias index after it as well.  Any aliases pointing to this item are removed.

## @keys list

Return a list of all the alias keys.

## @alias list key index

Create a named alias using the string key.  If the alias already exists, point it to the new index. Negative indexes are converted before storing with the alias.

## @read list key

Read the index where the alias is pointing to.  Insert and remove before the alias can change it's position.

## @unalias list key

Remove a named alias.

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

## @mod val val

Divide the first by the second and return the remainder.

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

