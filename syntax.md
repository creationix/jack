This document is the canonical concrete syntax for the Jack language.  Note that other syntaxes can be defined since it's the abstract format that really describes the language.  Then tools can convert between syntaxes to suit the developer's taste.

## Comment

Comments are completely ignored by the parser.  The syntax is two dashes that comment out to the end of the line.

    -- This is a comment

## Integer

Integers are represented as base 10 numbers.  They can be matched by the regular expression `(0|-?[1-9][0-9]*)`.

## Nil

Nil is represented as the string `nil`.

## Boolean

Booleans are represented by the strings `true` and `false`.

## String

A string is represented as the value between double or single quotes.  It has the same escape syntax as C code.  Unicode values are described inline as actual characters.

## Buffer

Buffer values are represented as a series of hex values between angle brackets.  For example, the jack binary format header would look like `<4A 61 63 6B 2A 00>`.

## Block

A block is simply code between curly braces.

## Function

A function is a block with arguments header.  This is represented as space separated identifiers between vertical pipes.  For example a function that accepts one variable and returns it's square looks like: `{|x| x * x }`.

## Function Call

A function is called by using the `!(...)` syntax where `...` is a list of values to be used as arguments.  For example assuming the square function is bound to the `square` identifier, we would call it using `square!(5)`.

## Binary operators

Binary operators can be represented using infix notation and is parsed using operator precedence.  For example the code `[@add 1 2]` is represented as `1 + 2`.

TODO: document all operators specifically and their symbols.

## Not operator

The negation operator is simply the `~` character before the expression.

## Parenthesis for manual order of operations

When the built-in order of operations is not the desired outcome, parenthesis may be used to manually group just as is done in arithmetic.

## Let keyword

The `let` keyword is used to create a new local variable.  Variables are lexically scoped so new local variables need to be defined so that the compiler can tell a reference to an outer scope apart from a typo or a new local variable.  Example: `let name = "Tim"`.

## Assign

To assign a value to an existing variable, use the `=` character.  This works like the other binary operators and is an inline expression. `name = "Tim"`.

## If..elif..else keywords

To create an if block, there are three keywords: `if`, `elif` and `else`.  The syntax is (`if` condition block (`elif` condition block)* (`else` block)?). Where there can be 0 or more elif sections and an optional else block at the end.

## While keyword

While is written as (`while` condition block).

## Return keyword.

Return is written as the statement (`return` expression?). 

## Lists

Lists are simply space separated values bounded by square brackets.  For example a list containing the numbers 1, 2, and 3 would be `[1 2 3]`.

Aliases can be defined in the literal syntax using `ident:` or `"string":` syntax.  So another list is `[name: "Tim" age: 30]`.  The styles can be mixed and each value can have 0 or more aliases. `[1 label: another: 2 3]` is valid.

## # length

The `#` operator returns the length of a string, buffer, or list. For example `#[1 2 3]` evaluates to `3`.

## Keys keyword

To get the alias keys of a list, use (`keys` list).

## Indexing

To read a value from a list, buffer, or string at an index, you can read it with `[]` syntax.  For example `people[3]` will return the 4th item in the people list.

To set a value, simply use assign syntax. `people[3] = "bob"`.

Aliases can be used as well with either dot notation or strings between the square braces. `person.name` or `person["name"]`.  Assignment works here too as in: `person.name = "Fred"`.

## Read and write aliases directly

To read and write raw alias indexes using `.&ident` or `&[index]`.  For example:

    let list = ["a" "b" "c" "d" "e"] -- Create a new list
    list.&middle = 2       -- Manually alias "middle" to index "2"
    list.middle            --> "c"
    list.&middle           --> 2
    list&["middle"]        --> 2

## Remove keyword

Remove can be used to remove aliases and optionally the slot they point to from the list.  If `&` syntax is used, only the alias is deleted.  If not, the slot is removed and all aliases pointing to that slot are deleted.  Resuming from the previous example:

    list.anotherLabel& = 2  -- Create a new label
    remove list.&middle     -- Delete the middle alias, the value "c" is still there as is the new label.
    remove list.anotherLabel -- The value is removed from the array and so all labels pointing to that slot are also removed.

Remove returns the removed value or the alias index of the removed alias.

It can also be used with numerical indexes.

    list = ["this" "is" "neat"]
    is = remove list[1]          --> "is", the list is now just ["this" "neat"]




## Built-ins

Built-ins are represented by `@` followed by their string name. The possible values are `@add`, `@sub`, `@mul`, `@div`, `@pow`, `@and`, `@or`, `@xor`, `@not`, `@conditional`, `@lte`, `@lt`, `@gte`, `@gt`, `@neq`, `@eq`, `@if`, `@while`, `@fn`, `@block`, `@call`, `@let`, `@assign`, `@fni`, `@len`, `@keys`, `@get`, `@set`, `@insert`, `@remove`, `@slice`, `@alias`, `@read`, `@unalias`, `@aget`, `@aset`, and `@adel`.

## Variables and Symbols

Variables are represented in two ways depending on if you mean to access their value or the symbol itself.  In either case, the identifier names must match the `[a-zA-Z_][a-ZA-Z0-9_]*` regular expression.  If it's a symbol a `:` is prefixed before the identifier.  So for example, the symbol for the variable `name` is `:name`.

(TODO: do we need symbols to symbols?  How does syntax build syntax that needs symbols?)

## Native Code

Native Blocks are represented by `$` followed by the native name.  The name must match the identifier pattern. For example, to reference the native `readdir` code block you would use `$readdir`.

## Native Value

It's impossible for syntax to create native values or store native values in source code.  However, native functions can create native values, and the string representation is `$HEXVALUE` where it's the hex representation of some opaque number. 

