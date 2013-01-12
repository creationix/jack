# Function and Variable Types

## @fn args-array items-array

Define a function with args and body.

## @call function args...

Call a function with args.

## @bind symbol value?

Bind a new local variable with optional value.

## @rebind symbol value

Rebind an existing variable to a new value.

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
