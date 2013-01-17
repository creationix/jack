# Functions

## @def `[args*] [code*]`

Defines a function prototype with it's argument names and code body.  When executed it captures the current scope and returns a `@fn` instance.

## @fn `scope [args*] [code*]`

This represents an actual function instance complete with closure scope.  Executing this code nothing, it's returned as-is.  But it can be passed as an argument to `@call` to execute it.

## @call `fn [args*]`

Call a function

# Variables

## @var `name value`

Declares a local variable and sets a value to it.

## @assign `name value`

Assigns a new value to an existing variable.

# Control Flow

## @if `(condition [code*])+ ([code*])?`

This is a alternating series of condition expressions and code blocks representing an if..elif..else chain.  The conditions are executed one at a time till a truthy result is found.  Then the corresponding block is executed.  If all are false and an odd block is passed in at the end, that else block is executed.  Returns `null` if no block is executed.

## @while `condition [code*]`

The condition is evaluated repeatedly till it evaluates to a falsy value.  For each true value, the code block is executed.

Returns the expression of the last loop or null.

## @for `list var filter [code*]`

This is for looping over lists.  List is the object to map over.  Var is a symbol for the variable to create in the body block and filter expression.  Filter is a filter expression. Pass in `true` to disable. The code block is executed for each item in the list.

First the list is called with "length" to get the length of the list as an integer.  If the list returns `null`, then the list is assumed to be `null` terminated.

The list is iterated by calling it repeatedly calling it with `0`, `1`, `2`... Till either a the length is reached of the value is `null` in the case of `null` terminated lists.

Returns the original list.

## @map - `list var filter [code*]`

This works exactly the same as for, except it remembers the value of each block and returns these as a new list.

