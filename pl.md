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
 - Boolean -> Boolean math (and, or, xor, not)
 - {expr* } block, evaluates to the last expression
 - {|param1, param2| expr*} Blocks can take arguments
 - blocks have a `self` reference to themselves
 - assignment indent=expr return the expression value
  - ident is the local variable.
 - Call block using expr(arg1, arg2) where args are also expressions

# Control Flow
 - loops using tail recursion

