# Goals

 - Minimal, no IO, no module system, tiny stdlib
 - Easy to implement
 - Easy to learn
 - Easy to embed

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
 - Boolean -> Boolean math (and, or, xor, not)
 - {expr* } block, evaluates to the last expression
 - {|param1, param2| expr*} Blocks can take arguments
 - if expr block else block - Standard if-else as an expression
 - blocks have a magic `self` variable point to themselves
 - assignment indent=expr return the expression value
  - ident is the local variable.

# Control Flow
 - loops using tail recursion

# Functions
 - {|param1, param2, param3| block-sans-braces } - A function looks like a block that takes parameters
  - Inherits lexical scope of parent variables (closure)

