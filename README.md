# Goals

 - Minimal, no IO, no module system, tiny stdlib
 - Easy to implement
 - Easy to learn
 - Easy to embed
 - tiny self-hosted compile to C implementation
 - interpret in JS implementation for rapid prototyping

# Values

 - Simple immutable primitives
  - integers for counting, loops, indexes, offsets, lengths.
  - Booleans (true, false)
  - nil (essentially means undefined)
  - utf8 encoded strings

 - mutable data structures
  - dense ordered lists, no holes allowed
  - tuples, basically fixed length lists 2 or longer
  - unordered maps where any value type can be key or value
  - buffers for dealing with binary data

# Expressions

 - explicit order of operations using parens
 - arithematic operators (+, -, *, /, ^, %)
 - comparison operators (<, <=, ==, >, >=, !=)
 - logical operators (!, &&, ||, ^^)
 - `{args..| code }` function literal, auto-returns the last expression
 - Function calling using `expr(arg1, arg2...)` syntax
 - vars declaration line at top of functions
 - object index, set, delete, query syntax
 - metamethod literal syntax
 - if..elif..else expressions for forking logic and returning values

# Loops

There are two kinds of loops.  One is the standard while loop, another is a simple for..in loop that iterates over various types of objects using numerical indexes to length, keys, or a custom iterator function.

