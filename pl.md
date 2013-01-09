# Goals

 - Minimal, no IO, no module system, tiny stdlib
 - Easy to implement
 - Easy to learn
 - Easy to embed
 - tiny self-hosted compile to C implementation
 - self-hosted compile to JS implementation

# Values

 - Simple immutable primitives
  - integers for counting, loops, indexes, offsets, lengths.
  - floats for when you really need them
  - Booleans (true, false)
  - nil (essentially means undefined)
  - utf8 encoded strings
   
 - mutable data structures
  - dense ordered lists, no holes allowed
  - unordered maps where any value type can be key or value
  - bytearrays for dealing with binary data possible ctype interface using struct definitions

# Expressions

 - explicit order of operations using parens
 - Number/Integer -> Number/Integer math (+, -, *, /, %)
 - Bitwise Integer -> Integer math (<<, >>, |, &, ^)
 - Integer -> Boolean math (<. <=, ==, >, >=, !=)
 - Boolean -> Boolean math (and, or, xor, not) (This implementes logical shortcuts and may not eval all arguments)
 - {expr* } block, evaluates to the last expression
 - {param1 param2| expr*} blocks can take arguments
 - closures have a `proto` reference to their function prototype
 - definition ident := expr, define ident as a local variable and set a value
 - assignment ident = expr return the expression value
 - Call block using expr(arg1, arg2) where args are also expressions

# Loops

There are a few keywords that do control flow in blocks and turn them into loops.

Tail recursion is your friend, embrace it!

 - `return val?` return early from a block with optional return value
 - `assert expr val?` Return early from a block if the expression is falsy
  - If we ever want an inverse to assert, some ideas are "refute", "abort", "deny".
 - `loop args...` Make a tail call to self with optional arguments.  This is also an early return in order to ensure tail calls.

