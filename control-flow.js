// New ideas for a better syntax based on conversation with Zef

// Implementation of if using && short circuting
if := {cond, fn|
  cond! && fn!
}

// function with two block arguments, the ! means to execute
if! {a < 5} { b = true }

// Implementation of while using if
while := {cond fn| // Takes two parameters, the conditon block and the iteration block
  if cond! {
    fn!
    self! cond fn
  }
}

// Count from 1 to 100 using while
i := 1 // decare a new local variable i and set to 1
while! { i <= 100 } {
  print! i
  i = i + 1
}

// Implementation of times using while
// loops i from 1 to n calling (fn i) for each
times := {n fn|
  i := 1
  while! { i <= n } {
    fn! i
    i = i + 1
  }
}

// lists are simply comma seperated values
list := 1, 2, 3, 4

